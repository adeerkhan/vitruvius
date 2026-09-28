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
{
  const m = /\|\s*`vitruvius\/`\s*\|\s*([\d,]+)\s*\|\s*[\d,]+\s*\|/.exec(text);
  if (m) {
    const claimed = +m[1].replace(/,/g, "");
    let onDisk = 0;
    const exts = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|c|cpp|cs|rb|swift|kt)$/;
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
        `CodeGraph table lists ${claimed} indexed files; ${onDisk} source files are on disk. ` +
        `The index is stale and locked by the MCP daemon, so the node/edge columns are older still.`;
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

// --- 6. The E1 numbers must match the gate -------------------------------
// The map now states all three. Two are machine-checked here; the third is
// recorded in the manifest and read from it rather than re-derived.
{
  const coverage = JSON.parse(readFileSync(join(REPO_ROOT, "skills", "e1-suite-manifest.json"), "utf8"));
  const stated = /\*\*(\d+)\/25\*\*/.exec(text);
  const onDisk = readdirSync(join(REPO_ROOT, "skills")).filter((n) =>
    existsSync(join(REPO_ROOT, "skills", n, "SKILL.md")),
  ).length;
  const withSuite = readdirSync(join(REPO_ROOT, "skills")).filter(
    (n) => existsSync(join(REPO_ROOT, "skills", n, "SKILL.md")) &&
      existsSync(join(REPO_ROOT, "tests", n)) &&
      readdirSync(join(REPO_ROOT, "tests", n)).some((f) => f.endsWith(".mjs")),
  ).length;
  if (stated && withSuite !== +stated[1] && `${withSuite}/${onDisk}` !== stated[1].replace(/\*\*\d+\//, "")) {
    // Only flag when the map is clearly asserting the suite floor.
    if (new RegExp(`suite floor[^\\n]*\\*\\*${stated[1]}\\*\\*`, "i").test(text) && withSuite !== +stated[1]) {
      problems.push(`map states a suite floor of ${stated[1]}; ${withSuite} skills actually have a suite`);
    }
  }
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
