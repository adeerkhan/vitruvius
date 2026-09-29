#!/usr/bin/env node
// steal-selfcheck.mjs — STEAL.md is the status map; this checks the map.
//
// Why this exists: the map carried a stale Implementation HEAD five commits
// behind, a CodeGraph file count of 97 against 141 source files on disk, and 33
// commit hashes that nothing verified. A status document whose own numbers
// drift is the same failure this repo spent two rounds eliminating elsewhere —
// and STEAL.md is what a reader trusts when deciding what to work on next.
//
// It is deliberately narrow. It checks facts that are cheap to compute and
// cheap to get wrong. It does NOT check whether the ranked list is the right
// judgement, which is a human call, nor whether the CodeGraph node/edge counts
// are right, because that needs a rebuild and rebuilding is locked.
//
// Usage: node scripts/steal-selfcheck.mjs [--json] [--report]

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STEAL = join(REPO_ROOT, "docs", "STEAL.md");

const problems = [];
const warnings = [];

const text = readFileSync(STEAL, "utf8");

const sh = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", cwd: REPO_ROOT }).trim();
  } catch (e) {
    return null;
  }
};

// --- 1. Implementation HEAD must be a real commit in this history -----------
// A map cannot name its own commit hash: committing the map changes HEAD, so
// the hash is always one behind by construction. The first version of this check
// required equality and therefore could never pass its own commit.
//
// What IS worth enforcing: the hash resolves, and it is an ANCESTOR of HEAD
// rather than something from an unrelated line. That is the real failure this
// repo already had - a fabricated hash that read as evidence. Lagging behind is
// normal and unavoidable, so that is a warning, not a failure.
{
  const claimed = /\*\*Implementation HEAD:\*\*\s*`([0-9a-f]{7,40})`/.exec(text);
  const actual = sh("git", ["rev-parse", "--short", "HEAD"]);
  if (!claimed) {
    problems.push("no '**Implementation HEAD:** `hash`' line found; the map must pin the tree it describes");
  } else {
    const hash = claimed[1];
    if (sh("git", ["cat-file", "-e", `${hash}^{commit}`]) === null) {
      problems.push(
        `Implementation HEAD \`${hash}\` is not a commit in this repository. A status map citing an ` +
          `unresolvable hash is the failure this repo has already had once.`,
      );
    } else if (sh("git", ["merge-base", "--is-ancestor", hash, "HEAD"]) === null) {
      problems.push(
        `Implementation HEAD \`${hash}\` exists but is not an ancestor of HEAD (\`${actual}\`). The map ` +
          `describes a different line of history than the tree it sits in.`,
      );
    } else if (actual && !actual.startsWith(hash) && !hash.startsWith(actual)) {
      const behind = sh("git", ["rev-list", "--count", `${hash}..HEAD`]);
      warnings.push(
        `Implementation HEAD is \`${hash}\`, ${behind ?? "?"} commit(s) behind \`${actual}\`. Unavoidable for ` +
          `a file that names a commit — committing the map moves HEAD — so this is reported, not failed. ` +
          `Check the "done" claims above are still true of the newer tree.`,
      );
    }
  }
}

// --- 2. Every commit hash cited must exist and be an ancestor --------------
// A fabricated hash in a status map is worse than a missing one: it reads as
// evidence. This repo has already had that exact failure.
{
  const rows = [...text.matchAll(/^\|\s*\d+\s*\|([^|]+)\|\s*`?([0-9a-f]{7,40})`?\s*\|/gm)];
  for (const [, what, hash] of rows) {
    const exists = sh("git", ["cat-file", "-e", `${hash}^{commit}`]);
    if (exists === null) {
      problems.push(`cites commit ${hash} ("${what.trim().slice(0, 60)}"), which is not in this repository`);
    }
  }
}

// --- 3. The scale line must match the tree ---------------------------------
{
  const m = /scripts:\s*(\d+)\s*files\s*·\s*tests:\s*(\d+)\s*files\s*·\s*skills:\s*(\d+)\s*·\s*agents:\s*(\d+)\s*canonical roles \+\s*(\d+)\s*OpenCode/.exec(text);
  const countMjs = (dir) => {
    let n = 0;
    (function walk(d) {
      if (!existsSync(d)) return;
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith(".mjs")) n++;
      }
    })(dir);
    return n;
  };
  const actual = {
    scripts: readdirSync(join(REPO_ROOT, "scripts")).filter((f) => f.endsWith(".mjs")).length,
    tests: countMjs(join(REPO_ROOT, "tests")),
    skills: readdirSync(join(REPO_ROOT, "skills")).filter((n) => existsSync(join(REPO_ROOT, "skills", n, "SKILL.md"))).length,
    roles: readdirSync(join(REPO_ROOT, "agents")).filter((f) => f.endsWith(".md")).length,
    adapters: existsSync(join(REPO_ROOT, ".opencode", "agent"))
      ? readdirSync(join(REPO_ROOT, ".opencode", "agent")).filter((f) => f.endsWith(".md")).length
      : 0,
  };
  if (!m) {
    problems.push("no scale line found; the map must state scripts/tests/skills/agents counts");
  } else {
    const pairs = [
      ["scripts", +m[1], actual.scripts],
      ["tests", +m[2], actual.tests],
      ["skills", +m[3], actual.skills],
      ["canonical roles", +m[4], actual.roles],
      ["OpenCode adapters", +m[5], actual.adapters],
    ];
    for (const [k, c, a] of pairs) {
      if (c !== a) problems.push(`scale line: ${k} claims ${c}, tree has ${a}`);
    }
  }
}

// --- 4. The CodeGraph file count must not be presented as current ---------
// Node/edge counts need a rebuild, and rebuilding is locked, so they are not
// checked. The FILE count is checkable, and a stale one misleads a reader about
// how much of the tree the index covers.
//
// CodeGraph indexes JS/TS/YAML only, so the on-disk count is restricted to
// those extensions — comparing against all source files would always fail.
{
  const m = /\|\s*`vitruvius\/`\s*\|\s*([\d,]+)\s*\|\s*[\d,]+\s*\|/.exec(text);
  if (m) {
    const claimed = +m[1].replace(/,/g, "");
    let onDisk = 0;
    const exts = /\.(ts|tsx|js|jsx|mjs|cjs|yaml|yml)$/;
    (function walk(dir) {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (["node_modules", ".git", "ref", "outputs"].includes(e.name)) continue;
        const p = join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (exts.test(e.name)) onDisk++;
      }
    })(REPO_ROOT);
    if (claimed !== onDisk) {
      // A stale number is acceptable when the row SAYS it is stale. A stale
      // number presented as current is the failure — it tells a reader the
      // index covers the tree when it does not.
      const rowLine = text.split("\n").find((l) => /`vitruvius\/`/.test(l)) ?? "";
      const markedStale = /stale/i.test(rowLine);
      const message =
        `CodeGraph table lists ${claimed} indexed files; ${onDisk} indexable source files are on disk. ` +
        `The index is stale, so the node/edge columns are older still.`;
      if (markedStale) {
        // Informational: the map is honest about it, so nothing to fix.
        console.error(`  note: ${message} The row is marked stale, which is correct.\n`);
      } else {
        problems.push(
          `${message} Mark the row stale rather than deleting it — an unmarked stale number reads as current.`,
        );
      }
    }
  }
}

// --- 5. The reference count must match, and the reachability gate must pass
{
  const m = /`references\/` holds (\d+) files\.\s*\*\*All (\d+) are cited/.exec(text);
  if (m) {
    const onDisk = readdirSync(join(REPO_ROOT, "references")).filter((f) => f.endsWith(".md")).length;
    if (+m[1] !== onDisk) problems.push(`claims references/ holds ${m[1]} files; ${onDisk} are on disk`);
    if (+m[1] !== +m[2]) problems.push(`claims ${m[1]} references but that only ${m[2]} are cited`);
  }
  const r = sh("node", [join(REPO_ROOT, "scripts", "reference-reachability.mjs")]);
  if (r === null) problems.push("scripts/reference-reachability.mjs could not be run to confirm the claim");
}

/**
 * Every suite-floor claim in the map, checked against the real count.
 *
 * Pure, so a test can drive it with synthetic lines. This function had three
 * false positives on its first run against the real map, all of them correct
 * text: the model-run catalog (4/25) on lines that also mention the floor, and a
 * historical "floor 10 -> 14/25" entry recording what the floor used to be.
 * Guessing which of two same-denominator counters a number means is how a check
 * cries wolf, so attribution is by the words immediately before each pair.
 *
 * @param {string} text         the map's contents
 * @param {number} onDisk       skills in skills/
 * @param {number} withSuite    skills with a tests/<skill>/ suite
 * @returns {string[]} problems
 */
export function checkSuiteFloor(text, onDisk, withSuite) {
  const problems = [];

  for (const line of text.matchAll(/^.*\bfloor\b.*$/gim).map((m) => m[0])) {
    // "floor 10 -> 14/25" records what the floor WAS, not what it is.
    if (/->|→|\bwas\b|formerly/i.test(line)) continue;

    for (const m of line.matchAll(/\*\*(\d+)\/(\d+)\*\*|\b(\d+)\/(\d+)\b/g)) {
      const bold = m[1] !== undefined;
      const claimed = +(m[1] ?? m[3]);
      const total = +(m[2] ?? m[4]);
      if (total !== onDisk) continue; // a different denominator, not a skill count

      // Attribute the pair to a counter by the words immediately before it, then
      // make ONE decision. An earlier version split this across two `continue`
      // guards, and they shadowed each other: removing either one changed
      // nothing observable, so the mutation harness reported both as vacuous.
      // One decision point, so each rule can fail on its own.
      const lead = line.slice(Math.max(0, m.index - 60), m.index);
      const saysCatalog = /model[- ]run|catalog|blind|behaviou?ral run/i.test(lead);
      const saysSuite = /suite|tests\/<skill>|directory|coverage/i.test(lead);
      // Catalog wins when it is the nearer name. A bold pair with no name at all
      // is the map's own canonical statement, so it counts as the floor. A bare
      // pair with no name is unattributable and is not this check's business.
      const counter = saysCatalog && !saysSuite ? "catalog" : saysSuite || bold ? "suite" : null;
      if (counter !== "suite") continue;

      if (claimed !== withSuite) {
        problems.push(
          `map states a suite floor of ${claimed}/${total} on a line reading "${line.trim().slice(0, 70)}", ` +
            `but ${withSuite} of ${onDisk} skills actually have a tests/<skill>/ suite`,
        );
      }
    }
  }

  return problems;
}

// --- 6. The E1 numbers must match the gate -------------------------------
// The map states all three. Two are machine-checked here; the third is recorded
// in the manifest and read from it rather than re-derived.
//
// This used to match the suite floor only when the map wrote it BOLD, as
// `suite floor … **25/25**`. Two lines reading "suite floor 14/25" unbolded
// slipped past the gate while a bold line 80-odd lines away said 25/25 — the
// map contradicting itself and the check passing anyway. The rule now reads a
// claim in any emphasis, and lives in checkSuiteFloor so it can be tested.
{
  const coverage = JSON.parse(readFileSync(join(REPO_ROOT, "skills", "e1-suite-manifest.json"), "utf8"));
  const onDisk = readdirSync(join(REPO_ROOT, "skills")).filter((n) =>
    existsSync(join(REPO_ROOT, "skills", n, "SKILL.md")),
  ).length;
  const withSuite = readdirSync(join(REPO_ROOT, "tests")).filter(
    (n) => existsSync(join(REPO_ROOT, "skills", n, "SKILL.md")) &&
      existsSync(join(REPO_ROOT, "tests", n)) &&
      readdirSync(join(REPO_ROOT, "tests", n)).some((f) => f.endsWith(".mjs")),
  ).length;

  problems.push(...checkSuiteFloor(text, onDisk, withSuite));

  if (coverage.model_run_recorded && !text.includes(`**${coverage.model_run_recorded}/25**`)) {
    problems.push(
      `skills/e1-suite-manifest.json records a model-run catalog of ${coverage.model_run_recorded}/25 but the ` +
        `map does not state it as **${coverage.model_run_recorded}/25**; the two numbers must agree`,
    );
  }
}

// --- 7. Working-tree accuracy ---------------------------------------------
// The map must not claim more than is committed, or a reader is misled about
// what survives a fresh clone. Only a WARNING: the common case is the map being
// edited in the same change that is about to be committed, and failing a build
// for that would be noise. The point is that it is reported, not enforced.
{
  const dirty = sh("git", ["status", "--porcelain"]);
  const uncommitted = dirty ? dirty.split("\n").filter(Boolean) : [];
  const tracked = uncommitted.filter((l) => !l.startsWith("??"));
  if (tracked.length > 0) {
    warnings.push(
      `${tracked.length} tracked file(s) are modified but uncommitted: ${tracked.slice(0, 3).join("; ")}. ` +
        `If the map describes that work, it is describing a tree a fresh clone does not have.`,
    );
  }
}

const result = { problems, warnings };
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(result, null, 2));
} else {
  if (problems.length === 0) {
    console.log("PASS: STEAL.md's own numbers match the tree (HEAD, commit hashes, counts, E1 figures)");
  } else {
    console.error(`FAIL: ${problems.length} problem(s) with STEAL.md's self-report:\n`);
    for (const p of problems) console.error(`  ${p}`);
  }
  if (warnings.length > 0) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  ${w}`);
  }
  console.log(
    `\nNot checked: whether the ranked list is the right judgement, and the CodeGraph node/edge ` +
      `columns (rebuilding the index is locked). A self-check cannot tell you what to do next.`,
  );
}

if (problems.length > 0) process.exit(1);
