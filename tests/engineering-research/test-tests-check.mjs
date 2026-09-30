import { strict as assert } from "node:assert";
import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// tests-check.mjs — the gate that stops .gitignore from hiding a test.
//
// The defect it exists for was invisible by construction. A bare `tests/*` in
// .gitignore matched the whole test tree. The 103 existing suites stayed
// tracked only because they were added before that line, and every NEW suite
// was silently ignored: green locally, green in CI, absent from the repository
// for anyone who cloned it. Nothing about that state looks wrong unless you
// happen to run `git status` on a file you just created.
//
// So these cases prove the gate has teeth in a throwaway repository, where a
// real .gitignore rule can be introduced and observed. Doing it in a temp repo
// rather than mutating this one is the same reasoning the other suites use:
// never dirty a tracked file to test a function.

const NODE = process.execPath;
const GIT = (args, cwd) =>
  execFileSync("git", args, { encoding: "utf8", cwd, stdio: ["ignore", "pipe", "ignore"] });

/**
 * Build a throwaway repo whose tests/ tree can be broken on purpose.
 *
 * The order of operations reproduces the real history, which is the whole
 * point. The suite is committed FIRST, while nothing ignores it; only then is
 * the .gitignore rule added. That is how 103 suites ended up tracked under a
 * `tests/*` rule: git keeps tracking a file it already has, so the rule was
 * invisible to every check that looked at `git ls-files`, and only bit the
 * NEXT test someone wrote.
 */
function makeRepo(gitignoreLines) {
  const dir = mkdtempSync(join(tmpdir(), "vitruvius-testscheck-"));
  GIT(["init", "-q"], dir);
  GIT(["config", "user.email", "t@example.com"], dir);
  GIT(["config", "user.name", "t"], dir);
  mkdirSync(join(dir, "tests", "unit"), { recursive: true });
  mkdirSync(join(dir, "scripts"), { recursive: true });
  writeFileSync(join(dir, "scripts", "tests-check.mjs"), readFileSync(new URL("../../scripts/tests-check.mjs", import.meta.url)));
  writeFileSync(join(dir, "tests", "unit", "a.test.mjs"), "export const a = 1;\n");
  // Commit the suite before any ignore rule exists — this is the "predates the
  // rule" state that made the original bug invisible.
  GIT(["add", "-A"], dir);
  GIT(["commit", "-qm", "base"], dir);
  // Then introduce the rule, which is what a later commit did here.
  if (gitignoreLines.length) {
    writeFileSync(join(dir, ".gitignore"), gitignoreLines.join("\n") + "\n");
    GIT(["add", ".gitignore"], dir);
    GIT(["commit", "-qm", "add ignore rule"], dir);
  }
  return dir;
}

const run = (dir) => {
  const r = spawnSync(NODE, [join(dir, "scripts", "tests-check.mjs")], { encoding: "utf8", cwd: dir });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
};

// --- 1. A clean repo passes -----------------------------------------------
{
  const dir = makeRepo([]);
  try {
    const r = run(dir);
    assert.equal(r.status, 0, `a repo with nothing ignored must pass:\n${r.out}`);
    assert.match(r.out, /PASS/, "and must say so");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// --- 2. The exact defect: `tests/*` must be caught ------------------------
// This is the regression. The rule looks harmless and hides the entire suite
// tree; every pre-existing file stays tracked, so the only symptom is that new
// files vanish.
{
  const dir = makeRepo(["tests/*"]);
  try {
    // The realistic shape of the original defect: an old suite already tracked,
    // a new one invisible. Both halves must be reported.
    writeFileSync(join(dir, "tests", "unit", "brand-new.test.mjs"), "export const b = 2;\n");
    const r = run(dir);
    assert.equal(r.status, 1, `tests/* must fail the gate:\n${r.out}`);
    assert.match(r.out, /is ignored/, "must report the ignored file");
    assert.match(r.out, /does not exist for/, "must say why an ignored test is a real problem");
    assert.match(r.out, /brand-new\.test\.mjs/, "must name the file that is hidden");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// --- 3. A NEW test under an ignoring rule is caught, not just old ones -----
// The original state was: existing suites tracked, new ones not. Checking only
// `git ls-files` would have passed, because the old files ARE listed.
{
  const dir = makeRepo(["tests/"]);
  try {
    writeFileSync(join(dir, "tests", "unit", "brand-new.test.mjs"), "export const b = 2;\n");
    const r = run(dir);
    assert.equal(r.status, 1, "a newly added test must be caught while older ones are fine");
    assert.match(r.out, /brand-new\.test\.mjs/, "must name the new file specifically");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// --- 4. The mirror case: on disk, untracked, never committed --------------
{
  const dir = makeRepo([]);
  try {
    writeFileSync(join(dir, "tests", "unit", "untracked.test.mjs"), "export const c = 3;\n");
    const r = run(dir);
    assert.equal(r.status, 1, "an untracked suite must fail — that is what a fresh clone would miss");
    assert.match(r.out, /not tracked by git/, "must distinguish this from the ignored case");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// --- 5. A declared exception is honoured ----------------------------------
// last-misses.txt is a real generated diagnostic. The gate must not make
// declaring one impossible, or the next person deletes the gate.
{
  const dir = makeRepo(["tests/routing/last-misses.txt"]);
  try {
    mkdirSync(join(dir, "tests", "routing"), { recursive: true });
    writeFileSync(join(dir, "tests", "routing", "last-misses.txt"), "diagnostic\n");
    // The fixture repo uses the real ALLOWED_IGNORED set, which names this path.
    const r = run(dir);
    assert.equal(r.status, 0, `the declared exception must be honoured:\n${r.out}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// --- 6. The real repo passes, and the gate is wired -----------------------
{
  const r = spawnSync(NODE, ["scripts/tests-check.mjs"], { encoding: "utf8" });
  assert.equal(r.status, 0, `this repository must pass its own gate:\n${r.stdout}\n${r.stderr}`);

  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.match(pkg.scripts.test, /scripts\/tests-check\.mjs/, "the gate must be in the npm test chain, not merely present");

  const gitignore = readFileSync(".gitignore", "utf8");
  assert.ok(
    !/^tests\/\*$/m.test(gitignore),
    "the bare `tests/*` rule must stay gone — it is what hid 103 suites from any new test",
  );
}

console.log(
  "PASS: a test hidden by .gitignore fails the gate, an untracked suite fails it, a " +
    "declared diagnostic exception is honoured, and this repository passes its own check",
);
