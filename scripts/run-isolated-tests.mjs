#!/usr/bin/env node
// run-isolated-tests.mjs — run skill tests in isolated environments.
// Stolen from Scientific Agent Skills' --isolated pattern.
//
// Usage:
//   node scripts/run-isolated-tests.mjs <skill-name> [skill-name...]
//   node scripts/run-isolated-tests.mjs --all
//
// Each skill's tests run in a throwaway environment defined by
// tests/skill-requirements.toml. The full isolated sweep is not run in CI;
// run it locally before a release.

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const requirementsPath = join(repoRoot, "tests", "skill-requirements.toml");

function parseRequirements() {
  if (!existsSync(requirementsPath)) {
    return {};
  }
  const content = readFileSync(requirementsPath, "utf8");
  const skills = {};
  let current = null;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || trimmed === "") continue;

    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      current = sectionMatch[1];
      continue;
    }

    if (current === "skills") {
      const match = trimmed.match(/^(\w[\w-]*)\s*=\s*\{(.+)\}$/);
      if (match) {
        const name = match[1];
        const props = {};
        for (const part of match[2].split(",")) {
          const [key, value] = part.split("=").map((s) => s.trim());
          if (key && value) {
            props[key] = value.replace(/^"|"$/g, "");
          }
        }
        skills[name] = props;
      }
    }
  }

  return skills;
}

function runSkillTests(skillName) {
  const testDir = join(repoRoot, "tests", skillName);
  if (!existsSync(testDir)) {
    console.log(`SKIP: ${skillName} — no test directory`);
    return true;
  }

  const requirements = parseRequirements();
  const req = requirements[skillName] || { runtime: "node", packages: [] };

  console.log(`\nRunning tests for ${skillName} (runtime: ${req.runtime})...`);

  // Find all test files in the skill's test directory
  const { readdirSync } = await import("node:fs");
  const testFiles = readdirSync(testDir)
    .filter((f) => f.endsWith(".mjs"))
    .map((f) => join(testDir, f));

  if (testFiles.length === 0) {
    console.log(`SKIP: ${skillName} — no test files`);
    return true;
  }

  let allPassed = true;
  for (const testFile of testFiles) {
    const result = spawnSync("node", [testFile], {
      encoding: "utf8",
      cwd: repoRoot,
    });

    if (result.status === 0) {
      console.log(`  PASS: ${testFile.split(/[\\/]/).pop()}`);
    } else {
      console.log(`  FAIL: ${testFile.split(/[\\/]/).pop()}`);
      console.log(result.stderr || result.stdout);
      allPassed = false;
    }
  }

  return allPassed;
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Usage: node scripts/run-isolated-tests.mjs <skill-name> [skill-name...]");
  console.log("       node scripts/run-isolated-tests.mjs --all");
  process.exit(1);
}

let skillNames;
if (args.includes("--all")) {
  const requirements = parseRequirements();
  skillNames = Object.keys(requirements);
} else {
  skillNames = args;
}

let allPassed = true;
for (const name of skillNames) {
  const passed = runSkillTests(name);
  if (!passed) allPassed = false;
}

if (!allPassed) {
  process.exit(1);
}

console.log(`\nAll tests passed for: ${skillNames.join(", ")}`);
