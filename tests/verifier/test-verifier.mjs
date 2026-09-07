/**
 * Behavioral test for verifier benchmark.
 *
 * Validates:
 * 1. All benchmark cases exist with proper structure
 * 2. Ground truth is parseable
 * 3. If verifier outputs exist, scores them against ground truth
 * 4. Asserts no false approvals (verifier PASS on BLOCKED case)
 * 5. Asserts >=80% correct verdicts (13/16)
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const CASES_DIR = join(REPO_ROOT, "tasks", "benchmark", "cases");
const RESULTS_DIR = join(REPO_ROOT, "tasks", "benchmark", "results");

let passed = 0;
let failed = 0;

function check(condition, message) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

const GROUND_TRUTH_PATTERN = /\*\*Ground-truth verdict:\*\*\s*(PASS|PARTIAL|BLOCKED)/i;
const FLAW_TYPE_PATTERN = /\*\*Flaw type:\*\*\s*(\S+)/i;
const VERDICT_PATTERN = /^MACHINE_VERDICT:\s*(PASS|PARTIAL|BLOCKED)\s*\|\s*FLAW:\s*(\S+)\s*\|\s*CONFIDENCE:\s*([\d.]+)\s*\|\s*CHECKS_PASSED:\s*(\d+)\/8\s*\|\s*LINE_PINNED:\s*(\d+)\/(\d+)/i;

function parseGroundTruth(content) {
  const verdictMatch = content.match(GROUND_TRUTH_PATTERN);
  const flawMatch = content.match(FLAW_TYPE_PATTERN);
  if (!verdictMatch) return null;
  return {
    verdict: verdictMatch[1].toUpperCase(),
    flaw: flawMatch ? flawMatch[1].trim() : "none",
  };
}

function parseMachineVerdict(content) {
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(VERDICT_PATTERN);
    if (match) {
      return {
        verdict: match[1].toUpperCase(),
        flaw: match[2].trim(),
        confidence: parseFloat(match[3]),
        checksPassed: parseInt(match[4], 10),
        linePinnedNum: parseInt(match[5], 10),
        linePinnedDen: parseInt(match[6], 10),
      };
    }
  }
  return null;
}

console.log("\n[Test] verifier — adversarial benchmark");

// 1. Discover all benchmark cases
const disciplines = readdirSync(CASES_DIR).filter((d) => {
  try {
    return statSync(join(CASES_DIR, d)).isDirectory();
  } catch {
    return false;
  }
});

const allCases = [];
for (const discipline of disciplines) {
  const disciplineDir = join(CASES_DIR, discipline);
  const files = readdirSync(disciplineDir).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    allCases.push({ discipline, file, path: join(disciplineDir, file) });
  }
}

console.log(`\n  Found ${allCases.length} benchmark cases across ${disciplines.length} disciplines`);

check(allCases.length >= 10, `has at least 10 benchmark cases (found ${allCases.length})`);

// 2. Validate case structure
let validCases = 0;
const caseGroundTruth = new Map();

for (const c of allCases) {
  const content = readFileSync(c.path, "utf-8");
  const gt = parseGroundTruth(content);

  if (gt) {
    validCases++;
    caseGroundTruth.set(c.file.replace(".md", ""), gt);

    // Check required sections
    check(
      content.includes("## Research Question"),
      `${c.file}: has Research Question section`
    );
    check(
      content.includes("## Evidence Items"),
      `${c.file}: has Evidence Items section`
    );
    check(
      content.includes("## Claimed Conclusion"),
      `${c.file}: has Claimed Conclusion section`
    );
  } else {
    check(false, `${c.file}: has parseable ground truth`);
  }
}

check(validCases === allCases.length, `all ${allCases.length} cases have valid ground truth`);

// 3. If results exist, score them
const hasResults = existsSync(RESULTS_DIR);
check(hasResults, "verifier results directory exists (tasks/benchmark/results/)");

if (!hasResults) {
  console.log("\n  WARNING: No results directory. Run verifier on cases to generate results.");
  console.log("  Test validates case structure only — scoring skipped.");
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  // Exit 1 if results dir is expected but missing (CI gate)
  if (process.env.CI) process.exit(1);
  process.exit(0);
}

const resultsFiles = readdirSync(RESULTS_DIR).filter((f) => f.endsWith("-result.md"));

if (resultsFiles.length === 0) {
  check(false, "at least one verifier result file found (*-result.md)");
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  process.exit(1);
}

console.log(`\n  Scoring ${resultsFiles.length} verifier outputs against ground truth...`);

let scored = 0;
let correct = 0;
let falseApprovals = 0;
let falseBlocks = 0;

for (const resultFile of resultsFiles) {
  const caseName = resultFile.replace("-result.md", "");
  const gt = caseGroundTruth.get(caseName);

  if (!gt) {
    console.log(`  SKIP: ${resultFile} — no matching case`);
    continue;
  }

  const resultPath = join(RESULTS_DIR, resultFile);
  const resultContent = readFileSync(resultPath, "utf-8");
  const mv = parseMachineVerdict(resultContent);

  if (!mv) {
    check(false, `${caseName}: result has parseable MACHINE_VERDICT line`);
    continue;
  }

  scored++;
  const verdictCorrect = mv.verdict === gt.verdict;
  if (verdictCorrect) correct++;

  // False approval: verifier said PASS but ground truth is BLOCKED
  const falseApproval = gt.verdict === "BLOCKED" && mv.verdict === "PASS";
  if (falseApproval) falseApprovals++;

  // False block: verifier said BLOCKED but ground truth is PASS
  const falseBlock = gt.verdict === "PASS" && mv.verdict === "BLOCKED";
  if (falseBlock) falseBlocks++;

  const status = verdictCorrect ? "CORRECT" : falseApproval ? "FALSE APPROVAL" : falseBlock ? "FALSE BLOCK" : "WRONG VERDICT";
  console.log(`    ${caseName}: ${status} (expected=${gt.verdict} got=${mv.verdict} checks=${mv.checksPassed}/8 conf=${mv.confidence.toFixed(2)})`);
}

// 4. Assertions
check(scored > 0, `scored at least 1 case (scored ${scored})`);
check(falseApprovals === 0, `no false approvals (found ${falseApprovals})`);

if (scored > 0) {
  const accuracy = correct / scored;
  check(accuracy >= 0.80, `accuracy >= 80% (${(accuracy * 100).toFixed(1)}% = ${correct}/${scored})`);
}

console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
