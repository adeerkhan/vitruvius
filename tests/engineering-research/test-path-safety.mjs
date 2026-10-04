import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, readFileSync, realpathSync, lstatSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalPath,
  isInside,
  isNonEmptyString,
  isRealPathInside,
  isSafeRelativePath,
  resolveRealFile,
} from "../../scripts/path-safety.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

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
  // An in-root symlink is accepted by BOTH forms, or the contracts and this
  // suite disagree about the same path.
  if (linked) {
    assert.equal(
      resolveRealFile(realRoot, "solver/link.ts").ok,
      true,
      "resolveRealFile must agree with isRealPathInside on a legitimate in-root link",
    );
  }

  // --- 5b. resolveRealFile is the one decision, and it says why ------------
  // The contracts cannot share a boolean: goal-check and field-pilot both report
  // an unsafe path differently from one that escapes the root. resolveRealFile is
  // the shared decision plus the reason, so each caller can keep its own wording
  // without re-implementing the check. If the rule forks again, the reason codes
  // are what stops it: two copies cannot both produce all three.
  const reasonOf = (value) => resolveRealFile(realRoot, value).reason ?? null;

  for (const [p, why] of REJECT_PATHS) {
    assert.equal(reasonOf(p), "unsafe", `must report \`unsafe\` for ${JSON.stringify(p)} — ${why}`);
  }
  assert.equal(reasonOf("solver/missing.ts"), "not-a-file", "a missing file is not-a-file, not an escape");
  assert.equal(reasonOf("solver"), "not-a-file", "a directory is not-a-file");

  // The case that distinguishes this from the inline copies these two contracts
  // used to carry: a symlink out of the root is refused as `escapes-root` even
  // though its own path is lexically inside. The old code reported it as a
  // missing file, which sent an operator looking for the wrong problem.
  const outside = mkdtempSync(join(tmpdir(), "vitruvius-pathsafety-outside-"));
  try {
    writeFileSync(join(outside, "secret.ts"), "export const secret = true;\n");
    try {
      symlinkSync(join(outside, "secret.ts"), join(insideDir, "escape.ts"), "file");
      assert.equal(
        reasonOf("solver/escape.ts"),
        "escapes-root",
        "a symlink pointing out of the root must be refused as an escape, not a missing file",
      );
      assert.equal(
        check(realRoot, "solver/escape.ts"),
        false,
        "and the boolean form must agree",
      );
    } catch (error) {
      if (error?.code !== "EPERM" && error?.code !== "EEXIST") throw error;
      /* no symlink privilege on this host */
    }
  } finally {
    rmSync(join(insideDir, "escape.ts"), { force: true });
    rmSync(outside, { recursive: true, force: true });
  }

  // `ok` carries both spellings: the path a caller should read, and the resolved
  // target that was actually judged. A caller that reads the resolved one cannot
  // be redirected by swapping the link after the check.
  const good = resolveRealFile(realRoot, "solver/a.ts");
  assert.equal(good.ok, true);
  assert.equal(good.reason, undefined, "a success carries no reason");
  assert.equal(good.resolved, join(realRoot, "solver", "a.ts"), "resolved is the target that was judged");

  // The escape case must be PROVEN, not merely attempted. This host is Windows
  // without SeCreateSymbolicLinkPrivilege, so the real symlink above is skipped
  // and would leave the rule untested everywhere except Linux CI. resolveRealFile
  // takes its fs functions as arguments for exactly this reason: a double can
  // state "solver/escape.ts resolves to a file outside the root" as a fact about
  // the fixture rather than a hope about the platform.
  //
  // The double is deliberately adversarial — it resolves the escaping link and
  // still reports it as a file, so the ONLY thing that can refuse it is the
  // containment test. An fs-double that returned a directory would pass for the
  // wrong reason.
  const escapeDeps = {
    lstat: () => ({ isFile: () => true }),
    realpath: (p) => (String(p).endsWith("escape.ts") ? "/outside/secret.ts" : String(p)),
  };
  assert.equal(
    resolveRealFile(realRoot, "solver/escape.ts", escapeDeps).reason,
    "escapes-root",
    "a resolved target outside the root must be refused even when it is a regular file",
  );
  assert.equal(
    resolveRealFile(realRoot, "solver/a.ts", escapeDeps).ok,
    true,
    "and the same double must still accept a path that resolves inside the root",
  );

  // The e73d7ed bug, stated as a fact rather than a hope. That fix found that an
  // lstat on the candidate describes the LINK, and a link is never isFile() — so
  // every symlink was refused, including a legitimate in-root one. The double
  // below is exactly that situation: the candidate reports not-a-file, the
  // resolved target reports a file. Mutation-confirmed — swapping the lstat back
  // onto the candidate turns this case red.
  const linkDeps = {
    lstat: (p) => ({ isFile: () => !String(p).endsWith("link.ts") }),
    // realpath must move the name, or the resolved target still ends in
    // `link.ts` and the double cannot tell the link from its target.
    realpath: (p) => (String(p).endsWith("link.ts") ? join(String(p), "..", "a.ts") : String(p)),
  };
  assert.equal(
    resolveRealFile(realRoot, "solver/link.ts", linkDeps).ok,
    true,
    "a symlink must be judged on its resolved target, never on the link itself",
  );
  // A link whose target cannot be stat-ed is a missing file, not an escape —
  // otherwise a broken link reads as a containment breach and sends an operator
  // hunting for an attack that never happened.
  assert.equal(
    resolveRealFile(realRoot, "solver/escape.ts", {
      realpath: escapeDeps.realpath,
      lstat: () => { throw Object.assign(new Error("ENOENT"), { code: "ENOENT" }); },
    }).reason,
    "not-a-file",
    "a target that vanishes between resolve and stat is not-a-file",
  );
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// --- 5c. The contracts delegate instead of re-implementing -----------------
// The escape case in 5b is unreachable without a symlink, and this host cannot
// make one. So for the four contract scripts the guarantee has to be structural:
// they must contain no containment logic of their own, because a copy cannot be
// exercised by a test that cannot create a symlink. Reintroduce a realpath +
// lstat + relative sequence in any of them and this goes red.
//
// The check is a shape test on purpose — it names the tokens that together mean
// "this file decides containment itself", not any particular implementation.
const DELEGATING_CONTRACTS = [
  "scripts/goal-check-contract.mjs",
  "scripts/field-pilot-contract.mjs",
  "scripts/fixed-case.mjs",
  "scripts/eval-contract.mjs",
];
for (const rel of DELEGATING_CONTRACTS) {
  const source = readFileSync(join(REPO_ROOT, rel), "utf8");
  assert.match(
    source,
    /from "\.\/path-safety\.mjs"/,
    `${rel} must import the shared predicates`,
  );
  assert.match(
    source,
    /resolveRealFile\(/,
    `${rel} must decide containment through resolveRealFile`,
  );
  assert.doesNotMatch(
    source,
    /realpathSync\([^)]*\)[^;]*\brelative\(/,
    `${rel} re-implements containment instead of calling resolveRealFile — one definition, or the fix lands in one copy`,
  );
  assert.doesNotMatch(
    source,
    /function\s+isSafeRegularFile\s*\([^)]*\)\s*\{\s*\n\s*if\s*\(!isSafe/,
    `${rel} has a hand-rolled containment predicate; it must be a one-line call`,
  );
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
