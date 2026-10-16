import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { writeFileSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = join(repoRoot, "scripts", "reference-reachability.mjs");

function run(args = []) {
  return spawnSync("node", [script, ...args], { encoding: "utf8" });
}

// The expected count comes from the live corpus, not a pinned number. A pinned
// "24/24" rotted when the corpus grew to 26, and nothing noticed because this
// suite was in no default runner; a count read from disk cannot drift.
const corpusSize = readdirSync(join(repoRoot, "references")).filter((f) => f.endsWith(".md")).length;

// --- Baseline: every reference is reachable -------------------------------
const clean = run();
assert.strictEqual(clean.status, 0, `baseline must pass, got: ${clean.stdout}${clean.stderr}`);
assert.match(
  clean.stdout,
  new RegExp(`${corpusSize}/${corpusSize} referenced`),
  `baseline must report ${corpusSize}/${corpusSize}, got: ${clean.stdout}`,
);

// --- The real corpus is walked, not a stub --------------------------------
assert.match(
  clean.stdout,
  new RegExp(`reference reachability: \\d+/${corpusSize}`),
  "the check must run against the real references/ corpus",
);

// --- An orphan must fail closed -------------------------------------------
// Add a file nothing cites, and confirm the gate refuses. This is the whole
// point: a dead reference file must not pass. The probe is removed in a
// `finally` so a failing assertion cannot leave the tree dirty — an orphan
// left behind would poison every later run of the gate.
const orphanName = "zz-orphan-probe.md";
const orphanPath = join(repoRoot, "references", orphanName);
try {
  writeFileSync(orphanPath, "# Probe\n\nA file nothing cites.\n", "utf8");

  const dirty = run();
  assert.strictEqual(
    dirty.status,
    1,
    `an uncited reference must fail the gate, got exit ${dirty.status}: ${dirty.stdout}`,
  );
  assert.match(dirty.stdout, /UNREACHABLE/, "the failing file must be named");
  assert.match(
    dirty.stdout,
    new RegExp(orphanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    "the orphan name must appear in the report",
  );
  assert.match(dirty.stderr, /dead file/, "the failure must explain why it matters");

  // --- --allow waives it, and the waiver is reported ---------------------
  const waived = run(["--allow", orphanName]);
  assert.strictEqual(waived.status, 0, "--allow must turn the failure into a pass");
  assert.match(waived.stdout, /waived/, "a waiver must be reported, not silently applied");
} finally {
  rmSync(orphanPath, { force: true });
}

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
