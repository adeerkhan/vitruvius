/**
 * AP1 negative fixtures for the artifact-path guard.
 *
 * The real-repo run proves the current tree is canonical; these fixtures prove
 * the guard can fail on a drifted path and on a generic basename.
 */
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const validator = join(root, "scripts", "validate-artifact-paths.mjs");
const temp = mkdtempSync(join(tmpdir(), "vitruvius-artifact-paths-"));

function run(artifactRoot) {
  return spawnSync(process.execPath, [validator], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, VITRUVIUS_ARTIFACT_ROOT: artifactRoot },
  });
}

function write(rootDir, relativePath, text) {
  const path = join(rootDir, relativePath);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, text);
}

try {
  // The real repo is canonical.
  const real = spawnSync(process.execPath, [validator], { cwd: root, encoding: "utf8" });
  assert.equal(real.status, 0, real.stderr);
  assert.match(real.stdout, /PASS/);

  // A canonical fixture passes.
  const good = join(temp, "good");
  write(good, "AGENTS.md", "# Agents\nPlan: outputs/.plans/<slug>.md\nFinal: outputs/<slug>.md\nLedger: .runs/<run_id>.evidence.json\n");
  assert.equal(run(good).status, 0, "canonical paths pass");

  // A drifted path fails.
  const drifted = join(temp, "drifted");
  write(drifted, "AGENTS.md", "# Agents\nPlan: outputs/.plans/<slug>.md\nBad: outputs/weird/notes.txt\n");
  const drift = run(drifted);
  assert.notEqual(drift.status, 0);
  assert.match(drift.stderr, /outputs\/weird\/notes\.txt.*not a canonical artifact path/);

  // A generic basename fails.
  const generic = join(temp, "generic");
  write(generic, "AGENTS.md", "# Agents\nFinal: outputs/research.md\n");
  const genericResult = run(generic);
  assert.notEqual(genericResult.status, 0);
  assert.match(genericResult.stderr, /generic basename banned by AGENTS\.md/);

  console.log("PASS: artifact-path guard accepts canonical paths and refuses drift and generic names");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
