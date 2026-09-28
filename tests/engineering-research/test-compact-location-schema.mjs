import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// The compact location schema reference must exist
const schemaPath = join(repoRoot, "references", "compact-location-schema.md");
assert.ok(existsSync(schemaPath), "references/compact-location-schema.md must exist");

const schema = readFileSync(schemaPath, "utf8");

// Must document the format
assert.match(schema, /file:line/, "schema must document file:line format");
assert.match(schema, /file:line-line/, "schema must document file:line-line format");

// Must document the rules
assert.match(schema, /1-based/, "schema must document 1-based line numbers");
assert.match(schema, /inclusive/, "schema must document inclusive ranges");

// Must have examples
assert.match(schema, /## Examples/, "schema must have examples");

// Must document integration points
assert.match(schema, /problem-anchor/, "schema must document problem-anchor integration");
assert.match(schema, /evidence-ledger/, "schema must document evidence-ledger integration");
assert.match(schema, /retrieval-bridge/, "schema must document retrieval-bridge integration");

console.log("PASS: compact location schema is documented with format, rules, examples, and integration");
