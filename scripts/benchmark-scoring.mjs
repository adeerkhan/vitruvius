/**
 * benchmark-scoring.mjs — Pure benchmark discovery and verdict classification.
 *
 * The CLI and tests use this module so missing evidence cannot be hidden by
 * different scoring implementations.
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { parseGroundTruth, parseMachineVerdict } from "./verifier-parser.mjs";

const RESULT_SUFFIX = "-result.md";

function walkMarkdown(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory).sort()) {
    const path = join(directory, entry);
    let stat;
    try {
      stat = statSync(path);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      files.push(...walkMarkdown(path));
    } else if (stat.isFile() && entry.endsWith(".md") && entry !== "README.md") {
      files.push(path);
    }
  }
  return files;
}

function readVerdictLines(content) {
  const verdicts = [];
  const malformed = [];
  for (const line of content.split(/\r?\n/)) {
    if (!line.toUpperCase().includes("MACHINE_VERDICT")) continue;
    const parsed = /^\s*#*\s*MACHINE_VERDICT:/i.test(line)
      ? parseMachineVerdict(line)
      : null;
    if (parsed) verdicts.push(parsed);
    else malformed.push(line.trim());
  }
  return { verdicts, malformed };
}

export function classify(groundTruth, machineVerdict) {
  const verdictMatch = machineVerdict.verdict === groundTruth.verdict;
  const flawMatch =
    machineVerdict.flaw.toLowerCase() === groundTruth.flaw.toLowerCase() ||
    (groundTruth.verdict === "PASS" && machineVerdict.flaw.toLowerCase() === "none");
  const falseApproval = groundTruth.verdict !== "PASS" && machineVerdict.verdict === "PASS";
  const falseBlock = groundTruth.verdict === "PASS" && machineVerdict.verdict !== "PASS";
  const conservativeOvercall =
    groundTruth.verdict === "PARTIAL" && machineVerdict.verdict === "BLOCKED";
  const status = verdictMatch
    ? "CORRECT"
    : falseApproval
      ? "FALSE APPROVAL"
      : falseBlock
        ? "FALSE BLOCK"
        : conservativeOvercall
          ? "CONSERVATIVE OVERCALL"
          : "WRONG VERDICT";

  return {
    verdictMatch,
    flawMatch,
    falseApproval,
    falseBlock,
    conservativeOvercall,
    correct: verdictMatch,
    status,
  };
}

export function scoreCase(caseFile, resultFile) {
  const caseName = basename(caseFile, ".md");
  const caseContent = readFileSync(caseFile, "utf-8");
  const groundTruth = parseGroundTruth(caseContent);
  if (!groundTruth) {
    return { caseName, error: `INVALID GROUND TRUTH: ${caseName}` };
  }
  if (!existsSync(resultFile)) {
    return { caseName, error: `MISSING RESULT: ${caseName}${RESULT_SUFFIX}` };
  }

  const resultContent = readFileSync(resultFile, "utf-8");
  const { verdicts, malformed } = readVerdictLines(resultContent);
  if (malformed.length > 0) {
    return { caseName, error: `MALFORMED VERDICT: ${caseName}` };
  }
  if (verdicts.length === 0) {
    return { caseName, error: `MISSING VERDICT: ${caseName}` };
  }
  if (verdicts.length > 1) {
    return { caseName, error: `DUPLICATE VERDICT: ${caseName}` };
  }

  const machineVerdict = verdicts[0];
  return {
    caseName,
    groundTruth,
    machineVerdict,
    ...classify(groundTruth, machineVerdict),
  };
}

export function scoreBenchmark({ casesDir, resultsDir }) {
  casesDir = resolve(casesDir);
  resultsDir = resolve(resultsDir);
  const errors = [];
  const caseFiles = walkMarkdown(casesDir);
  const resultFiles = existsSync(resultsDir)
    ? readdirSync(resultsDir)
        .filter((file) => file.endsWith(RESULT_SUFFIX))
        .sort()
    : [];
  const nestedResultFiles = existsSync(resultsDir)
    ? walkMarkdown(resultsDir).filter((file) => basename(file).endsWith(RESULT_SUFFIX) && dirname(file) !== resolve(resultsDir))
    : [];

  if (nestedResultFiles.length > 0) {
    for (const file of nestedResultFiles) {
      errors.push(`NESTED RESULT: ${file}`);
    }
  }

  if (caseFiles.length === 0) {
    errors.push(`NO CASES: ${casesDir}`);
  }
  if (!existsSync(resultsDir)) {
    errors.push(`MISSING RESULTS DIRECTORY: ${resultsDir}`);
  }

  const expectedResults = new Set();
  const caseNames = new Set();
  for (const caseFile of caseFiles) {
    const caseName = basename(caseFile, ".md");
    if (caseNames.has(caseName)) {
      errors.push(`DUPLICATE CASE: ${caseName}`);
      continue;
    }
    caseNames.add(caseName);
    expectedResults.add(`${caseName}${RESULT_SUFFIX}`);
  }

  for (const resultFile of resultFiles) {
    if (!expectedResults.has(resultFile)) {
      errors.push(`UNKNOWN RESULT: ${resultFile}`);
    }
  }

  const results = [];
  for (const caseFile of caseFiles) {
    const caseName = basename(caseFile, ".md");
    const resultFile = join(resultsDir, `${caseName}${RESULT_SUFFIX}`);
    let result;
    try {
      result = scoreCase(caseFile, resultFile);
    } catch (error) {
      errors.push(`READ ERROR: ${caseName}: ${error.message}`);
      continue;
    }
    if (result.error) {
      errors.push(result.error);
      continue;
    }
    results.push(result);
  }

  const summary = {
    total: caseFiles.length,
    scored: results.length,
    correct: results.filter((result) => result.correct).length,
    flawMatches: results.filter((result) => result.flawMatch).length,
    falseApprovals: results.filter((result) => result.falseApproval).length,
    falseBlocks: results.filter((result) => result.falseBlock).length,
    conservativeOvercalls: results.filter((result) => result.conservativeOvercall).length,
    unknownResults: resultFiles.filter((file) => !expectedResults.has(file)).length,
  };

  return { caseFiles, resultFiles, results, errors, summary };
}

/** Pick the strict-majority verdict, or null when the runs split. */
export function majorityOf(verdicts) {
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

/**
 * Score the same case set across independent runs and take the per-case
 * majority verdict. Completeness errors (a run missing or malforming a case)
 * are reported; splits are surfaced as variance, never silently resolved.
 */
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
