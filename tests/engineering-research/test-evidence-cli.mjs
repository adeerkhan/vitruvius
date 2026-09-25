import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { validateEvidenceLedger } from "../../skills/engineering-research/scripts/evidence-ledger.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const rootScript = join(repoRoot, "scripts", "record-evidence.mjs");
const rootValidator = join(repoRoot, "scripts", "validate-evidence.mjs");
const skillScript = join(repoRoot, "skills", "engineering-research", "scripts", "record-evidence.mjs");
const skillValidator = join(repoRoot, "skills", "engineering-research", "scripts", "validate-evidence.mjs");
const skillModule = join(repoRoot, "skills", "engineering-research", "scripts", "evidence-ledger.mjs");
const tempRoot = mkdtempSync(join(tmpdir(), "vitruvius-evidence-"));
const runsDir = join(tempRoot, "runs");
const repoSourcePath = "evals/fixtures/c1/supported-evidence/requirement.md";
const repoSourceHash = createHash("sha256").update(readFileSync(join(repoRoot, repoSourcePath))).digest("hex");

function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function seedRun(directory, runId) {
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "2026-09-25.jsonl"), `${JSON.stringify({ schema: "run.v1", run_id: runId, timestamp: "2026-09-25T00:00:00.000Z" })}\n`);
}

function ledger(runId, sourcePath = repoSourcePath, sourceHash = repoSourceHash) {
  return {
    schema: "evidence.v1",
    run_id: runId,
    question: "Does the synthetic local fixture support the stated limit?",
    sources: [{ id: "SRC-001", title: "Synthetic requirement", locator: "requirement.md#L3", artifact_path: sourcePath, sha256: sourceHash, accessed_on: "2026-09-25", status: "verified" }],
    searches: [{ id: "SEARCH-001", query: "synthetic limit", boundary: "local fixture set", searched_on: "2026-09-25", status: "completed", screened_count: 1, result_source_ids: ["SRC-001"] }],
    claims: [{ id: "CLAIM-001", text: "The fixture supports the stated limit.", status: "verified", coverage_status: "covered", support: [{ source_id: "SRC-001", locator: "requirement.md#L3", relation: "supports", status: "verified" }] }],
    coverage: { negative: [{ id: "NEG-001", search_id: "SEARCH-001", claim_ids: [], status: "documented", note: "The local set was screened." }], ambiguous: [] },
  };
}

function run(args, input, directory = runsDir) {
  return spawnSync(process.execPath, [rootScript, ...args], {
    cwd: repoRoot,
    env: { ...process.env, VITRUVIUS_RUNS_DIR: directory },
    input: JSON.stringify(input),
    encoding: "utf-8",
  });
}

function outputPath(runId, directory = runsDir) {
  return join(directory, `${runId}.evidence.json`);
}

function listTemps(directory = runsDir) {
  return existsSync(directory) ? readdirSync(directory).filter((name) => name.endsWith(".tmp")) : [];
}

try {
  for (const script of [rootScript, rootValidator, skillScript, skillValidator, skillModule]) {
    const syntax = spawnSync(process.execPath, ["--check", script], { encoding: "utf-8" });
    assert.equal(syntax.status, 0, syntax.stderr);
  }

  const runId = "11111111-1111-4111-8111-111111111111";
  seedRun(runsDir, runId);
  const valid = run(["--run-id", runId], ledger(runId));
  assert.equal(valid.status, 0, valid.stderr);
  assert.match(valid.stdout, new RegExp(`Recorded: ${runId}`));
  const firstBytes = readFileSync(outputPath(runId));
  const first = JSON.parse(firstBytes);
  assert.equal(first.schema, "evidence.v1");
  assert.equal(first.completion, "complete");
  assert.equal(first.run_id, runId);
  assert.match(first.recorded_at, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(validateEvidenceLedger(first, { repoRoot }).valid, true);
  assert.equal(existsSync(join(runsDir, ".log-run.lock")), false);
  const revalidated = spawnSync(process.execPath, [rootValidator, outputPath(runId)], { encoding: "utf-8" });
  assert.equal(revalidated.status, 0, revalidated.stderr);
  assert.match(revalidated.stdout, /PASS: evidence\.v1 valid/);

  const roundTripDir = join(tempRoot, "round-trip");
  const roundTripId = "99999999-9999-4999-8999-999999999999";
  seedRun(roundTripDir, roundTripId);
  const roundTripCwd = join(tempRoot, "round-trip-cwd");
  mkdirSync(roundTripCwd, { recursive: true });
  const roundTripEnv = { ...process.env, VITRUVIUS_RUNS_DIR: roundTripDir };
  delete roundTripEnv.VITRUVIUS_PROJECT_ROOT;
  const roundTripRecord = spawnSync(process.execPath, [rootScript, "--run-id", roundTripId], { cwd: roundTripCwd, env: roundTripEnv, input: JSON.stringify(ledger(roundTripId)), encoding: "utf-8" });
  assert.equal(roundTripRecord.status, 0, roundTripRecord.stderr);
  const roundTripValidate = spawnSync(process.execPath, [rootValidator, outputPath(roundTripId, roundTripDir)], { cwd: roundTripCwd, env: roundTripEnv, encoding: "utf-8" });
  assert.equal(roundTripValidate.status, 0, roundTripValidate.stderr);

  const duplicate = run(["--run-id", runId], ledger(runId));
  assert.notEqual(duplicate.status, 0);
  assert.match(duplicate.stderr, /already exists/i);
  assert.deepEqual(readFileSync(outputPath(runId)), firstBytes);

  const invalidId = "22222222-2222-4222-8222-222222222222";
  seedRun(runsDir, invalidId);
  const invalid = ledger(invalidId);
  invalid.claims[0].support[0].source_id = "SRC-UNKNOWN";
  const refused = run(["--run-id", invalidId], invalid);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /unknown source id/i);
  assert.equal(existsSync(outputPath(invalidId)), false);
  assert.deepEqual(listTemps(), []);

  const unknownRunId = "77777777-7777-4777-8777-777777777777";
  const unknownRun = run(["--run-id", unknownRunId], ledger(unknownRunId));
  assert.notEqual(unknownRun.status, 0);
  assert.match(unknownRun.stderr, /no L1 run entry found/i);
  assert.equal(existsSync(outputPath(unknownRunId)), false);

  const malformedDir = join(tempRoot, "malformed-l1");
  const malformedId = "88888888-8888-4888-8888-888888888888";
  seedRun(malformedDir, malformedId);
  writeFileSync(join(malformedDir, "bad.jsonl"), "{not-json}\n");
  const malformed = run(["--run-id", malformedId], ledger(malformedId), malformedDir);
  assert.notEqual(malformed.status, 0);
  assert.match(malformed.stderr, /invalid L1 JSONL/i);
  assert.equal(existsSync(outputPath(malformedId, malformedDir)), false);

  const mismatchId = "33333333-3333-4333-8333-333333333333";
  const mismatch = run(["--run-id", runId], ledger(mismatchId));
  assert.notEqual(mismatch.status, 0);
  assert.match(mismatch.stderr, /does not match --run-id/i);
  assert.equal(existsSync(outputPath(mismatchId)), false);

  const lockedId = "44444444-4444-4444-8444-444444444444";
  const lockedDir = join(tempRoot, "locked");
  seedRun(lockedDir, lockedId);
  writeFileSync(join(lockedDir, ".log-run.lock"), "held-by-test\n");
  const locked = run(["--run-id", lockedId], ledger(lockedId), lockedDir);
  assert.notEqual(locked.status, 0);
  assert.match(locked.stderr, /busy or locked/i);
  assert.equal(existsSync(outputPath(lockedId, lockedDir)), false);
  rmSync(join(lockedDir, ".log-run.lock"), { force: true });

  const copiedProject = join(tempRoot, "copied-project");
  const helper = join(copiedProject, "helper");
  mkdirSync(helper, { recursive: true });
  const copiedSource = join(helper, "source.md");
  writeFileSync(copiedSource, "# copied synthetic source\n");
  cpSync(skillScript, join(helper, "record-evidence.mjs"));
  cpSync(skillValidator, join(helper, "validate-evidence.mjs"));
  cpSync(skillModule, join(helper, "evidence-ledger.mjs"));
  const copiedId = "55555555-5555-4555-8555-555555555555";
  seedRun(join(copiedProject, ".runs"), copiedId);
  const copiedEnv = { ...process.env, VITRUVIUS_PROJECT_ROOT: copiedProject };
  delete copiedEnv.VITRUVIUS_RUNS_DIR;
  const copied = spawnSync(process.execPath, [join(helper, "record-evidence.mjs"), "--run-id", copiedId], {
    cwd: copiedProject,
    env: copiedEnv,
    input: JSON.stringify(ledger(copiedId, "helper/source.md", hashFile(copiedSource))),
    encoding: "utf-8",
  });
  assert.equal(copied.status, 0, copied.stderr);
  assert.equal(existsSync(outputPath(copiedId, join(copiedProject, ".runs"))), true);

  const compatibilityRoot = join(tempRoot, "compatibility-root");
  const compatibilityCwd = join(tempRoot, "compatibility-cwd");
  mkdirSync(join(compatibilityRoot, "scripts"), { recursive: true });
  mkdirSync(join(compatibilityRoot, "skills", "engineering-research", "scripts"), { recursive: true });
  mkdirSync(compatibilityCwd, { recursive: true });
  const compatibilitySource = join(compatibilityRoot, "source.md");
  writeFileSync(compatibilitySource, "# compatibility synthetic source\n");
  cpSync(rootScript, join(compatibilityRoot, "scripts", "record-evidence.mjs"));
  cpSync(rootValidator, join(compatibilityRoot, "scripts", "validate-evidence.mjs"));
  cpSync(skillScript, join(compatibilityRoot, "skills", "engineering-research", "scripts", "record-evidence.mjs"));
  cpSync(skillValidator, join(compatibilityRoot, "skills", "engineering-research", "scripts", "validate-evidence.mjs"));
  cpSync(skillModule, join(compatibilityRoot, "skills", "engineering-research", "scripts", "evidence-ledger.mjs"));
  const compatibilityId = "66666666-6666-4666-8666-666666666666";
  seedRun(join(compatibilityRoot, ".runs"), compatibilityId);
  const compatibilityEnv = { ...process.env };
  delete compatibilityEnv.VITRUVIUS_RUNS_DIR;
  delete compatibilityEnv.VITRUVIUS_PROJECT_ROOT;
  const compatibility = spawnSync(process.execPath, [join(compatibilityRoot, "scripts", "record-evidence.mjs"), "--run-id", compatibilityId], {
    cwd: compatibilityCwd,
    env: compatibilityEnv,
    input: JSON.stringify(ledger(compatibilityId, "source.md", hashFile(compatibilitySource))),
    encoding: "utf-8",
  });
  assert.equal(compatibility.status, 0, compatibility.stderr);
  assert.equal(existsSync(outputPath(compatibilityId, join(compatibilityRoot, ".runs"))), true);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

console.log("PASS: Q1 evidence ledger binds to L1, writes atomically, refuses overwrite/lock/malformed input, and preserves portability");
