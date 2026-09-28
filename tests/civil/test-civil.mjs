import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// civil — behavioral.
//
// Shape checks live in tests/all-skills. This suite covers the decisions that
// make a *civil/structural* dispatcher worth having, and it is written to fail
// if the same file could be pasted into another discipline without anyone
// noticing. That is the characteristic failure of the five thin dispatchers:
// they share a skeleton, so a suite that only asserts the skeleton passes for
// all five and measures nothing.
//
// The characteristic failure being guarded against: a structural answer with no
// load basis, an untraced design factor, or a material property asserted as
// "steel" with no grade — each of which produces a number that looks complete
// and cannot be re-checked.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const text = readFileSync(join(repoRoot, "skills", "civil", "SKILL.md"), "utf8");

/** Whitespace-insensitive match, so a rewrap does not break a rule. */
const ws = (s) =>
  new RegExp(
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .split(/\s+/)
      .join("\\s+"),
    "i",
  );

// --- The dispatch decision -------------------------------------------------
// civil is a payload on the shared method, not a second research loop. A
// dispatcher that restates the loop drifts from it silently.
assert.match(
  text,
  ws("Activate the `/skill:engineering-research` method"),
  "civil must activate the shared engineering-research method rather than define its own loop",
);
assert.match(
  text,
  ws("Do not restate the research loop here"),
  "civil must forbid restating the research loop; a copy of the loop drifts from the original",
);

// --- The evidence landscape is civil-specific ------------------------------
// These are the bodies a structural question actually turns on. A suite that
// omitted them would still pass on a generic file, so their absence is the
// defect: the payload no longer carries the discipline.
assert.match(text, /AISC 360/, "civil must name AISC 360 for steel design");
assert.match(text, /ACI 318/, "civil must name ACI 318 for concrete design");
assert.match(text, /ASCE 7/, "civil must name ASCE 7 for loads");
assert.match(text, /geotech/i, "civil must carry geotech as a first-class evidence source");
assert.match(
  text,
  /forensic|reconnaissance|failure/i,
  "civil must carry failure forensics and reconnaissance as prior art",
);

// --- The edition trap ------------------------------------------------------
// Structural provisions change between adopted editions, and the jurisdiction's
// adopted edition is the one that governs. A provision cited without an edition
// may be real and still not be the requirement in force.
assert.match(
  text,
  /cite the exact section — and check which \*\*edition\*\* the question's jurisdiction has adopted|check which \*\*edition\*\* the question's jurisdiction has\s+adopted/i,
  "civil must require citing the exact section AND checking the jurisdiction's adopted edition",
);

// --- Verification criteria that make a structural number checkable ---------
// Each of these exists because omitting it yields a plausible, unchecked number.

assert.match(
  text,
  /every load must state its basis[\s\S]{0,120}combination/i,
  "civil must require every load to state its basis and combination; an unbased load makes the whole result unreproducible",
);
assert.match(
  text,
  /compression vs tension|moment direction|global vs\s+local axes/i,
  "civil must require explicit sign conventions (compression/tension, moment direction, axes)",
);
assert.match(
  text,
  /named grade \+ governing spec|Gr\.\s*50 per ASTM A992|f'c per ACI 318/i,
  "civil must require material properties to trace to a named grade and governing spec, not a vague 'steel'",
);
assert.match(
  text,
  /phi, omega|LRFD|SFD/i,
  "civil must require design factors (phi, omega, LRFD/SFD) to be stated and traced to code, not assumed",
);
assert.match(
  text,
  /soil parameter must be marked `?verified|soil parameter must be marked/i,
  "civil must require soil parameters to be marked verified or inferred, never laundered into fact",
);
assert.match(
  text,
  /show formula, inputs, and units/i,
  "civil must require calculations to show formula, inputs, and units so the check can be re-run",
);

// A code provision summarized from memory is the failure AGENTS.md commandment 5
// names directly, so the prohibition must be present verbatim in the payload.
assert.match(
  text,
  /Do not summarize a provision from memory or a\s+title|Do not summarize a provision from memory/i,
  "civil must forbid summarizing a code provision from memory or a title",
);

// --- Deliverable shape -----------------------------------------------------
// A final artifact that omits the code citation cannot be audited later, and the
// status marks are what stop an inferred value reading as verified.
assert.match(
  text,
  /\*\*Sources\*\* section citing code \+ section \+ edition/i,
  "civil must end the final artifact with a Sources section citing code + section + edition",
);
assert.match(
  text,
  /`verified`,\s*`inferred`, or\s*`blocked`|`verified`,\s*`inferred`,\s*or `blocked`/i,
  "civil must mark loads, factors, and material properties verified/inferred/blocked",
);

// --- Gap detection is offered, never auto-invoked -------------------------
// Auto-invoking gap-analysis spends a whole triangulation run without the
// user's consent, on a question that may not have a gap at all.
assert.match(
  text,
  /suggest running\s+`?\/gap-analysis civil/i,
  "civil must name its own gap-analysis sub-topic when suggesting the escalation",
);
assert.match(
  text,
  /Do not invoke gap-analysis automatically/i,
  "civil must not invoke gap-analysis automatically; it is offered and awaits confirmation",
);

// --- Boundaries ------------------------------------------------------------
assert.match(
  text,
  /does NOT produce final designs or construction documents/i,
  "civil must state it produces research, not construction documents",
);
assert.match(
  text,
  /research-only, not for final engineering sign-off/i,
  "civil must carry the S7 research-only boundary",
);

console.log(
  "PASS: civil asserts the shared-method dispatch, the structural evidence landscape, " +
    "the adopted-edition trap, load/sign/factor/material traceability, and the S7 boundary",
);
