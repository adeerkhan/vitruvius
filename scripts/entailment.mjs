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
 * Governance phrasing: the words that turn an identifier into a claim about
 * *which* code governs a behaviour. "The room is 1.2 m wide" needs no
 * declaration site; "the aspect gate caps the room at 2.0" does.
 *
 * Deliberately short and tested-adjacent: the vocabulary that fires is `gate`
 * and `caps`, which is the error the V1 pilot actually produced. The longer
 * prose variants that used to sit here (`is the source of`, `held by`,
 * `carried by`, `centralised`) were never observed to fire on any claim, and a
 * matcher nobody has seen match is a matcher nobody can reason about. Add a
 * term when a real claim needs it, not in advance.
 */
const GOVERNANCE =
  /\b(?:gate|gates|cap|caps|capped|limit|limits|enforce[sd]?|enforcement|constrain[sd]?|constraint|govern[sd]?|sets the|defines the)\b/i;

/**
 * Escape a name for use in a regex. Identifiers carry `.`, `-` and `_`.
 */
function escapeName(name) {
  return name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// A non-global shape test. The module's IDENTIFIER carries the /g flag, so
// `.test()` on it would advance lastIndex and answer from stale state.
const IDENTIFIER_SHAPE = /^[A-Za-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)+$/;

/**
 * Does this line *declare* the identifier, or merely use it?
 *
 * Declaration shapes recognised: `const/let/var/function/class/def NAME`,
 * `#define NAME`, `NAME =`, and `NAME:` as an object-literal key. A reference —
 * `foo(NAME)` or `if (NAME > 2)` — is not a declaration, which is the whole
 * distinction this check rests on.
 *
 * Conservative on purpose: a shape that is not a declaration here yields
 * `false`, and a false `false` costs the check a hit rather than a false
 * accusation. Over-reading prose comments as declarations is what would make
 * this useless.
 *
 * One compiled alternation, not three: this runs per identifier per line of every
 * artifact the record declares, so compiling once per call instead of three times
 * is the difference that matters at that count.
 */
export function declaresIdentifier(lineText, identifier) {
  if (typeof lineText !== "string" || !identifier || !IDENTIFIER_SHAPE.test(identifier)) return false;
  const name = escapeName(identifier);
  return new RegExp(
    `\\b(?:const|let|var|function|class|def)\\s+${name}\\b|^${name}\\s*[:=]|#define\\s+${name}\\b`,
  ).test(lineText);
}

/**
 * Does the claim assert governance over an identifier that the anchored line
 * does not declare but some other artifact does?
 *
 * This is the half of the anchor check the token proxy cannot reach: a line can
 * carry every identifier and number in a claim and still be the wrong line,
 * because it *uses* the identifier where another file *defines* it. The V1
 * pilot produced exactly that — a claim anchored to a profile that carries
 * `maxAspectRatio` and `2.0` while the constraint file names the cap.
 *
 * Returns null when the check does not apply, which is most of the time.
 *
 * @param {string} claim
 * @param {string[]} anchoredLines   lines of the anchored file
 * @param {Array<{id: string, lines: string[]}>} artifacts every declared artifact
 * @param {string} [skippingId]     the anchored artifact, excluded from the comparison
 * @returns {{identifier: string, declaringArtifacts: string[]} | null}
 */
export function governanceMismatch(claim, anchoredLines, artifacts, skippingId) {
  if (typeof claim !== "string" || !GOVERNANCE.test(claim)) return null;
  if (!Array.isArray(anchoredLines) || anchoredLines.length === 0) return null;

  for (const match of claim.matchAll(IDENTIFIER)) {
    const identifier = match[0];
    // The anchor itself declares it: no mismatch, whatever else exists.
    if (anchoredLines.some((line) => declaresIdentifier(line, identifier))) continue;
    const declaringArtifacts = (artifacts ?? [])
      .filter(
        (artifact) =>
          artifact.id !== skippingId &&
          Array.isArray(artifact.lines) &&
          artifact.lines.some((line) => declaresIdentifier(line, identifier)),
      )
      .map((artifact) => artifact.id);
    if (declaringArtifacts.length > 0) return { identifier, declaringArtifacts };
  }
  return null;
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
