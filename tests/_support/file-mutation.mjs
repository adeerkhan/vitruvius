// tests/_support/file-mutation.mjs — durable write and restore guard for the
// mutation harnesses that weaken a tracked file, spawn a suite, then put the
// file back (test-e1-suites-have-teeth, test-script-suites-have-teeth,
// test-part3-suites-have-teeth, test-benchmark-claims-check).
//
// Why this exists: on Windows a virus scanner, a file watcher, or another
// process briefly holds a just-written file open. A bare writeFileSync then
// throws UNKNOWN (errno -4094), EPERM, or EBUSY, the harness's restore step
// fails, and the tracked file is left mutated. That reds the next `npm test`
// for no real reason (the content-addressed payload hash no longer matches the
// body) and, worse, can ship a weakened skill. It bit two harnesses in a single
// session before this module existed.
//
// Two things the plain writer lacks:
//   1. Atomicity — a sibling temp file is renamed over the target, so an
//      interrupted or failed write never leaves a half-written file; the old
//      content survives and is retried. A bare `writeFileSync(path, ...)` opens
//      with O_TRUNC, so a failure mid-write can mangle the file (observed).
//   2. Persistence — the write verifies its own bytes and retries with backoff
//      until it lands, so a transient lock clears instead of corrupting the tree.

import { readFileSync, writeFileSync, renameSync, rmSync } from "node:fs";

// Synchronous backoff without a timer: the harness only ever calls this between
// synchronous writes, so Atomics.wait is the one sleep that cannot interleave.
function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

const tmpName = (path) => `${path}.mutation-tmp`;

function removeTmp(path) {
  try {
    rmSync(tmpName(path), { force: true });
  } catch {
    // Best effort; the exit sweep tries again.
  }
}

/**
 * Write `contents` to `path` and prove it landed, retrying a transient lock.
 * Atomic replace first (no torn file), in-place write as a fallback.
 */
export function writeDurable(
  path,
  contents,
  { attempts = 60, baseDelayMs = 50, maxDelayMs = 300 } = {},
) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    const tmp = tmpName(path);
    try {
      writeFileSync(tmp, contents, "utf8");
      renameSync(tmp, path); // replaces an existing target on Windows and POSIX
      if (readFileSync(path, "utf8") === contents) return;
      lastErr = new Error(`partial write: ${path}`);
    } catch (err) {
      lastErr = err;
    } finally {
      removeTmp(path);
    }

    try {
      writeFileSync(path, contents, "utf8");
      if (readFileSync(path, "utf8") === contents) return;
      lastErr = new Error(`partial write: ${path}`);
    } catch (err) {
      lastErr = err;
    }

    sleep(Math.min(baseDelayMs * (i + 1), maxDelayMs));
  }
  throw lastErr ?? new Error(`could not durably write ${path}`);
}

/**
 * Restore every snapshot on normal exit and on Ctrl-C, so a mutation run can
 * never leave the tree dirty. `snapshots` is a Map<absolutePath, originalText>.
 * Returns restoreAll() for a harness that also verifies cleanliness inline.
 */
export function installRestoreGuard(snapshots, { label = "file" } = {}) {
  const restoreAll = () => {
    const failed = [];
    for (const [file, original] of snapshots) {
      try {
        writeDurable(file, original);
      } catch (err) {
        failed.push(`${file}: ${err.message}`);
      }
      removeTmp(file);
    }
    return failed;
  };

  const sweep = () => {
    if (snapshots.size === 0) return;
    const failed = restoreAll();
    if (failed.length > 0) {
      console.error(`\nFATAL: could not restore ${failed.length} mutated ${label}(s):\n  ${failed.join("\n  ")}`);
      process.exitCode = 1;
    }
  };

  process.on("exit", sweep);
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      sweep();
      process.exit(1);
    });
  }

  return restoreAll;
}
