#!/usr/bin/env node
/**
 * fs-walk.mjs — the one recursive directory walk.
 *
 * Every script that needed "list the files under a tree" carried its own copy of
 * the same recursion, and each copy could drop the node_modules skip or the
 * extension filter on its own — the same drift that let `isSafeRelativePath` be
 * re-implemented five times before scripts/path-safety.mjs became the single
 * definition. This is the single definition for the walk.
 *
 * `readdirSync(root, { recursive: true })` is not a substitute: the declared
 * floor is Node >=20, where the recursive form does not yet expose each entry's
 * parent path (added in 20.12), so a portable walk still needs the recursion.
 */
import { readdirSync } from "node:fs";
import { join, extname } from "node:path";

/** Directory names a walk never descends into. */
export const DEFAULT_SKIP = new Set(["node_modules", ".git", ".codegraph"]);

/**
 * File paths under `root`, recursively, in a deterministic (sorted) order.
 *
 * An unreadable directory yields no files rather than throwing, so a caller
 * walking an optional tree does not need its own try/catch.
 *
 * @param {string} root
 * @param {object} [options]
 * @param {string[]} [options.extensions] keep only files with one of these
 *   extensions (each with a leading dot, e.g. ".mjs").
 * @param {Set<string>} [options.skip] directory names to skip.
 * @param {(path: string) => boolean} [options.include] extra per-file filter.
 * @returns {string[]}
 */
export function walkFiles(root, { extensions, skip = DEFAULT_SKIP, include } = {}) {
  const out = [];
  const walk = (dir) => {
    let entries;
    try {
      // Code-unit sort, matching `readdirSync(dir).sort()`: a caller that
      // previously sorted its own entries must see the same order.
      entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
        a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
      );
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (skip.has(entry.name)) continue;
        walk(join(dir, entry.name));
      } else if (entry.isFile()) {
        const full = join(dir, entry.name);
        if (extensions && !extensions.includes(extname(entry.name))) continue;
        if (include && !include(full)) continue;
        out.push(full);
      }
    }
  };
  walk(root);
  return out;
}
