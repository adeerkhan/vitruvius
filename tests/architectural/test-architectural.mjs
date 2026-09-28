import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// architectural — behavioral.
//
// Shape checks live in tests/all-skills. This suite covers the decisions that
// make an *architectural* dispatcher worth having, written to fail if the file
// could be pasted into another discipline unchanged.
//
// The characteristic failure: a wall or roof assembly asserted without a named
// system and evaluation report, a thermal value quoted as R-value when the
// question was about U-factor, or a precedent's systems inferred from a photo.
// Enclosure and assembly performance is the architectural-specific surface.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const text = readFileSync(join(repoRoot, "skills", "architectural", "SKILL.md"), "utf8");

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
  "architectural must activate the shared engineering-research method",
);
assert.match(
  text,
  ws("Do not restate the research loop here"),
  "architectural must forbid restating the research loop",
);

// --- The evidence landscape is architectural-specific ----------------------
assert.match(text, /IBC/, "architectural must name the IBC");
assert.match(text, /ADA\/ABA/, "architectural must name ADA/ABA for accessibility");
assert.match(text, /NFPA/, "architectural must name NFPA for life safety");
assert.match(text, /ASHRAE/, "architectural must name ASHRAE for comfort and envelope performance");
assert.match(
  text,
  /ICC-ES|evaluation report/i,
  "architectural must carry ICC-ES / evaluation reports; an assembly's performance lives in its evaluation report",
);
assert.match(
  text,
  /building failures and enclosure\s+forensics|enclosure\s+forensics/i,
  "architectural must carry enclosure forensics as prior art",
);
assert.match(
  text,
  /reconnaissance|post-disaster/i,
  "architectural must carry post-disaster reconnaissance as prior art",
);

// --- The adopted-edition trap ----------------------------------------------
assert.match(
  text,
  /Cite section \+ edition, and check which edition the\s+jurisdiction has adopted/i,
  "architectural must require citation plus the jurisdiction's adopted edition",
);
assert.match(
  text,
  /Do not summarize a provision from\s+memory/i,
  "architectural must forbid summarizing a provision from memory",
);

// --- Assembly claims: the architectural-specific rule -----------------------
assert.match(
  text,
  /an assembly \(wall, roof, glazing\) must trace to a\s+named system \+ evaluation report/i,
  "architectural must require an assembly to trace to a named system and evaluation report",
);
assert.match(
  text,
  /not a generic\s+["“]?a curtain wall/i,
  "architectural must forbid a generic assembly reference where a named system is required",
);

// --- Performance values must name the test method --------------------------
assert.match(
  text,
  /thermal, acoustic, fire, and structural values must\s+trace to a named standard\/test method/i,
  "architectural must require performance values to trace to a named test method",
);
assert.match(
  text,
  /ASTM C518, ASTM E90, NFPA 285/,
  "architectural must name concrete test methods (C518, E90, NFPA 285) so the rule is usable",
);

// --- R-value vs U-value: the unit trap -------------------------------------
assert.match(
  text,
  /R-value vs U-value/i,
  "architectural must call out the R-value vs U-value confusion explicitly",
);
assert.match(
  text,
  /every number carries a unit/i,
  "architectural must require every number to carry a unit",
);

// --- Precedent claims must be checkable ------------------------------------
assert.match(
  text,
  /do not\s+infer a building's systems from a photo/i,
  "architectural must forbid inferring a building's systems from a photo",
);
assert.match(
  text,
  /north arrows, sun paths, and floor\s+levels must be explicit/i,
  "architectural must require orientation to be explicit when a claim depends on it",
);

// --- Deliverable shape -----------------------------------------------------
assert.match(
  text,
  /named assemblies \+\s+evaluation reports/i,
  "architectural must end with a Sources section naming assemblies and evaluation reports",
);
assert.match(
  text,
  /performance values `verified`, `inferred`, or\s+`blocked`|`verified`,\s*`inferred`,\s*or `blocked`/i,
  "architectural must mark performance values verified/inferred/blocked",
);

// --- Gap detection: offered, never auto-invoked ---------------------------
assert.match(
  text,
  /suggest running\s+`?\/gap-analysis architectural/i,
  "architectural must name its own gap-analysis sub-topic when escalating",
);
assert.match(
  text,
  /Do not invoke gap-analysis automatically/i,
  "architectural must not invoke gap-analysis automatically",
);

// --- Boundaries ------------------------------------------------------------
assert.match(
  text,
  /does NOT produce final designs or construction documents/i,
  "architectural must state it produces research, not construction documents",
);
assert.match(
  text,
  /research-only, not for final engineering sign-off/i,
  "architectural must carry the S7 research-only boundary",
);

console.log(
  "PASS: architectural asserts the shared-method dispatch, assembly-to-evaluation-report " +
    "traceability, named test methods, the R/U-value trap, and the S7 boundary",
);
