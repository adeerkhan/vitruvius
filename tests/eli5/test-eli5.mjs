import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// eli5 — behavioral.
//
// Shape checks live in tests/all-skills. This suite covers the decisions that
// make a plain-language explanation of engineering worth having.
//
// The failure this skill has to resist is the obvious one: simplification that
// is *too* successful. An explanation that drops the safety consequence, or that
// gets read as a compliance check, is worse than jargon — it is confidently
// wrong and aimed at someone who now trusts it. So the assertions below are
// almost entirely about what must survive the simplification.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const text = readFileSync(join(repoRoot, "skills", "eli5", "SKILL.md"), "utf8");

const ws = (s) =>
  new RegExp(
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .split(/\s+/)
      .join("\\s+"),
    "i",
  );

// --- The goal is clarity, not reduction ------------------------------------
assert.match(
  text,
  /The point is clarity, not\s+dumbing down/i,
  "eli5 must state that the goal is clarity, not dumbing down",
);

// --- Read the source, do not explain from memory --------------------------
// An explanation from memory is the most dangerous kind, because the reader
// cannot tell it was not checked.
assert.match(
  text,
  /If the user\s+names a specific standard, provision, or part, read it first — do not\s+explain from memory/i,
  "eli5 must require reading a named standard or part before explaining it, not explaining from memory",
);

// --- The structure ---------------------------------------------------------
for (const beat of [
  "One-sentence summary",
  "The big idea",
  "How it works",
  "Why it matters",
  "What to be skeptical of",
  "If you remember 3 things",
]) {
  assert.match(text, new RegExp(beat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    `eli5 must carry the "${beat}" beat, so the explanation has a shape`);
}
// "What to be skeptical of" is the beat that keeps an explanation honest; it is
// where the reader learns which simplification is load-bearing.
assert.match(
  text,
  /What to be skeptical of\*\* \(where simplification hides risk\)/i,
  "eli5 must define the skepticism beat as where simplification hides risk",
);

// --- Language discipline ---------------------------------------------------
assert.match(
  text,
  /Use short sentences and concrete words/i,
  "eli5 must require short sentences and concrete words",
);
assert.match(
  text,
  /Define jargon immediately or\s+remove it/i,
  "eli5 must require jargon be defined immediately or removed",
);
assert.match(
  text,
  /Prefer one good analogy over\s+several weak ones/i,
  "eli5 must prefer one good analogy over several weak ones",
);

// --- The load-bearing constraint: accuracy is not tradeable ---------------
assert.match(
  text,
  /Keep numbers, units, and safety consequences intact/i,
  "eli5 must require numbers, units, and safety consequences to survive simplification",
);
assert.match(
  text,
  /Never trade accuracy\s+for simplicity on anything that affects safety or a design decision/i,
  "eli5 must forbid trading accuracy for simplicity on anything affecting safety or a design decision",
);

// --- A lossy analogy must be declared lossy -------------------------------
// This is the assertion most likely to be dropped in a rewrite, and it is the
// difference between an honest simplification and a misleading one.
assert.match(
  text,
  /Separate the engineering fact from the simplification/i,
  "eli5 must require separating the engineering fact from the simplification",
);
assert.match(
  text,
  /When an analogy\s+is lossy — when it would mislead an engineer — say so in one line/i,
  "eli5 must require a lossy analogy to be declared lossy in one line",
);

// --- It is not a compliance check -----------------------------------------
assert.match(
  text,
  /An ELI5 of a code provision is not a compliance check/i,
  "eli5 must state an explanation is not a compliance check",
);
assert.match(
  text,
  /point them to `?\/skill:verify`? or `?\/skill:review`?/i,
  "eli5 must route a real decision to verify or review rather than answering it in plain language",
);

// --- Output shape ----------------------------------------------------------
assert.match(
  text,
  /Keep the explanation inline unless the user asks to save it/i,
  "eli5 must keep the explanation inline unless the user asks to save it",
);

// --- Boundaries ------------------------------------------------------------
assert.match(
  text,
  /research-only, not for final engineering sign-off/i,
  "eli5 must carry the S7 research-only boundary",
);

console.log(
  "PASS: eli5 asserts read-before-explaining, the honesty beats, the no-accuracy-trade " +
    "constraint, declared-lossy analogies, and the not-a-compliance-check boundary",
);
