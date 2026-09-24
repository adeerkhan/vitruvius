/**
 * verifier-parser.mjs — Shared strict verdict parser for Vitruvius outputs.
 *
 * A machine verdict is accepted only when the complete line is present and
 * numeric ranges are valid. Partial or decorated lines are integrity errors.
 */

export const VERDICT_PATTERN = /^\s*#*\s*MACHINE_VERDICT:\s*(PASS|PARTIAL|BLOCKED)\s*\|\s*FLAW:\s*([A-Za-z0-9_-]+)\s*\|\s*CONFIDENCE:\s*(0(?:\.\d+)?|1(?:\.0+)?)\s*\|\s*CHECKS_PASSED:\s*([0-8])\/8\s*\|\s*LINE_PINNED:\s*(\d+)\/([1-9]\d*)\s*$/i;

export const GROUND_TRUTH_PATTERN = /\*\*Ground-truth verdict:\*\*\s*(PASS|PARTIAL|BLOCKED)\s*$/im;
export const FLAW_TYPE_PATTERN = /\*\*Flaw type:\*\*\s*(\S+)\s*$/im;

export function parseMachineVerdict(line) {
  if (typeof line !== "string") return null;
  const match = line.match(VERDICT_PATTERN);
  if (!match) return null;
  const confidence = Number.parseFloat(match[3]);
  const checksPassed = Number.parseInt(match[4], 10);
  const linePinnedNum = Number.parseInt(match[5], 10);
  const linePinnedDen = Number.parseInt(match[6], 10);
  if (
    confidence < 0 ||
    confidence > 1 ||
    !Number.isSafeInteger(checksPassed) ||
    !Number.isSafeInteger(linePinnedNum) ||
    !Number.isSafeInteger(linePinnedDen) ||
    checksPassed < 0 ||
    checksPassed > 8 ||
    linePinnedNum < 0 ||
    linePinnedDen <= 0 ||
    linePinnedNum > linePinnedDen
  ) {
    return null;
  }
  const verdict = match[1].toUpperCase();
  const flaw = match[2].trim().toLowerCase();
  if (
    (verdict === "PASS" && (flaw !== "none" || checksPassed !== 8 || linePinnedNum !== linePinnedDen)) ||
    (verdict !== "PASS" && flaw === "none")
  ) {
    return null;
  }
  return {
    verdict,
    flaw,
    confidence,
    checksPassed,
    linePinnedNum,
    linePinnedDen,
  };
}

export function parseGroundTruth(content) {
  const verdictMatches = [...content.matchAll(new RegExp(GROUND_TRUTH_PATTERN.source, "gim"))];
  const flawMatches = [...content.matchAll(new RegExp(FLAW_TYPE_PATTERN.source, "gim"))];
  if (verdictMatches.length !== 1 || flawMatches.length !== 1) return null;
  return {
    verdict: verdictMatches[0][1].toUpperCase(),
    flaw: flawMatches[0][1].trim(),
  };
}
