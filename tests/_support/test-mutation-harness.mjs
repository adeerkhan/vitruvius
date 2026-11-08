import { strict as assert } from "node:assert";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runMutationHarness } from "./mutation-harness.mjs";
import { makeTempDir, removeTempDir } from "../_support/temp-dir.mjs";

// Tests for the mutation harness helper. The harnesses prove suites can fail;
// this proves the harness itself classifies outcomes correctly. A harness that
// scores "detected" when the suite failed for an unrelated reason is the
// vacuous-coverage failure it exists to prevent, so each failure mode below has
// a case: a suite that ignores the rule (vacuous), a mutation that does not
// land (broken), and a suite that fails before any mutation (broken baseline).

const here = dirname(fileURLToPath(import.meta.url));
const fixture = makeTempDir("vitruvius-mutation-helper-");

const GUARDED = `import { readFileSync } from "node:fs";
const rule = readFileSync(new URL("./rule.txt", import.meta.url), "utf8");
if (!rule.includes("the rule")) {
  console.error("rule missing");
  process.exit(1);
}
console.log("ok");
`;

try {
  writeFileSync(join(fixture, "rule.txt"), "the rule\n");
  writeFileSync(join(fixture, "guarded-suite.mjs"), GUARDED);
  writeFileSync(join(fixture, "blind-suite.mjs"), `console.log("ok");\n`);
  writeFileSync(join(fixture, "failing-suite.mjs"), `process.exit(1);\n`);

  const entries = ["rule.txt", "guarded-suite.mjs", "blind-suite.mjs", "failing-suite.mjs"];
  const removeRule = (original) => original.replace("the rule", "no rule");
  const run = (overrides) =>
    runMutationHarness({
      label: "fixture",
      repoRoot: fixture,
      copyEntries: entries,
      seedGit: false,
      ...overrides,
    });

  // --- 1. Detected: the mutation breaks the guarded suite ----------------
  {
    const report = run({
      cases: [{ name: "rule removed", file: "rule.txt", test: "guarded-suite.mjs", mutate: removeRule }],
    });
    assert.equal(report.ok, true, `a detected mutation must pass the harness:\n${JSON.stringify(report)}`);
    assert.equal(report.detected, 1);
    assert.ok(report.workspaceRemoved, "the throwaway copy must be removed");
    assert.equal(
      readFileSync(join(fixture, "rule.txt"), "utf8"),
      "the rule\n",
      "the source fixture must never be mutated — only the copy",
    );
  }

  // --- 2. Vacuous: a suite that ignores the rule must not count ----------
  {
    const report = run({
      cases: [{ name: "rule removed", file: "rule.txt", test: "blind-suite.mjs", mutate: removeRule }],
    });
    assert.equal(report.ok, false, "a mutation a suite cannot notice must fail the harness");
    assert.deepEqual(report.vacuous, ["rule removed"]);
    assert.equal(report.detected, 0);
  }

  // --- 3. Broken harness: a mutation that does not land ------------------
  {
    const report = run({
      cases: [{ name: "rule removed", file: "rule.txt", test: "guarded-suite.mjs", mutate: (s) => s }],
    });
    assert.equal(report.ok, false, "a mutation that changes nothing must fail the harness");
    assert.deepEqual(report.broken, ["rule removed"]);
  }

  // --- 4. Broken baseline: the suite fails before any mutation -----------
  {
    const report = run({
      cases: [{ name: "rule removed", file: "rule.txt", test: "failing-suite.mjs", mutate: removeRule }],
    });
    assert.equal(report.ok, false, "a suite that already fails cannot prove anything");
    assert.deepEqual(report.baselineFailures, ["failing-suite.mjs"]);
    assert.equal(report.detected, 0, "a case with a failed baseline must never be scored as detected");
  }

  console.log(
    "PASS: mutation harness detects real regressions, rejects vacuous suites, broken mutations, and broken baselines",
  );
} finally {
  removeTempDir(fixture);
}
