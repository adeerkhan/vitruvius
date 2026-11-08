#!/usr/bin/env node
// host-smoke.mjs — install every host adapter into a throwaway project and
// validate what landed. On failure, preserve the whole bundle.
//
// The gap this closes: before this, a broken adapter was found by a user's
// host refusing to load it (the empty `tools:` bug) or by reading a diff.
// There was no tier that installed the real output and looked at it, and no
// failure artifact to debug from when a smoke fails on CI — the earlier note
// in notes/STEAL.md recorded exactly that.
//
// Steps, each captured with stdout, stderr and exit code:
//   1. install   — node installer/install.mjs --target <tmp> --all
//   2. json      — every generated .json parses
//   3. syntax    — every generated .mjs passes `node --check`
//   4. frontmatter — every generated .md with --- opens and closes it
//
// On success the throwaway tree is deleted. On failure it is copied into
// outputs/.host-smoke/<timestamp>/installed/ beside stdout.txt, stderr.txt,
// exit.json and summary.json, so the failing state can be inspected after the
// runner is gone.
//
// Usage:
//   node scripts/host-smoke.mjs [--target <dir>] [--keep] [--json]
//     --target  install into this directory (default: a new temp directory)
//     --keep    keep the throwaway tree even on success

import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INSTALLER = join(REPO_ROOT, "installer", "install.mjs");

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
};
const flag = (name) => argv.includes(`--${name}`);

function walk(dir, predicate) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs, predicate));
    else if (predicate(abs)) out.push(abs);
  }
  return out;
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const bundleDir = join(REPO_ROOT, "outputs", ".host-smoke", timestamp);
const target = opt("target", join(tmpdir(), `vitruvius-host-smoke-${process.pid}`));
const keep = flag("keep");

const steps = [];
function record(name, stdout, stderr, status, extra = {}) {
  steps.push({ name, status, stdout_bytes: Buffer.byteLength(stdout ?? "", "utf8"), stderr_bytes: Buffer.byteLength(stderr ?? "", "utf8"), ...extra });
  return status === 0;
}

function runStep(name, fn) {
  const started = Date.now();
  try {
    const stdout = fn();
    const ok = record(name, stdout ?? "", "", 0, { wall_ms: Date.now() - started });
    console.log(`  ${ok ? "ok  " : "FAIL"} ${name}`);
    return ok;
  } catch (error) {
    record(name, "", String(error?.message ?? error), 1, { wall_ms: Date.now() - started });
    console.log(`  FAIL ${name}: ${error?.message ?? error}`);
    return false;
  }
}

function preserveBundle() {
  mkdirSync(bundleDir, { recursive: true });
  writeFileSync(join(bundleDir, "summary.json"), JSON.stringify({ target, timestamp, steps }, null, 2) + "\n");
  writeFileSync(join(bundleDir, "exit.json"), JSON.stringify({ status: 1, failed_step: steps.at(-1)?.name ?? null }, null, 2) + "\n");
  writeFileSync(join(bundleDir, "stdout.txt"), steps.map((s) => `${s.name}\n${s.stdout ?? ""}`).join("\n"));
  writeFileSync(join(bundleDir, "stderr.txt"), steps.map((s) => `${s.name}\n${s.stderr ?? ""}`).join("\n"));
  const targetIsDir = existsSync(target) && statSync(target).isDirectory();
  if (targetIsDir) {
    cpSync(target, join(bundleDir, "installed"), { recursive: true });
  }
  // A manifest makes the preserved tree auditable without diffing it.
  const files = targetIsDir ? walk(target, () => true) : [];
  writeFileSync(
    join(bundleDir, "installed-manifest.json"),
    JSON.stringify(
      files.map((abs) => ({
        path: relative(target, abs).split("\\").join("/"),
        bytes: statSync(abs).size,
        sha256: createHash("sha256").update(readFileSync(abs)).digest("hex"),
      })),
      null,
      2,
    ) + "\n",
  );
  console.log(`\nFailure bundle preserved: ${bundleDir}`);
}

function validateJsonTree(root) {
  const files = walk(root, (f) => f.endsWith(".json"));
  for (const file of files) JSON.parse(readFileSync(file, "utf8"));
  return `${files.length} json file(s) parsed`;
}

function validateSyntaxTree(root) {
  const files = walk(root, (f) => f.endsWith(".mjs"));
  for (const file of files) {
    const check = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (check.status !== 0) throw new Error(`${relative(root, file)}: ${(check.stderr ?? "").split("\n")[0]}`);
  }
  return `${files.length} module(s) passed node --check`;
}

function validateFrontmatterTree(root) {
  const files = walk(root, (f) => f.endsWith(".md"));
  let checked = 0;
  for (const file of files) {
    const lines = readFileSync(file, "utf8").split("\n");
    if (lines[0] !== "---") continue;
    const close = lines.slice(1, 60).indexOf("---");
    if (close === -1) throw new Error(`${relative(root, file)}: frontmatter never closes`);
    // A `key:` with nothing after it is YAML null unless the NEXT line is an
    // indented block. The adapter bug this catches rendered `tools:` alone:
    // valid-looking to a delimiter check, rejected by the host as null.
    for (let i = 1; i <= close; i++) {
      const match = /^([A-Za-z0-9_-]+):\s*$/.exec(lines[i]);
      if (!match) continue;
      const next = lines[i + 1] ?? "";
      if (next.startsWith(" ") || next.startsWith("\t")) continue; // nested block
      throw new Error(`${relative(root, file)}: frontmatter key "${match[1]}" has a null value`);
    }
    checked++;
  }
  return `${checked} frontmatter block(s) valid`;
}

function runValidation(root) {
  return (
    runStep("json", () => validateJsonTree(root)) &&
    runStep("syntax", () => validateSyntaxTree(root)) &&
    runStep("frontmatter", () => validateFrontmatterTree(root))
  );
}

function main() {
  const replay = opt("replay", null);
  if (replay) {
    const installed = join(resolve(replay), "installed");
    if (!existsSync(installed)) {
      console.error(`replay: ${installed} does not exist — not a preserved bundle`);
      return 2;
    }
    console.log(`host-smoke: replaying ${installed}`);
    const ok = runValidation(installed);
    console.log(ok ? "\nPASS: the preserved tree validates" : "\nFAIL: the preserved tree still fails");
    return ok ? 0 : 1;
  }

  console.log(`host-smoke: installing into ${target}`);
  const install = spawnSync(process.execPath, [INSTALLER, "--target", target, "--all"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  const installOk = record("install", install.stdout ?? "", install.stderr ?? "", install.status ?? 1);
  console.log(`  ${installOk ? "ok  " : "FAIL"} install`);
  if (!installOk) {
    preserveBundle();
    return 1;
  }

  const ok = runValidation(target);

  if (!ok) {
    preserveBundle();
    return 1;
  }

  if (!keep) rmSync(target, { recursive: true, force: true });
  else console.log(`kept installed tree: ${target}`);
  console.log("\nPASS: every host adapter installs, parses, and compiles in a throwaway project");
  return 0;
}

const code = main();
if (flag("json")) console.log(JSON.stringify({ steps }, null, 2));
process.exit(code);
