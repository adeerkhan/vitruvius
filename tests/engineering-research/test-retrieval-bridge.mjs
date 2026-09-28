import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// The retrieval bridge script must exist
const bridgePath = join(repoRoot, "scripts", "retrieval-bridge.mjs");
assert.ok(existsSync(bridgePath), "scripts/retrieval-bridge.mjs must exist");

const bridge = readFileSync(bridgePath, "utf8");

// Must implement the three-step bridge: semantic recall, exact search, direct read
assert.match(bridge, /semantic.*recall/i, "bridge must implement semantic recall");
assert.match(bridge, /exact.*search/i, "bridge must implement exact search");
assert.match(bridge, /direct.*read/i, "bridge must implement direct read");

// Must use codegraph for semantic recall
assert.match(bridge, /codegraph/, "bridge must use codegraph for semantic recall");

// Must accept a query argument
assert.match(bridge, /query/, "bridge must accept a query argument");

// Must have a --max-results option
assert.match(bridge, /max-results/, "bridge must support --max-results option");

console.log("PASS: retrieval bridge implements semantic-recall, exact-search, direct-read");
