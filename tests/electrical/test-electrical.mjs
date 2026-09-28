import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// electrical — behavioral.
//
// Shape checks live in tests/all-skills. This suite covers the decisions that
// make an *electrical/electronics* dispatcher worth having. It is written to
// fail if the file could be pasted into another discipline unchanged.
//
// The characteristic failure: a part value with no datasheet read, an SI prefix
// silently wrong (nF read as uF, RMS read as peak), or a mains-safety claim
// with no code clause behind it. Each produces a confident, wrong number.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const text = readFileSync(join(repoRoot, "skills", "electrical", "SKILL.md"), "utf8");

const ws = (s) =>
  new RegExp(
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .split(/\s+/)
      .join("\\s+"),
    "i",
  );

// --- The dispatch decision -------------------------------------------------
assert.match(
  text,
  ws("Activate the `/skill:engineering-research` method"),
  "electrical must activate the shared engineering-research method",
);
assert.match(
  text,
  ws("Do not restate the research loop here"),
  "electrical must forbid restating the research loop",
);

// --- The evidence landscape is electrical-specific -------------------------
assert.match(text, /IEEE/, "electrical must name IEEE as a governing standards body");
assert.match(text, /NEC \(NFPA 70\)/, "electrical must name the NEC as the US installation code");
assert.match(text, /UL/, "electrical must name UL for listing/safety standards");
assert.match(text, /errata/i, "electrical must treat datasheet errata as a source; errata change the value");
assert.match(
  text,
  /recall|advisory|failure-analys/i,
  "electrical must carry recalls, advisories, and failure analysis as prior art",
);

// --- Units and notation: the electrical-specific failure --------------------
// This is the assertion that makes the suite electrical rather than generic.
// A prefix error is a factor-of-1000 error that still looks like a real number.
assert.match(
  text,
  /mA vs A|nF vs uF/i,
  "electrical must call out SI prefix ambiguity explicitly (mA vs A, nF vs uF)",
);
assert.match(
  text,
  /RMS vs peak|dB vs linear/i,
  "electrical must call out RMS vs peak and dB vs linear as notation traps",
);
assert.match(
  text,
  /every number carries a unit/i,
  "electrical must require every number to carry a unit",
);

// --- A part value without a datasheet read is not verified -----------------
assert.match(
  text,
  ws("a part number without a datasheet read is `inferred`, not `verified`"),
  "electrical must state that a part number without a datasheet read is inferred, not verified",
);
assert.match(
  text,
  /not a vague ["“]?a resistor/i,
  "electrical must forbid a vague component reference where a named part is required",
);
assert.match(
  text,
  /manufacturer, and the datasheet revision/i,
  "electrical must require part, manufacturer, and datasheet revision to be named",
);

// --- Mains and protection must cite the code clause ------------------------
assert.match(
  text,
  /mains, protection, or grounding must\s+cite the governing code clause/i,
  "electrical must require a governing code clause for anything touching mains, protection, or grounding",
);
assert.match(
  text,
  /Design margins must be\s+stated, not assumed/i,
  "electrical must require design margins to be stated, not assumed",
);

// --- Standards are read, not summarized from the number --------------------
assert.match(
  text,
  /read the actual clause before\s+summarizing it/i,
  "electrical must require reading the actual clause before summarizing a standard",
);
assert.match(
  text,
  /Cite clause numbers, not just the standard number/i,
  "electrical must require clause numbers, not just the standard number",
);

// --- Deliverable shape: datasheet + revision, per value --------------------
assert.match(
  text,
  /datasheet \+ revision for\s+every part value/i,
  "electrical must require datasheet + revision for every part value in the Sources section",
);
assert.match(
  text,
  /`verified`, `inferred`, or `blocked`|`verified`,\s*`inferred`,\s*or `blocked`/i,
  "electrical must mark each value verified/inferred/blocked",
);

// --- Gap detection: offered, never auto-invoked ---------------------------
assert.match(
  text,
  /suggest running\s+`?\/gap-analysis electrical/i,
  "electrical must name its own gap-analysis sub-topic when escalating",
);
assert.match(
  text,
  /Do not invoke gap-analysis automatically/i,
  "electrical must not invoke gap-analysis automatically",
);

// --- Boundaries ------------------------------------------------------------
assert.match(
  text,
  /does NOT produce final designs or construction documents/i,
  "electrical must state it produces research, not construction documents",
);
assert.match(
  text,
  /research-only, not for final engineering sign-off/i,
  "electrical must carry the S7 research-only boundary",
);

console.log(
  "PASS: electrical asserts the shared-method dispatch, SI/RMS/dB notation traps, " +
    "datasheet-read-before-verified, mains code clauses, and the S7 boundary",
);
