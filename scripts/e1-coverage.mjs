#!/usr/bin/env node
// e1-coverage.mjs — report the E1 numbers, and gate the one that can be gated.
//
// Usage: node scripts/e1-coverage.mjs [--json] [--report]
//
// THREE NUMBERS, NOT ONE. They are routinely conflated, and the confusion is
// how "25/25" came to look like a claim it is not:
//
//   1. MODEL-RUN CATALOG  — a blind model run per skill. NOT machine-countable
//      here: it needs a model run per skill, which this script cannot do and
//      nobody has scripted. Tracked by hand in skills/e1-suite-manifest.json. This script does
//      not print it, because a number it cannot compute is a number it cannot
//      contradict — and the failure this exists to prevent is a doc claiming a
//      count the tooling never verified.
//
//   2. SUITE FLOOR  — a tests/<skill>/ suite exists. Computable, and now a
//      GATE: coverage cannot silently regress when a suite is deleted.
//
//   3. TEETH  — the suite can actually fail. Proven by mutation in
//      tests/all-skills/test-e1-suites-have-teeth.mjs, which is a separate
//      check because it spawns every suite. A directory that exists proves
//      nothing on its own, which is why this script reports the floor and the
//      teeth harness proves the floor is meaningful.
//
// The floor is now a gate rather than an always-exit-0 reporter. As a reporter
// it printed 14/25 for months while nothing could contradict it, and a skill
// could have lost its suite with a green build. See the 2026-09-28 entry in
// notes/rejected-changes.md for why that mattered.

import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const SKILLS_DIR = join(REPO_ROOT, "skills");
const TESTS_DIR = join(REPO_ROOT, "tests");
const MANIFEST = join(REPO_ROOT, "skills", "e1-suite-manifest.json");

function skillNames() {
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(SKILLS_DIR, e.name, "SKILL.md")))
    .map((e) => e.name)
    .sort();
}

function suiteFiles(skill) {
  const dir = join(TESTS_DIR, skill);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".mjs"))
    .map((f) => `tests/${skill}/${f}`);
}

// --- The recorded floor ----------------------------------------------------
// A gate needs a recorded value to compare against; without one it can only
// report, which is what it used to do. Kept in a data file rather than in this
// script so updating coverage is an explicit edit, not an implicit consequence
// of running the tool.
function recordedFloor() {
  if (!existsSync(MANIFEST)) return null;
  try {
    return JSON.parse(readFileSync(MANIFEST, "utf8"));
  } catch {
    return null;
  }
}

const report = [];
for (const skill of skillNames()) {
  const files = suiteFiles(skill);
  report.push({ skill, covered: files.length > 0, suite_files: files.length });
}

const covered = report.filter((r) => r.covered);
const uncovered = report.filter((r) => !r.covered);
const floor = recordedFloor();

const problems = [];
if (floor === null) {
  problems.push(
    "skills/e1-suite-manifest.json is missing or unreadable, so there is no recorded floor to gate against. " +
      "A gate with no recorded value can only report, which is what this script did before.",
  );
} else {
  for (const name of floor.must_have_suite ?? []) {
    if (!report.find((r) => r.skill === name)?.covered) {
      problems.push(
        `${name} is recorded in skills/e1-suite-manifest.json as having a suite, but tests/${name}/ is gone. ` +
          `Coverage regressed silently. If the suite was removed on purpose, delete the entry in the manifest too.`,
      );
    }
  }
  const stale = (floor.must_have_suite ?? []).filter((n) => !report.find((r) => r.skill === n));
  for (const n of stale) {
    problems.push(`${n} is in the manifest but is not a skill in skills/; remove the stale entry.`);
  }
}

const result = {
  suite_floor: { covered: covered.length, total: report.length, uncovered: uncovered.map((r) => r.skill) },
  model_run_catalog: {
    count: floor?.model_run_recorded ?? null,
    // Deliberately not computed here. Stating it as a machine number would let
    // a reader assume something verifies it.
    note: "not machine-countable; requires a blind model run per skill. Tracked by hand in skills/e1-suite-manifest.json.",
  },
  teeth: {
    harness: "tests/all-skills/test-e1-suites-have-teeth.mjs",
    note: "run separately; it spawns every suite to prove each can fail",
  },
  skills: report,
  problems,
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(result, null, 2));
} else if (process.argv.includes("--report")) {
  // --report prints and exits 0 regardless, for a human who wants the current
  // state without the gate failing them.
  printReport();
  process.exit(0);
} else {
  printReport();
}

function printReport() {
  console.log(`E1 SUITE FLOOR (machine-checked, gated): ${covered.length}/${report.length} skills have a tests/<skill>/ suite`);
  console.log(`E1 MODEL-RUN CATALOG:                    ${floor?.model_run_recorded ?? "unknown"}/25 skills have a blind model-run record`);
  console.log("  (not machine-countable — needs a model run per skill; tracked by hand in skills/e1-suite-manifest.json)");
  console.log("E1 TEETH:                                 proven by tests/all-skills/test-e1-suites-have-teeth.mjs\n");
  for (const r of report) {
    console.log(`  ${r.covered ? "OK  " : "GAP "} ${r.skill}${r.suite_files ? ` (${r.suite_files} file${r.suite_files === 1 ? "" : "s"})` : ""}`);
  }
  console.log(
    `\nThese are three different numbers. A tests/<skill>/ directory is a floor, not the ` +
      `catalog: the catalog is a blind model run per skill. And a suite that cannot fail is decoration — ` +
      `the teeth harness is what makes the floor mean something.`,
  );
  if (problems.length > 0) {
    console.error(`\nFAIL: ${problems.length} coverage problem(s):`);
    for (const p of problems) console.error(`  ${p}`);
  }
}

if (problems.length > 0) process.exit(1);

