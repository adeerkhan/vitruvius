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
import { check } from "../_contract/contract.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const SKILL_PATH = join(REPO_ROOT, "skills", "gap-analysis", "SKILL.md");
const REFERENCE_DIR = join(REPO_ROOT, "gap-analysis");

let passed = 0;
let failed = 0;

const skill = readFileSync(SKILL_PATH, "utf-8");
const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/)?.[1] || "";

console.log("\n[Test] Frontmatter has required fields");
{
  check(frontmatter.includes("name:"), "has name field");
  check(frontmatter.includes("description:"), "has description field");
  check(frontmatter.includes("argument-hint:"), "has argument-hint field");
  check(frontmatter.includes("allowed-tools:"), "has allowed-tools field");
  check(frontmatter.includes("license:"), "has license field");
}

console.log("\n[Test] Argument hint includes discipline and sub-topic");
{
  const argHintMatch = frontmatter.match(/argument-hint:\s*"([^"]+)"|argument-hint:\s*<([^>]+)>/);
  const argHint = argHintMatch ? (argHintMatch[1] || argHintMatch[2] || "") : "";
  check(argHint.includes("discipline"), "argument-hint mentions discipline");
  check(argHint.includes("sub-topic"), "argument-hint mentions sub-topic");
}

console.log("\n[Test] Skill has required methodology sections");
{
  check(skill.includes("## Phase 1") || skill.includes("### Phase 1"), "has Phase 1 section");
  check(skill.includes("## Phase 2") || skill.includes("### Phase 2"), "has Phase 2 section");
  check(skill.includes("## Phase 3") || skill.includes("### Phase 3"), "has Phase 3 section");
}

console.log("\n[Test] Phase 1 uses title_and_abstract.search");
{
  check(
    skill.includes("title_and_abstract.search"),
    "references title_and_abstract.search filter",
  );
}

console.log("\n[Test] Phase 2 defines triangulation with 3 source tiers");
{
  check(skill.includes("OpenAlex"), "mentions OpenAlex");
  check(skill.includes("arXiv"), "mentions arXiv");
  check(skill.includes("0–5") || skill.includes("0-5"), "defines gap signal threshold");
}

console.log("\n[Test] Output section defines inline summary and full dossier");
{
  check(skill.includes("Inline Summary") || skill.includes("inline summary"), "defines inline summary");
  check(skill.includes("Full Dossier") || skill.includes("full dossier"), "defines full dossier");
  check(skill.includes("outputs/gap-analysis/"), "specifies output path");
}

console.log("\n[Test] Scope and boundaries section exists");
{
  check(skill.includes("## Scope and Boundaries"), "has scope section");
  check(skill.includes("research-only"), "states research-only boundary");
}

console.log("\n[Test] References evidence-quality-tiers.md");
{
  check(
    skill.includes("references/evidence-quality-tiers.md"),
    "links to shared evidence quality reference",
  );
}

console.log("\n[Test] Invocation flags documented");
{
  check(skill.includes("--deep"), "documents --deep flag");
  check(skill.includes("--quick"), "documents --quick flag");
}

console.log("\n[Test] Skill is under 500 lines (contract limit)");
{
  const lines = skill.split("\n").length;
  check(lines <= 500, `SKILL.md is ${lines} lines (limit 500)`);
}

console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
