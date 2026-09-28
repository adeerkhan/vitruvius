import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// review — behavioral.
//
// Shape checks live in tests/all-skills. This suite covers the decisions that
// make an artifact review worth running, and pins what separates it from
// `peer-review`, which shares its severity ladder almost exactly.
//
// The characteristic failure: a review that reads as approval. "Looks good",
// vague praise, or a predicted sign-off all convert an adversarial review into
// a rubber stamp that reads as a clean bill of health it never issued.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const text = readFileSync(join(repoRoot, "skills", "review", "SKILL.md"), "utf8");
const peerText = readFileSync(join(repoRoot, "skills", "peer-review", "SKILL.md"), "utf8");

const ws = (s) =>
  new RegExp(
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .split(/\s+/)
      .join("\\s+"),
    "i",
  );

// --- The framing: the artifact is the subject ------------------------------
assert.match(
  text,
  ws("the artifact is the subject, not a question to research"),
  "review must frame the artifact as the subject, not a question to research",
);
assert.match(
  text,
  /this reuses the\s+`engineering-research` evidence discipline/i,
  "review must reuse the engineering-research evidence discipline",
);

// --- Input gate ------------------------------------------------------------
assert.match(
  text,
  /## Input Gate/i,
  "review must declare the shared input gate",
);
assert.match(
  text,
  /Ask ONE clarifying question if the ask is too vague, then proceed/i,
  "review must ask exactly one clarifying question then proceed, so a vague ask does not stall",
);

// --- Claims are identified before they are checked -------------------------
assert.match(
  text,
  /what is it \(design, calc set,\s+spec, brief, report\), what does it claim, and what standard\/code governs it/i,
  "review must identify the artifact, its claims, and the governing standard before verifying",
);

// --- Verification is per-artifact-type -------------------------------------
// A design is checked for loads, factors, material properties, and sign
// conventions; a report is checked for every number, figure, and citation.
// Treating them alike is how a design review misses a load case.
assert.match(
  text,
  /For a design: loads, factors, material\s+properties, code sections, sign conventions/i,
  "review must check designs for loads, factors, material properties, code sections, and sign conventions",
);
assert.match(
  text,
  /For a report: every number,\s+figure, and citation/i,
  "review must check reports for every number, figure, and citation",
);
assert.match(
  text,
  /Check each against the primary source/i,
  "review must check each item against the primary source",
);

// --- The severity ladder ---------------------------------------------------
for (const level of ["FATAL", "MAJOR", "MINOR"]) {
  assert.match(text, new RegExp(`\\*\\*${level}\\*\\*`), `review must define the ${level} tier`);
}
assert.match(
  text,
  /\*\*FATAL\*\* — unsafe, non-compliant, or unsupported; must fix before use/i,
  "FATAL must mean unsafe, non-compliant, or unsupported",
);
assert.match(
  text,
  /Each finding cites the specific section\/line\/claim it targets/i,
  "review must require each finding to cite the section/line/claim it targets",
);

// --- Blocked is not passed -------------------------------------------------
assert.match(
  text,
  /Check what was NOT verified/i,
  "review must require checking what was NOT verified",
);
assert.match(
  text,
  /never let a missing check read as a\s+pass/i,
  "review must forbid letting a missing check read as a pass",
);
assert.match(
  text,
  /`verified` \/ `inferred` \/ `blocked` per load-bearing item/i,
  "review must record per-item verification status including blocked",
);

// --- The two anti-rubber-stamp rules --------------------------------------
// These are the assertions that make review adversarial rather than agreeable.
assert.match(
  text,
  /Do not praise vaguely/i,
  "review must forbid vague praise; praise without evidence is filler that reads as endorsement",
);
assert.match(
  text,
  /Do not predict ["“]approval["”] — assess revision risk and\s+evidence quality/i,
  "review must forbid predicting approval and require revision-risk assessment instead",
);

// --- The artifact contract -------------------------------------------------
assert.match(
  text,
  /outputs\/<slug>-review\.md/,
  "review must save findings to outputs/<slug>-review.md",
);
assert.match(
  text,
  /Save exactly one review/i,
  "review must save exactly one review, so a rerun does not leave two contradicting artifacts",
);
for (const section of ["Summary assessment", "Strengths", "Revision plan"]) {
  assert.match(
    text,
    new RegExp(section.replace(/ /g, "\\s"), "i"),
    `review's output contract must include ${section}`,
  );
}

// --- Boundaries ------------------------------------------------------------
assert.match(
  text,
  /does NOT produce final designs or construction documents/i,
  "review must state it produces research, not construction documents",
);
assert.match(
  text,
  /research-only, not for final engineering sign-off/i,
  "review must carry the S7 research-only boundary",
);

// --- What separates review from peer-review -------------------------------
// Both carry the same FATAL/MAJOR/MINOR ladder. If the two files were swapped the
// severity assertions would still pass, so the difference must be asserted
// directly: peer-review owns independence and the no-softening rule; review owns
// the artifact-is-the-subject framing and the anti-rubber-stamp pair.
assert.match(
  peerText,
  /independence is the point/i,
  "peer-review must own the independence framing, which review does not claim",
);
assert.match(
  peerText,
  /Never soften a FATAL to MAJOR/i,
  "peer-review must own the no-softening rule",
);
assert.doesNotMatch(
  text,
  /Never soften a FATAL to MAJOR/i,
  "review must not duplicate peer-review's no-softening rule; duplicated rules drift apart",
);
assert.doesNotMatch(
  text,
  /independence is the point/i,
  "review must not claim peer-review's independence framing",
);

console.log(
  "PASS: review asserts the artifact-is-the-subject framing, per-artifact-type checks, " +
    "blocked-not-pass, the anti-rubber-stamp pair, and its separation from peer-review",
);
