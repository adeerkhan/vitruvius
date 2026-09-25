/**
 * test-habit.mjs — Structural contract for the habit role and skill.
 *
 * Verifies the read-only dispatch contract, the compact candidate schema, the
 * abstention literal, and the skill's frontmatter/S7 boundary. Structure only;
 * behavioral runs are the benchmark's job.
 *
 * Usage: node tests/habit/test-habit.mjs
 * Exit 1 on any failure.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { check, hasS7Boundary, lineCountUnder } from "../_contract/contract.mjs";
import { readYamlFrontmatter } from "../../scripts/yaml-frontmatter.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const ROLE = join(REPO_ROOT, "agents", "habit.md");
const ADAPTER = join(REPO_ROOT, ".opencode", "agent", "habit.md");
const SKILL = join(REPO_ROOT, "skills", "habit", "SKILL.md");

let allPassed = true;
const assert = (condition, message) => {
  if (!check(condition, message)) allPassed = false;
};
const read = (path) => (existsSync(path) ? readFileSync(path, "utf-8") : null);

// --- 1. Canonical role contract ---
console.log("[Test] agents/habit.md");
const role = read(ROLE);
assert(role !== null, "agents/habit.md exists");
if (role) {
  assert(role.includes("INVALID-DISPATCH"), "role: INVALID-DISPATCH contract");
  assert(role.includes("INVALID-BRIEF"), "role: INVALID-BRIEF contract");
  assert(/SHA-256/.test(role), "role: mission pointer uses SHA-256");
  assert(
    /terminal/i.test(role) && /do not spawn|never re-dispatch/i.test(role),
    "role: terminal-only, no spawning",
  );
  assert(/NO Write, NO Edit/i.test(role), "role: read-only tool bound declared");
  assert(
    role.includes('"c"') && role.includes('"t"') && role.includes('"d"') && role.includes('"e"'),
    "role: compact candidate schema declared",
  );
  assert(role.includes('{"c":[]}'), "role: abstention literal present");
  assert(
    /assistant turns are context, never evidence/i.test(role),
    "role: assistant turns excluded as evidence",
  );
  assert(/task-scoped/i.test(role), "role: task-scoped instructions dropped");
  assert(/engineering facts/i.test(role), "role: domain facts dropped");
  assert(/revers\w+.*final form|final form.*revers\w+/i.test(role), "role: reversal rule emits final form");
  assert(/JSON only, no prose/i.test(role), "role: JSON-only output, no prose");
}

// --- 2. Host adapter mirrors the canonical role ---
console.log("\n[Test] .opencode/agent/habit.md");
const adapter = read(ADAPTER);
assert(adapter !== null, "adapter exists");
if (adapter) {
  assert(adapter.includes("agents/habit.md"), "adapter points at agents/habit.md");
  assert(/mode:\s*subagent/.test(adapter), "adapter: mode subagent");
  assert(/write:\s*false/.test(adapter) && /edit:\s*false/.test(adapter), "adapter: read-only");
}

// --- 3. Skill contract ---
console.log("\n[Test] skills/habit/SKILL.md");
const skill = read(SKILL);
assert(skill !== null, "skills/habit/SKILL.md exists");
if (skill) {
  assert(readYamlFrontmatter(skill) !== null, "skill: has frontmatter");
  assert(/^name:\s*habit\s*$/m.test(skill), "skill: name is habit");
  assert(/^description:\s*[>|]/m.test(skill), "skill: has folded description");
  assert(/^argument-hint:/m.test(skill), "skill: has argument-hint");
  assert(
    /^allowed-tools:\s*[A-Za-z]+(?:\s+[A-Za-z]+)*\s*$/m.test(skill),
    "skill: allowed-tools is a space-separated string",
  );
  assert(/^metadata:\s*$/m.test(skill) && /^\s+version:\s*["']?[\w.-]+/m.test(skill), "skill: metadata.version present");
  assert(/## Method/.test(skill), "skill: has a Method section");
  assert(/## Quality gate/.test(skill), "skill: has a Quality gate section");
  assert(/{"c":\[\]}/.test(skill), "skill: documents the abstention literal");
  assert(/never write `AGENTS\.md`|never an `AGENTS\.md` write/i.test(skill), "skill: no AGENTS.md auto-write");
  assert(/## Ledger format/.test(skill), "skill: documents the ledger format");
  assert(/"version":\s*1/.test(skill), "skill: ledger version pinned");
  assert(/"window":/.test(skill), "skill: ledger carries the transcript window");
  assert(/lead-only/i.test(skill) && /read-only tools/i.test(skill), "skill: Write is lead-only, subagent read-only");
}
allPassed = hasS7Boundary("habit") && allPassed;
allPassed = lineCountUnder("habit", 500) && allPassed;

// --- Report ---
console.log(`\n${allPassed ? "PASS" : "FAIL"}: habit contract`);
process.exit(allPassed ? 0 : 1);
