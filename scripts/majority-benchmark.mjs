#!/usr/bin/env node
/**
 * majority-benchmark.mjs — CLI for B1 majority-of-N certification.
 *
 * Scoring lives in benchmark-scoring.mjs next to scoreBenchmark; this prints
 * the report and applies the optional strict gate.
 *
 * Usage:
 *   node scripts/majority-benchmark.mjs <run1> <run2> <run3> [--cases <dir>]
 *     [--json] [--strict-quality]
 *
 * Completeness errors (a run missing or malforming a case) always fail.
 * `--strict-quality` additionally fails on a majority false approval or false
 * block; splits are published as variance, not hidden.
 */
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { scoreMajority } from "./benchmark-scoring.mjs";

function printReport(report) {
  console.log(`\nMajority Benchmark — ${new Date().toISOString().split("T")[0]}`);
  console.log("=".repeat(60));
  for (const item of report.cases) {
    if (item.error !== undefined) {
      console.log(`${item.caseName}: ${item.error}`);
      continue;
    }
    console.log(
      `${item.caseName}: ${item.status} (expected=${item.groundTruth.verdict} ` +
        `verdicts=${item.verdicts.join("/")} agreement=${item.agreement.toFixed(2)})`,
    );
  }
  if (report.errors.length > 0) {
    console.error("\nIntegrity errors:");
    for (const error of report.errors) console.error(`  ${error}`);
  }
  const { summary } = report;
  console.log("\nMajority Summary:");
  console.log(`  Cases:               ${summary.cases}`);
  console.log(`  Runs:                ${summary.runs}`);
  console.log(`  Unanimous:           ${summary.unanimous}`);
  console.log(`  Majority (non-unan.):${summary.majorityOnly}`);
  console.log(`  Split:               ${summary.split}`);
  console.log(`  Majority correct:    ${summary.majorityCorrect}/${summary.scored}`);
  console.log(`  Majority false appr: ${summary.majorityFalseApprovals}`);
  console.log(`  Majority false blk:  ${summary.majorityFalseBlocks}`);
  console.log(`  Mean agreement:      ${summary.meanAgreement.toFixed(3)}`);
  console.log("  Per-run (correct/false-approvals/false-blocks):");
  summary.perRun.forEach((run, index) => {
    console.log(`    run${index + 1}: ${run.correct}/${run.scored} correct, ${run.falseApprovals} false-appr, ${run.falseBlocks} false-blk`);
  });
}

function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.error("Usage: node scripts/majority-benchmark.mjs <run1> <run2> <run3> [--cases <dir>] [--json] [--strict-quality]");
    return 0;
  }
  const strictQuality = argv.includes("--strict-quality");
  const json = argv.includes("--json");
  const casesIndex = argv.indexOf("--cases");
  const casesDir = casesIndex === -1 ? resolve(process.cwd(), "tasks", "benchmark", "cases") : resolve(argv[casesIndex + 1]);
  const runDirs = argv.filter(
    (arg, index) => !arg.startsWith("--") && !(casesIndex !== -1 && index === casesIndex + 1),
  );
  if (runDirs.length < 2) {
    console.error("majority scoring requires at least two run directories");
    return 1;
  }

  const report = scoreMajority({ casesDir, runDirs });
  if (json) console.log(JSON.stringify(report, null, 2));
  else printReport(report);

  if (report.errors.length > 0) return 1;
  if (strictQuality && (report.summary.majorityFalseApprovals > 0 || report.summary.majorityFalseBlocks > 0)) {
    console.error("\nStrict majority gate failed.");
    return 1;
  }
  return 0;
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  process.exitCode = main(process.argv.slice(2));
}
