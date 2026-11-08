import { strict as assert } from "node:assert";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { makeTempDir, removeTempDir } from "../_support/temp-dir.mjs";

// The host-smoke tier: install the real adapters into a throwaway project and
// validate what landed. The failure half is the point — a smoke whose failure
// leaves no bundle cannot be debugged after the runner is gone.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const smoke = join(repoRoot, "scripts", "host-smoke.mjs");

function run(args = []) {
  return spawnSync(process.execPath, [smoke, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 120000,
  });
}

// --- 1. The real adapters install and validate ----------------------------
{
  const target = makeTempDir("vitruvius-host-smoke-ok-");
  try {
    const result = run(["--target", target, "--keep"]);
    assert.equal(result.status, 0, `the installed adapters must validate:\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout ?? "", /PASS: every host adapter installs/);
    // The runner removes its throwaway tree on success: no state left behind.
    // With --target the caller owns it, so validate the tree, then let the
    // helper remove it below.
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

// --- 3. The tier is reachable from an npm script --------------------------
{
  const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  assert.ok(
    Object.values(pkg.scripts).some((body) => body.includes("scripts/host-smoke.mjs")),
    "the host-smoke tier must be reachable from an npm script",
  );
}

console.log("PASS: host smoke installs and validates adapters, and a failure preserves the full bundle");
