/**
 * Test suite for skills/gap-analysis/SKILL.md
 *
 * Strategy: validate the skill's structure, required sections, and
 * expected output format. Declarative skill testing — verify the
 * instruction contract, not runtime behavior.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const SKILL_PATH = join(REPO_ROOT, "skills", "gap-analysis", "SKILL.md");
const REFERENCE_DIR = join(REPO_ROOT, "gap-analysis");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

const skill = readFileSync(SKILL_PATH, "utf-8");
const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/)?.[1] || "";

console.log("\n[Test] Frontmatter has required fields");
{
  assert(frontmatter.includes("name:"), "has name field");
  assert(frontmatter.includes("description:"), "has description field");
  assert(frontmatter.includes("argument-hint:"), "has argument-hint field");
  assert(frontmatter.includes("allowed-tools:"), "has allowed-tools field");
  assert(frontmatter.includes("license:"), "has license field");
}

console.log("\n[Test] Argument hint includes discipline and sub-topic");
{
  const argHintMatch = frontmatter.match(/argument-hint:\s*"([^"]+)"|argument-hint:\s*<([^>]+)>/);
  const argHint = argHintMatch ? (argHintMatch[1] || argHintMatch[2] || "") : "";
  assert(argHint.includes("discipline"), "argument-hint mentions discipline");
  assert(argHint.includes("sub-topic"), "argument-hint mentions sub-topic");
}

console.log("\n[Test] Skill has required methodology sections");
{
  assert(skill.includes("## Phase 1"), "has Phase 1 section");
  assert(skill.includes("## Phase 2"), "has Phase 2 section");
  assert(skill.includes("## Phase 3"), "has Phase 3 section");
  assert(skill.includes("## Phase 4"), "has Phase 4 section");
}

console.log("\n[Test] Phase 1 uses title_and_abstract.search");
{
  assert(
    skill.includes("title_and_abstract.search"),
    "references title_and_abstract.search filter",
  );
}

console.log("\n[Test] Phase 2 defines triangulation with 3 source tiers");
{
  assert(skill.includes("OpenAlex"), "mentions OpenAlex");
  assert(skill.includes("arXiv"), "mentions arXiv");
  assert(skill.includes("Web search"), "mentions web search");
  assert(skill.includes("0–5") || skill.includes("0-5"), "defines gap signal threshold");
}

console.log("\n[Test] Phase 3 requires Covers/Misses annotations");
{
  assert(skill.includes("Covers:"), "requires Covers annotation");
  assert(skill.includes("Misses:"), "requires Misses annotation");
}

console.log("\n[Test] Phase 4 defines evidence quality tiers");
{
  assert(skill.includes("Tier 1"), "defines Tier 1");
  assert(skill.includes("Tier 2"), "defines Tier 2");
  assert(skill.includes("Tier 3"), "defines Tier 3");
  assert(skill.includes("Tier 4"), "defines Tier 4");
}

console.log("\n[Test] Output section defines inline summary and full dossier");
{
  assert(skill.includes("Inline Summary"), "defines inline summary");
  assert(skill.includes("Full Dossier"), "defines full dossier");
  assert(skill.includes("outputs/gap-analysis/"), "specifies output path");
}

console.log("\n[Test] Scope and boundaries section exists");
{
  assert(skill.includes("## Scope and Boundaries"), "has scope section");
  assert(skill.includes("research-only"), "states research-only boundary");
}

console.log("\n[Test] References evidence-quality-tiers.md");
{
  assert(
    skill.includes("references/evidence-quality-tiers.md"),
    "links to shared evidence quality reference",
  );
}

console.log("\n[Test] Invocation flags documented");
{
  assert(skill.includes("--deep"), "documents --deep flag");
  assert(skill.includes("--quick"), "documents --quick flag");
}

console.log("\n[Test] Reference output folder (if present)");
{
  if (existsSync(REFERENCE_DIR)) {
    assert(
      existsSync(join(REFERENCE_DIR, "MASTER-REPORT.md")),
      "MASTER-REPORT.md exists as reference",
    );
  } else {
    console.log("  SKIP: gap-analysis/ reference folder not on disk (optional)");
  }
}

console.log("\n[Test] Skill is under 500 lines (contract limit)");
{
  const lines = skill.split("\n").length;
  assert(lines <= 500, `SKILL.md is ${lines} lines (limit 500)`);
}

console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
