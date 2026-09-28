import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// artifact-reading — behavioral.
//
// Shape checks live in tests/all-skills. This suite covers the decisions that
// make anchored document reading worth having.
//
// The skill's own framing is that most research failures are reading failures —
// answering from one page, from a title, or from memory. So the assertions below
// are the three ways that happens, plus the anchor that makes any extract
// re-checkable. A reading skill that loses these still parses documents; it just
// produces answers nobody can verify.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const text = readFileSync(join(repoRoot, "skills", "artifact-reading", "SKILL.md"), "utf8");

const ws = (s) =>
  new RegExp(
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .split(/\s+/)
      .join("\\s+"),
    "i",
  );

// --- The premise -----------------------------------------------------------
assert.match(
  text,
  /most research failures are reading\s+failures/i,
  "artifact-reading must state the premise that most research failures are reading failures",
);
assert.match(
  text,
  /answering from one page, from a title, or from memory/i,
  "artifact-reading must name the three specific reading failures it prevents",
);

// --- Map before answering --------------------------------------------------
// Reading one page and generalizing is the failure. Structure first.
assert.match(
  text,
  /Map the document first/i,
  "artifact-reading must require mapping the document before answering",
);
assert.match(
  text,
  /where the normative \(required\) content lives vs\s+the informative \(guidance\) content/i,
  "artifact-reading must require separating normative from informative content",
);

// --- Every extract carries a location --------------------------------------
// This is the property that makes an extract re-checkable later. Strip the
// location and the number becomes an assertion with no trail.
assert.match(
  text,
  /Anchor every extract to a location/i,
  "artifact-reading must require anchoring every extract to a location",
);
assert.match(
  text,
  /Page\/section\/table\/figure numbers\s+for PDFs and standards; sheet \+ zone for drawings; clause \+ line for code/i,
  "artifact-reading must give the anchor form per artifact type (PDF, drawing, code)",
);
assert.match(
  text,
  /Keep table values, figure labels, part numbers, and quoted snippets tied to\s+their location so they can be re-checked/i,
  "artifact-reading must require table values, figure labels, and part numbers stay tied to their location",
);
assert.match(
  text,
  /Never strip the location when handing\s+findings to synthesis/i,
  "artifact-reading must forbid stripping the location when handing findings to synthesis",
);

// --- Read the pages the answer depends on ----------------------------------
assert.match(
  text,
  /Read the pages the answer depends on/i,
  "artifact-reading must require reading every page the answer depends on",
);
assert.match(
  text,
  /Do not answer from a single\s+visible page when the question spans methods, tables, notes, or appendices/i,
  "artifact-reading must forbid answering from a single visible page when the question spans more",
);
assert.match(
  text,
  /read the notes under the tables — that is where the\s+limits live/i,
  "artifact-reading must require reading datasheet table notes, where the limits live",
);

// --- Cross-check across parts ---------------------------------------------
assert.match(
  text,
  /when a conclusion depends on multiple parts of a document\s+\(a value in a table, a note, a referenced section\), verify they agree/i,
  "artifact-reading must require cross-checking when a conclusion spans a table, a note, and a section",
);
assert.match(
  text,
  /Check normative references when the source points at another document/i,
  "artifact-reading must require checking normative references to other documents",
);

// --- Type-specific reading -------------------------------------------------
assert.match(
  text,
  /distinguish\s+normative \(shall\) from informative \(should\/may\) and commentary/i,
  "artifact-reading must distinguish shall from should/may and from commentary in standards",
);
assert.match(
  text,
  /absolute maximum\s+ratings vs recommended operating conditions/i,
  "artifact-reading must separate absolute maximum ratings from recommended operating conditions",
);
assert.match(
  text,
  /do not infer\s+results from the abstract/i,
  "artifact-reading must forbid inferring paper results from the abstract",
);
assert.match(
  text,
  /title block \(revision, scale\), sheet layout, zone grid/i,
  "artifact-reading must require the drawing title block, scale, and zone grid",
);
assert.match(
  text,
  ws("verification method each requirement is measured against"),
  "artifact-reading must require the verification method each spec requirement is measured against",
);

// --- The gap rule ----------------------------------------------------------
// This is the one the whole skill exists to enforce: a gap you could not read
// is reported as a gap, not filled from memory.
assert.match(
  text,
  /Never fill a gap you could not read/i,
  "artifact-reading must forbid filling a gap that could not be read",
);
assert.match(
  text,
  /Mark it `blocked` and say what was\s+unreadable and why/i,
  "artifact-reading must require marking an unreadable gap blocked with the reason",
);
assert.match(
  text,
  /paywall, missing page, unreadable scan, binary format/i,
  "artifact-reading must name the real reasons a read fails, so blocked is specific",
);
assert.match(
  text,
  /Do not answer from a title, filename, or snippet when a direct read is\s+possible/i,
  "artifact-reading must forbid answering from a title, filename, or snippet when a direct read is possible",
);

// --- Subagent dispatch mode: the deterministic path -----------------------
// /proposal binds evidence deterministically, so vision output must not slip in
// unrecorded. This is the assertion that makes the mode safe rather than handy.
assert.match(
  text,
  /scripts\/extract-pdf\.mjs/,
  "artifact-reading must name the PDF extractor it dispatches to",
);
assert.match(
  text,
  /stamps `\[\[page N\]\]` boundaries and reports the\s+source `sha256`/i,
  "artifact-reading must require the PDF reader to stamp page boundaries and report a source hash",
);
assert.match(
  text,
  /must stop and require a separately recorded text transcription/i,
  "artifact-reading's intake must stop and require a recorded transcription rather than silently binding vision output",
);
assert.match(
  text,
  /must not silently feed vision output into the\s+binder/i,
  "artifact-reading must forbid silently feeding vision output into the evidence binder",
);

// --- Boundaries ------------------------------------------------------------
assert.match(
  text,
  /research-only, not for final engineering sign-off/i,
  "artifact-reading must carry the S7 research-only boundary",
);

console.log(
  "PASS: artifact-reading asserts map-before-answer, per-extract anchoring, " +
    "read-the-dependent-pages, blocked-not-filled, and the no-silent-vision rule",
);
