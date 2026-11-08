/**
 * test-security-scan-usability.mjs — a scan that read nothing must not pass.
 *
 * src-02's quality gate (#694) refuses an unusable report with exit 2 instead
 * of counting it clean ("a browser error page can otherwise look like a
 * successful accessibility scan"). Before the guard, walkFiles returning zero
 * files — a renamed skills/ directory, a broken checkout — fell through to
 * "PASS: No security issues found": a green run over nothing.
 *
 * Three layers: the guard's own contract, the CLI's exit-2 wiring proven by
 * running a copy of the scanner in a layout with no skills tree, and the real
 * tree still scanning clean.
 */

import { strict as assert } from "node:assert";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { assertUsableScan } from "../../scripts/security-scan.mjs";
import { makeTempDir, removeTempDir } from "../_support/temp-dir.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const scanner = join(repoRoot, "scripts", "security-scan.mjs");
const sandboxes = [];

try {
  // --- 1. The guard's contract -------------------------------------------
  assert.throws(
    () => assertUsableScan(0, 10),
    /the skills walk returned 0 file\(s\); refusing to report a clean scan over nothing/,
    "an empty skills walk must throw, not pass",
  );
  assert.throws(
    () => assertUsableScan(26, 0),
    /the runtime-script list holds 0 entry\(ies\); refusing to report a clean scan over nothing/,
    "an emptied runtime list must throw — the array can be edited to nothing too",
  );
  assert.throws(() => assertUsableScan(undefined, 10), /refusing to report a clean scan/);
  assert.throws(() => assertUsableScan(-1, 10), /refusing to report a clean scan/);
  assert.doesNotThrow(() => assertUsableScan(1, 1), "a minimal-but-real scan is usable");
  assert.doesNotThrow(() => assertUsableScan(143, 10));

  // --- 2. The CLI wiring: a copy with no skills tree exits 2, not PASS ----
  {
    const dir = makeTempDir("vitruvius-security-scan-empty-");
    sandboxes.push(dir);
    // Only the scanner and its one import: no skills/ tree, none of the ten
    // runtime scripts. The guard must fire before any of them is read.
    mkdirSync(join(dir, "scripts"), { recursive: true });
    copyFileSync(scanner, join(dir, "scripts", "security-scan.mjs"));
    copyFileSync(join(repoRoot, "scripts", "fs-walk.mjs"), join(dir, "scripts", "fs-walk.mjs"));

    const run = spawnSync(process.execPath, [join(dir, "scripts", "security-scan.mjs")], {
      encoding: "utf8",
      cwd: dir,
    });
    assert.equal(run.status, 2, `expected exit 2 (unusable), got ${run.status}:\n${run.stdout}\n${run.stderr}`);
    assert.ok(!run.stdout.includes("PASS"), `an unusable scan must not print PASS:\n${run.stdout}`);
    assert.match(run.stderr, /refusing to report a clean scan over nothing/);
  }

  // --- 3. The real tree is non-empty and still scans clean ---------------
  {
    const run = spawnSync(process.execPath, [scanner], { encoding: "utf8", cwd: repoRoot });
    assert.equal(run.status, 0, `real-tree scan must pass:\n${run.stdout}\n${run.stderr}`);
    assert.match(run.stdout, /PASS: No security issues found/);
    assert.ok(!run.stdout.includes("refusing to report"), "the real tree must not trip the usability guard");
  }

  console.log("PASS: security-scan refuses an empty walk (exit 2) and the real tree still passes");
} finally {
  for (const dir of sandboxes) removeTempDir(dir);
}
