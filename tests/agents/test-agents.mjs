/**
 * test-agents.mjs — Behavioral-contract tests for agents/*.md and the
 * engineering-research loop wiring (N11 + GOAL-CHECK + repair loop).
 *
 * These are structure-plus-contract tests: they verify the dispatchable
 * contracts exist and say what the design requires. Headless behavioral
 * runs are the benchmark's job (tasks/benchmark/).
 *
 * Usage: node tests/agents/test-agents.mjs
 * Exit 1 on any failure.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const AGENTS_DIR = join(REPO_ROOT, "agents");
const ADAPTERS_DIR = join(REPO_ROOT, ".opencode", "agent");

let failed = 0;
const results = [];
function check(name, ok, detail = "") {
  results.push(`${ok ? "PASS" : "FAIL"}: ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed++;
}
function read(p) {
  return existsSync(p) ? readFileSync(p, "utf-8") : null;
}

const ROLES = ["researcher", "writer", "verifier", "reviewer", "arbiter", "goal-checker"];

// --- 1. Canonical agent files exist with N11 contracts ---
for (const role of ROLES) {
  const text = read(join(AGENTS_DIR, `${role}.md`));
  check(`agents/${role}.md exists`, text !== null);
  if (!text) continue;
  check(`${role}: INVALID-DISPATCH contract`, text.includes("INVALID-DISPATCH"));
  check(`${role}: terminal-only (no spawning)`, /terminal/i.test(text) && /do not spawn|never re-dispatch/i.test(text));
  if (["verifier", "reviewer", "arbiter", "goal-checker"].includes(role)) {
    check(`${role}: mission pointer (SHA-256)`, /SHA-256/.test(text));
    check(`${role}: INVALID-BRIEF on mismatch`, text.includes("INVALID-BRIEF"));
  }
}

// --- 2. Tool bounds: judges read-only, producers bounded ---
const judgeToolBounds = {
  verifier: /NO Write, NO Edit/i,
  reviewer: /NO Write, NO Edit/i,
  arbiter: /NO Write, NO Edit/i,
  "goal-checker": /NO Write, NO Edit/i,
};
for (const [role, pattern] of Object.entries(judgeToolBounds)) {
  const text = read(join(AGENTS_DIR, `${role}.md`)) ?? "";
  check(`${role}: read-only tool restriction declared`, pattern.test(text));
}

// --- 3. Verifier protocol specifics ---
const verifier = read(join(AGENTS_DIR, "verifier.md")) ?? "";
check("verifier: severity→verdict gate", /Severity→verdict gate|severity→verdict/i.test(verifier));
check("verifier: PARTIAL-vs-BLOCKED decision rule", /PARTIAL vs BLOCKED|Conservatism is not correctness/i.test(verifier));
check("verifier: FAIL is not a verdict value", /never a verdict value|never the bare word FAIL/i.test(verifier));
check("verifier: quality gate has 7 items incl. required-value check", /Required-value check/.test(verifier));
check("verifier: 8 adversarial checks", /8\.\s+\*\*Citation entailment/.test(verifier));

// --- 4. Goal-checker specifics ---
const goalChecker = read(join(AGENTS_DIR, "goal-checker.md")) ?? "";
check("goal-checker: default NOT-DONE", /default is NOT-DONE|Default NOT-DONE|starts NOT-DONE/i.test(goalChecker));
check("goal-checker: re-derives from original question, not plan", /original research question|ORIGINAL/i.test(goalChecker) && /cross-reference/i.test(goalChecker));
check("goal-checker: E2E machine line", /E2E:\s*scope=/.test(goalChecker));
check("goal-checker: prompt=gap catches too-small plans", /prompt=gap/.test(goalChecker));

// --- 5. engineering-research loop wiring ---
const method = read(join(REPO_ROOT, "skills", "engineering-research", "SKILL.md")) ?? "";
check("engineering-research: Step 7 GOAL-CHECK gate", /GOAL-CHECK gate/.test(method));
check("engineering-research: dispatches goal-checker role", /agents\/goal-checker\.md/.test(method));
check("engineering-research: repair loop (named items only, retain evidence)", /repair the named items only|repair only named/i.test(method) && /retain/i.test(method));
check("engineering-research: records E2E line in provenance", /GOAL-CHECK: E2E:/.test(method));
check("engineering-research: escalation 1→2→3", /2 parallel verifiers|two verifiers|escalat/i.test(method));

// --- 6. Host adapters mirror canonical roles (exact role set, no strays) ---
const adapters = existsSync(ADAPTERS_DIR) ? readdirSync(ADAPTERS_DIR).filter((f) => f.endsWith(".md")) : [];
const expectedAdapters = ROLES.map((r) => `${r}.md`).sort();
const foundAdapters = adapters.sort();
check(
  "opencode: adapters match canonical roles exactly",
  JSON.stringify(foundAdapters) === JSON.stringify(expectedAdapters),
  `found: ${foundAdapters.join(", ") || "none"}`,
);
for (const role of ROLES) {
  const adapter = read(join(ADAPTERS_DIR, `${role}.md`));
  check(`opencode adapter for ${role} points at canonical file`, adapter !== null && adapter.includes(`agents/${role}.md`));
}

// --- Report ---
for (const line of results) console.log(`  ${line}`);
console.log(`\n${results.filter((r) => r.startsWith("PASS")).length}/${results.length} agent-contract checks passed`);
if (failed > 0) {
  console.error(`FAIL: ${failed} agent-contract check(s) failed`);
  process.exit(1);
}
