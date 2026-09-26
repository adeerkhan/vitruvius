/**
 * High-precision entailment proxy for anchored repository claims.
 *
 * The problem-anchor contract proves a claim points at real, non-blank,
 * hash-pinned bytes. It does not read the claim. A finding asserting that a
 * module is absent, anchored to the file that proves it is present, passes.
 * This narrows that: for a `repo` finding marked `verified`, the claim's
 * high-precision content — quoted spans, identifiers, and measures — must be
 * carried by the anchored line.
 *
 * Deliberately NOT a semantic entailment check. It reads tokens, not meaning,
 * so it cannot tell a correct paraphrase from an inverted one, and it cannot
 * judge a negative claim at all. A finding that paraphrases rather than quotes
 * should be `partial`, not `verified`; the stricter status is what buys this
 * check its low false-positive rate.
 */

// A quoted span in the claim must appear in the line, case-insensitively.
const QUOTED = /`([^`\n]{2,80})`/g;
// dotted / snake_case / kebab-case identifiers containing a letter
const IDENTIFIER = /\b[A-Za-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)+\b/g;
// a number carrying a unit. Percentages and plain counts are excluded on
// purpose: they are the most legitimately derived values in a research claim.
const MEASURE = /(?<![\w.])(\d+(?:[.,]\d+)?)\s*(mm2|mm²|cm2|cm²|m2|m²|mm|cm|inch|inches|in|feet|ft|m)\b/gi;

// Base units for comparison. Length in millimetres, area in square millimetres.
const LENGTH_TO_MM = { mm: 1, cm: 10, m: 1000, in: 25.4, inch: 25.4, inches: 25.4, ft: 304.8, feet: 304.8 };
const AREA_TO_MM2 = { mm2: 1, "mm²": 1, cm2: 100, "cm²": 100, m2: 1e6, "m²": 1e6 };
const RELATIVE_TOLERANCE = 0.005; // 0.5%, so rounding does not trip it

function parseNumber(raw) {
  return Number(String(raw).replace(/,/g, ""));
}

function toBase(value, unit) {
  const key = unit.toLowerCase();
  if (key in AREA_TO_MM2) return { base: value * AREA_TO_MM2[key], kind: "area" };
  if (key in LENGTH_TO_MM) return { base: value * LENGTH_TO_MM[key], kind: "length" };
  return null;
}

function measureSupported(measure, line) {
  const wanted = toBase(measure.value, measure.unit);
  if (!wanted) return true;
  for (const candidate of line.matchAll(MEASURE)) {
    const value = parseNumber(candidate[1]);
    if (Number.isNaN(value)) continue;
    const got = toBase(value, candidate[2]);
    // `toBase` already discriminates kind, so a 20 m² in the line can never
    // satisfy a 5 m claim. Comparing raw magnitudes here instead would reject
    // every dimension over a metre.
    if (!got || got.kind !== wanted.kind) continue;
    const scale = Math.max(Math.abs(got.base), Math.abs(wanted.base), 1e-9);
    if (Math.abs(got.base - wanted.base) / scale <= RELATIVE_TOLERANCE) return true;
  }
  return false;
}

/**
 * @returns {{ token: string, kind: string }[]} unsupported high-precision tokens
 */
export function unsupportedTokens(claim, anchoredLine) {
  const line = anchoredLine.toLowerCase();
  const unsupported = [];

  for (const match of claim.matchAll(QUOTED)) {
    if (!line.includes(match[1].toLowerCase())) {
      unsupported.push({ token: `\`${match[1]}\``, kind: "quoted span" });
    }
  }

  for (const match of claim.matchAll(IDENTIFIER)) {
    if (!line.includes(match[0].toLowerCase())) {
      unsupported.push({ token: match[0], kind: "identifier" });
    }
  }

  for (const match of claim.matchAll(MEASURE)) {
    const value = parseNumber(match[1]);
    if (Number.isNaN(value)) continue;
    if (!measureSupported({ value, unit: match[2] }, anchoredLine)) {
      unsupported.push({ token: `${match[1]} ${match[2]}`, kind: "measure" });
    }
  }

  return unsupported;
}
