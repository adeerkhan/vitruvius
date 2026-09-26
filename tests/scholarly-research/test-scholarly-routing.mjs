import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const skill = readFileSync(join(root, "skills", "scholarly-research", "SKILL.md"), "utf8");

// M1: need-based routing modes, including code prior art, not just keyword search.
for (const mode of ["discover", "known-id", "citation-graph", "semantic", "full-text", "code-prior-art"]) {
  assert.match(skill, new RegExp(`\`${mode}\``), `scholarly-research declares the ${mode} mode`);
}
assert.match(skill, /## Routing modes/, "has a routing modes section");
assert.match(skill, /2–4 reworded queries/, "requires multiple reworded queries");
assert.match(
  skill,
  /scripts\/extract-pdf\.mjs/,
  "routes full text through the page-anchored reader",
);

// N1 handshake: exact-first dedup vocabulary is declared here and enforced in
// the evidence.v1 ledger.
assert.match(skill, /## Source identity \(exact-first\)/, "has an exact-first source identity section");
assert.match(skill, /merge_rule/, "names the merge rule");
assert.match(skill, /discard_reason/, "names the discard reason");

const version = skill.match(/version:\s*"(\d+)\.(\d+)\.(\d+)"/);
assert.ok(version, "scholarly-research has a version");
assert.ok(
  Number(version[1]) > 0 || Number(version[2]) >= 2,
  `scholarly-research version is 0.2.0+ (got ${version[1]}.${version[2]}.${version[3]})`,
);

console.log("PASS: scholarly-research declares routing modes and exact-first source identity");
