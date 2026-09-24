/**
 * score-benchmark.mjs — Scores verifier output against ground truth.
 *
 * Usage:
 *   node scripts/score-benchmark.mjs <results-dir> [cases-dir]
 *   node scripts/score-benchmark.mjs --strict-quality <results-dir> [cases-dir]
 *   node scripts/score-benchmark.mjs --case <case-file> <verifier-output-file>
 *
 * Completeness errors (missing, malformed, duplicate, or unknown results)
 * always fail. Quality residuals are reported by default and fail only with
 * --strict-quality, so incomplete evidence is never confused with a model
 * error.
 */

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { scoreBenchmark, scoreCase } from "./benchmark-scoring.mjs";

function printUsage() {
  console.error("Usage: node scripts/score-benchmark.mjs [--strict-quality] <results-dir> [cases-dir]");
  console.error("       node scripts/score-benchmark.mjs --case <case-file> <verifier-output-file>");
}

function printSingleResult(result) {
  if (result.error) {
    console.error(`ERROR: ${result.error}`);
    return;
  }
  console.log(
    `${result.caseName}: ${result.status} (expected=${result.groundTruth.verdict} ` +
      `got=${result.machineVerdict.verdict} checks=${result.machineVerdict.checksPassed}/8)`,
  );
}

function printReport(report) {
  console.log(`\nBenchmark Results — ${new Date().toISOString().split("T")[0]}`);
  console.log("=".repeat(60));

  for (const result of report.results) {
    printSingleResult(result);
  }

  if (report.errors.length > 0) {
    console.error("\nIntegrity errors:");
    for (const error of report.errors) console.error(`  ${error}`);
  }

  const { summary } = report;
  const accuracy = summary.scored === 0 ? 0 : (summary.correct / summary.scored) * 100;
  console.log("\nOverall Summary:");
  console.log("=".repeat(60));
  console.log(`  Cases expected:      ${summary.total}`);
  console.log(`  Cases scored:        ${summary.scored}`);
  console.log(`  Correct verdicts:    ${summary.correct}/${summary.scored} (${accuracy.toFixed(1)}%)`);
  console.log(`  Flaw-type matches:   ${summary.flawMatches}/${summary.scored}`);
  console.log(`  False approvals:     ${summary.falseApprovals}`);
  console.log(`  False blocks:        ${summary.falseBlocks}`);
  console.log(`  Conservative over:   ${summary.conservativeOvercalls}`);
  console.log(`  Unknown results:     ${summary.unknownResults}`);
}

function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    printUsage();
    return 0;
  }

  if (argv[0] === "--case") {
    if (argv.length !== 3) {
      printUsage();
      return 1;
    }
    const result = scoreCase(resolve(argv[1]), resolve(argv[2]));
    printSingleResult(result);
    return result.error ? 1 : 0;
  }

  const strictQuality = argv.includes("--strict-quality");
  const positional = argv.filter((arg) => arg !== "--strict-quality");
  if (positional.length < 1 || positional.length > 2) {
    printUsage();
    return 1;
  }

  const resultsDir = resolve(positional[0]);
  const casesDir = resolve(positional[1] ?? join(process.cwd(), "tasks", "benchmark", "cases"));
  if (!existsSync(resultsDir)) {
    console.error(`Results directory not found: ${resultsDir}`);
    return 1;
  }
  if (!existsSync(casesDir)) {
    console.error(`Cases directory not found: ${casesDir}`);
    return 1;
  }

  const report = scoreBenchmark({ casesDir, resultsDir });
  printReport(report);

  if (report.errors.length > 0) return 1;
  if (strictQuality && (report.summary.falseApprovals > 0 || report.summary.falseBlocks > 0)) {
    console.error("\nStrict quality gate failed.");
    return 1;
  }
  return 0;
}

process.exitCode = main(process.argv.slice(2));
