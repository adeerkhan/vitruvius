import { strict as assert } from "node:assert";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const generator = join(root, "scripts", "generate-adapters.mjs");
const generatedCommand = join(root, ".opencode", "command", "vitruvius.md");
const original = readFileSync(generatedCommand, "utf-8");
const clean = spawnSync(process.execPath, [generator, "--check"], {
  cwd: root,
  encoding: "utf-8",
});
assert.equal(clean.status, 0, "clean generated command tree must pass --check");

try {
  writeFileSync(generatedCommand, `${original}\n<!-- intentional stale fixture -->\n`, "utf-8");
  const result = spawnSync(process.execPath, [generator, "--check"], {
    cwd: root,
    encoding: "utf-8",
  });
  assert.notEqual(result.status, 0, "--check must fail on stale generated output");
  assert.match(`${result.stdout}\n${result.stderr}`, /command[\\/]vitruvius\.md/);
  assert.match(readFileSync(generatedCommand, "utf-8"), /intentional stale fixture/);
} finally {
  writeFileSync(generatedCommand, original, "utf-8");
}

console.log("PASS: generated adapter drift is detected without rewriting files");
