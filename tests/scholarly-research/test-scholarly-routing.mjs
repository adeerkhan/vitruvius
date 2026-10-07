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

// Per-index capability table, so the routing table has a stated reason. An
// index that answers badly is worse than one that refuses.
assert.match(skill, /## What each index is actually good for/, "has a per-index capability table");
for (const index of ["OpenAlex", "Semantic Scholar", "arXiv", "alphaXiv"]) {
  assert.match(skill, new RegExp(`\\|\\s*${index.replace(" ", "\\s")}`), `capability table covers ${index}`);
}
// arXiv is demoted for topic discovery, with the reason given.
assert.match(skill, /resolving a known preprint id/, "arXiv is presented as id-resolution first");
assert.match(skill, /lexical, poorly ranked|lexical and ranks concept queries poorly/, "states why arXiv topic search is weak");

// A fallback must not erase the failure it replaced.
assert.match(skill, /fallback never erases the failure/i, "requires the failed search to be recorded, not dropped");
assert.match(skill, /status: partial/, "says the failed search is recorded as partial");

// Rate discipline and the recorded endpoint.
assert.match(skill, /Serialise/i, "requires serialised arXiv requests");
assert.match(skill, /exact endpoint/i, "requires the exact endpoint per search");

// arXiv version canonicalisation: one work, one source.
assert.match(skill, /### arXiv ids carry a version, and two shapes/, "has an arXiv version section");
assert.match(skill, /two sources for one work/, "names the double-count risk");
assert.match(skill, /hep-th\/9901001/, "names the legacy id shape");
assert.match(skill, /disagreement between versions is a finding/i, "a version disagreement is a finding, not a merge");

const version = skill.match(/version:\s*"(\d+)\.(\d+)\.(\d+)"/);
assert.ok(version, "scholarly-research has a version");
assert.ok(
  Number(version[1]) > 0 || Number(version[2]) >= 2,
  `scholarly-research version is 0.2.0+ (got ${version[1]}.${version[2]}.${version[3]})`,
);

console.log("PASS: scholarly-research declares routing modes, per-index capability limits, exact-first source identity and arXiv version rules");
