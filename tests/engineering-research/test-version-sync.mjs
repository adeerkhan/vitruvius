import { strict as assert } from "node:assert";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// Every plugin manifest must agree with package.json on name and version.
//
// This test used to read ONE hardcoded path, `.claude-plugin/plugin.json`.
// `.qoder-plugin/plugin.json` sat next to it carrying the same version and
// nothing checked it — so a version bump that missed it would ship two
// manifests disagreeing, and the build would stay green. That is the failure
// the src-06 validator (src-06 scripts/validate-package.py:61) is
// built to prevent, and it hardcodes its four files only because that repo
// knows it will never have a fifth.
//
// Here the set is DISCOVERED, so a new host manifest is covered the day it is
// added rather than the day someone remembers to extend this list. The failure
// mode of the old version was a check that could not see a file that existed.

const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8"));

// Top-level dot-directories that carry a plugin manifest. `ref/` and
// `node_modules/` hold other projects' manifests and are not ours.
const manifests = readdirSync(repoRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.endsWith("-plugin"))
  .filter((entry) => entry.name !== "ref" && entry.name !== "node_modules")
  .map((entry) => ({
    dir: entry.name,
    path: join(repoRoot, entry.name, "plugin.json"),
  }))
  .filter((m) => existsSync(m.path));

// A discovery check that finds nothing passes vacuously. Require the two that
// exist today, so an empty or mis-scoped glob is a failure here, not silence.
assert.ok(
  manifests.length >= 2,
  `expected at least 2 plugin manifests at the repo root, found ${manifests.length} ` +
    `(${manifests.map((m) => m.dir).join(", ") || "none"}) — the discovery is broken if this is 0`,
);

for (const { dir, path } of manifests) {
  const manifest = JSON.parse(readFileSync(path, "utf-8"));

  assert.strictEqual(
    manifest.name,
    pkg.name,
    `${dir}/plugin.json name "${manifest.name}" must match package.json name "${pkg.name}"`,
  );

  assert.strictEqual(
    manifest.version,
    pkg.version,
    `${dir}/plugin.json version ${manifest.version} must match package.json version ${pkg.version}`,
  );
}

// The specific manifest this test used to check by name, asserted directly so a
// refactor that stops shipping it fails loudly rather than by omission.
const claudeManifestPath = join(repoRoot, ".claude-plugin", "plugin.json");
assert.ok(existsSync(claudeManifestPath), ".claude-plugin/plugin.json must exist");

console.log(
  `PASS: ${manifests.length} plugin manifest(s) match package.json on name and version ` +
    `(${manifests.map((m) => m.dir).join(", ")})`,
);
