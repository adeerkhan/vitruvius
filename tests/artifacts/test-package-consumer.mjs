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

  // 5. The re-export shims must resolve INSIDE the installed package.
  //
  // scripts/verifier-parser.mjs is a one-line `export * from
  // '../skills/proposal/scripts/...'`. It works in the repo and breaks silently
  // in the tarball if `skills/` is ever trimmed from package.json#files, and it
  // is what scripts/benchmark-scoring.mjs imports. Nothing imported it from the
  // installed package, so that break would ship. Import it for real, by path,
  // from the consumer's copy.
  const shim = join(pkgDir, "scripts", "verifier-parser.mjs");
  assert.ok(existsSync(shim), `tarball ships ${shim.split(/[\\/]/).slice(-2).join("/")}`);
  // A probe file rather than `-e`: on Windows a dynamic import of an absolute
  // path needs a file:// URL, and pathToFileURL is the only correct way to build
  // one. Inlining it into a shell string is how this ended up wrong first time.
  const probe = join(temp, "probe-shim.mjs");
  writeFileSync(
    probe,
    `import { pathToFileURL } from "node:url";
const m = await import(pathToFileURL(${JSON.stringify(shim)}).href);
const names = Object.keys(m).sort();
if (!names.includes("parseMachineVerdict")) {
  console.error("missing parseMachineVerdict; exports: " + names.join(","));
  process.exit(1);
}
console.log("ok:" + names.length);
`,
    "utf8",
  );
  const importShim = spawnSync(process.execPath, [probe], { encoding: "utf8", cwd: temp });
  assert.equal(
    importShim.status,
    0,
    `the published re-export shim must resolve inside the installed package; it imports from ` +
      `skills/, so a trimmed tarball would ship a broken module: ${importShim.stderr}`,
  );
  assert.match(importShim.stdout, /^ok:\d+/m, "the shim must export a usable surface");

  console.log(
    `PASS: package tarball (${entry.size} bytes, ${files.length} files) installs into a clean consumer, ` +
      `exposes ${bins.length} validator bins, and its re-export shims resolve inside the install`,
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
