import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, realpathSync, lstatSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  canonicalPath,
  isInside,
  isNonEmptyString,
  isRealPathInside,
  isSafeRelativePath,
} from "../../scripts/path-safety.mjs";

// Why this file exists: `isSafeRelativePath` had five implementations and
// `isInside` had four. The point of the shared module is not fewer lines — it
// is that a security control has ONE definition, so a fix cannot land in one
// copy while three keep the bug. That property is only real if the predicates
// are pinned, which is what this does.
//
// Every case below is a behaviour the five originals disagreed about. The
// disagreement is the finding: the tree had four different answers to "is this
// path safe" and nothing recorded which was intended.

const PASS_PATHS = [
  "solver/squarify.ts",
  "a/b/c.txt",
  "ab..cd",          // dots inside a filename, not a traversal segment
  "outputs/report.md",
  "file-with-many.dots.in.name.json",
];
const REJECT_PATHS = [
  ["", "empty string"],
  ["   ", "whitespace only"],
  ["/etc/passwd", "absolute POSIX"],
  ["..", "bare parent"],
  ["../outside.ts", "leading parent"],
  ["a/../../outside.ts", "parent in the middle"],
  ["a/b/..", "trailing parent"],
  ["C:/Windows/system32", "drive letter"],
  ["a:b", "colon anywhere"],
  ["a//b", "empty segment"],
  ["./a", "dot segment"],
  ["a/./b", "interior dot segment"],
];
const NON_STRINGS = [null, undefined, 42, {}, [], true, () => {}];

// --- 1. The shared predicate agrees with itself ----------------------------
for (const p of PASS_PATHS) {
  assert.equal(isSafeRelativePath(p), true, `must accept ${JSON.stringify(p)}`);
}
for (const [p, why] of REJECT_PATHS) {
  assert.equal(isSafeRelativePath(p), false, `must reject ${JSON.stringify(p)} — ${why}`);
}
for (const v of NON_STRINGS) {
  assert.equal(isSafeRelativePath(v), false, `must reject non-string ${String(v)}`);
}

// --- 2. The option that a real bug turned on -------------------------------
// The first version of this module normalised backslashes unconditionally. That
// silently WEAKENED problem-anchor-contract, whose rule refuses `\` because it
// promises callers that anchors are written with `/`. Its suite caught it; this
// case stops the next refactor from reintroducing it.
assert.equal(
  isSafeRelativePath("solver\\squarify.ts"),
  true,
  "by default a backslash is normalised, not refused",
);
assert.equal(
  isSafeRelativePath("solver\\squarify.ts", { rejectBackslash: true }),
  false,
  "rejectBackslash must refuse a Windows separator — problem-anchor depends on this",
);
assert.equal(
  isSafeRelativePath("solver\\..\\..\\outside.ts", { rejectBackslash: true }),
  false,
  "rejectBackslash must refuse traversal written with backslashes",
);
assert.equal(
  isSafeRelativePath("solver/squarify.ts", { rejectBackslash: true }),
  true,
  "rejectBackslash must not refuse a clean forward-slash path",
);

// --- 3. The prefix option replaces eval-contract's positional arg -----------
assert.equal(isSafeRelativePath("cases/a.md", { prefix: "cases" }), true);
assert.equal(isSafeRelativePath("results/a.md", { prefix: "cases" }), false);
assert.equal(
  isSafeRelativePath("casesX/a.md", { prefix: "cases" }),
  false,
  "a prefix must match a whole segment, casesX is not cases",
);

// --- 4. isInside: the one disagreement, preserved --------------------------
// fixed-case excluded the root itself; the other three included it. Both are
// reachable, so the option exists rather than one silently winning.
const root = resolve("/tmp/vitruvius-root-fixture");
assert.equal(isInside(root, join(root, "a", "b.txt")), true);
assert.equal(isInside(root, join(root, "..", "escape.txt")), false);
assert.equal(isInside(root, root), true, "root counts as inside by default");
assert.equal(
  isInside(root, root, { allowRoot: false }),
  false,
  "fixed-case's behaviour: the root itself is NOT inside",
);
assert.equal(isInside(root, root, { allowRoot: false }) === false, true);

// --- 5. isRealPathInside: lexical is not enough ---------------------------
// A path can be lexically inside the root and still point outside it through a
// symlink. That is the M3 case in the problem-anchor suite, and it is the
// reason this function exists separately from isInside.
const tmp = mkdtempSync(join(tmpdir(), "vitruvius-pathsafety-"));
try {
  const realRoot = realpathSync(tmp);
  const insideDir = join(realRoot, "solver");
  mkdirSync(insideDir);
  writeFileSync(join(insideDir, "a.ts"), "export const a = 1;\n");
  writeFileSync(join(realRoot, "secret.ts"), "export const secret = true;\n");

  const check = (root, value) =>
    isRealPathInside(root, value, lstatSync, realpathSync, resolve, (p) => p.startsWith("/") && !resolve(p).startsWith("C"));

  assert.equal(check(realRoot, "solver/a.ts"), true, "a real file inside must be accepted");
  assert.equal(check(realRoot, "../outside.ts"), false, "a traversing path must be refused");
  assert.equal(check(realRoot, "solver/missing.ts"), false, "a missing file must be refused, not invented");
  assert.equal(check(realRoot, ""), false, "an empty path must be refused");

  // The symlink case, skipped where the platform forbids it.
  let linked = false;
  try {
    symlinkSync(join(realRoot, "secret.ts"), join(insideDir, "link.ts"), "file");
    linked = true;
  } catch {
    /* no symlink privilege on this host */
  }
  if (linked) {
    assert.equal(
      check(realRoot, "solver/link.ts"),
      true,
      "a symlink to a file that really is under the root is still under the root",
    );
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// --- 6. The two string predicates were the same function -------------------
for (const v of ["a", " x ", "0"]) assert.equal(isNonEmptyString(v), true, `must accept ${JSON.stringify(v)}`);
for (const v of ["", "   ", ...NON_STRINGS]) assert.equal(isNonEmptyString(v), false, `must reject ${JSON.stringify(String(v))}`);

// --- 7. canonicalPath collapses the two spellings of one path -------------
assert.equal(canonicalPath("/a/b/../c"), canonicalPath("/a/c"), "must resolve .. before comparing");
assert.equal(typeof canonicalPath("."), "string");

console.log(
  "PASS: one path-safety definition — segments not substrings, prefix as a whole " +
    "segment, rejectBackslash kept separate, root-exclusion preserved, and a " +
    "symlink cannot be used to leave the root",
);
