# run-pressure.ps1 — Run the pressure suite via opencode run
param(
    [string]$Model = "opencode-go/longcat-2.5-preview-free"
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..\..")

$OutDir = "tasks/benchmark/pressure-results"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$cases = Get-ChildItem -Path "tasks/benchmark/pressure" -Filter "*.md" | Where-Object { $_.Name -ne "README.md" }

Write-Host "Running $($cases.Count) pressure case(s) with model: $Model"

$scored = 0
foreach ($case in $cases) {
    $name = $case.BaseName
    Write-Host "--- running $name"

    $fullContent = Get-Content -Path $case.FullName -Raw
    $blindContent = ($fullContent -split '\*\*Ground-truth verdict:\*\*')[0].TrimEnd()

    $blindFile = Join-Path $OutDir ".blind-$name.md"
    Set-Content -Path $blindFile -Value $blindContent -NoNewline

    $resultFile = Join-Path $OutDir "$name-result.md"
    $errFile = Join-Path $OutDir ".err-$name.log"

    try {
        $output = opencode run --agent verifier --model $Model --format json -f $blindFile "Blind verification dispatch. Verify the claimed conclusion below against your evidence items, following your verifier protocol. Ground truth is not provided. Return your report in your Output format, including the MACHINE_VERDICT line. Case:" 2>$errFile
        $output | Out-File -FilePath $resultFile -Encoding utf8
    } catch {
        Write-Host "    PROCESS FAILED"
        Remove-Item -Path $blindFile -Force
        continue
    }

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

    if ($textContent) {
        Set-Content -Path $resultFile -Value $textContent -NoNewline
    }

    $scoreOutput = node scripts/score-benchmark.mjs --case $case.FullName $resultFile 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        $scored++
        Write-Host "    ok"
    } else {
        Write-Host "    INVALID MACHINE_VERDICT"
    }

    Remove-Item -Path $blindFile -Force
}

Write-Host "`nScored: $scored/$($cases.Count)"
