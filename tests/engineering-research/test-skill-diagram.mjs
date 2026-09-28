import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = join(repoRoot, "scripts", "generate-skill-diagram.mjs");

// The script must exist
assert.ok(existsSync(script), "generate-skill-diagram.mjs must exist");

// Generate a diagram for a skill with a known workflow
const result = spawnSync("node", [script, "engineering-research"], { encoding: "utf8" });
assert.strictEqual(result.status, 0, `script failed: ${result.stderr}`);

const output = result.stdout;

// Must produce a Mermaid diagram
assert.match(output, /graph TD/, "must produce a Mermaid graph");

// Must extract workflow steps
assert.match(output, /\d+ workflow step\(s\) extracted/, "must report extracted step count");

// Must contain step nodes
assert.match(output, /Step1\[/, "must contain Step1 node");

console.log("PASS: skill diagram generator produces valid Mermaid diagrams");
