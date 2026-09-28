import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// summarize — behavioral.
//
// tests/all-skills/test-all-skills.mjs already covers shape (file exists,
// frontmatter, name, line count, no personal paths). This suite covers the
// decisions the skill makes, because each rule below exists to prevent a
// specific, named failure: summarizing an abstract instead of the document,
// inventing a plausible number, or filling a paywalled gap from memory.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const text = readFileSync(join(repoRoot, "skills", "summarize", "SKILL.md"), "utf8");

// Failure mode: agent reads the abstract and calls it a summary. The skill must
// require reading the whole document, and say why the abstract is not enough.
assert.match(
  text,
  /read the whole document/i,
  "summarize must require reading the whole document, not the abstract",
);
assert.match(
  text,
  /not just the abstract|abstract or first pages/i,
  "summarize must name the abstract-only failure mode explicitly",
);

// Failure mode: agent invents a number to fill a table. The skill must make
// invention a named prohibition, not an implied preference.
assert.match(
  text,
  /extract, don't invent|Extract, don.t invent/i,
  "summarize must carry an explicit extract-don't-invent rule",
);
assert.match(
  text,
  /must come from the document|every number, unit, and provision/i,
  "summarize must bind every number and unit to the source document",
);
assert.match(
  text,
  /with units|key values/i,
  "summarize must require units on extracted values",
);

// Failure mode: agent fills a paywalled or unreadable gap from memory, which
// is the single most damaging thing this skill can do.
assert.match(
  text,
  /never fill the gap from memory|never fill the gap/i,
  "summarize must forbid filling an unreadable gap from memory",
);
assert.match(
  text,
  /blocked/,
  "summarize must carry the blocked status for unreadable content",
);
assert.match(
  text,
  /if the document is paywalled, partial|paywalled, partial/i,
  "summarize must name paywalled and partial documents as a real case",
);

// Failure mode: the summary is unusable because the reader cannot get back to
// the source. Section references must survive condensation.
assert.match(
  text,
  /section (?:references|numbers)|by section/i,
  "summarize must carry section references through to the output",
);
assert.match(
  text,
  /standard \+ edition, URL, or path|cite the document/i,
  "summarize must require citing the document with its edition or path",
);

// The artifact contract, and the boundary. Without these the skill's output
// cannot be audited or safely used.
assert.match(
  text,
  /outputs\/<slug>-summary\.md/,
  "summarize must declare its artifact path so the output is locatable",
);
assert.match(
  text,
  /research-only, not for final engineering sign-off/i,
  "summarize must carry the S7 research-only boundary",
);
assert.match(
  text,
  /never launders uncertainty/i,
  "summarize must state it does not launder uncertainty",
);
assert.match(
  text,
  /does NOT produce final designs/i,
  "summarize must state it does not produce final designs",
);

// Input gate: a summary of the wrong edition is worse than no summary.
assert.match(text, /## Input Gate/, "summarize must declare the shared input gate");
assert.match(
  text,
  /jurisdiction\/edition/i,
  "summarize's gate must cover jurisdiction/edition, since provisions differ by edition",
);

console.log(
  "PASS: summarize asserts whole-document reading, extract-don't-invent, blocked-not-memory, " +
    "units, section references, artifact contract, and the S7 boundary",
);
