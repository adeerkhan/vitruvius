import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const result = spawnSync(
  process.execPath,
  [join(here, "failing-check.mjs")],
  { encoding: "utf-8" },
);

assert.notEqual(result.status, 0, "a failed shared check must exit nonzero");
assert.match(result.stderr, /intentional failing-check regression fixture/);
console.log("PASS: shared check failures terminate the test process");
