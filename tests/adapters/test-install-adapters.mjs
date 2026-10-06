/**
 * test-install-adapters.mjs — the installer produces a complete, byte-exact tree.
 *
 * Vitruvius commits only authored host files and renders the rest at install
 * time. This suite runs installer/install.mjs into a temp project and
 * proves: the generated output matches a direct render byte-for-byte, the
 * authored files are copied exactly, the install is idempotent, `--host`
 * selects a subset, and an unknown host is a hard error.
 *
 * Usage: node tests/adapters/test-install-adapters.mjs
 * Exit 1 on any failure.
 */

import { strict as assert } from "node:assert";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { hosts } from "../../installer/contract.mjs";
import { renderAdapters } from "../../installer/render.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const installer = join(root, "installer", "install.mjs");

const run = (args) => spawnSync(process.execPath, [installer, ...args], { cwd: root, encoding: "utf-8" });

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// A source tree whose every file byte-matches the installed copy.
function assertTreeCopied(from, to, label) {
  const stats = statSync(from);
  if (stats.isDirectory()) {
    assert.ok(existsSync(to), `${label}: ${to} must exist`);
    for (const file of walk(from)) {
      const rel = file.slice(from.length + 1);
      const installed = join(to, rel);
      assert.ok(existsSync(installed), `${label}: expected ${rel} under ${to}`);
      assert.equal(
        readFileSync(installed, "utf-8"),
        readFileSync(file, "utf-8"),
        `${label}: ${rel} must be byte-identical`,
      );
    }
  } else {
    assert.ok(existsSync(to), `${label}: ${to} must exist`);
    assert.equal(readFileSync(to, "utf-8"), readFileSync(from, "utf-8"), `${label}: ${to} must be byte-identical`);
  }
}

const temp = mkdtempSync(join(tmpdir(), "vitruvius-install-"));
const reference = mkdtempSync(join(tmpdir(), "vitruvius-render-"));
try {
  // 1. Every authored source named by the install map exists in the repository.
  for (const host of hosts) {
    for (const entry of host.copy ?? []) {
      assert.ok(existsSync(join(root, entry.from)), `${host.id}: missing authored source ${entry.from}`);
    }
  }

  // 2. A full install succeeds.
  const install = run(["--target", temp, "--all"]);
  assert.equal(install.status, 0, `install must succeed: ${install.stderr}`);

  // 3. Generated output is byte-identical to a direct render.
  renderAdapters({ targetRoot: reference });
  for (const file of walk(reference)) {
    const rel = file.slice(reference.length + 1);
    const installed = join(temp, rel);
    assert.ok(existsSync(installed), `installer output is missing ${rel}`);
    assert.equal(readFileSync(installed, "utf-8"), readFileSync(file, "utf-8"), `generated ${rel} must match a direct render`);
  }

  // 4. Authored files are copied exactly.
  for (const host of hosts) {
    for (const entry of host.copy ?? []) {
      assertTreeCopied(join(root, entry.from), join(temp, entry.to), `${host.id} ${entry.to}`);
    }
  }

  // 5. Re-running over an existing install is idempotent.
  const again = run(["--target", temp, "--all"]);
  assert.equal(again.status, 0, `re-install must succeed: ${again.stderr}`);
  assert.equal(
    readFileSync(join(temp, ".opencode", "command", "vitruvius.md"), "utf-8"),
    readFileSync(join(reference, ".opencode", "command", "vitruvius.md"), "utf-8"),
  );

  // 6. `--host` installs only the named host.
  const subset = mkdtempSync(join(tmpdir(), "vitruvius-install-one-"));
  try {
    const one = run(["--target", subset, "--host", "opencode"]);
    assert.equal(one.status, 0, one.stderr);
    assert.ok(existsSync(join(subset, ".opencode", "agent")), "--host opencode installs .opencode/agent");
    assert.ok(existsSync(join(subset, ".opencode", "command", "vitruvius.md")), "--host opencode installs commands");
    assert.ok(existsSync(join(subset, ".opencode", "plugins", "vitruvius.mjs")), "--host opencode installs the plugin");
    assert.ok(!existsSync(join(subset, ".cursor")), "--host opencode must not install .cursor");
  } finally {
    rmSync(subset, { recursive: true, force: true });
  }

  // 7. An unknown host is a hard error, not a silent no-op.
  const unknown = run(["--target", temp, "--host", "not-a-host"]);
  assert.notEqual(unknown.status, 0, "an unknown --host must fail");
  assert.match(`${unknown.stdout}\n${unknown.stderr}`, /Unknown host/);

  // 8. `--global` copies the skills bundle and ruleset into each harness's
  // global config root, honoring the host's env override.
  const fakeHome = mkdtempSync(join(tmpdir(), "vitruvius-home-"));
  try {
    const env = {
      ...process.env,
      HOME: fakeHome,
      USERPROFILE: fakeHome,
      XDG_CONFIG_HOME: join(fakeHome, ".config"),
    };
    for (const key of [
      "CLAUDE_CONFIG_DIR",
      "CODEX_HOME",
      "PRIME_AGENT_CODING_AGENT_DIR",
      "PI_CODING_AGENT_DIR",
      "DSH_HOME",
      "HERMES_HOME",
      "GROK_HOME",
      "REASONIX_HOME",
    ]) {
      delete env[key];
    }
    const runGlobal = (args, extraEnv = env) =>
      spawnSync(process.execPath, [installer, ...args], { cwd: root, encoding: "utf-8", env: extraEnv });

    const global = runGlobal(["--global", "--host", "hermes", "--host", "deepseek", "--host", "opencode"]);
    assert.equal(global.status, 0, `--global must succeed: ${global.stderr}`);

    const skillDirs = readdirSync(join(root, "skills"), { withFileTypes: true }).filter((e) => e.isDirectory()).length;
    for (const rel of [".hermes/skills", ".dsh/skills", ".config/opencode/skills"]) {
      const dest = join(fakeHome, rel, "vitruvius");
      assert.ok(existsSync(join(dest, "verifier", "SKILL.md")), `${rel}/vitruvius/verifier/SKILL.md`);
      assert.ok(existsSync(join(dest, "host-rules.md")), `${rel}/vitruvius/host-rules.md`);
      const copied = readdirSync(dest, { withFileTypes: true }).filter((e) => e.isDirectory()).length;
      assert.equal(copied, skillDirs, `${rel}/vitruvius carries every skill`);
    }

    // An env override replaces the home fallback.
    const overrideRoot = join(fakeHome, "dsh-custom");
    const overridden = runGlobal(["--global", "--host", "deepseek"], { ...env, DSH_HOME: overrideRoot });
    assert.equal(overridden.status, 0, overridden.stderr);
    assert.ok(
      existsSync(join(overrideRoot, "skills", "vitruvius", "verifier", "SKILL.md")),
      "DSH_HOME override must be honored",
    );

    // A project-only host has no global root and must fail, not silently no-op.
    const bad = runGlobal(["--global", "--host", "cursor"]);
    assert.notEqual(bad.status, 0, "a project-only host must fail in --global mode");
    assert.match(`${bad.stdout}\n${bad.stderr}`, /Unknown global host/);
  } finally {
    rmSync(fakeHome, { recursive: true, force: true });
  }

  console.log(
    `PASS: ${hosts.length} host(s) install byte-exactly into a target project from authored sources + the contract`,
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
  rmSync(reference, { recursive: true, force: true });
}
