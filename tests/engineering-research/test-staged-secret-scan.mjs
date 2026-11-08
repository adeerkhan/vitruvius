/**
 * test-staged-secret-scan.mjs — the contract of .githooks/pre-commit's scan.
 *
 * src-02's lesson (#717/#718): a staged-secret scan that prints matched diff
 * lines echoes the credential it exists to flag into the terminal and every
 * agent tool log. This suite runs the shipped scanner against fixture repos
 * and asserts both halves of that contract: the offending file is NAMED, and
 * the sentinel value never reaches stdout or stderr. It also pins the wiring
 * (registry entry + executable hook) — a committed hook is not run by anyone
 * who has not enabled it, so the test is the coverage for every other clone.
 *
 * Fixture secrets are built at RUNTIME from parts: a literal `key = value`
 * line in this source would trip the very scanner under test the day this
 * file is staged.
 */

import { strict as assert } from "node:assert";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { makeTempDir, removeTempDir } from "../_support/temp-dir.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const scanner = join(repoRoot, "scripts", "staged-secret-scan.mjs");

// Not a shape any SECRET_PATTERN matches on its own; matched only once the
// runtime-built credential line is in a staged diff.
const SENTINEL = "FAKE_SENTINEL_FOR_TEST_ONLY_4b8d2f1a";
const CREDENTIAL_KEY = ["API", "PASSWORD"].join("_");

const GIT_ENV = {
  ...process.env,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
  GIT_AUTHOR_NAME: "Staged Secret Scan Test",
  GIT_AUTHOR_EMAIL: "staged-secret-scan@example.invalid",
  GIT_COMMITTER_NAME: "Staged Secret Scan Test",
  GIT_COMMITTER_EMAIL: "staged-secret-scan@example.invalid",
};

const sandboxes = [];
function sandbox() {
  const dir = makeTempDir("vitruvius-staged-secret-");
  sandboxes.push(dir);
  git(dir, "init", "-q");
  return dir;
}

function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", env: GIT_ENV });
  assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
}

function runScanner(cwd) {
  return spawnSync(process.execPath, [scanner], { cwd, encoding: "utf8", env: GIT_ENV });
}

// Runtime-built credential line: JSON.stringify produces the shape the
// patterns target without this file containing it.
function credentialFileContents() {
  return JSON.stringify({ [CREDENTIAL_KEY]: SENTINEL }) + "\n";
}

try {
  // --- 1. A staged credential is flagged by FILE NAME, never by value -----
  {
    const dir = sandbox();
    writeFileSync(join(dir, "clean.txt"), "nothing sensitive here\n");
    writeFileSync(join(dir, "leak.txt"), credentialFileContents());
    git(dir, "add", "clean.txt", "leak.txt");

    const run = runScanner(dir);
    assert.equal(run.status, 1, `expected exit 1 (findings), got ${run.status}:\n${run.stdout}\n${run.stderr}`);
    const output = run.stdout + run.stderr;
    assert.match(output, /leak\.txt/, "the offending file must be named");
    assert.ok(!output.includes("clean.txt"), `only offenders are named:\n${output}`);
    assert.ok(!output.includes(SENTINEL), `the sentinel value reached the output:\n${output}`);
    assert.ok(!output.includes(CREDENTIAL_KEY), `the matched line's key reached the output:\n${output}`);
  }

  // --- 2. A clean staged file passes -------------------------------------
  {
    const dir = sandbox();
    writeFileSync(join(dir, "clean.txt"), "ordinary change\n");
    git(dir, "add", "clean.txt");

    const run = runScanner(dir);
    assert.equal(run.status, 0, `expected exit 0, got ${run.status}:\n${run.stdout}\n${run.stderr}`);
    assert.match(run.stdout, /none adds a credential-shaped line/);
  }

  // --- 3. REMOVING a secret is not blocked: added lines only -------------
  {
    const dir = sandbox();
    writeFileSync(join(dir, "conf.txt"), credentialFileContents());
    git(dir, "add", "conf.txt");
    git(dir, "commit", "-q", "-m", "seed the fixture");
    writeFileSync(join(dir, "conf.txt"), "credential removed\n");
    git(dir, "add", "conf.txt");

    const run = runScanner(dir);
    assert.equal(
      run.status,
      0,
      `a pure removal must not be blocked (cleanup is not a leak):\n${run.stdout}\n${run.stderr}`,
    );
  }

  // --- 4. Nothing staged passes ------------------------------------------
  {
    const dir = sandbox();
    const run = runScanner(dir);
    assert.equal(run.status, 0, `expected exit 0 with nothing staged:\n${run.stdout}\n${run.stderr}`);
    assert.match(run.stdout, /nothing staged/);
  }

  // --- 5. Unusable (not a git repo) is exit 2, not a quiet pass ----------
  {
    const dir = makeTempDir("vitruvius-staged-secret-nogit-");
    sandboxes.push(dir);
    const run = runScanner(dir);
    assert.equal(run.status, 2, `expected exit 2 (unusable), got ${run.status}:\n${run.stdout}\n${run.stderr}`);
    assert.ok(!(run.stdout + run.stderr).includes(SENTINEL), "the error path must not print file content");
  }

  // --- 6. The wiring exists: registry entry + executable hook ------------
  {
    const registry = readFileSync(join(repoRoot, "scripts", "gate-registry.mjs"), "utf8");
    assert.match(
      registry,
      /"staged-secret-scan\.mjs"/,
      "staged-secret-scan.mjs must be declared in scripts/gate-registry.mjs",
    );

    const hook = join(repoRoot, ".githooks", "pre-commit");
    assert.ok(existsSync(hook), ".githooks/pre-commit must exist");
    const hookText = readFileSync(hook, "utf8");
    assert.match(hookText, /staged-secret-scan\.mjs/, "the hook must invoke the scanner");
    if (process.platform !== "win32") {
      assert.notEqual(
        statSync(hook).mode & 0o111,
        0,
        "the hook must be executable or git will not run it",
      );
    }
  }

  console.log("PASS: staged secret scan names files without echoing values, and is wired");
} finally {
  for (const dir of sandboxes) removeTempDir(dir);
}
