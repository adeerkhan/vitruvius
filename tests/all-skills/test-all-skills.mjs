/**
 * Structural tests for all skills not covered by other test suites.
 * Covers: mechanical, civil, electrical, software, architectural,
 *          compare, review, audit, summarize, eli5,
 *          artifact-reading, scholarly-research, standards-lookup.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { check } from "../_contract/contract.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const SKILLS_DIR = join(REPO_ROOT, "skills");

const skills = [
  // Discipline skills
  "mechanical", "civil", "electrical", "software", "architectural",
  // Workflow skills
  "compare", "review", "audit", "summarize", "eli5",
  // Application skills
  "artifact-reading", "scholarly-research", "standards-lookup",
];

const disciplineExtras = ["Evidence Landscape", "Verification Criteria"];

let allPassed = true;

for (const skill of skills) {
  console.log(`\n[Test] ${skill}`);

  const skillMd = join(SKILLS_DIR, skill, "SKILL.md");

  // Test 1: SKILL.md exists
  if (!check(existsSync(skillMd), `${skill}: SKILL.md exists`)) {
    allPassed = false;
    continue;
  }

  const text = readFileSync(skillMd, "utf-8");

  // Test 2: Has frontmatter
  if (!check(text.startsWith("---"), `${skill}: has frontmatter`)) {
    allPassed = false;
    continue;
  }

  // Test 3: Frontmatter has name
  const nameMatch = text.match(/^name:\s*(.+)$/m);
  if (!check(nameMatch !== null, `${skill}: frontmatter has name`)) {
    allPassed = false;
    continue;
  }

  // Test 4: Name matches directory
  const fmName = nameMatch[1].trim().replace(/^["']|["']$/g, "");
  if (!check(fmName === skill, `${skill}: name matches directory (${fmName})`)) {
    allPassed = false;
  }

  // Test 5: Has description
  if (!check(text.match(/^description:\s*(?:>|.+)$/m) !== null, `${skill}: has description`)) {
    allPassed = false;
  }

  // Test 6: Under 500 lines
  const lines = text.split("\n").length;
  if (!check(lines <= 500, `${skill}: ${lines} lines (limit 500)`)) {
    allPassed = false;
  }

  // Test 7: No personal paths
  const personalPath = text.match(/\/Users\/[^\/]+/);
  if (!check(personalPath === null, `${skill}: no personal paths`)) {
    allPassed = false;
  }

  // Test 8: Has content sections
  if (!check(/#+\s+.+/.test(text), `${skill}: has content sections`)) {
    allPassed = false;
  }

  // Discipline-specific tests
  if (disciplineExtras.some(e => skill === "mechanical" || skill === "civil" || skill === "electrical" || skill === "software" || skill === "architectural")) {
    for (const section of disciplineExtras) {
      if (!check(new RegExp(`##\\s+${section}`, "i").test(text), `${skill}: has ${section} section`)) {
        allPassed = false;
      }
    }
  }
}

if (allPassed) {
  console.log("\nPASS: All skills structurally valid");
  process.exit(0);
} else {
  console.error("\nFAIL: Some skills have structural issues");
  process.exit(1);
}
