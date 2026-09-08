/**
 * validate-skill-output.mjs — Shared validation utilities for skill outputs.
 *
 * Checks output structure and required sections.
 * Used by per-skill validators and CI.
 *
 * Usage:
 *   node scripts/validate-skill-output.mjs <skill> <output-file>
 *
 * Example:
 *   node scripts/validate-skill-output.mjs gap-analysis outputs/gap-analysis/my-topic.md
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(new.meta.url));
const REPO_ROOT = join(__dirname, "..");

const skill = process.argv[2];
const outputFile = process.argv[3];

if (!skill || !outputFile) {
  console.error("Usage: node scripts/validate-skill-output.mjs <skill> <output-file>");
  process.exit(1);
}

const filePath = join(REPO_ROOT, outputFile);
if (!existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const text = readFileSync(filePath, "utf-8");
let errors = 0;

function check(condition, message) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    errors++;
  } else {
    console.log(`  PASS: ${message}`);
  }
}

// Universal checks
check(text.length > 100, "output is not empty");
check(text.includes("#"), "has a title");

// Skill-specific checks
switch (skill) {
  case "gap-analysis":
    check(text.includes("## What's Missing") || text.includes("## What is Missing"), "has 'What's Missing' section");
    check(text.includes("## Why It Matters"), "has 'Why It Matters' section");
    check(text.includes("## Suggested Research Questions"), "has research questions");
    check(text.includes("## Key Papers"), "has key papers section");
    check(text.includes("## Validation"), "has validation section");
    check(text.includes("## Confidence"), "has confidence section");
    check((text.match(/Tier [1-4]/g) || []).length >= 2, "has tier assignments");
    break;

  case "evidence-ranking":
    check(text.includes("## Question"), "has question section");
    check(text.includes("## Evidence Items"), "has evidence items table");
    check(text.includes("## Tier Distribution"), "has tier distribution");
    check(text.includes("## Scoring Rationale"), "has scoring rationale");
    check(text.includes("## Evidence Strength"), "has evidence strength");
    check((text.match(/Tier [1-4]/g) || []).length >= 1, "has tier assignments");
    break;

  case "verifier":
    check(text.includes("MACHINE_VERDICT:"), "has MACHINE_VERDICT line");
    check(text.includes("PASS") || text.includes("PARTIAL") || text.includes("BLOCKED"), "has valid verdict");
    check(text.includes("## Evidence Trail") || text.includes("## Evidence"), "has evidence trail");
    check(text.includes("CHECKS_PASSED:"), "has checks passed count");
    break;

  case "design-alternatives":
    check(text.includes("## Problem"), "has problem section");
    check(text.includes("## Alternatives"), "has alternatives section");
    check(text.includes("## Comparison Matrix"), "has comparison matrix");
    check(text.includes("## Recommendation"), "has recommendation");
    break;

  case "fmea-brainstorm":
    check(text.includes("## System"), "has system description");
    check(text.includes("## Failure Modes"), "has failure modes table");
    check(text.includes("Severity") && text.includes("Occurrence") && text.includes("Detection"), "has S/O/D ratings");
    check(text.includes("RPN") || text.includes("Risk Priority Number"), "has RPN calculation");
    break;

  default:
    console.log(`  SKIP: No specific checks for '${skill}'`);
}

if (errors > 0) {
  console.error(`\nFAIL: ${errors} check(s) failed for ${skill}`);
  process.exit(1);
} else {
  console.log(`\nPASS: ${skill} output valid`);
  process.exit(0);
}
