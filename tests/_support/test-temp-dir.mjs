import { strict as assert } from "node:assert";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { makeTempDir, removeTempDir, withTempDir } from "./temp-dir.mjs";

// The cleanup contract the 44 hand-rolled preludes each re-implemented:
// recursive, forced, and guaranteed even when the body throws.

// --- withTempDir returns the body's value and cleans up on success --------
{
  let seen = null;
  const value = withTempDir("vitruvius-temp-dir-", (dir) => {
    seen = dir;
    writeFileSync(join(dir, "file.txt"), "x");
    return "result";
  });
  assert.equal(value, "result", "withTempDir must return the callback's value");
  assert.ok(seen && existsSync(seen) === false, "the directory must be gone after success");
}

// --- withTempDir cleans up when the body throws ---------------------------
{
  let seen = null;
  assert.throws(
    () =>
      withTempDir("vitruvius-temp-dir-", (dir) => {
        seen = dir;
        throw new Error("boom");
      }),
    /boom/,
    "the body's error must propagate",
  );
  assert.ok(seen && existsSync(seen) === false, "the directory must be gone after a throw");
}

// --- makeTempDir / removeTempDir for suites that need a longer lifetime ---
{
  const dir = makeTempDir("vitruvius-temp-dir-");
  assert.ok(existsSync(dir), "makeTempDir must create the directory");
  writeFileSync(join(dir, "keep.txt"), "x");
  removeTempDir(dir);
  assert.equal(existsSync(dir), false, "removeTempDir must remove it with contents");
  removeTempDir(dir); // force: a second removal must not throw
}

console.log("PASS: temp-dir helper cleans up on success, on throw, and on a forced second removal");
