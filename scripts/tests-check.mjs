#!/usr/bin/env node
// tests-check.mjs — fail if .gitignore can hide a test from the repository.
//
// Why this exists: .gitignore carried a bare `tests/*`. It matched the entire
// test tree. The 103 suites already in git survived only because they were
// added before that line; every NEW test was silently ignored, so it ran on the
// author's machine and did not exist for anyone who cloned the repo. A test
// wired into `npm test` and absent from the repository is the "a name match is
// not execution" failure one layer down — the chain references a file that no
// other clone has.
//
// Nothing about that state looks wrong locally: the suite runs, npm test is
// green, and the file is on disk. Only `git status` can see it, and only if
// someone happens to look.
//
// So the rule is checked mechanically, and it is checked by asking git rather
// than by parsing .gitignore — a pattern this file cannot get subtly wrong the
// way a regex can.
//
// Usage: node scripts/tests-check.mjs [--json]

import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TESTS_DIR = join(REPO_ROOT, "tests");

/**
 * Files under tests/ that are generated diagnostics, not suites.
 *
 * `last-misses.txt` is written by the routing eval on every run and carries no
 * state a reader can act on; `e1-misses.txt` stays tracked because it is the
 * regression record. The distinction is the whole reason this file exists: a
 * tracked generated file dirties the tree every run, and an untracked suite
 * vanishes from the repository.
 */
const ALLOWED_IGNORED = new Set(["tests/routing/last-misses.txt"]);

const problems = [];

const sh = (cmd, args) => {
  try {
    return execFileSync(cmd, args, {
      encoding: "utf8",
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
};

// Every file under tests/, recursively.
function walk(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(p));
    else found.push(p);
  }
  return found;
}

if (!existsSync(TESTS_DIR)) {
  problems.push("tests/ does not exist; this check cannot confirm the suites are visible to git");
} else {
  for (const abs of walk(TESTS_DIR)) {
    const rel = relative(REPO_ROOT, abs).replaceAll("\\", "/");
    // `git check-ignore` exits 0 when the path IS ignored, 1 when it is not.
    // The path does not need to exist for the pattern to match, so an untracked
    // new test is caught exactly like a tracked one.
    if (sh("git", ["check-ignore", "-q", rel]) !== null) {
      if (ALLOWED_IGNORED.has(rel)) continue;
      problems.push(
        `${rel} is ignored by .gitignore. A test that is not in the repository does not exist for ` +
          `anyone who clones it — it runs locally and passes CI while being absent. If this file is a ` +
          `generated diagnostic rather than a suite, add it to ALLOWED_IGNORED in scripts/tests-check.mjs ` +
          `with a reason.`,
      );
    }
  }
}

// The mirror image: a suite on disk that is not tracked, which is the same
// defect reached from the other side and is the state a fresh clone would be in.
const tracked = new Set((sh("git", ["ls-files", "tests/"]) ?? "").split("\n").filter(Boolean));
for (const abs of walk(TESTS_DIR)) {
  const rel = relative(REPO_ROOT, abs).replaceAll("\\", "/");
  if (ALLOWED_IGNORED.has(rel)) continue;
  if (!tracked.has(rel)) {
    problems.push(
      `${rel} exists on disk but is not tracked by git. Either add it, or delete it — a suite that ` +
        `is wired into \`npm test\` and absent from the repository is a false self-report.`,
    );
  }
}

const asJson = process.argv.includes("--json");
if (asJson) {
  console.log(JSON.stringify({ problems, tests: walk(TESTS_DIR).length }, null, 2));
} else if (problems.length > 0) {
  console.error(`FAIL: ${problems.length} problem(s) with test visibility:\n`);
  for (const p of problems) console.error(`  ${p}`);
} else {
  const count = walk(TESTS_DIR).length;
  console.log(
    `PASS: all ${count} file(s) under tests/ are visible to git (${ALLOWED_IGNORED.size} declared diagnostic exception)`,
  );
}

if (problems.length > 0) process.exit(1);
