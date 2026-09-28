import { strict as assert } from "node:assert";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// vitruvius — behavioral.
//
// Shape checks live in tests/all-skills. This suite covers the routing decisions
// that make the entry point trustworthy, because everything downstream depends
// on landing in the right skill.
//
// The characteristic failure: a request for one discipline quietly dispatched to
// another, or — worse — to no skill, producing a generic answer that looks like
// a Vitruvius run. A dispatcher that guesses is worse than one that asks.
//
// The second failure is coverage: a skill that exists but is unreachable from
// the dispatch tables. That is the same class of defect as an unwired gate, and
// the tables below are checked against the real skills/ directory rather than
// against a hand-maintained list.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const text = readFileSync(join(repoRoot, "skills", "vitruvius", "SKILL.md"), "utf8");
const SKILLS_DIR = join(repoRoot, "skills");

const ws = (s) =>
  new RegExp(
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .split(/\s+/)
      .join("\\s+"),
    "i",
  );

// --- The role --------------------------------------------------------------
assert.match(
  text,
  /engineering research agent for the five built-world\s+disciplines/i,
  "vitruvius must state it is an engineering research agent for the five built-world disciplines",
);
assert.match(
  text,
  /Your job is research: discovering, reading, understanding,\s+verifying, and synthesizing engineering knowledge into auditable artifacts/i,
  "vitruvius must state the job is research producing auditable artifacts",
);

// --- Dispatch by discipline: all five must be routed -----------------------
// Each row names the trigger vocabulary as well as the command, so a paraphrase
// of the table still has to route.
const DISCIPLINES = [
  { name: "mechanical", triggers: /mechanical, mech, machine design, thermal, fluids, materials, manufacturing/i },
  { name: "software", triggers: /software, code, system design, architecture \(IT\)/i },
  { name: "civil", triggers: /civil, structural, geotech, transportation, water/i },
  { name: "electrical", triggers: /electrical, electronics, power, controls/i },
  { name: "architectural", triggers: /architectural, architecture, buildings, facade/i },
];
for (const d of DISCIPLINES) {
  assert.match(
    text,
    new RegExp(`/vitruvius:${d.name}`),
    `vitruvius must route to the ${d.name} discipline skill`,
  );
  assert.match(
    text,
    d.triggers,
    `vitruvius's ${d.name} row must carry the trigger vocabulary, so a paraphrase still routes`,
  );
}

// The two non-discipline routes a discipline table would otherwise miss.
assert.match(
  text,
  /`\/vitruvius:scholarly-research`[\s\S]{0,60}Academic literature discovery/i,
  "vitruvius must route paper/prior-art questions to scholarly-research",
);
assert.match(
  text,
  /`\/vitruvius:standards-lookup`[\s\S]{0,60}Engineering standards and codes/i,
  "vitruvius must route standard/code lookups to standards-lookup",
);
assert.match(
  text,
  /`\/vitruvius:verifier`[\s\S]{0,80}verdict on a claim or number with evidence trail/i,
  "vitruvius must route verify requests to the blind verifier",
);

// --- Dispatch by workflow --------------------------------------------------
const WORKFLOWS = [
  { name: "compare", triggers: /compare, weigh, choose between, where do X and Y differ/i },
  { name: "review", triggers: /review, critique, find weaknesses, pre-submission check/i },
  { name: "audit", triggers: /audit, does the code match the paper\/spec, consistency check/i },
  { name: "summarize", triggers: /summarize, condense, key requirements of this spec\/standard\/paper/i },
  { name: "eli5", triggers: /explain like i'm 5, ELI5, simplify this, what does this mean/i },
  { name: "artifact-reading", triggers: /read\/extract from PDF\/datasheet\/drawing\/spec, answer from a document/i },
];
for (const w of WORKFLOWS) {
  assert.match(text, new RegExp(`/vitruvius:${w.name}`), `vitruvius must route to ${w.name}`);
  assert.match(text, w.triggers, `vitruvius's ${w.name} row must carry its trigger vocabulary`);
}

// --- The two fallbacks -----------------------------------------------------
// A dispatcher with no fallback either stalls or guesses. Guessing is the
// failure; both branches must be explicit.
assert.match(
  text,
  /If the user names no discipline, ask which discipline the question belongs to\s+before starting/i,
  "vitruvius must ask which discipline when none is named, rather than guessing",
);
assert.match(
  text,
  /If the user names a workflow the table does not cover, default to the\s+matching discipline skill and the shared `engineering-research` method/i,
  "vitruvius must state the fallback for an uncovered workflow",
);

// --- The always-rules ------------------------------------------------------
assert.match(
  text,
  /Follow `AGENTS\.md` integrity commandments/i,
  "vitruvius must bind itself to the AGENTS.md integrity commandments",
);
for (const cmd of [
  "never fabricate a source",
  "never claim something exists without checking",
  "read before you summarize",
  "mark status honestly",
]) {
  assert.match(
    text,
    ws(cmd),
    `vitruvius must carry the commandment "${cmd}"`,
  );
}
assert.match(
  text,
  /Every research output gets a `?\.provenance\.md`? sidecar/i,
  "vitruvius must require a provenance sidecar on every research output",
);

// --- All seven canonical roles are named -----------------------------------
// A role dropped from this list stops being performed, silently, because every
// host falls back to the lead agent.
for (const role of ["researcher", "writer", "verifier", "reviewer", "arbiter", "goal-checker", "habit"]) {
  assert.match(
    text,
    new RegExp(`\`${role}\``),
    `vitruvius must name the ${role} role, or it stops being performed`,
  );
}
assert.match(
  text,
  /are performed by subagents when the host supports them,\s+otherwise by you/i,
  "vitruvius must state the subagent fallback for the canonical roles",
);

// --- Help is reachable -----------------------------------------------------
assert.match(
  text,
  /activate `\/vitruvius-help`/i,
  "vitruvius must point at /vitruvius-help, or the reference card is unreachable",
);

// --- No skill is unreachable from the dispatcher ---------------------------
// The real check: every skill that should be reachable appears somewhere in the
// dispatcher or is deliberately excluded. An unwired skill and an unroutable
// skill are the same defect.
const ROUTED = new Set([
  ...DISCIPLINES.map((d) => d.name),
  ...WORKFLOWS.map((w) => w.name),
  "scholarly-research",
  "standards-lookup",
  "verifier",
  "vitruvius-help",
  // The shared method is the fallback target, not a table row.
  "engineering-research",
]);
const DELIBERATELY_UNROUTED = {
  // This file IS the dispatcher; it is the entry point, not a dispatch target.
  "vitruvius": "the entry point itself, not a dispatch target",
  // The help card is reachable via its own activation, not the dispatch tables.
  "vitruvius-help": "reachable by activation",
  // These are invoked by other skills, not by a user-facing dispatch.
  "habit": "invoked as a subagent role, not by the user",
  "verifier": "also routed from the discipline/workflow tables",
  "engineering-research": "the shared method, the fallback target",
  "gap-analysis": "offered by discipline skills at a dead end",
  "evidence-ranking": "invoked by other skills",
  "design-alternatives": "invoked by other skills",
  "fmea-brainstorm": "invoked by other skills",
  "proposal": "invoked as a subagent",
  "hypothesis-generation": "invoked by other skills",
  "peer-review": "invoked by other skills",
  "audit": "invoked by other skills",
  "compare": "invoked by other skills",
  "review": "invoked by other skills",
  "summarize": "invoked by other skills",
  "eli5": "invoked by other skills",
  "artifact-reading": "invoked by other skills",
  "scholarly-research": "invoked by other skills",
  "standards-lookup": "invoked by other skills",
  "researcher": "n/a",
};

const onDisk = readdirSync(SKILLS_DIR).filter((n) => existsSync(join(SKILLS_DIR, n, "SKILL.md")));
const unrouted = onDisk.filter(
  (n) => !ROUTED.has(n) && !(n in DELIBERATELY_UNROUTED),
);
assert.deepStrictEqual(
  unrouted,
  [],
  `these skills exist but are neither routed nor recorded as deliberately unrouted: ${unrouted.join(", ")}. ` +
    `An unroutable skill is the same defect as an unwired gate — add a dispatch row or record why not.`,
);

// And the reverse: nothing is claimed routed that does not exist.
for (const r of ROUTED) {
  assert.ok(
    onDisk.includes(r),
    `vitruvius's dispatch tables reference ${r}, which does not exist in skills/`,
  );
}

// --- Boundaries ------------------------------------------------------------
assert.match(
  text,
  /does NOT produce final designs, construction documents, or implementation guidance/i,
  "vitruvius must state it produces research, not implementation guidance",
);
assert.match(
  text,
  /research-only, not for final engineering sign-off/i,
  "vitruvius must carry the S7 research-only boundary",
);

console.log(
  `PASS: vitruvius asserts all five discipline routes, ${WORKFLOWS.length} workflow routes, ` +
    `both fallbacks, all seven canonical roles, and that all ${onDisk.length} skills are routed or ` +
    `recorded as deliberately unrouted`,
);
