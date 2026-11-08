// mutation-harness.mjs — run mutation cases against a COPY of the repository.
//
// Why a copy: the earlier design mutated the tracked tree in place and then
// restored it. That cost five repair commits of its own (interrupted-run
// restore, a Windows file lock, a restore that reverted an unrelated rename,
// a restore that deleted 25 reference files) and made an uncommitted edit to
// a mutated file fail the harness by design — so the full `npm test` could not
// run before the very commit it was meant to check. A copy has none of those
// states: the mutation lands in a throwaway tree, the suite runs there, and the
// tree is deleted. No restore, no lock retry, no dirty check, no commit order.
//
// Attribution detail: every suite derives its repo root from its own path
// (import.meta.url), so running the COPY's suite validates the COPY's files.
// A suite that still passed after its rule was removed would be vacuous — but a
// suite that fails because the copy is missing a file would look "detected"
// without proving anything. That is why every suite first runs once against the
// pristine copy: a failed baseline is reported as BROKEN BASELINE and the
// mutation is never scored.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { makeTempDir, removeTempDir } from "../_support/temp-dir.mjs";

const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

// Copied into the throwaway tree. `evals/` is ~101MB of fixtures, so only the
// catalog a suite reads is copied, not the directory.
const DEFAULT_COPY = [
  "skills",
  "references",
  "agents",
  "scripts",
  "tests",
  "installer",
  "notes",
  "tasks",
  ".githooks",
  ".gitignore",
  "package.json",
  "AGENTS.md",
  "README.md",
  "NOTICE",
  "LICENSE",
  "CHANGELOG.md",
];
const DEFAULT_FILES = ["evals/catalog.json"];

// Isolated git identity: the seeded commit must not inherit the user's config
// (signing, hooksPath) or the harness would depend on the developer's machine.
// Windows has no /dev/null; NUL is the equivalent. A literal /dev/null is a
// relative path there, so git would read the repo for config and the harness
// would stop being hermetic.
const NULL_DEVICE = process.platform === "win32" ? "NUL" : "/dev/null";

const GIT_ENV = {
  ...process.env,
  GIT_CONFIG_GLOBAL: NULL_DEVICE,
  GIT_CONFIG_SYSTEM: NULL_DEVICE,
  GIT_AUTHOR_NAME: "Mutation Harness",
  GIT_AUTHOR_EMAIL: "mutation-harness@example.invalid",
  GIT_COMMITTER_NAME: "Mutation Harness",
  GIT_COMMITTER_EMAIL: "mutation-harness@example.invalid",
};

function copyRepo(sourceRoot, entries) {
  const root = makeTempDir("vitruvius-mutation-");
  for (const entry of entries) {
    const from = join(sourceRoot, entry);
    if (!existsSync(from)) continue;
    const to = join(root, entry);
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to, { recursive: true });
  }
  // Suites may write test artifacts into outputs/ (e.g. the research-to-post
  // card PNG). The directory exists in any real checkout; the copy gets an
  // empty one rather than the developer's local artifacts.
  mkdirSync(join(root, "outputs"), { recursive: true });
  return root;
}

/**
 * Copy the tree a mutation suite needs into a throwaway directory and return
 * its path. Exported for suites that mutate documents directly (the
 * benchmark-claims harness) rather than through runMutationHarness().
 * Remove it with removeRepository() when done.
 */
export function copyRepository(sourceRoot = DEFAULT_ROOT, entries = [...DEFAULT_COPY, ...DEFAULT_FILES]) {
  return copyRepo(sourceRoot, entries);
}

/** Delete a copy created by copyRepository; returns whether it is gone. */
export function removeRepository(root) {
  try {
    removeTempDir(root);
    return !existsSync(root);
  } catch {
    return false;
  }
}

/**
 * Seed one conforming commit so suites that read HEAD have a repo to read.
 * The message passes references/commit-rule.md on purpose: the
 * commit-message-check suite asserts that HEAD passes.
 */
function seedGit(root) {
  const git = (...args) =>
    spawnSync("git", args, { cwd: root, env: GIT_ENV, encoding: "utf8" });
  if (git("init", "-q").status !== 0) return false;
  if (git("add", "-A").status !== 0) return false;
  return git("commit", "-q", "-m", "test(mutation): seed the temporary copy").status === 0;
}

function refreshHeaderHash(content) {
  const match = /<!-- VITRUVIUS-COMPILED-SKILL:BEGIN v1 sha256=([0-9a-f]{64}) -->/.exec(content);
  if (!match) return content;
  const [, oldHash] = match;
  const body = content.slice(content.indexOf("-->", match.index) + 3);
  return content.replace(oldHash, createHash("sha256").update(body).digest("hex"));
}

function runSuite(root, test) {
  const run = spawnSync(process.execPath, [join(root, test)], { cwd: root, encoding: "utf8" });
  return {
    status: run.status,
    output: `${run.stdout ?? ""}${run.stderr ?? ""}`,
    error: run.error,
  };
}

/**
 * @param {{
 *   label: string,
 *   cases: Array<{name: string, file: string, test: string, mutate: (original: string) => string}>,
 *   repoRoot?: string,
 *   copyEntries?: string[],
 *   seedGit?: boolean,
 * }} options
 * @returns {{ok: boolean, detected: number, cases: number, vacuous: string[], broken: string[],
 *            baselineFailures: string[], workspaceRemoved: boolean}}
 */
export function runMutationHarness({
  label,
  cases,
  repoRoot = DEFAULT_ROOT,
  copyEntries = [...DEFAULT_COPY, ...DEFAULT_FILES],
  seedGit: wantGit = true,
}) {
  const root = copyRepo(repoRoot, copyEntries);
  const report = {
    ok: false,
    detected: 0,
    cases: cases.length,
    vacuous: [],
    broken: [],
    baselineFailures: [],
    workspaceRemoved: false,
  };
  const pristine = new Map();

  try {
    if (wantGit && !seedGit(root)) {
      console.log(`  BROKEN BASELINE: ${label} — the temporary copy has no usable git seed`);
      report.baselineFailures.push("git seed");
      return report;
    }

    // Pristine content comes from the copy, which mirrors the working tree the
    // old in-place harness mutated. Kept per file so a case always starts from
    // the same bytes even if an earlier suite wrote into the copy.
    for (const c of cases) {
      const abs = join(root, c.file);
      if (!pristine.has(c.file)) pristine.set(c.file, readFileSync(abs, "utf8"));
    }

    // One baseline per suite, before any mutation. Deduped: several cases share
    // a suite, and a baseline that ran after a mutation would prove nothing.
    const suiteBaselines = new Map();
    const baselineFailures = [];
    for (const test of [...new Set(cases.map((c) => c.test))]) {
      const run = runSuite(root, test);
      suiteBaselines.set(test, run);
      if (run.status !== 0) {
        baselineFailures.push(test);
        const caught = /AssertionError.*?: (.*)/.exec(run.output);
        console.log(
          `  BROKEN BASELINE: ${test} fails in a pristine copy` +
            (caught ? ` — ${caught[1].slice(0, 100)}` : ""),
        );
      }
    }

    let detected = 0;
    const vacuous = [];
    const broken = [];

    for (const c of cases) {
      const baseline = suiteBaselines.get(c.test);
      if (baseline.status !== 0) continue; // already reported; never scored

      const original = pristine.get(c.file);
      // Start from pristine every time, whatever a previous suite left behind.
      writeFileSync(join(root, c.file), original, "utf8");

      let mutated;
      try {
        mutated = c.mutate(original);
      } catch (error) {
        broken.push(c.name);
        console.log(`  BROKEN HARNESS: ${c.name} — mutation threw: ${error.message}`);
        continue;
      }
      if (typeof mutated !== "string" || mutated === original) {
        broken.push(c.name);
        console.log(`  BROKEN HARNESS: ${c.name} — the pattern did not match, nothing was mutated`);
        continue;
      }

      const content = c.file.endsWith(".md") ? refreshHeaderHash(mutated) : mutated;
      writeFileSync(join(root, c.file), content, "utf8");
      let run;
      try {
        run = runSuite(root, c.test);
      } finally {
        writeFileSync(join(root, c.file), original, "utf8");
      }

      if (run.status === 0) {
        vacuous.push(c.name);
        console.log(`  NOT DETECTED: ${c.name} — suite still passed`);
      } else {
        detected++;
        const caught = /AssertionError.*?: (.*)/.exec(run.output);
        console.log(`  detected: ${c.name}`);
        if (caught) console.log(`             caught by: ${caught[1].slice(0, 100)}`);
      }
    }

    const ok = baselineFailures.length === 0 && vacuous.length === 0 && broken.length === 0;
    const parts = [];
    if (vacuous.length) parts.push(`vacuous: ${vacuous.join("; ")}`);
    if (broken.length) parts.push(`broken harness: ${broken.join("; ")}`);
    if (baselineFailures.length) parts.push(`broken baseline: ${baselineFailures.join("; ")}`);
    console.log(
      `\n${ok ? "PASS" : "FAIL"}: ${label} — ${detected}/${cases.length} mutations detected` +
        (parts.length ? `\n  ${parts.join("\n  ")}` : ""),
    );

    report.ok = ok;
    report.detected = detected;
    report.vacuous = vacuous;
    report.broken = broken;
    report.baselineFailures = baselineFailures;
    return report;
  } finally {
    try {
      removeTempDir(root);
      report.workspaceRemoved = !existsSync(root);
    } catch {
      report.workspaceRemoved = false;
    }
  }
}
