# run-opencode.ps1 — Run the verifier benchmark via opencode run (inside OpenCode).
# Usage: powershell -File tasks/benchmark/run-opencode.ps1 [case-name-filter] [cases-dir] [model]
param(
    [string]$Filter = "",
    [string]$CasesDir = "tasks/benchmark/cases",
    [string]$Model = "opencode-go/longcat-2.5-preview-free"
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..\..")

$OutDir = "tasks/benchmark/results-opencode"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

# Find cases
$cases = @()
foreach ($disciplineDir in Get-ChildItem -Path $CasesDir -Directory) {
    foreach ($file in Get-ChildItem -Path $disciplineDir.FullName -Filter "*.md") {
        if ($file.Name -eq "README.md") { continue }
        $name = $file.BaseName
        if ($Filter -and $name -notlike "*$Filter*") { continue }
        $cases += @{ Name = $name; Path = $file.FullName }
    }
}

if ($cases.Count -eq 0) {
    Write-Error "INCOMPLETE: filter matched no benchmark cases"
    exit 1
}

Write-Host "Running $($cases.Count) case(s) with model: $Model"

$scored = 0
foreach ($case in $cases) {
    $name = $case.Name
    $path = $case.Path
    Write-Host "--- running $name"

    # Strip ground truth
    $fullContent = Get-Content -Path $path -Raw
    $blindContent = ($fullContent -split '\*\*Ground-truth verdict:\*\*')[0].TrimEnd()

    # Leak guard
    if ($blindContent -match '(?i)ground.truth|flaw type') {
        Write-Error "    LEAK: $name still contains ground-truth material after stripping"
        exit 1
    }

    # Write blind case to temp file (repo root for verifier access)
    $blindFile = ".blind-$name.md"
    Set-Content -Path $blindFile -Value $blindContent -NoNewline

    # Run opencode
    $resultFile = Join-Path $OutDir "$name-result.md"
    $errFile = Join-Path $OutDir ".err-$name.log"

    try {
        $output = opencode run --agent verifier --model $Model --format json -f $blindFile "Blind verification dispatch. Verify the claimed conclusion below against your evidence items, following your verifier protocol. Ground truth is not provided. Return your report in your Output format, including the MACHINE_VERDICT line. Case:" 2>$errFile
        $output | Out-File -FilePath $resultFile -Encoding utf8
    } catch {
        Write-Host "    PROCESS FAILED (see $errFile)"
        Remove-Item -Path $blindFile -Force
        exit 1
    }

    # Extract text content from JSON events
    $textContent = ""
    foreach ($line in $output) {
        if ($line -match '"type":"text"') {
            try {
                $event = $line | ConvertFrom-Json
                if ($event.part.type -eq "text" -and $event.part.text) {
                    $textContent += $event.part.text + "`n"
                }
            } catch {
                # Skip malformed JSON lines
            }
        }
    }

    # Write extracted text to result file
    if ($textContent) {
        Set-Content -Path $resultFile -Value $textContent -NoNewline
    }

    # Score it (use cmd to avoid PowerShell 5.1 stderr-as-error behavior)
    $scoreOutput = cmd /c "node scripts/score-benchmark.mjs --case `"$path`" `"$resultFile`" 2>&1"
    if ($LASTEXITCODE -eq 0) {
        $scored++
        Write-Host "    ok"
    } else {
        Write-Host "    INVALID MACHINE_VERDICT (see $resultFile)"
    }

    Remove-Item -Path $blindFile -Force
}

Write-Host "`nScored: $scored/$($cases.Count)"
if ($scored -ne $cases.Count) {
    exit 1
}
