import { strict as assert } from "node:assert";
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import { scoreCase } from "../../scripts/benchmark-scoring.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const tmp = mkdtempSync(join(tmpdir(), "empty-result-guard-"));

const caseFile = join(tmp, "demo-case.md");
writeFileSync(
  caseFile,
  [
    "## Research Question",
    "Does the weld satisfy AISC 360-16?",
    "",
    "**Ground-truth verdict:** BLOCKED",
    "**Flaw type:** missing_factor",
    "",
  ].join("\n"),
  "utf8",
);

// --- An empty result is a harness failure, not a model failure -------------
const emptyResult = join(tmp, "demo-case-result.md");
writeFileSync(emptyResult, "", "utf8");

const empty = scoreCase(caseFile, emptyResult);
assert.ok(empty.error, "an empty result must be an integrity error");
assert.match(
  empty.error,
  /^EMPTY RESULT/,
  `an empty result must be reported as EMPTY RESULT, not a model failure (got: ${empty.error})`,
);
assert.doesNotMatch(
  empty.error,
  /MISSING VERDICT/,
  "an empty result must not be conflated with a missing verdict",
);

// --- A whitespace-only result is also empty --------------------------------
const blankResult = join(tmp, "blank-case-result.md");
writeFileSync(blankResult, "\n   \n\t\n", "utf8");
const blank = scoreCase(caseFile, blankResult);
assert.match(blank.error, /^EMPTY RESULT/, "a whitespace-only result counts as empty");

// --- A real non-empty result with no verdict line is still MISSING VERDICT -
const proseResult = join(tmp, "prose-case-result.md");
writeFileSync(proseResult, "# Report\n\nI could not determine the answer.\n", "utf8");
const prose = scoreCase(caseFile, proseResult);
assert.match(
  prose.error,
  /^MISSING VERDICT/,
  "a non-empty result with no verdict line is a model failure, not an empty-file failure",
);

// --- A valid verdict still scores ------------------------------------------
const goodResult = join(tmp, "good-case-result.md");
writeFileSync(
  goodResult,
  [
    "## Verdict: BLOCKED",
    "",
    "MACHINE_VERDICT: BLOCKED | FLAW: missing_factor | CONFIDENCE: 0.9 | CHECKS_PASSED: 5/8 | LINE_PINNED: 4/4",
    "",
  ].join("\n"),
  "utf8",
);
const good = scoreCase(caseFile, goodResult);
assert.ok(!good.error, `a valid verdict must score, got: ${good.error}`);
assert.ok(good.correct, "a BLOCKED verdict against BLOCKED ground truth is correct");

rmSync(tmp, { recursive: true, force: true });

// --- The runner must not truncate the tracked result path speculatively ----
const runner = readFileSync(join(repoRoot, "tasks", "benchmark", "run-opencode.sh"), "utf8");
assert.match(
  runner,
  /\.tmp-\$name-result\.md/,
  "the benchmark runner must write to a temp file before moving into place",
);
assert.match(
  runner,
  /mv "\$tmp" "\$OUT\/\$name-result\.md"/,
  "the benchmark runner must move the temp file into place only after a non-empty run",
);
assert.match(
  runner,
  /\[ ! -s "\$tmp" \]/,
  "the benchmark runner must refuse an empty run before publishing it as a result",
);
assert.doesNotMatch(
  runner,
  /> "\$OUT\/\$name-result\.md"/,
  "the runner must never redirect shell output directly onto the tracked result path",
);

console.log("PASS: empty benchmark results are a distinct integrity error, and the runner cannot create them");
