import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { DEFAULT_SKIP, walkFiles } from "../../scripts/fs-walk.mjs";

// fs-walk — behavioural.
//
// The shared walk replaced ten copies, so it now carries their combined
// contract: skip the noise directories, honour an extension filter, honour an
// extra predicate, return a deterministic order, and yield nothing (not a
// throw) for a tree that isn't there. Each assertion below is a property one of
// the callers depends on, which is exactly why a single definition matters.

const root = mkdtempSync(join(tmpdir(), "vitruvius-fs-walk-"));
process.on("exit", () => rmSync(root, { recursive: true, force: true }));

mkdirSync(join(root, "sub"), { recursive: true });
mkdirSync(join(root, "node_modules"), { recursive: true });
writeFileSync(join(root, "a.txt"), "a");
writeFileSync(join(root, "README.md"), "readme");
writeFileSync(join(root, "sub", "b.mjs"), "b");
writeFileSync(join(root, "node_modules", "c.mjs"), "c");

const rel = (files) => files.map((f) => f.slice(root.length + 1).split(/[\\/]/).join("/"));

// 1. Recursive, sorted, and node_modules is skipped by default.
assert.deepEqual(
  rel(walkFiles(root)),
  ["README.md", "a.txt", "sub/b.mjs"],
  "walkFiles must recurse, sort, and skip node_modules",
);
assert.ok(DEFAULT_SKIP.has("node_modules"), "node_modules must be in the default skip set");

// 2. Extension filter.
assert.deepEqual(
  rel(walkFiles(root, { extensions: [".mjs"] })),
  ["sub/b.mjs"],
  "walkFiles must keep only the requested extensions",
);

// 3. Extra predicate (e.g. exclude README.md).
assert.deepEqual(
  rel(walkFiles(root, { extensions: [".md"], include: (f) => !f.endsWith("README.md") })),
  [],
  "walkFiles must apply the include predicate",
);

// 4. A missing tree yields nothing rather than throwing, so callers walking an
//    optional directory do not need their own try/catch.
assert.deepEqual(walkFiles(join(root, "does-not-exist")), [], "a missing tree must yield no files");

console.log(
  "PASS: fs-walk recurses in sorted order, skips node_modules, filters by extension and predicate, " +
    "and treats a missing tree as empty",
);
