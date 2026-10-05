import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  CASES_SCHEMA,
  RECORD_SCHEMA,
  aggregate,
  compareConditions,
  scoreRecord,
  validateCaseSet,
  validateRecord,
} from "../../scripts/baseline-scoring.mjs";

// baseline — behavioural.
//
// The Vitruvius-vs-baseline comparison is only as honest as its scorer. This
// suite proves the record contract is fail-closed and that the scorer separates
// a grounded run (sources read with pinned artifacts, supported) from a baseline
// run (sources recalled or fabricated). It also drives the CLI end to end.
//
// The characteristic failure: a scorer that reports a difference it cannot see,
// or a contract that accepts a "read" citation with no artifact behind it.

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const toRel = (abs) => abs.replaceAll("\\", "/").replace(`${REPO_ROOT.replaceAll("\\", "/")}/`, "");
const artifact = (abs, rel) => {
  const buf = readFileSync(abs);
  return { path: rel, sha256: createHash("sha256").update(buf).digest("hex"), bytes: buf.length };
};

const CASE = {
  id: "software-http-404-cache",
  discipline: "software",
  question: "Under RFC 9110, is a 404 response cacheable by default?",
  real_sources: ["RFC 9110"],
  fabrication_traps: ["RFC 9999"],
};
const caseSet = { schema: CASES_SCHEMA, id: "test", cases: [CASE] };
const caseIds = new Set([CASE.id]);

// --- 1. The checked-in case set is valid ------------------------------------
const onDisk = JSON.parse(readFileSync(join(REPO_ROOT, "evals", "baseline", "cases.json"), "utf8"));
assert.deepEqual(validateCaseSet(onDisk), [], "evals/baseline/cases.json must satisfy its own contract");
assert.equal(onDisk.cases.length, 10, "the case set is the fixed ten questions");

// --- 2. The record contract is fail-closed ----------------------------------
const dir = mkdtempSync(join(tmpdir(), "vitruvius-baseline-"));
writeFileSync(join(dir, "answer.md"), "# Answer\n\nRFC 9110 says a 404 is heuristically cacheable.\n", "utf8");
writeFileSync(join(dir, "source.txt"), "RFC 9110 section 15.5.5\n", "utf8");

const grounded = {
  schema: RECORD_SCHEMA,
  case_id: CASE.id,
  condition: "with-vitruvius",
  observed_on: "2026-10-05",
  host: "opencode",
  model: "test",
  session_id: "ses_test",
  context: "isolated",
  answer: artifact(join(dir, "answer.md"), "answer.md"),
  citations: [{ locator: "RFC 9110", status: "read", supported: true, artifact: artifact(join(dir, "source.txt"), "source.txt") }],
  metrics: { wall_time_minutes: null, wall_time_status: "unavailable", cost_usd: null, cost_status: "unavailable", notes: "test fixture" },
  completion: "complete",
  notes: "test fixture",
};
assert.deepEqual(validateRecord(grounded, { root: dir, caseIds }), [], "a well-formed read record must validate");

const baselineRecord = {
  ...grounded,
  condition: "baseline",
  citations: [
    { locator: "RFC 9110", status: "recalled", supported: null },
    { locator: "RFC 9999", status: "fabricated", supported: false },
  ],
};

const reject = (label, mutate) => {
  const bad = structuredClone(grounded);
  mutate(bad);
  const errors = validateRecord(bad, { root: dir, caseIds });
  assert.ok(errors.length > 0, `contract must reject: ${label}`);
};
reject("read citation with no artifact", (r) => delete r.citations[0].artifact);
reject("recalled citation carrying an artifact", (r) => {
  r.citations[0].status = "recalled";
  r.citations[0].supported = null;
});
reject("unknown citation status", (r) => (r.citations[0].status = "guessed"));
reject("unknown record field", (r) => (r.extra = true));
reject("sha that does not match the file", (r) => (r.answer.sha256 = "0".repeat(64)));
reject("unknown case id", (r) => (r.case_id = "not-a-case"));
reject("blank notes", (r) => (r.notes = ""));
reject("unknown context", (r) => (r.context = "somewhere"));
console.log("  contract: accepts a grounded record, rejects eight malformed variants");

// --- 3. The scorer discriminates read from recalled/fabricated --------------
const g = scoreRecord(grounded, CASE);
assert.equal(g.readVsRecalledRate, 1, "grounded run reads every source");
assert.equal(g.citationAccuracy, 1, "grounded run's only citation is read and supported");
assert.equal(g.fabricatedCount, 0);
assert.equal(g.oracleViolations, 0);

const b = scoreRecord(baselineRecord, CASE);
assert.equal(b.readVsRecalledRate, 0, "baseline reads nothing");
assert.equal(b.citationAccuracy, 0, "a fabricated citation is not accurate");
assert.equal(b.fabricatedCount, 1);
assert.equal(b.oracleViolations, 1, "a citation matching a trap is an oracle violation");
console.log("  scorer: grounded reads=1.0 accuracy=1.0 fab=0; baseline reads=0.0 accuracy=0.0 fab=1");

// --- 4. compareConditions fails closed on a missing condition ---------------
const paired = compareConditions({ "with-vitruvius": [grounded], baseline: [baselineRecord] }, caseSet, { root: dir });
assert.deepEqual(paired.errors, [], "a complete pair compares cleanly");
assert.equal(paired.perCase.length, 1);
assert.equal(paired.coverage.scored, 1, "coverage counts the scored case");
const summary = aggregate(paired.perCase);
assert.equal(summary.withVitruvius.fabricatedCount, 0);
assert.equal(summary.baseline.fabricatedCount, 1);

const missing = compareConditions({ "with-vitruvius": [grounded], baseline: [] }, caseSet, { root: dir });
assert.ok(
  missing.errors.some((e) => /missing baseline/.test(e)),
  "a case with no baseline record must fail closed, not be skipped",
);

// A baseline that shared the Vitruvius harness is recorded but flagged: the
// number may understate the difference, so it must never read as a clean control.
const contaminated = compareConditions(
  { "with-vitruvius": [grounded], baseline: [{ ...baselineRecord, context: "shared-harness" }] },
  caseSet,
  { root: dir },
);
assert.ok(
  contaminated.warnings.some((w) => /shared-harness/.test(w)),
  "a non-isolated baseline must produce a contamination warning",
);
console.log("  compare: pairs cleanly, a missing condition is an error, and a shared-harness baseline warns");

rmSync(dir, { recursive: true, force: true });

// --- 5. The CLI drives the whole comparison end to end ----------------------
// Fixtures live under outputs/ (gitignored) so artifact paths are
// repository-relative, which is what the contract requires.
const scratch = join(REPO_ROOT, "outputs", ".baseline-test");
const records = join(scratch, "records");
const runCli = (args) =>
  spawnSync(process.execPath, [join(REPO_ROOT, "scripts", "baseline-scoring.mjs"), ...args], { encoding: "utf8", cwd: REPO_ROOT });

try {
  mkdirSync(records, { recursive: true });
  writeFileSync(join(scratch, "answer.md"), "# Answer\n", "utf8");
  writeFileSync(join(scratch, "source.txt"), "RFC 9110\n", "utf8");
  writeFileSync(join(scratch, "cases.json"), JSON.stringify(caseSet), "utf8");

  const ans = artifact(join(scratch, "answer.md"), toRel(join(scratch, "answer.md")));
  const src = artifact(join(scratch, "source.txt"), toRel(join(scratch, "source.txt")));
  const record = (condition, citations, context = "isolated") => ({ ...grounded, condition, context, answer: ans, citations });
  const casesArg = ["--cases", toRel(join(scratch, "cases.json"))];

  writeFileSync(
    join(records, "with-vitruvius.json"),
    JSON.stringify(record("with-vitruvius", [{ locator: "RFC 9110", status: "read", supported: true, artifact: src }])),
    "utf8",
  );
  const missingCondition = runCli([toRel(records), ...casesArg]);
  assert.notEqual(missingCondition.status, 0, "CLI must fail closed when a condition is missing");

  writeFileSync(
    join(records, "baseline.json"),
    JSON.stringify(
      record(
        "baseline",
        [
          { locator: "RFC 9110", status: "recalled", supported: null },
          { locator: "RFC 9999", status: "fabricated", supported: false },
        ],
        "shared-harness",
      ),
    ),
    "utf8",
  );
  const complete = runCli([toRel(records), ...casesArg]);
  assert.equal(complete.status, 0, `CLI must pass on a complete pair: ${complete.stderr}`);
  assert.match(complete.stdout, /read-vs-recalled/, "CLI must print the comparison");
  assert.match(complete.stdout, /WARN:.*contamination/s, "CLI must surface the baseline contamination warning");
  console.log("  CLI: fails closed on a missing condition, passes on a complete pair, and warns on a shared baseline");
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

console.log(
  "\nPASS: baseline contract is fail-closed, the scorer separates read from recalled/fabricated, " +
    "compareConditions rejects a missing condition, and the CLI drives it end to end",
);
