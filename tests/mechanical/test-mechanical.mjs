import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// mechanical — behavioral.
//
// Shape checks live in tests/all-skills. This suite covers the decisions that
// make a *mechanical* dispatcher worth having, written to fail if the file
// could be pasted into another discipline unchanged.
//
// The characteristic failure: a material property asserted as "steel" with no
// grade, a factor of safety that appears in the calculation but traces to
// nothing, or a handbook number used where a primary source was readable. The
// handbook case is the mechanical-specific one — Machinery's Handbook and
// Shigley's are extremely easy to cite and are not primary sources.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const text = readFileSync(join(repoRoot, "skills", "mechanical", "SKILL.md"), "utf8");

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
  "mechanical must activate the shared engineering-research method",
);
assert.match(
  text,
  ws("Do not restate the research loop here"),
  "mechanical must forbid restating the research loop",
);

// --- The evidence landscape is mechanical-specific -------------------------
assert.match(text, /ASME \(BPVC, B31 piping\)/, "mechanical must name ASME BPVC and B31 piping");
assert.match(text, /AGMA/, "mechanical must name AGMA for gear and power-transmission practice");
assert.match(
  text,
  /Machinery's Handbook, Marks', Shigley's/i,
  "mechanical must name the handbooks it is allowed to use",
);
assert.match(
  text,
  /use only when a direct primary read is possible/i,
  "mechanical must restrict handbooks to cases where a direct primary read is not possible; a handbook cited where the standard is readable is a laundered secondary source",
);
assert.match(
  text,
  /failure analyses|documented field failures/i,
  "mechanical must carry field failures and failure analyses as prior art",
);
assert.match(
  text,
  /scholarly-research` discovery layers|scholarly-research\s+discovery layers/i,
  "mechanical must route journal literature through the scholarly-research discovery layers",
);

// --- Verification criteria -------------------------------------------------
assert.match(
  text,
  /state the unit system \(SI, US\s+customary\) and convert explicitly/i,
  "mechanical must require the unit system to be stated and conversion explicit",
);
assert.match(text, /Flag mixed-unit claims/i, "mechanical must require mixed-unit claims to be flagged");
assert.match(
  text,
  /tension\/compression, torque direction, load sign/i,
  "mechanical must require sign conventions (tension/compression, torque direction, load sign)",
);
assert.match(
  text,
  /named grade \+\s+specification/i,
  "mechanical must require material properties to trace to a named grade and specification, not a vague 'steel'",
);
assert.match(
  text,
  /A36 per ASTM A36/,
  "mechanical must give the grade+spec pattern concretely (A36 per ASTM A36) so the rule is usable",
);
assert.match(
  text,
  /design factor \/ factor of safety must be stated and traced\s+to code or practice/i,
  "mechanical must require the design factor / factor of safety to be traced to code or practice, not assumed",
);
assert.match(
  text,
  /read the actual provision before summarizing it/i,
  "mechanical must require reading the actual provision before summarizing it",
);
assert.match(
  text,
  /show the formula, inputs, and\s+units/i,
  "mechanical must require derived numbers to show formula, inputs, and units",
);

// --- Deliverable shape -----------------------------------------------------
assert.match(
  text,
  /outputs\/\.plans\/<slug>\.md/,
  "mechanical must name the plan artifact from the shared artifact contract",
);
assert.match(
  text,
  /\*\*Sources\*\* section citing standard \+ section/i,
  "mechanical must end with a Sources section citing standard + section",
);
assert.match(
  text,
  /every load, factor,\s+and material property `verified`, `inferred`, or `blocked`/i,
  "mechanical must mark every load, factor, and material property verified/inferred/blocked",
);

// --- Gap detection: offered, never auto-invoked ---------------------------
assert.match(
  text,
  /suggest running\s+`?\/gap-analysis mechanical/i,
  "mechanical must name its own gap-analysis sub-topic when escalating",
);
assert.match(
  text,
  /Do not invoke gap-analysis automatically/i,
  "mechanical must not invoke gap-analysis automatically",
);

// --- Boundaries ------------------------------------------------------------
assert.match(
  text,
  /does NOT produce final designs or construction documents/i,
  "mechanical must state it produces research, not construction documents",
);
assert.match(
  text,
  /research-only, not for final engineering sign-off/i,
  "mechanical must carry the S7 research-only boundary",
);

console.log(
  "PASS: mechanical asserts the shared-method dispatch, the handbook-is-secondary " +
    "constraint, unit-system and sign-convention rules, grade+spec traceability, and the S7 boundary",
);
