/**
 * staged-secret-scan.mjs — refuse a staged change that ADDS a credential.
 *
 * The commit rule says never commit secrets; until this existed, nothing
 * checked the staged content. scripts/security-scan.mjs walks skills/ (code
 * extensions) and ten named runtime scripts, so a credential added to a
 * markdown file, a fixture, docs/ or outputs/ was invisible to it, and
 * .githooks/ carried only commit-msg.
 *
 * Method from src-02 (agent-skills #717/#718, MIT): report the offending
 * FILE NAME only. Their earlier documented form piped the staged diff through
 * a printing grep, so the staged credential's raw value reached terminal
 * output and every agent tool log — the scan echoed the very thing it exists
 * to flag. This keeps that contract and tightens the mechanism two ways:
 *
 * 1. Matching runs here against ADDED lines only. Removing a secret must not
 *    block its own cleanup, and a pickaxe form (which also matches removed
 *    lines) would.
 * 2. The patterns are imported from security-scan.mjs, not copied: one
 *    definition cannot drift from the other.
 *
 * Stated limit: binary staged files are not matched — the patterns are
 * text-shaped, and a credential inside an archive is out of scope here.
 *
 * Exit codes: 0 clean or nothing staged; 1 credential-shaped added lines are
 * staged (files named, lines never printed); 2 unusable (git failed).
 *
 * Reached by .githooks/pre-commit — opt-in per clone, `git config
 * core.hooksPath .githooks` — and by
 * tests/engineering-research/test-staged-secret-scan.mjs, which is what makes
 * the rule survive a fresh clone: a committed hook is not run by anyone who
 * has not enabled it.
 */

import { spawnSync } from "node:child_process";
import { SECRET_PATTERNS } from "./security-scan.mjs";

function git(args) {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) throw new Error(`git is not runnable: ${result.error.message}`);
  if (result.status !== 0) {
    // stderr only — a git failure message does not echo file content.
    const detail = (result.stderr || "").trim().split("\n").slice(0, 3).join(" ");
    throw new Error(`git ${args.slice(0, 2).join(" ")} failed (status ${result.status}): ${detail}`);
  }
  return result.stdout;
}

function stagedFiles() {
  // -z: NUL-terminated, never C-quoted, so a path with a space or a quote
  // cannot be silently mis-parsed into a file we never scan.
  // D (deleted) excluded: a pure removal adds no content to the commit.
  return git(["diff", "--staged", "--name-only", "-z", "--diff-filter=ACMR"])
    .split("\0")
    .filter(Boolean);
}

function addedLines(file) {
  const out = git([
    "diff",
    "--staged",
    "--unified=0",
    "--no-color",
    "--no-ext-diff",
    "--no-textconv",
    "--diff-filter=ACMR",
    "--",
    file,
  ]);
  const lines = [];
  for (const line of out.split("\n")) {
    // "+" starts an added line; "+++" is the +++ b/<path> header.
    if (line.startsWith("+") && !line.startsWith("+++")) lines.push(line.slice(1));
  }
  return lines;
}

function fileAddsSecret(file) {
  for (const line of addedLines(file)) {
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(line)) return true;
    }
  }
  return false;
}

function unusable(error) {
  console.error(`staged-secret-scan: unusable — ${error.message}`);
  process.exit(2);
}

function main() {
  let files;
  try {
    files = stagedFiles();
  } catch (error) {
    unusable(error);
  }
  if (files.length === 0) {
    console.log("staged-secret-scan: nothing staged (added/copied/modified/renamed).");
    return;
  }

  const flagged = [];
  for (const file of files) {
    try {
      if (fileAddsSecret(file)) flagged.push(file);
    } catch (error) {
      unusable(error);
    }
  }

  if (flagged.length === 0) {
    console.log(`staged-secret-scan: ${files.length} staged file(s), none adds a credential-shaped line.`);
    return;
  }

  console.error(`FAIL: ${flagged.length} staged file(s) add a credential-shaped line:`);
  for (const file of flagged) console.error(`  ${file}`);
  console.error("");
  console.error("Review these files before committing. File names only — the matched line is");
  console.error("never printed, because this output lands in the terminal and in agent logs.");
  process.exit(1);
}

main();
