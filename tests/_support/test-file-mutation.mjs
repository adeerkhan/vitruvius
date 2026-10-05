import { strict as assert } from "node:assert";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { writeDurable, installRestoreGuard } from "./file-mutation.mjs";

// Tests for the durable-write / restore-guard helper that the four mutation
// harnesses depend on. The bug it fixes is a transient Windows file lock that
// a bare writeFileSync turns into a thrown error and a mutated tracked file.
// An intermittent bug needs a test that reproduces the mechanism, not one that
// merely observes a green suite, so this spins up a real exclusive OS lock.

const HERE = dirname(fileURLToPath(import.meta.url));
const HELPER_URL = new URL("./file-mutation.mjs", import.meta.url).href;

const dir = mkdtempSync(join(tmpdir(), "vitruvius-file-mutation-"));
const target = join(dir, "doc.md");
writeFileSync(target, "original\n", "utf8");

try {
  // 1. A durable write lands exact bytes and leaves no temp file behind.
  writeDurable(target, "changed\n");
  assert.equal(readFileSync(target, "utf8"), "changed\n", "writeDurable must write exact bytes");
  assert.ok(!existsSync(`${target}.mutation-tmp`), "writeDurable must not leave a temp file");
  assert.deepEqual(readdirSync(dir).sort(), ["doc.md"], "writeDurable must leave no stray files");
  console.log("  durable write: exact bytes, no temp residue");

  // 2. The restore guard restores on process exit even when nothing else does.
  //    Run it in a child so the parent can read the file after the child exits.
  const childScript = join(dir, "child.mjs");
  writeFileSync(
    childScript,
    [
      `import { readFileSync } from "node:fs";`,
      `import { writeDurable, installRestoreGuard } from ${JSON.stringify(HELPER_URL)};`,
      `const target = ${JSON.stringify(target)};`,
      `const snapshot = new Map([[target, readFileSync(target, "utf8")]]);`,
      `installRestoreGuard(snapshot, { label: "test file" });`,
      `writeDurable(target, "mutated by child\\n");`,
      `// Exit WITHOUT restoring — the guard must put it back.`,
      ``,
    ].join("\n"),
    "utf8",
  );
  const child = spawnSync(process.execPath, [childScript], { encoding: "utf8" });
  assert.equal(child.status, 0, `child must exit cleanly: ${child.stderr}`);
  assert.equal(
    readFileSync(target, "utf8"),
    "changed\n",
    "the exit guard must restore the file the child mutated",
  );
  console.log("  restore guard: file restored on process exit");

  // 3. Recover from a real exclusive OS lock. Windows-only: it is the platform
  //    the flake occurs on, and the lock is a Win32 FileShare mode. A portable
  //    in-process simulation would not prove the same thing.
  if (process.platform === "win32") {
    const ready = join(dir, "locked.ready");
    const psTarget = target.replace(/'/g, "''");
    const psReady = ready.replace(/'/g, "''");
    const locker = spawn("powershell", [
      "-NoProfile",
      "-Command",
      `$f=[System.IO.File]::Open('${psTarget}',[System.IO.FileMode]::Open,[System.IO.FileAccess]::ReadWrite,[System.IO.FileShare]::None);` +
        ` [System.IO.File]::WriteAllText('${psReady}','1'); Start-Sleep -Milliseconds 700; $f.Close()`,
    ]);

    const waitUntil = Date.now() + 8000;
    while (!existsSync(ready) && Date.now() < waitUntil) {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25);
    }
    assert.ok(existsSync(ready), "the locker process must acquire the exclusive lock");

    // Prove the lock is real. If a bare write succeeds here, the lock is not
    // exclusive and the recovery assertion below would pass for the wrong
    // reason — a vacuous test, which is the failure this repo keeps eliminating.
    let bareWriteBlocked = false;
    try {
      writeFileSync(target, "bare\n", "utf8");
    } catch {
      bareWriteBlocked = true;
    }
    assert.ok(
      bareWriteBlocked,
      "the exclusive lock must block a bare writeFileSync, or this test proves nothing",
    );

    // The lock is held for ~700ms. A bare writeFileSync throws here; the
    // durable writer must retry until the lock clears and still land the bytes.
    writeDurable(target, "written under lock\n");
    assert.equal(
      readFileSync(target, "utf8"),
      "written under lock\n",
      "a durable write started inside an exclusive lock window must still land",
    );
    locker.kill();
    console.log("  exclusive OS lock: write recovered after the lock cleared");
  } else {
    console.log("  exclusive OS lock: skipped (Windows-only reproduction)");
  }

  console.log("PASS: file-mutation helper is durable, restores on exit, and recovers from an exclusive lock");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
