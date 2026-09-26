/**
 * majority-benchmark.mjs — B1 majority-of-N certification for the verifier
 * benchmark.
 *
 * A single benchmark run is a variance-limited point estimate
 * (`tasks/benchmark/RESULTS.md`). This scores the same case set across several
 * independent runs, takes the per-case majority verdict, and publishes the
 * agreement and the per-run residuals instead of one headline number.
 *
 * Usage:
 *   node scripts/majority-benchmark.mjs <run1> <run2> <run3> [--cases <dir>]
 *     [--json] [--strict-quality]
 *
 * Completeness errors (a run missing or malforming a case) always fail.
 * `--strict-quality` additionally fails on a majority false approval or false
 * block; splits are published as variance, not hidden.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { classify, scoreBenchmark } from "./benchmark-scoring.mjs";
import { parseGroundTruth } from "./verifier-parser.mjs";

function majorityOf(verdicts) {
  const counts = new Map();
  for (const verdict of verdicts) counts.set(verdict, (counts.get(verdict) ?? 0) + 1);
  let winner = null;
  let winnerCount = 0;
  for (const [verdict, count] of counts) {
    if (count > winnerCount) {
      winner = verdict;
      winnerCount = count;
    }
  }
  const split = winnerCount * 2 <= verdicts.length;
  return { verdict: split ? null : winner, count: winnerCount, split, distribution: Object.fromEntries(counts) };
}

export function scoreMajority({ casesDir, runDirs }) {
  casesDir = resolve(casesDir);
  const errors = [];
  const runs = (runDirs ?? []).map((dir) => resolve(dir));
  if (runs.length < 2) errors.push("majority scoring requires at least two run directories");
  for (const dir of runs) {
    if (!existsSync(dir)) errors.push(`missing run directory: ${dir}`);
  }

  const perRun = runs.map((resultsDir) => scoreBenchmark({ casesDir, resultsDir }));
  for (const [index, report] of perRun.entries()) {
    for (const error of report.errors) errors.push(`run${index + 1}: ${error}`);
  }

  const caseFiles = perRun[0]?.caseFiles ?? [];
  const caseNames = caseFiles.map((file) => basename(file, ".md"));
  const cases = [];
  for (const [index, caseFile] of caseFiles.entries()) {
    const caseName = caseNames[index];
    const groundTruth = parseGroundTruth(readFileSync(caseFile, "utf-8"));
    const verdicts = [];
    let incomplete = false;
    for (const report of perRun) {
      const scored = report.results.find((result) => result.caseName === caseName);
      if (!scored) {
        incomplete = true;
        break;
      }
      verdicts.push(scored.machineVerdict.verdict);
    }
    if (incomplete || groundTruth === null) {
      cases.push({ caseName, groundTruth, verdicts, error: incomplete ? "INCOMPLETE RUN" : "INVALID GROUND TRUTH" });
      continue;
    }
    const majority = majorityOf(verdicts);
    const classification = majority.verdict === null ? null : classify(groundTruth, { verdict: majority.verdict, flaw: "none" });
    cases.push({
      caseName,
      groundTruth,
      verdicts,
      majority: majority.verdict,
      agreement: majority.count / verdicts.length,
      unanimous: majority.count === verdicts.length,
      split: majority.split,
      distribution: majority.distribution,
      status: majority.split ? "SPLIT" : classification.status,
      correct: majority.split ? false : classification.correct,
      falseApproval: majority.split ? false : classification.falseApproval,
      falseBlock: majority.split ? false : classification.falseBlock,
      conservativeOvercall: majority.split ? false : classification.conservativeOvercall,
    });
  }

  const scoredCases = cases.filter((item) => item.error === undefined);
  const unanimous = scoredCases.filter((item) => item.unanimous).length;
  const split = scoredCases.filter((item) => item.split).length;
  const summary = {
    cases: cases.length,
    scored: scoredCases.length,
    runs: runs.length,
    unanimous,
    majorityOnly: scoredCases.length - unanimous - split,
    split,
    majorityCorrect: scoredCases.filter((item) => item.correct).length,
    majorityFalseApprovals: scoredCases.filter((item) => item.falseApproval).length,
    majorityFalseBlocks: scoredCases.filter((item) => item.falseBlock).length,
    conservativeOvercalls: scoredCases.filter((item) => item.conservativeOvercall).length,
    meanAgreement: scoredCases.length === 0
      ? 0
      : scoredCases.reduce((sum, item) => sum + item.agreement, 0) / scoredCases.length,
    perRun: perRun.map((report) => ({
      scored: report.summary.scored,
      correct: report.summary.correct,
      falseApprovals: report.summary.falseApprovals,
      falseBlocks: report.summary.falseBlocks,
      conservativeOvercalls: report.summary.conservativeOvercalls,
    })),
  };

  return { cases, errors, summary };
}

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
