/**
 * Behavioral test for hypothesis-generation skill.
 *
 * Validates that the skill produces correct output shape and key claims
 * when run against a fixture input.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const OUTPUTS_DIR = join(REPO_ROOT, "outputs", "hypothesis");

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

console.log("\n[Test] hypothesis-generation — behavioral");

// Find the latest hypothesis output
let latestFile = null;
let latestTime = 0;
try {
  const files = readdirSync(OUTPUTS_DIR).filter((f) => f.endsWith(".md"));
  for (const f of files) {
    const path = join(OUTPUTS_DIR, f);
    const stat = readFileSync(path, "utf-8");
    if (stat.length > latestTime) {
      latestTime = stat.length;
      latestFile = path;
    }
  }
} catch {
  // no outputs yet
}

if (!latestFile) {
  console.error("  SKIP: No hypothesis outputs found in outputs/hypothesis/");
  console.log("  Run /hypothesis-generation first to generate test data.");
  process.exit(0);
}

const text = readFileSync(latestFile, "utf-8");

console.log(`\n  Testing: ${latestFile.split("/").pop()}`);

// Check output shape
check(text.includes("# Hypothesis Generation:"), "has title with topic");
check(text.includes("## Observation (Frozen)"), "has frozen observation section");
check(text.includes("## Research Question"), "has research question section");
check(text.includes("## Evidence Boundary"), "has evidence boundary section");
check(text.includes("## Rival Hypotheses"), "has rival hypotheses section");
check(text.includes("## Discriminating Tests"), "has discriminating tests section");
check(text.includes("## Pre-registration Record"), "has pre-registration record");

// Check key claims
check(text.includes("Date observed:"), "observation is dated");
check(text.includes("Distinguish measured vs inferred"), "distinguishes measured vs inferred");
check(text.includes("Claim type:"), "states claim type");
check(text.includes("Search date:"), "evidence boundary has search date");
check(text.includes("Databases"), "evidence boundary lists databases");
check(text.includes("Limitations:"), "evidence boundary states limitations");

// Check rival hypotheses quality
const rivalCount = (text.match(/### H\d:/g) || []).length;
check(rivalCount >= 3, `has 3+ rival hypotheses (found ${rivalCount})`);

// Check no tool scoring
check(text.includes("candidate"), "hypotheses marked as candidate (not scored)");
check(
  !text.includes("best hypothesis") && !text.includes("selected hypothesis"),
  "does not select a 'best' hypothesis",
);

// Check pre-registration
check(text.includes("Generated:"), "pre-registration is timestamped");
check(text.includes("candidate") && text.includes("Status:"), "status is candidate");
check(text.includes("S7 boundary:"), "has S7 boundary statement");

console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
