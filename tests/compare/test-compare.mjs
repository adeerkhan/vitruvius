import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// compare — behavioral.
//
// Shape checks (exists, frontmatter, name) live in tests/all-skills. This suite
// covers the decisions that make a comparison trustworthy. The characteristic
// failure of a comparison document is that it reads as authoritative while
// resting on sources nobody opened, or that it silently crowns a winner.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const text = readFileSync(join(repoRoot, "skills", "compare", "SKILL.md"), "utf8");
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

// Failure mode: the matrix is built from titles and abstracts, so every cell
// is plausible and none is checked. Reading each source directly is the whole
// point of the skill.
assert.match(
  text,
  ws("Read each source directly before describing it"),
  "compare must require reading each source directly, not describing it from a title",
);

// Failure mode: a row asserts a provision without saying which edition, so the
// comparison silently mixes revisions.
assert.match(
  text,
  ws("section + edition"),
  "compare must bind every source row to section and edition",
);
assert.match(
  text,
  /standard \/ URL \/ artifact|standard\/URL\/artifact/i,
  "compare must identify the source kind in the matrix",
);

// Failure mode: confidence is a free-text column, so "probably" passes review.
assert.match(
  text,
  /verified/,
  "compare's matrix must carry a confidence column",
);
assert.match(
  text,
  /inferred/,
  "compare's confidence vocabulary must distinguish inferred from verified",
);
assert.match(
  text,
  /blocked/,
  "compare's confidence vocabulary must have a blocked state for unreachable sources",
);

// Failure mode: sources listed but never cited, or citations with no source.
assert.match(
  text,
  /inline citations/i,
  "compare must require inline citations in the matrix",
);
assert.match(
  text,
  /verify every source means what it/i,
  "compare must require verifying each source means what the row claims",
);

// The scale decision: over-delegating a 3-item comparison wastes tokens and
// loses the thread.
assert.match(
  text,
  /direct search for 2/,
  "compare must scale 2-3 items to direct search rather than subagents",
);
assert.match(
  text,
  /researcher. subagent only for a\s+broad set|subagent only for/i,
  "compare must reserve subagents for genuinely broad sets",
);

assert.match(text, /## Input Gate/, "compare must declare the shared input gate");
assert.match(
  text,
  /outputs\/\.plans\/<slug>\.md/,
  "compare must write a plan artifact, so the comparison set is frozen before gathering",
);
assert.match(
  text,
  /engineering-research/,
  "compare must run the shared research method rather than restating the loop",
);

console.log(
  "PASS: compare asserts direct source reading, section+edition binding, a real confidence " +
    "vocabulary, citation integrity, and a scale decision",
);
