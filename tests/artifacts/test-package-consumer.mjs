import { strict as assert } from "node:assert";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("../..", import.meta.url)));
const temp = mkdtempSync(join(tmpdir(), "vitruvius-consumer-"));

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npmCli = process.env.npm_execpath;

// npm test exports npm_config_* (and friends) to lifecycle scripts. A child npm
// that inherits them can reject flags it did not receive. Strip them so the
// consumer install is hermetic.
const cleanEnv = { ...process.env };
for (const key of Object.keys(cleanEnv)) {
  if (/^npm_(config|package|lifecycle|command|execpath)/.test(key)) delete cleanEnv[key];
}

function run(command, args, cwd) {
  const options = { cwd, encoding: "utf8", env: cleanEnv };
  // Prefer npm's own JS entry when available (npm test sets npm_execpath), so
  // no shell is needed on Windows and no DEP0190 warning is emitted.
  if (npmCli) return spawnSync(process.execPath, [npmCli, ...args], options);
  return spawnSync(command, args, { ...options, shell: process.platform === "win32" });
}

function runNpm(args, cwd) {
  return run(npm, args, cwd);
}

function packEntry(stdout) {
  const parsed = JSON.parse(stdout);
  return Array.isArray(parsed) ? parsed[0] : Object.values(parsed)[0];
}

try {
  // 1. Pack the exact tarball under a size budget.
  const pack = runNpm(["pack", "--json", "--pack-destination", temp], root);
  assert.equal(pack.status, 0, pack.stderr);
  const entry = packEntry(pack.stdout);
  const tarball = join(temp, entry.filename);
  assert.ok(existsSync(tarball), "npm pack produced a tarball");
  assert.ok(entry.size < 2_000_000, `tarball stays under budget (${entry.size} bytes)`);

  // 2. The tarball carries the discovery surface: contract runtimes, canonical
  // role contracts, host adapters, references, and every skill.
  const files = entry.files.map((file) => file.path);
  for (const required of [
    "scripts/problem-anchor-contract.mjs",
    "scripts/goal-check-contract.mjs",
    "scripts/artifact-closure.mjs",
    "scripts/field-pilot-contract.mjs",
    "agents/verifier.md",
    "references/input-gate.md",
    "references/evidence-quality-tiers.md",
    ".opencode/command/vitruvius.md",
  ]) {
    assert.ok(files.includes(required), `tarball includes ${required}`);
  }
  const skillFiles = files.filter((path) => /^skills\/[^/]+\/SKILL\.md$/.test(path));
  assert.ok(skillFiles.length >= 25, `tarball includes every skill (${skillFiles.length})`);

  // 3. Install into a clean consumer. No required deps, optional dep omitted,
  // so this is offline and deterministic.
  writeFileSync(join(temp, "package.json"), JSON.stringify({ name: "consumer", private: true }));
  const install = runNpm(
    [
      "install",
      tarball,
      "--no-save",
      "--no-package-lock",
      "--omit=optional",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
    ],
    temp,
  );
  assert.equal(install.status, 0, install.stderr);

  const pkgDir = join(temp, "node_modules", "vitruvius");
  assert.ok(existsSync(pkgDir), "package installed into the clean consumer");

  // 4. The declared validator bins resolve inside the consumer, and one runs.
  const installed = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
  const bins = Object.entries(installed.bin);
  assert.ok(bins.length >= 4, `package exposes its validator bins (${bins.length})`);
  for (const [name, target] of bins) {
    assert.ok(existsSync(join(pkgDir, target)), `bin ${name} resolves to ${target}`);
  }

  const empty = join(temp, "empty-outputs");
  mkdirSync(empty, { recursive: true });
  const closure = spawnSync(
    process.execPath,
    [join(pkgDir, "scripts", "artifact-closure.mjs"), empty],
    { encoding: "utf8" },
  );
  assert.equal(closure.status, 0, closure.stderr);
  assert.match(closure.stdout, /PASS/);

  console.log(
    `PASS: package tarball (${entry.size} bytes, ${files.length} files) installs into a clean consumer and exposes ${bins.length} validator bins`,
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
