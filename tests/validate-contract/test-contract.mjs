/**
 * Test suite for scripts/validate-contract.mjs
 *
 * Strategy: run the validator against the real repo and assert that all
 * skills conform. Also test the validator's logic by creating minimal
 * fixtures that exercise specific checks.
 */

import { readFileSync, existsSync, readdirSync, statSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { check } from "../_contract/contract.mjs";
import { readYamlFrontmatter } from "../../scripts/yaml-frontmatter.mjs";

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
    const hasFrontmatter = readYamlFrontmatter(skillMd) !== null;
    check(hasFrontmatter, `${name}: has frontmatter`);

    if (hasFrontmatter) {
      const frontmatter = readYamlFrontmatter(skillMd) ?? "";
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

console.log("\n[Test] A frontmatter value opening with a YAML indicator is refused");
{
  // The real-repo run proves all 25 skills conform; these fixtures prove the
  // rule can actually fail, so a green run is meaningful. Strict YAML parsers
  // (PyYAML, psych) reject a plain scalar starting with ` @ % * , and a
  // one-line `|`/`>` header — this line-based parser would accept both.
  const temp = mkdtempSync(join(tmpdir(), "vitruvius-indicator-"));
  const skills = join(temp, "skills");
  const writeSkill = (name, descriptionLine) => {
    const dir = join(skills, name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "SKILL.md"),
      `---\nname: ${name}\n${descriptionLine}\nlicense: MIT\nmetadata:\n  version: "0.1.0"\n---\n\n# ${name}\n\nResearch-only, not for final engineering sign-off.\n`,
    );
  };
  const runValidator = () =>
    spawnSync(process.execPath, [VALIDATOR], {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      env: { ...process.env, VITRUVIUS_SKILLS_DIR: skills },
    });

  try {
    // A backtick-led description: valid to our parser, refused by strict YAML.
    writeSkill("bad-indicator", "description: `other-skill` does things. Use when testing.");
    const badIndicator = runValidator();
    check(badIndicator.status !== 0, "a value starting with a backtick is refused");
    check(
      /YAML indicator/.test(badIndicator.stderr + badIndicator.stdout),
      "the refusal names the YAML indicator",
    );
    rmSync(join(skills, "bad-indicator"), { recursive: true, force: true });

    // A one-line block header: `|foo` is not a block scalar, strict YAML refuses.
    writeSkill("bad-block-header", "description: |foo use when testing.");
    const badHeader = runValidator();
    check(badHeader.status !== 0, "a one-line block header value is refused");
    check(
      /one-line block header/.test(badHeader.stderr + badHeader.stdout),
      "the refusal names the one-line block header",
    );
    rmSync(join(skills, "bad-block-header"), { recursive: true, force: true });

    // The quoted form of the same text is the documented fix, so it must pass.
    writeSkill("good-quoted", 'description: "`other-skill` does things. Use when testing."');
    const goodQuoted = runValidator();
    check(goodQuoted.status === 0, "a quoted value starting with a backtick is accepted");
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
