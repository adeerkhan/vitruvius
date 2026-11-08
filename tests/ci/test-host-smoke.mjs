import { strict as assert } from "node:assert";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { makeTempDir, removeTempDir } from "../_support/temp-dir.mjs";

// The host-smoke tier: install the real adapters into a throwaway project and
// validate what landed. The failure half is the point — a smoke whose failure
// leaves no bundle cannot be debugged after the runner is gone, and a bundle
// that cannot be replayed cannot confirm or refute the failure.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const smoke = join(repoRoot, "scripts", "host-smoke.mjs");

function run(args = []) {
  return spawnSync(process.execPath, [smoke, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 120000,
  });
}

function findFirst(dir, suffix) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findFirst(abs, suffix);
      if (found) return found;
    } else if (entry.name.endsWith(suffix)) {
      return abs;
    }
  }
  return null;
}

function makeBundle(target) {
  const bundle = makeTempDir("vitruvius-host-smoke-bundle-");
  cpSync(target, join(bundle, "installed"), { recursive: true });
  return bundle;
}

// --- 1. The real adapters install and validate ----------------------------
{
  const target = makeTempDir("vitruvius-host-smoke-ok-");
  try {
    const result = run(["--target", target, "--keep"]);
    assert.equal(result.status, 0, `the installed adapters must validate:\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout ?? "", /PASS: every host adapter installs/);
    assert.ok(existsSync(join(target, ".opencode")), "the target must contain installed hosts");
  } finally {
    removeTempDir(target);
  }
}

// --- 2. A failure preserves stdout, stderr, exit, and the installed tree --
// A genuine install failure: the target path is a FILE, so the installer
// cannot create a directory there.
{
  const dir = makeTempDir("vitruvius-host-smoke-fail-");
  const brokenTarget = join(dir, "not-a-directory");
  writeFileSync(brokenTarget, "x");
  try {
    const result = run(["--target", brokenTarget]);
    assert.equal(result.status, 1, "a failed install must exit 1");
    const match = /Failure bundle preserved: (.+)/.exec(result.stdout ?? "");
    assert.ok(match, `the failure must name its bundle:\n${result.stdout}\n${result.stderr}`);

    const bundle = match[1].trim();
    for (const file of ["summary.json", "exit.json", "stdout.txt", "stderr.txt", "installed-manifest.json"]) {
      assert.ok(existsSync(join(bundle, file)), `the bundle must preserve ${file}`);
    }
    const exit = JSON.parse(readFileSync(join(bundle, "exit.json"), "utf8"));
    assert.equal(exit.status, 1);
    assert.equal(exit.failed_step, "install");
    const summary = JSON.parse(readFileSync(join(bundle, "summary.json"), "utf8"));
    assert.equal(summary.steps.at(-1).status, 1, "the summary must record the failing step");
  } finally {
    removeTempDir(dir);
  }
}

// --- 3. A preserved bundle replays, and still fails for the same reason ---
{
  const target = makeTempDir("vitruvius-host-smoke-replay-");
  try {
    assert.equal(run(["--target", target, "--keep"]).status, 0, "the pristine install must pass");
    const bundle = makeBundle(target);
    try {
      const pristine = run(["--replay", bundle]);
      assert.equal(pristine.status, 0, `a pristine bundle must replay clean:\n${pristine.stdout}\n${pristine.stderr}`);

      const jsonFile = findFirst(join(bundle, "installed"), ".json");
      assert.ok(jsonFile, "the installed tree must contain json files");
      writeFileSync(jsonFile, "{ not json");
      const broken = run(["--replay", bundle]);
      assert.equal(broken.status, 1, "a corrupted preserved tree must replay as failing");
      assert.match(broken.stdout ?? "", /FAIL: the preserved tree still fails/);
    } finally {
      removeTempDir(bundle);
    }
  } finally {
    removeTempDir(target);
  }
}

// --- 4. A null frontmatter value is caught ---------------------------------
// The adapter bug that shipped: `tools:` alone, valid to a delimiter check and
// rejected by the host as null.
{
  const target = makeTempDir("vitruvius-host-smoke-null-");
  try {
    assert.equal(run(["--target", target, "--keep"]).status, 0);
    const bundle = makeBundle(target);
    try {
      const agent = join(bundle, "installed", ".opencode", "agent", "researcher.md");
      assert.ok(existsSync(agent), "the installed tree must contain the opencode agent");
      writeFileSync(agent, "---\nname: researcher\ndescription: x\ntools:\n---\nbody\n");
      const result = run(["--replay", bundle]);
      assert.equal(result.status, 1, "a null frontmatter value must fail the smoke");
      assert.match(result.stdout ?? "", /frontmatter key "tools" has a null value/);
    } finally {
      removeTempDir(bundle);
    }
  } finally {
    removeTempDir(target);
  }
}

// --- 5. The tier is reachable from an npm script --------------------------
{
  const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  assert.ok(
    Object.values(pkg.scripts).some((body) => body.includes("scripts/host-smoke.mjs")),
    "the host-smoke tier must be reachable from an npm script",
  );
}

console.log("PASS: host smoke installs and validates adapters; failures preserve a bundle that replays");
