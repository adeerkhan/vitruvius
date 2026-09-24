/**
 * Behavioral test for verifier benchmark integrity and quality floors.
 *
 * The test fails closed when a case or result is missing, malformed, or
 * duplicated. Quality residuals remain visible as metrics rather than being
 * hidden by a skip.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scoreBenchmark } from "../../scripts/benchmark-scoring.mjs";
import { check } from "../_contract/contract.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const ADVERSARIAL_CASES = join(REPO_ROOT, "tasks", "benchmark", "cases");
const ADVERSARIAL_RESULTS = join(REPO_ROOT, "tasks", "benchmark", "results");
const CONTROL_CASES = join(REPO_ROOT, "tasks", "benchmark", "controls", "cases");
const CONTROL_RESULTS = join(REPO_ROOT, "tasks", "benchmark", "controls", "results");

function errorText(errors) {
  return errors.length === 0 ? "none" : errors.join("; ");
}

console.log("\n[Test] verifier — adversarial benchmark");

const adversarial = scoreBenchmark({
  casesDir: ADVERSARIAL_CASES,
  resultsDir: ADVERSARIAL_RESULTS,
});

check(
  adversarial.errors.length === 0,
  `adversarial benchmark has no integrity errors (${errorText(adversarial.errors)})`,
);
check(adversarial.summary.total === 20, `all 20 adversarial cases are discovered (${adversarial.summary.total})`);
check(
  adversarial.summary.scored === adversarial.summary.total,
  `all adversarial cases are scored (${adversarial.summary.scored}/${adversarial.summary.total})`,
);

for (const caseFile of adversarial.caseFiles) {
  const content = readFileSync(caseFile, "utf-8");
  const name = caseFile.split(/[\\/]/).at(-1);
  check(content.includes("## Research Question"), `${name}: has Research Question section`);
  check(content.includes("## Evidence Items"), `${name}: has Evidence Items section`);
  check(content.includes("## Claimed Conclusion"), `${name}: has Claimed Conclusion section`);
}

const adversarialAccuracy = adversarial.summary.correct / adversarial.summary.total;
check(
  adversarialAccuracy >= 0.65,
  `adversarial accuracy >= 65% floor (${(adversarialAccuracy * 100).toFixed(1)}%)`,
);
check(
  adversarial.summary.falseApprovals <= 2,
  `adversarial false approvals <= 2 baseline (${adversarial.summary.falseApprovals})`,
);
check(
  adversarial.summary.falseBlocks === 0,
  `adversarial false blocks == 0 (${adversarial.summary.falseBlocks})`,
);

console.log("\n[Test] verifier — PASS controls");

const controls = scoreBenchmark({
  casesDir: CONTROL_CASES,
  resultsDir: CONTROL_RESULTS,
});

check(
  controls.errors.length === 0,
  `PASS controls have no integrity errors (${errorText(controls.errors)})`,
);
check(controls.summary.total === 5, `all 5 discipline PASS controls are discovered (${controls.summary.total})`);
check(controls.summary.scored === 5, `all PASS controls are scored (${controls.summary.scored}/5)`);
check(controls.summary.correct === 5, `all PASS controls are correct (${controls.summary.correct}/5)`);
check(controls.summary.falseApprovals === 0, `PASS controls have no false approvals (${controls.summary.falseApprovals})`);
check(controls.summary.falseBlocks === 0, `PASS controls have no false blocks (${controls.summary.falseBlocks})`);
check(
  controls.results.every((result) => result.groundTruth.verdict === "PASS"),
  "every control declares PASS ground truth",
);

console.log("\nPASS: verifier benchmark integrity and controls");
