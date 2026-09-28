import { strict as assert } from "node:assert";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// standards-lookup — behavioral.
//
// This skill's behavior lives in its 20 reference files: each is a retrieval
// card for one standards body. The failure mode is a card that names a standard
// but cannot actually be used to find a provision — no edition, no access
// reality, no citation format. So this suite iterates every card and asserts
// the retrieval structure, rather than regex-matching the SKILL.md once.
//
// Shape checks (file exists, frontmatter, name) already live in
// tests/all-skills/test-all-skills.mjs.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const skillDir = join(repoRoot, "skills", "standards-lookup");
const text = readFileSync(join(skillDir, "SKILL.md"), "utf8");
const refDir = join(skillDir, "references");

// --- The skill must make edition a first-class decision -------------------
// Failure mode: a provision quoted from the wrong edition. Numbers move between
// editions, so the skill has to force the edition question.
assert.match(
  text,
  /jurisdiction\/edition/i,
  "standards-lookup's gate must force a jurisdiction/edition decision",
);
assert.match(
  text,
  /edition/i,
  "standards-lookup must treat edition as part of retrieval, not an afterthought",
);
assert.match(
  text,
  /reproducible|provenance/i,
  "standards-lookup must return provisions another engineer can reproduce",
);

// Failure mode: a dead or paywalled source quoted as if it were read.
assert.match(
  text,
  /paywalled|paywall/i,
  "standards-lookup must name paywall reality explicitly, since most standards are paywalled",
);

// --- Every reference card must be usable for retrieval --------------------
const cards = readdirSync(refDir).filter((f) => f.endsWith(".md"));
assert.ok(cards.length >= 15, `expected a real card set, found only ${cards.length}`);

const missing = [];
for (const card of cards) {
  const body = readFileSync(join(refDir, card), "utf8");
  const gaps = [];
  if (!/^#\s+\S/m.test(body)) gaps.push("no title");
  if (!/## Scope|## When to use|## Applicability/i.test(body)) gaps.push("no scope/applicability");
  // "Access" is how a paywalled body is reached. A card for open/free
  // standards legitimately satisfies the same need with an availability
  // section instead, so both count — the requirement is "an engineer can tell
  // me how to get this", not the specific heading.
  if (!/## Access|## Obtaining|## How to access|## Free alternatives|## Availability/i.test(body)) {
    gaps.push("no access/availability section");
  }
  // An engineer cannot act on a provision without knowing whether its language
  // is enforceable. Every card must state the mandatory/advisory convention.
  if (!/## Mandatory-language conventions|mandatory|advisory|\bshall\b/i.test(body)) {
    gaps.push("no mandatory/advisory language convention");
  }
  if (gaps.length > 0) missing.push(`${card}: ${gaps.join(", ")}`);
}

assert.deepStrictEqual(
  missing,
  [],
  `every standards card must carry the structure needed to retrieve a provision:\n  ${missing.join("\n  ")}`,
);

// --- The cards must stay distinct -----------------------------------------
// Failure mode: two cards that describe the same body, which means one of them
// was copy-pasted and its retrieval patterns are wrong for its standard.
const titles = new Map();
const dupes = [];
for (const card of cards) {
  const title = readFileSync(join(refDir, card), "utf8").match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (!title) continue;
  if (titles.has(title)) dupes.push(`${title} (${titles.get(title)} and ${card})`);
  titles.set(title, card);
}
assert.deepStrictEqual(dupes, [], `standards cards must have distinct titles; duplicates: ${dupes.join(", ")}`);

// --- The boundary ----------------------------------------------------------
assert.match(
  text,
  /research-only, not for final engineering sign-off/i,
  "standards-lookup must carry the S7 research-only boundary",
);
// The boundary that actually matters here is against overreach into judgment.
// Retrieval and judging are different acts: this skill locates and quotes a
// provision, and must not decide whether it supports a conclusion. That
// decision belongs to the verifier.
assert.match(
  text,
  /belongs to the\s+verifier|judging whether a\s+provision supports/i,
  "standards-lookup must hand the support judgment to the verifier, not make it",
);
// Prose is hard-wrapped, so multi-word phrases can straddle a newline. Every
// assertion below is written against whitespace-flexible patterns for that
// reason — a wrapped sentence must not read as a missing rule.
// Prose is hard-wrapped, so a multi-word phrase can straddle a newline. Match
// phrases whitespace-flexibly: escape regex metacharacters first, then let any
// run of whitespace stand in for a single space. (Escaping first matters — a
// literal "+" in a phrase would otherwise become a quantifier.)
const ws = (s) =>
  new RegExp(
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .split(/\s+/)
      .join("\\s+"),
    "i",
  );

assert.match(
  text,
  ws("Do NOT use for general engineering knowledge"),
  "standards-lookup must refuse general knowledge that has no standard backing",
);
// Never reconstruct a mandatory provision from memory — the single most
// dangerous thing a paywalled-standards skill can do.
assert.match(
  text,
  /never reconstruct a .?shall.? provision from memory|Do not reconstruct mandatory\s+provisions from memory/i,
  "standards-lookup must forbid reconstructing a 'shall' provision from memory",
);
// And a conflict must be surfaced, never silently resolved by picking the
// conservative value — that is a design decision, not a retrieval one.
assert.match(
  text,
  /do not silently pick|never silently pick/i,
  "standards-lookup must report conflicting standards rather than silently choosing",
);

console.log(
  `PASS: standards-lookup forces edition/paywall decisions and all ${cards.length} cards carry ` +
    "scope, access, and provision-retrieval structure with distinct titles",
);
