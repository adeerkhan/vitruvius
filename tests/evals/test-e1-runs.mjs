import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { validate } from "../../scripts/e1-model-run.mjs";
import { makeTempDir, removeTempDir } from "../_support/temp-dir.mjs";

// The E1 model-run record layer: a record must be evidence, not a claim.
// Each failure mode below is one way a manifest could overstate the count.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex");

const CASES = {
  schema: "vitruvius-e1-cases.v1",
  cases: [
    {
      skill: "audit",
      prompt: "Audit this against its spec.",
      expectations: [
        { id: "E1", statement: "Names the mismatch." },
        { id: "E2", statement: "States what was checked." },
      ],
    },
  ],
};

function fixture({ output = "The audit found a 3-versus-5 mismatch.\n", gradeOverrides = {}, runOverrides = {} } = {}) {
  const dir = makeTempDir("vitruvius-e1-runs-");
  mkdirSync(join(dir, "out"), { recursive: true });
  writeFileSync(join(dir, "out", "audit.md"), output);
  const run = {
    skill: "audit",
    run_id: "run-1",
    date: "2026-11-08",
    fresh: true,
    agent: "general",
    session_id: "ses_fixture0000000000000000000",
    prompt: CASES.cases[0].prompt,
    prompt_sha256: sha256(CASES.cases[0].prompt),
    output: { path: "out/audit.md", sha256: sha256(output), bytes: Buffer.byteLength(output, "utf8") },
    grade: {
      status: "PASS",
      expectations: [
        { id: "E1", statement: "Names the mismatch.", passed: true, evidence: "States 3 versus 5." },
        { id: "E2", statement: "States what was checked.", passed: true, evidence: "Compares spec to code." },
      ],
      ...gradeOverrides,
    },
    ...runOverrides,
  };
  return { dir, runs: { schema: "vitruvius-e1-runs.v1", runs: [run] } };
}

function run(overrides, mutate) {
  const { dir, runs } = fixture(overrides);
  try {
    if (mutate) mutate(runs.runs[0], dir);
    return validate(CASES, runs, dir);
  } finally {
    removeTempDir(dir);
  }
}

// --- 1. A complete record validates --------------------------------------
{
  const result = run();
  assert.deepEqual(result.problems, [], `a complete record must pass:\n${result.problems.join("\n")}`);
  assert.deepEqual(result.records, ["audit"]);
}

// --- 2. A tampered output hash is refused --------------------------------
{
  const result = run({}, (r) => { r.output.sha256 = "0".repeat(64); });
  assert.ok(result.problems.some((p) => /output sha256 mismatch/.test(p)), "a changed answer must be caught");
  assert.equal(result.records.length, 0);
}

// --- 3. A byte count that does not match is refused ----------------------
{
  const result = run({}, (r) => { r.output.bytes += 1; });
  assert.ok(result.problems.some((p) => /output bytes mismatch/.test(p)));
}

// --- 4. PASS with a failed expectation is contradictory ------------------
{
  const result = run({}, (r) => { r.grade.expectations[0].passed = false; });
  assert.ok(result.problems.some((p) => /PASS with 1\/2 passed/.test(p)), "the status must agree with the grades");
}

// --- 5. An expectation with no evidence is refused -----------------------
{
  const result = run({}, (r) => { r.grade.expectations[0].evidence = "  "; });
  assert.ok(result.problems.some((p) => /has no evidence/.test(p)));
}

// --- 6. An ungraded expectation is refused -------------------------------
{
  const result = run({}, (r) => { r.grade.expectations.pop(); });
  assert.ok(result.problems.some((p) => /grades 1 expectation\(s\), case has 2/.test(p)));
  assert.ok(result.problems.some((p) => /E2 is ungraded/.test(p)));
}

// --- 7. A prompt that differs from the case is refused -------------------
{
  const result = run({}, (r) => { r.prompt = "A different prompt"; });
  assert.ok(result.problems.some((p) => /prompt differs from the case/.test(p)));
}

// --- 8. A non-fresh (non-blind) run is refused ---------------------------
{
  const result = run({}, (r) => { r.fresh = false; });
  assert.ok(result.problems.some((p) => /must be fresh/.test(p)));
}

// --- 9. Duplicate records for one skill are refused ----------------------
{
  const result = run({}, (_r, dir) => {
    const runs = { schema: "vitruvius-e1-runs.v1", runs: [] };
    // Rebuild through validate directly: two valid records for the same skill.
    const one = fixture();
    try {
      runs.runs = [one.runs.runs[0], structuredClone(one.runs.runs[0])];
      const result2 = validate(CASES, runs, one.dir);
      assert.ok(result2.problems.some((p) => /duplicate record for skill/.test(p)));
    } finally {
      removeTempDir(one.dir);
    }
  });
  assert.ok(Array.isArray(result.problems));
}

// --- 10. The checked-in state is coherent --------------------------------
{
  const cases = JSON.parse(readFileSync(join(repoRoot, "evals", "e1-cases.json"), "utf8"));
  const runs = JSON.parse(readFileSync(join(repoRoot, "evals", "e1-runs", "manifest.json"), "utf8"));
  const result = validate(cases, runs, repoRoot);
  assert.deepEqual(result.problems, [], `the real record layer must validate:\n${result.problems.join("\n")}`);
  assert.equal(result.cases, 27, "the case catalog must cover every skill");
  const manifest = JSON.parse(readFileSync(join(repoRoot, "skills", "e1-suite-manifest.json"), "utf8"));
  assert.equal(
    manifest.model_run_recorded,
    result.records.length,
    "model_run_recorded must equal the number of valid records",
  );
}

console.log("PASS: E1 model-run records are evidence — hashes, grades, evidence, and the derived count all fail closed");
