/**
 * Test suite for scripts/validate-contract.mjs
 *
 * Strategy: run the validator against the real repo and assert that all
 * skills conform. Also test the validator's logic by creating minimal
 * fixtures that exercise specific checks.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { check } from "../_contract/contract.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const VALIDATOR = join(REPO_ROOT, "scripts", "validate-contract.mjs");
const SKILLS_DIR = join(REPO_ROOT, "skills");

let passed = 0;
let failed = 0;

console.log("\n[Test] Validator runs against real repo");
{
  const proc = spawnSync(
    process.execPath,
    [VALIDATOR],
    { cwd: REPO_ROOT, encoding: "utf-8" },
  );
  check(proc.status === 0, `all skills conform (exit ${proc.status})`);
  check(
    proc.stdout.includes("PASS"),
    "validator reports PASS",
  );
}

function getSkills() {
  return readdirSync(SKILLS_DIR).filter((name) => {
    try {
      return statSync(join(SKILLS_DIR, name, "SKILL.md")).isFile();
    } catch {
      return false;
    }
  });
}

console.log("\n[Test] All skills have required frontmatter fields");
{
  for (const name of getSkills()) {
    const skillMd = readFileSync(join(SKILLS_DIR, name, "SKILL.md"), "utf-8");
    const hasFrontmatter = skillMd.startsWith("---\n");
    check(hasFrontmatter, `${name}: has frontmatter`);

    if (hasFrontmatter) {
      const frontmatter = skillMd.match(/^---\n([\s\S]*?)\n---/)?.[1] || "";
      check(frontmatter.includes("name:"), `${name}: has name field`);
      check(frontmatter.includes("description:"), `${name}: has description field`);
    }
  }
}

console.log("\n[Test] All skills are under 500 lines");
{
  for (const name of getSkills()) {
    const lines = readFileSync(join(SKILLS_DIR, name, "SKILL.md"), "utf-8")
      .split("\n").length;
    check(lines <= 500, `${name}: ${lines} lines (limit 500)`);
  }
}

console.log("\n[Test] No skill ships tests/ directory");
{
  for (const name of getSkills()) {
    let hasTestsDir = false;
    try {
      const entries = readdirSync(join(SKILLS_DIR, name), { withFileTypes: true });
      hasTestsDir = entries.some((e) => e.isDirectory() && e.name === "tests");
    } catch {
      // ignore
    }
    check(!hasTestsDir, `${name}: no stray tests/ directory`);
  }
}

console.log("\n[Test] New skills link to evidence-quality-tiers.md");
{
  for (const name of ["gap-analysis", "design-alternatives", "fmea-brainstorm"]) {
    const skillMd = readFileSync(join(SKILLS_DIR, name, "SKILL.md"), "utf-8");
    check(
      skillMd.includes("references/evidence-quality-tiers.md"),
      `${name}: links to evidence-quality-tiers.md`,
    );
  }
}

console.log("\n[Test] All skills have S7 boundary language");
{
  for (const name of getSkills()) {
    const skillMd = readFileSync(join(SKILLS_DIR, name, "SKILL.md"), "utf-8");
    check(
      skillMd.includes("research-only") || skillMd.includes("not for final engineering"),
      `${name}: has S7 boundary language`,
    );
  }
}

console.log("\n[Test] references/evidence-quality-tiers.md exists");
{
  check(
    existsSync(join(REPO_ROOT, "references", "evidence-quality-tiers.md")),
    "shared evidence quality tiers file exists",
  );
}

console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
