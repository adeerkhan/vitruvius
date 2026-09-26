import { strict as assert } from "node:assert";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { checkHostDiscovery } from "../../scripts/host-discovery-smoke.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = join(root, "scripts", "host-discovery-smoke.mjs");
const temp = mkdtempSync(join(tmpdir(), "vitruvius-host-smoke-"));

try {
  // The real repo discovers every surface.
  const real = spawnSync(process.execPath, [script], { cwd: root, encoding: "utf8" });
  assert.equal(real.status, 0, real.stderr);
  assert.match(real.stdout, /PASS: host discovery smoke/);
  assert.deepEqual(checkHostDiscovery({ root }), []);

  // An empty root fails discovery on every host surface.
  const emptyRoot = join(temp, "empty");
  mkdirSync(emptyRoot, { recursive: true });
  const problems = checkHostDiscovery({ root: emptyRoot });
  assert.ok(problems.some((problem) => /skills\/ directory is missing/.test(problem)));
  assert.ok(problems.some((problem) => /\.opencode\/command is missing/.test(problem)));
  assert.ok(problems.some((problem) => /\.clinerules\/vitruvius\.md is missing/.test(problem)));

  // Failure preserves a bundle with the exact problems.
  const bundleDir = join(temp, "bundle");
  const failed = spawnSync(process.execPath, [script, "--root", emptyRoot, "--out", bundleDir], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /bundle at/);
  const report = JSON.parse(readFileSync(join(bundleDir, "report.json"), "utf8"));
  assert.equal(report.problemCount, problems.length);
  assert.ok(report.problems.some((problem) => /skills\/ directory is missing/.test(problem)));
  assert.ok(existsSync(join(bundleDir, "report.md")));

  console.log("PASS: host-discovery smoke passes on the repo and bundles exact failures off it");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
