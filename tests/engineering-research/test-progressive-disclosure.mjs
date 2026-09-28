import { strict as assert } from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Progressive disclosure moved detail out of skills/engineering-research/SKILL.md
// on 2026-09-28 (499 -> 406 lines) to unpin it from the 500-line contract cap.
//
// The risk of that refactor is silent rule loss: a gate that was inline is now
// only reachable if a reference still carries it AND the skill still points at
// that reference. This suite asserts both halves. It is deliberately written
// against the whole loadable surface rather than SKILL.md alone, because a rule
// that moved to a reference the skill names is still enforced — a rule that
// moved and was dropped is not.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const skillDir = join(repoRoot, "skills", "engineering-research");
const skill = readFileSync(join(skillDir, "SKILL.md"), "utf8");

const refDir = join(skillDir, "references");
const refs = readdirSync(refDir).filter((f) => f.endsWith(".md"));
const surface = [skill, ...refs.map((f) => readFileSync(join(refDir, f), "utf8"))].join("\n");

// --- Headroom: the cap must not be a constraint on the next edit ----------
const lineCount = skill.split("\n").length;
assert.ok(
  lineCount <= 500,
  `SKILL.md is ${lineCount} lines, over the 500-line contract cap`,
);
assert.ok(
  lineCount <= 440,
  `SKILL.md is ${lineCount} lines; progressive disclosure should leave real headroom, ` +
    "not hover at the cap again",
);

// --- Every rule that moved must still be findable -------------------------
const RELOCATED_RULES = [
  ["entailment proxy requirement", /entailment proxy|entailment/i],
  ["repo evidence type", /`repo`/],
  ["path:line anchor rule", /path:line/],
  ["negative coverage section", /What we did not find/i],
  ["impact-vs-evidence section", /Impact vs\. evidence/i],
  ["numeric claim needs a unit and sign convention", /sign convention/],
  ["no deleting a finding to pass the anchor", /deleting the\s+finding|delete the finding/i],
  ["mandatory problem-anchor record", /problem-anchor\.v1/],
  ["increment checklist", /Increment Checklist/],
  ["evidence table format", /evidence table format|Evidence table format/i],
  ["subagent failFast setting", /failFast/],
  ["researcher role integrity rules", /six integrity commandments/i],
  ["source quality tiers", /\*\*Prefer\*\*|Deprioritize|evidence-quality-tiers/i],
];

for (const [name, pattern] of RELOCATED_RULES) {
  assert.match(surface, pattern, `relocated rule is missing from the skill surface: ${name}`);
}

// --- The skill must point at the references the detail moved into ---------
// Reachability alone is not enough: an unreferenced detail file is dead weight,
// which is what scripts/reference-reachability.mjs guards at the repo level.
for (const moved of ["evidence-gathering.md", "draft-and-anchor.md"]) {
  assert.ok(refs.includes(moved), `${moved} must exist under skills/engineering-research/references/`);
  assert.ok(
    skill.includes(moved),
    `SKILL.md must point at references/${moved}; moved detail nobody is told to read is not enforced`,
  );
}

// --- The integrity rules that must stay inline are still inline -----------
// Progressive disclosure must not hollow out the gates an agent reads first.
for (const [name, pattern] of [
  ["overwrite guard", /### Overwrite Guard/],
  ["cross-session pickup", /### Cross-Session Plan Pickup/],
  ["problem anchor freeze", /Problem anchor/],
  ["GOAL-CHECK gate", /GOAL-CHECK/],
  ["mandatory post-edit audit", /Post-Edit Verification Audit/],
  ["research-only boundary", /research-only, not for final engineering sign-off/i],
]) {
  assert.match(skill, pattern, `gate must stay inline in SKILL.md, not moved out: ${name}`);
}

console.log(
  `PASS: SKILL.md is ${lineCount}/500 lines with headroom, ${RELOCATED_RULES.length} relocated rules intact, ` +
    `${refs.length} references all pointed at`,
);
