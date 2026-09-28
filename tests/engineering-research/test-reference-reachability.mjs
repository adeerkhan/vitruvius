import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = join(repoRoot, "scripts", "reference-reachability.mjs");

function run(args = []) {
  return spawnSync("node", [script, ...args], { encoding: "utf8" });
}

// --- Baseline: every reference is reachable -------------------------------
const clean = run();
assert.strictEqual(clean.status, 0, `baseline must pass, got: ${clean.stdout}${clean.stderr}`);
assert.match(clean.stdout, /24\/24 referenced/, `baseline must report 24/24, got: ${clean.stdout}`);

// --- The real corpus is walked, not a stub --------------------------------
assert.match(
  clean.stdout,
  /reference reachability: \d+\/24/,
  "the check must run against the real references/ corpus",
);

// --- An orphan must fail closed -------------------------------------------
// Move a live reference aside under a name nothing cites, and confirm the gate
// refuses. This is the whole point: a dead reference file must not pass.
const probeDir = mkdtempSync(join(tmpdir(), "ref-reach-"));
const orphanName = "zz-orphan-probe.md";
const orphanPath = join(repoRoot, "references", orphanName);
writeFileSync(orphanPath, "# Probe\n\nA file nothing cites.\n", "utf8");

const dirty = run();
assert.strictEqual(
  dirty.status,
  1,
  `an uncited reference must fail the gate, got exit ${dirty.status}: ${dirty.stdout}`,
);
assert.match(dirty.stdout, /UNREACHABLE/, "the failing file must be named");
assert.match(dirty.stdout, new RegExp(orphanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), "the orphan name must appear in the report");
assert.match(dirty.stderr, /dead file/, "the failure must explain why it matters");

// --- --allow waives it, and the waiver is reported -------------------------
const waived = run(["--allow", orphanName]);
assert.strictEqual(waived.status, 0, "--allow must turn the failure into a pass");
assert.match(waived.stdout, /waived/, "a waiver must be reported, not silently applied");

rmSync(probeDir, { recursive: true, force: true });
rmSync(orphanPath, { force: true });

// --- Removing the probe restores the baseline -----------------------------
const restored = run();
assert.strictEqual(restored.status, 0, "the corpus must return to green after cleanup");

// --- The waiver must not leak into a checked-in script ---------------------
// Ignore comments: the file documents `--allow <name>`, which is the intended
// usage, not a hardcoded waiver. What must not exist is a literal filename
// passed to --allow outside a comment.
const source = readFileSync(script, "utf8")
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("//"))
  .join("\n");
assert.doesNotMatch(
  source,
  /--allow\s+["']?[A-Za-z0-9_.-]+\.md/,
  "the script must not hardcode a waiver; waivers belong on the command line",
);

console.log("PASS: reference reachability gate passes on a wired tree and fails on an orphan");
