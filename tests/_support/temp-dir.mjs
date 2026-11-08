// temp-dir.mjs — the one temporary-directory lifecycle used by the suites.
//
// The audit found 44 tests hand-rolling mkdtempSync + rmSync-in-finally. The
// duplicated part was never the mkdtemp call — it was the cleanup contract:
// recursive, forced, and guaranteed to run even when an assertion throws.
// withTempDir owns that contract once. Suites that need the directory to
// outlive a single block (node:test `after()` hooks, child-process fixtures)
// use makeTempDir / removeTempDir instead.

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function makeTempDir(prefix) {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function removeTempDir(dir) {
  rmSync(dir, { recursive: true, force: true });
}

/**
 * Create a temporary directory, run `fn` with it, and remove it afterwards —
 * on success, on an assertion failure, and on any thrown error.
 * @template T
 * @param {string} prefix
 * @param {(dir: string) => T} fn
 * @returns {T}
 */
export function withTempDir(prefix, fn) {
  const dir = makeTempDir(prefix);
  try {
    return fn(dir);
  } finally {
    removeTempDir(dir);
  }
}
