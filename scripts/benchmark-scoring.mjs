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
import { basename, join } from "node:path";
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
    if (!line.includes("MACHINE_VERDICT")) continue;
    const parsed = /^\s*#*\s*MACHINE_VERDICT:/.test(line)
      ? parseMachineVerdict(line)
      : null;
    if (parsed) verdicts.push(parsed);
    else malformed.push(line.trim());
  }
  return { verdicts, malformed };
}

function classify(groundTruth, machineVerdict) {
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
  const errors = [];
  const caseFiles = walkMarkdown(casesDir);
  const resultFiles = existsSync(resultsDir)
    ? readdirSync(resultsDir)
        .filter((file) => file.endsWith(RESULT_SUFFIX))
        .sort()
    : [];

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
    falseApprovals: results.filter((result) => result.falseApproval).length,
    falseBlocks: results.filter((result) => result.falseBlock).length,
    conservativeOvercalls: results.filter((result) => result.conservativeOvercall).length,
    unknownResults: resultFiles.filter((file) => !expectedResults.has(file)).length,
  };

  return { caseFiles, resultFiles, results, errors, summary };
}
