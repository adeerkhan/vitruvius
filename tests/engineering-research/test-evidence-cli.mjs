import { strict as assert } from "node:assert";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { validateEvidenceLedger } from "../../skills/engineering-research/scripts/evidence-ledger.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const rootScript = join(repoRoot, "scripts", "record-evidence.mjs");
const skillScript = join(repoRoot, "skills", "engineering-research", "scripts", "record-evidence.mjs");
const skillModule = join(repoRoot, "skills", "engineering-research", "scripts", "evidence-ledger.mjs");
const tempRoot = mkdtempSync(join(tmpdir(), "vitruvius-evidence-"));
const runsDir = join(tempRoot, "runs");

function ledger(runId = "11111111-1111-4111-8111-111111111111") {
  return {
    schema: "evidence.v1",
    run_id: runId,
    question: "Does the synthetic local fixture support the stated limit?",
    sources: [{ id: "SRC-001", title: "Requirement", locator: "local://requirement", status: "verified" }],
    searches: [{
      id: "SEARCH-001",
      query: "synthetic limit",
      boundary: "local fixture set",
      searched_on: "2026-09-25",
      status: "completed",
      result_source_ids: ["SRC-001"],
    }],
    claims: [{
      id: "CLAIM-001",
      text: "The fixture supports the stated limit.",
      status: "verified",
      support: [{ source_id: "SRC-001", locator: "requirement#L1", relation: "supports", status: "verified" }],
    }],
    coverage: {
      negative: [{ id: "NEG-001", search_id: "SEARCH-001", status: "documented", note: "The local set was screened." }],
      ambiguous: [],
    },
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
  for (const script of [rootScript, skillScript, skillModule]) {
    const syntax = spawnSync(process.execPath, ["--check", script], { encoding: "utf-8" });
    assert.equal(syntax.status, 0, syntax.stderr);
  }

  const runId = "11111111-1111-4111-8111-111111111111";
  const valid = run(["--run-id", runId], ledger(runId));
  assert.equal(valid.status, 0, valid.stderr);
  assert.match(valid.stdout, /Recorded: 11111111-1111-4111-8111-111111111111/);
  const firstBytes = readFileSync(outputPath(runId));
  const first = JSON.parse(firstBytes);
  assert.equal(first.schema, "evidence.v1");
  assert.equal(first.run_id, runId);
  assert.match(first.recorded_at, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(validateEvidenceLedger(first).valid, true);

  const duplicate = run([], ledger(runId));
  assert.notEqual(duplicate.status, 0);
  assert.match(duplicate.stderr, /already exists/i);
  assert.deepEqual(readFileSync(outputPath(runId)), firstBytes);

  const invalidId = "22222222-2222-4222-8222-222222222222";
  const invalid = ledger(invalidId);
  invalid.claims[0].support[0].source_id = "SRC-UNKNOWN";
  const refused = run([], invalid);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /unknown source id/i);
  assert.equal(existsSync(outputPath(invalidId)), false);
  assert.deepEqual(listTemps(), []);

  const mismatchId = "33333333-3333-4333-8333-333333333333";
  const mismatch = run(["--run-id", runId], ledger(mismatchId));
  assert.notEqual(mismatch.status, 0);
  assert.match(mismatch.stderr, /does not match --run-id/i);
  assert.equal(existsSync(outputPath(mismatchId)), false);

  const lockedId = "44444444-4444-4444-8444-444444444444";
  const lockedDir = join(tempRoot, "locked");
  mkdirSync(lockedDir);
  writeFileSync(join(lockedDir, `${lockedId}.evidence.lock`), "held-by-test\n");
  const locked = run([], ledger(lockedId), lockedDir);
  assert.notEqual(locked.status, 0);
  assert.match(locked.stderr, /locked/i);
  assert.equal(existsSync(outputPath(lockedId, lockedDir)), false);
  rmSync(join(lockedDir, `${lockedId}.evidence.lock`), { force: true });

  const copiedProject = join(tempRoot, "copied-project");
  const helper = join(copiedProject, "helper");
  mkdirSync(helper, { recursive: true });
  cpSync(skillScript, join(helper, "record-evidence.mjs"));
  cpSync(skillModule, join(helper, "evidence-ledger.mjs"));
  const copiedId = "55555555-5555-4555-8555-555555555555";
  const copiedEnv = { ...process.env, VITRUVIUS_PROJECT_ROOT: copiedProject };
  delete copiedEnv.VITRUVIUS_RUNS_DIR;
  const copied = spawnSync(process.execPath, [join(helper, "record-evidence.mjs")], {
    cwd: copiedProject,
    env: copiedEnv,
    input: JSON.stringify(ledger(copiedId)),
    encoding: "utf-8",
  });
  assert.equal(copied.status, 0, copied.stderr);
  assert.equal(existsSync(outputPath(copiedId, join(copiedProject, ".runs"))), true);

  const compatibilityRoot = join(tempRoot, "compatibility-root");
  const compatibilityCwd = join(tempRoot, "compatibility-cwd");
  mkdirSync(join(compatibilityRoot, "scripts"), { recursive: true });
  mkdirSync(join(compatibilityRoot, "skills", "engineering-research", "scripts"), { recursive: true });
  mkdirSync(compatibilityCwd, { recursive: true });
  cpSync(rootScript, join(compatibilityRoot, "scripts", "record-evidence.mjs"));
  cpSync(skillScript, join(compatibilityRoot, "skills", "engineering-research", "scripts", "record-evidence.mjs"));
  cpSync(skillModule, join(compatibilityRoot, "skills", "engineering-research", "scripts", "evidence-ledger.mjs"));
  const compatibilityId = "66666666-6666-4666-8666-666666666666";
  const compatibilityEnv = { ...process.env };
  delete compatibilityEnv.VITRUVIUS_RUNS_DIR;
  delete compatibilityEnv.VITRUVIUS_PROJECT_ROOT;
  const compatibility = spawnSync(process.execPath, [join(compatibilityRoot, "scripts", "record-evidence.mjs")], {
    cwd: compatibilityCwd,
    env: compatibilityEnv,
    input: JSON.stringify(ledger(compatibilityId)),
    encoding: "utf-8",
  });
  assert.equal(compatibility.status, 0, compatibility.stderr);
  assert.equal(existsSync(outputPath(compatibilityId, join(compatibilityRoot, ".runs"))), true);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

console.log("PASS: Q1 evidence ledger writes atomically, refuses overwrite/lock/malformed input, and preserves portability");
