/**
 * verifier-parser.mjs — strict machine-verdict grammar shared with proposal intake.
 * Keep this implementation aligned with scripts/verifier-parser.mjs.
 */

export const VERDICT_PATTERN = /^\s*#*\s*MACHINE_VERDICT:\s*(PASS|PARTIAL|BLOCKED)\s*\|\s*FLAW:\s*([A-Za-z0-9_-]+)\s*\|\s*CONFIDENCE:\s*(0(?:\.\d+)?|1(?:\.0+)?)\s*\|\s*CHECKS_PASSED:\s*([0-8])\/8\s*\|\s*LINE_PINNED:\s*(\d+)\/([1-9]\d*)\s*$/;
export const GROUND_TRUTH_PATTERN = /\*\*Ground-truth verdict:\*\*\s*(PASS|PARTIAL|BLOCKED)\s*$/im;
export const FLAW_TYPE_PATTERN = /\*\*Flaw type:\*\*\s*(\S+)\s*$/im;
const FLAW_TYPES = new Set([
  "none", "code_misapplication", "unit_sign_error", "omission", "missing_factor",
  "calculation_error", "synthesis_overreach", "conflicting_standard", "criterion_mismatch", "entailment_failure",
]);
const GROUND_TRUTH_FLAWS = FLAW_TYPES;
const GROUND_TRUTH_MARKER = /\*\*Ground-truth verdict:\*\*/gi;
const FLAW_MARKER = /\*\*Flaw type:\*\*/gi;

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
  ) return null;
  const verdict = match[1].toUpperCase();
  const flaw = match[2].trim().toLowerCase();
  if (!FLAW_TYPES.has(flaw)) return null;
  if (
    (verdict === "PASS" && (flaw !== "none" || checksPassed !== 8 || linePinnedNum !== linePinnedDen)) ||
    (verdict !== "PASS" && flaw === "none")
  ) return null;
  return { verdict, flaw, confidence, checksPassed, linePinnedNum, linePinnedDen };
}

export function parseGroundTruth(content) {
  if (typeof content !== "string") return null;
  const groundTruthMarkerCount = [...content.matchAll(new RegExp(GROUND_TRUTH_MARKER.source, "gi"))].length;
  const flawMarkerCount = [...content.matchAll(new RegExp(FLAW_MARKER.source, "gi"))].length;
  if (groundTruthMarkerCount !== 1 || flawMarkerCount !== 1) return null;
  const verdictMatches = [...content.matchAll(new RegExp(GROUND_TRUTH_PATTERN.source, "gim"))];
  const flawMatches = [...content.matchAll(new RegExp(FLAW_TYPE_PATTERN.source, "gim"))];
  if (verdictMatches.length !== 1 || flawMatches.length !== 1) return null;
  const verdict = verdictMatches[0][1].toUpperCase();
  const flaw = flawMatches[0][1].trim().toLowerCase();
  if (!GROUND_TRUTH_FLAWS.has(flaw)) return null;
  if ((verdict === "PASS" && flaw !== "none") || (verdict !== "PASS" && flaw === "none")) return null;
  return { verdict, flaw };
}
