/**
 * verifier-parser.mjs — Shared verdict parser for Vitruvius verifier outputs.
 *
 * Parses MACHINE_VERDICT lines and ground-truth verdicts from benchmark files.
 * Used by score-benchmark.mjs and test-verifier.mjs.
 */

export const VERDICT_PATTERN = /^MACHINE_VERDICT:\s*(PASS|PARTIAL|BLOCKED)\s*\|\s*FLAW:\s*(\S+)\s*\|\s*CONFIDENCE:\s*([\d.]+)\s*\|\s*CHECKS_PASSED:\s*(\d+)\/8\s*\|\s*LINE_PINNED:\s*(\d+)\/(\d+)/i;

export const GROUND_TRUTH_PATTERN = /\*\*Ground-truth verdict:\*\*\s*(PASS|PARTIAL|BLOCKED)/i;
export const FLAW_TYPE_PATTERN = /\*\*Flaw type:\*\*\s*(\S+)/i;

export function parseMachineVerdict(line) {
  const match = line.match(VERDICT_PATTERN);
  if (!match) return null;
  return {
    verdict: match[1].toUpperCase(),
    flaw: match[2].trim(),
    confidence: parseFloat(match[3]),
    checksPassed: parseInt(match[4], 10),
    linePinnedNum: parseInt(match[5], 10),
    linePinnedDen: parseInt(match[6], 10),
  };
}

export function parseGroundTruth(content) {
  const verdictMatch = content.match(GROUND_TRUTH_PATTERN);
  const flawMatch = content.match(FLAW_TYPE_PATTERN);
  if (!verdictMatch) return null;
  return {
    verdict: verdictMatch[1].toUpperCase(),
    flaw: flawMatch ? flawMatch[1].trim() : "none",
  };
}
