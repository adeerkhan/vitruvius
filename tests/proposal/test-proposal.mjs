import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const tempRoot = mkdtempSync(join(tmpdir(), "vitruvius-proposal-"));
const env = { ...process.env, VITRUVIUS_PROJECT_ROOT: tempRoot };

function run(script, args = []) {
  return spawnSync(process.execPath, [join(repoRoot, script), ...args], {
    cwd: repoRoot,
    env,
    encoding: "utf-8",
  });
}

function project(slug) {
  return join(tempRoot, "projects", slug);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function initialize(slug) {
  const result = run("skills/proposal/scripts/init-project.mjs", [slug]);
  assert.equal(result.status, 0, result.stderr);
  return project(slug);
}

function structuredDigest(value) {
  const copy = { ...value };
  delete copy.structured_sha256;
  delete copy.verification;
  delete copy.input_lineage;
  return createHash("sha256").update(JSON.stringify(copy)).digest("hex");
}

function lineageFor(profileSha, postingSha = "none", profileStructured = "none", postingStructured = "none") {
  return createHash("sha256").update(`${profileSha}|${postingSha}|${profileStructured}|${postingStructured}`).digest("hex");
}

function verifierArtifact(lineage, verdict = "PASS") {
  const flaw = verdict === "PASS" ? "none" : "entailment_failure";
  return `## Verdict: ${verdict}

MACHINE_VERDICT: ${verdict} | FLAW: ${flaw} | CONFIDENCE: 0.9 | CHECKS_PASSED: 8/8 | LINE_PINNED: 1/1
RUN_INPUT_SHA256: ${lineage}

## Findings
### Checks that passed
- Code/standard applicability check passed.
- Units and signs check passed.
- Completeness check passed.
- Missing factors check passed.
- Calculation integrity check passed.
- Source-to-claim fidelity check passed.
- Conflict check passed.
- Citation entailment check passed.

### Issues found
None.

## Corrected Conclusion
The fixture conclusion is usable.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---|---|---|---|
| 1 | Fixture claim | local fixture | line 1 | supported |`;
}

function makeCoreArtifacts(slug, verdict = "PASS") {
  const dir = initialize(slug);
  mkdirSync(join(dir, "gap-analysis"), { recursive: true });
  mkdirSync(join(dir, "evidence-ranking"), { recursive: true });
  mkdirSync(join(dir, "verifier"), { recursive: true });
  const profileSha = "ef9f96f38e767c24db192b6771c86317e4e4f0bc741b230bbe3d6f9f8c20eb1e";
  const sourcePath = join(dir, "fixture-source.txt");
  writeFileSync(sourcePath, "Student Name\nreliability engineering");
  writeFileSync(join(dir, "cv-raw.txt"), "Student Name\nreliability engineering");
  writeJson(join(dir, "profile.json"), {
    status: "parsed",
    structured: true,
    method: "text",
    resolved_source: sourcePath,
    name: "Student Name",
    targetLab: "Example Lab",
    researchInterests: ["reliability engineering"],
    raw_text: "Student Name\nreliability engineering",
    raw_bytes: 36,
    raw_sha256: "ef9f96f38e767c24db192b6771c86317e4e4f0bc741b230bbe3d6f9f8c20eb1e",
    source_bytes: 36,
    source_sha256: "ef9f96f38e767c24db192b6771c86317e4e4f0bc741b230bbe3d6f9f8c20eb1e",
    verification: {
      status: "verified",
      provenance: "phase-0-provenance.md",
      source_sha256: "ef9f96f38e767c24db192b6771c86317e4e4f0bc741b230bbe3d6f9f8c20eb1e",
      raw_sha256: "ef9f96f38e767c24db192b6771c86317e4e4f0bc741b230bbe3d6f9f8c20eb1e",
    },
  });
  const profilePath = join(dir, "profile.json");
  const profileArtifact = readJson(profilePath);
  profileArtifact.structured_sha256 = structuredDigest(profileArtifact);
  writeJson(profilePath, profileArtifact);
  const profileStructured = profileArtifact.structured_sha256;
  const lineage = lineageFor(profileSha, "none", profileStructured, "none");
  writeFileSync(join(dir, "phase-0-provenance.md"), "# Phase 0 Provenance\n\n## Sources\n- source=fixture; status=parsed; method=text; pages=1; source_bytes=36; source_sha256=ef9f96f38e767c24db192b6771c86317e4e4f0bc741b230bbe3d6f9f8c20eb1e; raw_bytes=36; raw_sha256=ef9f96f38e767c24db192b6771c86317e4e4f0bc741b230bbe3d6f9f8c20eb1e\n");
  writeJson(join(dir, "run-manifest.json"), {
    schema: "proposal-run.v1",
    revision: 1,
    status: "ready",
    profile_sha256: profileSha,
    posting_sha256: null,
    profile_structured_sha256: profileStructured,
    posting_structured_sha256: null,
    lineage_id: lineage,
    updated_at: new Date().toISOString(),
    error: null,
  });
  writeFileSync(join(dir, "gap-analysis", `${slug}.md`), `# Gaps\n\nRUN_INPUT_SHA256: ${lineage}\n\n### Gap 1\nA bounded research gap.`);
  writeFileSync(join(dir, "gap-analysis", `${slug}.provenance.md`), `# Provenance\n\nRUN_INPUT_SHA256: ${lineage}\nverified fixture\n`);
  writeFileSync(join(dir, "evidence-ranking", `${slug}.md`), `# Evidence\n\nRUN_INPUT_SHA256: ${lineage}\n- source: fixture`);
  writeFileSync(join(dir, "verifier", `${slug}-verdict.md`), verifierArtifact(lineage, verdict));
  writeFileSync(join(dir, "proposal-draft.md"), `# Draft\n\nRUN_INPUT_SHA256: ${lineage}\n\nResearch proposal draft.`);
  writeFileSync(join(dir, "proposal-final.md"), `# Proposal\n\nRUN_INPUT_SHA256: ${lineage}\n\nHumanized proposal.`);
  return dir;
}

try {
  const scripts = [
    "scripts/extract-document.mjs",
    "scripts/verifier-parser.mjs",
    "skills/proposal/scripts/document-extractor.mjs",
    "skills/proposal/scripts/extract-document.mjs",
    "skills/proposal/scripts/verifier-parser.mjs",
    "skills/proposal/scripts/project-utils.mjs",
    "skills/proposal/scripts/init-project.mjs",
    "skills/proposal/scripts/parse-posting.mjs",
    "skills/proposal/scripts/parse-cv.mjs",
    "skills/proposal/scripts/register-structured.mjs",
    "skills/proposal/scripts/find-voice-sample.mjs",
    "skills/proposal/scripts/research-professor.mjs",
    "skills/proposal/scripts/assemble-binder.mjs",
  ];
  for (const script of scripts) {
    const result = spawnSync(process.execPath, ["--check", join(repoRoot, script)], { encoding: "utf-8" });
    assert.equal(result.status, 0, `${script}: ${result.stderr}`);
  }

  {
    const installedSkill = join(tempRoot, ".agents", "skills", "proposal");
    cpSync(join(repoRoot, "skills", "proposal"), installedSkill, { recursive: true });
    const localEnv = { ...process.env };
    delete localEnv.VITRUVIUS_PROJECT_ROOT;
    const localCv = join(tempRoot, "installed-cv.txt");
    writeFileSync(localCv, "Installed Student\nResearch interests: systems engineering");
    const init = spawnSync(process.execPath, [join(installedSkill, "scripts", "init-project.mjs"), "installed-student"], {
      cwd: tempRoot,
      env: localEnv,
      encoding: "utf-8",
    });
    assert.equal(init.status, 0, init.stderr);
    assert.match(init.stdout, /parse-cv\.mjs/);
    assert.ok(existsSync(join(tempRoot, "projects", "installed-student")));
    const extract = spawnSync(process.execPath, [join(installedSkill, "scripts", "extract-document.mjs"), localCv, "--json"], {
      cwd: tempRoot,
      env: localEnv,
      encoding: "utf-8",
    });
    assert.equal(extract.status, 0, extract.stderr);
    assert.equal(JSON.parse(extract.stdout).method, "text");
    const parse = spawnSync(process.execPath, [join(installedSkill, "scripts", "parse-cv.mjs"), "installed-student", localCv], {
      cwd: tempRoot,
      env: localEnv,
      encoding: "utf-8",
    });
    assert.equal(parse.status, 0, parse.stderr);
    assert.equal(readJson(join(tempRoot, "projects", "installed-student", "profile.json")).status, "parsed");
  }

  {
    const voiceDir = initialize("voice-options-student");
    const sample = join(tempRoot, "sample.txt");
    const statement = join(tempRoot, "statement.txt");
    writeFileSync(sample, "sample voice");
    writeFileSync(statement, "statement voice");
    const result = run("skills/proposal/scripts/find-voice-sample.mjs", ["voice-options-student", "--sample", sample, "--statement", statement]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(readFileSync(join(voiceDir, "voice-sample.txt"), "utf-8"), /Source: .*sample\.txt/);
    const missing = run("skills/proposal/scripts/find-voice-sample.mjs", ["voice-options-student", "--sample"]);
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /requires a path|BLOCKED/i);
  }

  const posting = join(tempRoot, "posting.txt");
  const cv = join(tempRoot, "cv.txt");
  writeFileSync(posting, "Position posting\nProfessor Example\nResearch area: systems engineering\n");
  writeFileSync(cv, "Student Name\nResearch interests: reliability engineering\n");

  {
    const result = run("scripts/extract-document.mjs", [posting, "--json"]);
    assert.equal(result.status, 0, result.stderr);
    const extracted = JSON.parse(result.stdout);
    assert.equal(extracted.method, "text");
    assert.match(extracted.text, /Professor Example/);
  }
  {
    const markdown = join(tempRoot, "statement.md");
    writeFileSync(markdown, "# Statement\nResearch statement.");
    const result = run("scripts/extract-document.mjs", [markdown, "--json"]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).method, "text");
  }
  {
    const empty = join(tempRoot, "empty.txt");
    writeFileSync(empty, " \n\t");
    const result = run("scripts/extract-document.mjs", [empty, "--json"]);
    assert.notEqual(result.status, 0);
    assert.match(JSON.parse(result.stdout).warnings.join(" "), /empty|readable/i);
  }
  {
    const renamedPng = join(tempRoot, "renamed.txt");
    writeFileSync(renamedPng, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const result = run("scripts/extract-document.mjs", [renamedPng, "--json"]);
    assert.notEqual(result.status, 0);
    assert.match(JSON.parse(result.stdout).warnings.join(" "), /binary|masquerading/i);
  }
  {
    const fakePdf = join(tempRoot, "scanned.pdf");
    writeFileSync(fakePdf, "%PDF-1.4\nnot a readable document\n");
    const result = run("scripts/extract-document.mjs", [fakePdf, "--json"]);
    assert.notEqual(result.status, 0);
    assert.match(JSON.parse(result.stdout).warnings.join(" "), /pdf-parse|OCR|vision/i);
  }
  {
    // The --json payload must stay parseable no matter which optional
    // dependencies are installed. pdf-parse prints "Warning: Indexing all PDF
    // objects" to stdout on a malformed PDF; if that reaches stdout it
    // corrupts every machine caller. Found by installing the optional
    // pdf-parse dependency and re-running the suite.
    const noisyPdf = join(tempRoot, "noisy.pdf");
    writeFileSync(noisyPdf, "%PDF-1.4\nnot a readable document\n");
    const result = run("scripts/extract-document.mjs", [noisyPdf, "--json"]);
    const parsed = JSON.parse(result.stdout);
    assert.equal(typeof parsed, "object");
    assert.equal(typeof parsed.method, "string");
    assert.ok(Array.isArray(parsed.warnings), "warnings must survive as an array");
    // If the optional dep is present, its stdout is recorded rather than leaked.
    const leaked = parsed.warnings.filter((w) => /pdf-parse wrote to stdout/.test(w));
    if (leaked.length > 0) {
      assert.ok(
        !result.stdout.includes("Warning: Indexing all PDF objects"),
        "dependency stdout must not precede the JSON payload",
      );
    }
  }

  const dir = initialize("test-student");
  assert.ok(existsSync(join(dir, "voice-sample.txt")));
  {
    const fakePdf = join(tempRoot, "voice.pdf");
    writeFileSync(fakePdf, "%PDF-1.4\n%%EOF\n");
    const result = run("skills/proposal/scripts/find-voice-sample.mjs", ["test-student", "--statement", fakePdf]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /BLOCKED|pdf-parse|OCR|vision/i);
    rmSync(join(dir, "voice-sample.txt.blocked"), { force: true });
  }

  {
    const image = join(tempRoot, "posting.png");
    writeFileSync(image, "not an image");
    const result = run("skills/proposal/scripts/parse-posting.mjs", ["test-student", image]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /image|BLOCKED/i);
    assert.equal(readJson(join(dir, "posting.json")).status, "blocked");
  }
  {
    const result = run("skills/proposal/scripts/parse-posting.mjs", ["test-student", "https://example.invalid/posting"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /URL|BLOCKED/i);
  }

  {
    const result = run("skills/proposal/scripts/parse-posting.mjs", ["test-student", posting]);
    assert.equal(result.status, 0, result.stderr);
    const output = readJson(join(dir, "posting.json"));
    assert.equal(output.status, "parsed");
    assert.equal(output.structured, false);
    assert.match(output.source_sha256, /^[a-f0-9]{64}$/);
    assert.match(output.raw_sha256, /^[a-f0-9]{64}$/);
    assert.match(output.raw_text, /Professor Example/);
  }
  {
    const result = run("skills/proposal/scripts/parse-cv.mjs", ["test-student", cv]);
    assert.equal(result.status, 0, result.stderr);
    const output = readJson(join(dir, "profile.json"));
    assert.equal(output.status, "parsed");
    assert.equal(output.structured, false);
    assert.equal(output.name, null);
    assert.match(output.source_sha256, /^[a-f0-9]{64}$/);
    assert.match(output.raw_sha256, /^[a-f0-9]{64}$/);
    assert.match(output.raw_text, /Student Name/);
  }

  const provenance = readFileSync(join(dir, "phase-0-provenance.md"), "utf-8");
  assert.match(provenance, /posting\.txt/);
  assert.match(provenance, /cv\.txt/);
  assert.match(provenance, /sha256=/);

  {
    const empty = join(tempRoot, "empty-cv.txt");
    writeFileSync(empty, "");
    const result = run("skills/proposal/scripts/parse-cv.mjs", ["test-student", empty]);
    assert.notEqual(result.status, 0);
    assert.ok(existsSync(join(dir, "profile.json.blocked")));
    assert.equal(readJson(join(dir, "profile.json")).status, "parsed");
    rmSync(join(dir, "profile.json.blocked"));
    const retry = run("skills/proposal/scripts/parse-cv.mjs", ["test-student", cv]);
    assert.equal(retry.status, 0, retry.stderr);
  }

  {
    const rawResearch = run("skills/proposal/scripts/research-professor.mjs", ["test-student"]);
    assert.notEqual(rawResearch.status, 0);
    assert.match(rawResearch.stderr, /raw intake|structured/i);
  }
  {
    const rawProfile = readJson(join(dir, "profile.json"));
    writeJson(join(dir, "profile.json"), {
      ...rawProfile,
      structured: true,
      name: "Student Name",
      targetLab: "Example Lab",
      researchInterests: ["reliability engineering"],
      verification: {
        status: "verified",
        provenance: "phase-0-provenance.md",
        source_sha256: rawProfile.source_sha256,
        raw_sha256: rawProfile.raw_sha256,
      },
    });
    const rawPosting = readJson(join(dir, "posting.json"));
    writeJson(join(dir, "posting.json"), {
      ...rawPosting,
      structured: true,
      professor: { name: "Professor Example" },
      university: "Example University",
      research: { areas: ["systems engineering"], keywords: [], description: null },
      verification: {
        status: "verified",
        provenance: "phase-0-provenance.md",
        source_sha256: rawPosting.source_sha256,
        raw_sha256: rawPosting.raw_sha256,
      },
    });
    const registered = run("skills/proposal/scripts/register-structured.mjs", ["test-student"]);
    assert.equal(registered.status, 0, registered.stderr);
    const voice = run("skills/proposal/scripts/find-voice-sample.mjs", ["test-student", "--sample", cv]);
    assert.equal(voice.status, 0, voice.stderr);
    assert.match(readFileSync(join(dir, "voice-sample.txt"), "utf-8"), /^Status: PROVIDED$/m);
  }

  {
    const result = run("skills/proposal/scripts/research-professor.mjs", ["test-student"]);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(existsSync(join(dir, "professor-search-plan.txt")));
  }

  const lineage = readJson(join(dir, "run-manifest.json")).lineage_id;
  mkdirSync(join(dir, "gap-analysis"), { recursive: true });
  mkdirSync(join(dir, "evidence-ranking"), { recursive: true });
  mkdirSync(join(dir, "verifier"), { recursive: true });
  writeFileSync(join(dir, "gap-analysis", "test-student.md"), `# Gaps\n\nRUN_INPUT_SHA256: ${lineage}\n\n### Gap 1\nA bounded research gap.`);
  writeFileSync(join(dir, "gap-analysis", "test-student.provenance.md"), `# Provenance\n\nRUN_INPUT_SHA256: ${lineage}\nverified fixture\n`);
  writeFileSync(join(dir, "evidence-ranking", "test-student.md"), `# Evidence\n\nRUN_INPUT_SHA256: ${lineage}\n- source: fixture`);
  writeFileSync(join(dir, "verifier", "test-student-verdict.md"), verifierArtifact(lineage));
  writeFileSync(join(dir, "proposal-draft.md"), `# Draft\n\nRUN_INPUT_SHA256: ${lineage}\n\nResearch proposal draft.`);
  writeFileSync(join(dir, "proposal-final.md"), `# Proposal\n\nRUN_INPUT_SHA256: ${lineage}\n\nHumanized proposal.`);

  {
    const rerunDir = initialize("rerun-student");
    writeFileSync(join(rerunDir, "proposal-final.md"), "old proposal");
    writeFileSync(join(rerunDir, "binder.md"), "old binder");
    const rerun = run("skills/proposal/scripts/parse-cv.mjs", ["rerun-student", cv]);
    assert.equal(rerun.status, 0, rerun.stderr);
    assert.equal(existsSync(join(rerunDir, "proposal-final.md")), false);
    assert.equal(existsSync(join(rerunDir, "binder.md")), false);
    assert.ok(readdirSync(rerunDir).some((name) => name.startsWith("proposal-final.md.stale-")));
  }
  {
    const result = run("skills/proposal/scripts/assemble-binder.mjs", ["test-student"]);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(existsSync(join(dir, "binder.md")));
    assert.ok(existsSync(join(dir, "binder.provenance.md")));
  }
  {
    const mixedGeneration = makeCoreArtifacts("mixed-generation-student");
    const gapPath = join(mixedGeneration, "gap-analysis", "mixed-generation-student.md");
    const currentLineage = readJson(join(mixedGeneration, "run-manifest.json")).lineage_id;
    writeFileSync(gapPath, `# Gaps\n\nRUN_INPUT_SHA256: ${currentLineage}\nRUN_INPUT_SHA256: ${"0".repeat(64)}\n\n### Gap 1\nMixed generation.`);
    const result = run("skills/proposal/scripts/assemble-binder.mjs", ["mixed-generation-student"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /intake generation/i);
  }
  {
    const lowConfidence = makeCoreArtifacts("low-confidence-student");
    const lowLineage = readJson(join(lowConfidence, "run-manifest.json")).lineage_id;
    writeFileSync(join(lowConfidence, "verifier", "low-confidence-student-verdict.md"), verifierArtifact(lowLineage).replace("CONFIDENCE: 0.9", "CONFIDENCE: 0.0"));
    const result = run("skills/proposal/scripts/assemble-binder.mjs", ["low-confidence-student"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /confidence|PASS threshold/i);
  }
  {
    const incomplete = makeCoreArtifacts("incomplete-verifier-student");
    const incompleteLineage = readJson(join(incomplete, "run-manifest.json")).lineage_id;
    writeFileSync(join(incomplete, "verifier", "incomplete-verifier-student-verdict.md"), `MACHINE_VERDICT: PASS | FLAW: none | CONFIDENCE: 0.9 | CHECKS_PASSED: 8/8 | LINE_PINNED: 1/1\nRUN_INPUT_SHA256: ${incompleteLineage}\n`);
    const result = run("skills/proposal/scripts/assemble-binder.mjs", ["incomplete-verifier-student"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing content|Findings/i);
  }
  {
    writeFileSync(join(dir, "verifier", "test-student-verdict.md"), `${verifierArtifact(lineage)}\nmachine_verdict: BLOCKED | FLAW: entailment_failure | CONFIDENCE: 0.2 | CHECKS_PASSED: 1/8 | LINE_PINNED: 0/1`);
    const result = run("skills/proposal/scripts/assemble-binder.mjs", ["test-student"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /exactly one/i);
    assert.ok(readdirSync(dir).some((name) => name.startsWith("binder.md.stale-")));
  }
  {
    const blockedVerdictDir = makeCoreArtifacts("blocked-verdict-student");
    writeFileSync(join(blockedVerdictDir, "verifier", "blocked-verdict-student-verdict.md"), verifierArtifact(readJson(join(blockedVerdictDir, "run-manifest.json")).lineage_id, "BLOCKED"));
    const result = run("skills/proposal/scripts/assemble-binder.mjs", ["blocked-verdict-student"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /PASS|BLOCKED/i);
    assert.equal(existsSync(join(blockedVerdictDir, "binder.md")), false);
  }

  {
    const emptyRetry = join(tempRoot, "empty-retry.txt");
    writeFileSync(emptyRetry, "");
    const failedRetry = run("skills/proposal/scripts/parse-cv.mjs", ["test-student", emptyRetry]);
    assert.notEqual(failedRetry.status, 0);
    rmSync(join(dir, "profile.json.blocked"), { force: true });
    const blockedManifest = run("skills/proposal/scripts/assemble-binder.mjs", ["test-student"]);
    assert.notEqual(blockedManifest.status, 0);
    assert.match(blockedManifest.stderr, /manifest|blocked|required/i);
    assert.equal(readJson(join(dir, "run-manifest.json")).status, "blocked");
  }
  {
    const rawOptional = makeCoreArtifacts("raw-optional-student");
    writeJson(join(rawOptional, "posting.json"), { status: "raw", structured: true, raw_text: "fixture" });
    const result = run("skills/proposal/scripts/assemble-binder.mjs", ["raw-optional-student"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /status=parsed|structured=true/i);
  }
  {
    const noParsedSource = makeCoreArtifacts("blocked-source-student");
    writeFileSync(join(noParsedSource, "phase-0-provenance.md"), "# Phase 0 Provenance\n\n- source=blocked; status=blocked; method=none; pages=unavailable; bytes=0; sha256=unavailable\n");
    const result = run("skills/proposal/scripts/assemble-binder.mjs", ["blocked-source-student"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /hashed parsed source/i);
  }
  {
    const missing = makeCoreArtifacts("missing-student");
    rmSync(join(missing, "evidence-ranking", "missing-student.md"));
    const result = run("skills/proposal/scripts/assemble-binder.mjs", ["missing-student"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /evidence-ranking|required artifacts/i);
    assert.equal(existsSync(join(missing, "binder.md")), false);
  }
  {
    const oneShotDir = makeCoreArtifacts("one-shot-registration-student");
    const already = run("skills/proposal/scripts/register-structured.mjs", ["one-shot-registration-student"]);
    assert.equal(already.status, 0, already.stderr);
    const changedProfile = readJson(join(oneShotDir, "profile.json"));
    changedProfile.name = "Changed Student";
    writeJson(join(oneShotDir, "profile.json"), changedProfile);
    const changed = run("skills/proposal/scripts/register-structured.mjs", ["one-shot-registration-student"]);
    assert.notEqual(changed.status, 0);
    assert.match(changed.stderr, /new intake generation|structured fields changed/i);
  }
  {
    const reuseDir = initialize("reuse-student");
    const reuseManifest = readJson(join(reuseDir, "run-manifest.json"));
    writeJson(join(reuseDir, "run-manifest.json"), { ...reuseManifest, status: "ready" });
    const reuse = run("skills/proposal/scripts/init-project.mjs", ["reuse-student"]);
    assert.notEqual(reuse.status, 0);
    assert.match(reuse.stderr, /active or completed|BLOCKED/i);
    assert.ok(existsSync(join(reuseDir, "run-manifest.json")));
  }
  {
    const result = run("skills/proposal/scripts/init-project.mjs", ["../escape"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Invalid slug/i);
  }

  const packageJson = readJson(join(repoRoot, "package.json"));
  assert.ok(packageJson.files.includes("scripts/extract-document.mjs"));
  assert.ok(packageJson.files.includes("scripts/verifier-parser.mjs"));
  assert.equal(packageJson.optionalDependencies["pdf-parse"], "^1.1.1");
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

console.log("PASS: proposal intake, provenance, fail-closed binder, and packaging");
