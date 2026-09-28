import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (path) => readFileSync(join(repoRoot, path), "utf8");

// --- Piece 1: In-place task state tracking (references/plan-state.md) ---

const planState = read("references/plan-state.md");

assert.match(planState, /## Task Ledger Format/, "plan-state.md must document the task ledger format");
assert.match(planState, /- \[x\]/, "plan-state.md must show checked task syntax");
assert.match(planState, /- \[ \]/, "plan-state.md must show unchecked task syntax");
assert.match(planState, /## In-Place Updates/, "plan-state.md must document in-place update rules");
assert.match(planState, /phase boundary/, "plan-state.md must mention phase boundaries");

// --- Piece 2: Overwrite guard (skills/engineering-research/SKILL.md) ---

const skill = read("skills/engineering-research/SKILL.md");

assert.match(skill, /### Overwrite Guard/, "skill must have an Overwrite Guard section");
assert.match(skill, /never silently overwrite an incomplete plan/i, "skill must state the overwrite guard rule");
assert.match(skill, /stop and ask the user/, "skill must require asking before overwriting");

// --- Piece 3: Cross-session plan pickup (skills/engineering-research/SKILL.md) ---

assert.match(skill, /### Cross-Session Plan Pickup/, "skill must have a Cross-Session Plan Pickup section");
assert.match(skill, /resume from there\.\s*Do not start over/i, "skill must state the pickup rule");
assert.match(skill, /resumed run/, "skill must require noting the resumed run in the Decision log");

// --- Cross-references ---

assert.match(skill, /references\/plan-state\.md/, "skill must reference plan-state.md");
assert.match(planState, /## Overwrite Guard/, "plan-state.md must document the overwrite guard");
assert.match(planState, /## Cross-Session Plan Pickup/, "plan-state.md must document cross-session pickup");

console.log("PASS: plan-state reference, overwrite guard, and cross-session pickup are implemented");
