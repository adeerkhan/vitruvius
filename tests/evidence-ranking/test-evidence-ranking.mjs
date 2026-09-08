/**
 * Behavioral test for evidence-ranking skill.
 *
 * Validates output shape, tier assignments, and conflict handling.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { assert } from "../_contract/contract.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const OUTPUTS_DIR = join(REPO_ROOT, "outputs", "evidence-ranking");

let passed = 0;
let failed = 0;

function check(condition, message) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

console.log("\n[Test] evidence-ranking — behavioral");

let latestFile = null;
let latestTime = 0;
try {
  const files = readdirSync(OUTPUTS_DIR).filter((f) => f.endsWith(".md"));
  for (const f of files) {
    const path = join(OUTPUTS_DIR, f);
    const content = readFileSync(path, "utf-8");
    if (content.length > latestTime) {
      latestTime = content.length;
      latestFile = path;
    }
  }
} catch {
  // no outputs yet
}

if (!latestFile) {
  console.error("  SKIP: No evidence-ranking outputs found");
  console.log("  Run /evidence-ranking first to generate test data.");
  process.exit(0);
}

const text = readFileSync(latestFile, "utf-8");

console.log(`\n  Testing: ${latestFile.split("/").pop()}`);

// Output shape
check(text.includes("# Evidence Ranking:"), "has title with topic");
check(text.includes("## Question"), "has question section");
check(text.includes("## Evidence Items"), "has evidence items table");
check(text.includes("## Tier Distribution"), "has tier distribution");
check(text.includes("## Scoring Rationale"), "has scoring rationale");
check(text.includes("## Conflicts"), "has conflicts section");
check(text.includes("## Evidence Strength"), "has evidence strength assessment");

// Tier assignments
check(text.includes("Tier 1"), "assigns Tier 1 (authoritative)");
check(text.includes("Tier 2"), "assigns Tier 2 (reliable)");
check(text.includes("Tier 3") || text.includes("Tier 4"), "assigns Tier 3-4 (supporting/weak)");

// No "best" selection
check(
  !text.includes("best source") && !text.includes("recommended source"),
  "does not select a 'best' source",
);
check(
  text.includes("human") && text.includes("judgment"),
  "defers to human judgment",
);

// Conflict handling
check(text.includes("Conflict"), "identifies conflicts");
check(text.includes("Resolution") || text.includes("resolution"), "attempts conflict resolution");

// S7 boundary
check(text.includes("S7 boundary"), "has S7 boundary statement");

console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
