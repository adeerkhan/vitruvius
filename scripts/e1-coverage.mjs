#!/usr/bin/env node
// e1-coverage.mjs — report which of the 25 skills have a dedicated test
// directory, and which do not. Makes the E1-full progress measurable instead
// of a hand-counted number in docs/STEAL.md.
//
// Usage: node scripts/e1-coverage.mjs [--json]
//
// Coverage is "a tests/<skill>/ directory exists". That is a floor, not the
// E1 behavioral catalog: several skills have a suite that checks shape rather
// than behavior. The report says which floor each skill clears so the gap is
// visible, and the STEAL map keeps the behavioral number by hand.

import { readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const SKILLS_DIR = join(REPO_ROOT, "skills");
const TESTS_DIR = join(REPO_ROOT, "tests");

function skillNames() {
  const names = [];
  for (const entry of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (entry.isDirectory() && existsSync(join(SKILLS_DIR, entry.name, "SKILL.md"))) {
      names.push(entry.name);
    }
  }
  return names.sort();
}

function suiteFiles(skill) {
  const dir = join(TESTS_DIR, skill);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".mjs"))
    .map((f) => `tests/${skill}/${f}`);
}

const report = [];
for (const skill of skillNames()) {
  const files = suiteFiles(skill);
  report.push({ skill, covered: files.length > 0, suite_files: files.length });
}

const covered = report.filter((r) => r.covered);
const uncovered = report.filter((r) => !r.covered);

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ total: report.length, covered: covered.length, uncovered: uncovered.length, skills: report }, null, 2));
} else {
  console.log(`E1 coverage floor: ${covered.length}/${report.length} skills have a tests/<skill>/ suite\n`);
  for (const r of report) {
    console.log(`  ${r.covered ? "OK  " : "GAP "} ${r.skill}${r.suite_files ? ` (${r.suite_files} file${r.suite_files === 1 ? "" : "s"})` : ""}`);
  }
  console.log(`\n${uncovered.length} skill(s) without a dedicated suite.`);
  console.log("This is a coverage FLOOR, not the E1 behavioral catalog — see docs/STEAL.md for the behavioral count.");
}

if (uncovered.length > 0) {
  // The floor is informational, not a gate: several thin dispatcher skills
  // legitimately have no dedicated suite and are covered by tests/all-skills.
  process.exit(0);
}
