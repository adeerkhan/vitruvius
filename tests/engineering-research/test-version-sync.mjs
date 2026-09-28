import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// package.json and plugin.json versions must match
const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8"));
const manifestPath = join(repoRoot, ".claude-plugin", "plugin.json");

assert.ok(existsSync(manifestPath), ".claude-plugin/plugin.json must exist");
const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

assert.strictEqual(
  manifest.version,
  pkg.version,
  `plugin.json version ${manifest.version} must match package.json version ${pkg.version}`,
);

console.log("PASS: plugin.json version matches package.json version");
