import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("../..", import.meta.url)));
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

assert.equal(packageJson.bin["vitruvius-goal-check"].replace(/^\.\//, ""), "scripts/goal-check-contract.mjs");
assert.equal(packageJson.bin["vitruvius-artifact-closure"].replace(/^\.\//, ""), "scripts/artifact-closure.mjs");
assert.equal(packageJson.bin["vitruvius-field-pilot"].replace(/^\.\//, ""), "scripts/field-pilot-contract.mjs");
assert.equal(packageJson.bin["vitruvius-problem-anchor"].replace(/^\.\//, ""), "scripts/problem-anchor-contract.mjs");
for (const path of [
  "scripts/goal-check-contract.mjs",
  "scripts/artifact-closure.mjs",
  "scripts/field-pilot-contract.mjs",
  "scripts/problem-anchor-contract.mjs",
  "evals/field-pilot/",
]) assert.ok(packageJson.files.includes(path), `package files include ${path}`);

console.log("PASS: package contract exposes the four validation commands and field-pilot template");
