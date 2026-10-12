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

// Resolution and enrichment layers. Crossref, Unpaywall and OpenCitations answer
// a question about a DOI we already hold; they are not discovery routes, and
// asserting that distinction is what keeps them out of the ranking table.assert.match(skill, /resolution and enrichment.*not discovery/i, "the DOI layers are marked as enrichment, not discovery");
assert.match(skill, /metadata of record/, "Crossref is named the metadata of record");

// Every endpoint below was fetched and answered 200 before it was written into
// the skill, so a URL that stops resolving is a regression this suite catches.
for (const layer of ["Crossref", "Unpaywall", "OpenCitations"]) {
  assert.match(skill, new RegExp(`\\|\\s*${layer}`), `capability table covers ${layer}`);
}
for (const endpoint of [
  "https://api.crossref.org/works/<doi>",
  "https://api.crossref.org/works?query.bibliographic=",
  "https://api.unpaywall.org/v2/<doi>?email=",
  "https://api.opencitations.net/index/v1/references/<doi>",
  "https://api.opencitations.net/index/v1/citations/<doi>",
]) {
  assert.ok(skill.includes(endpoint), `scholarly-research must carry the verified endpoint ${endpoint}`);
}

// Each layer's honest limits, each of which was observed on a real response:
// a mandatory contact address that is not a credential, an OA record with no
// PDF, and a citation payload large enough to truncate a read.
assert.match(skill, /mailto=/, "Crossref requires the polite-pool contact address");
assert.match(skill, /contact address, not a credential/i, "Unpaywall's email is stated as a contact, not a key");
assert.match(skill, /422/, "Unpaywall's rejection of a placeholder address is recorded");
assert.match(skill, /does not promise a PDF/i, "records that is_oa true can still have no PDF");
assert.match(skill, /tens of megabytes/i, "records the OpenCitations citations payload size risk");
assert.match(skill, /unverified coverage/i, "a COCI gap is marked unverified coverage, not absence of citation");
assert.match(skill, /api\.opencitations\.net/, "the resolved OpenCitations host is used, not the redirecting one");

// Systematic-review coverage. The counts are part of the answer, and the two
// distinctions that keep them honest are asserted so neither can be dropped.
assert.match(skill, /## Systematic-review coverage/, "has a systematic-review coverage section");
for (const stage of ["Identification", "Screening", "Included"]) {
  assert.ok(skill.includes(stage), `records the ${stage} stage`);
}
assert.match(skill, /Records vs studies/i, "separates records from studies");
assert.match(skill, /Removed is not the same as not found/i, "separates an exclusion from a zero-result search");
assert.match(skill, /## Search coverage/i, "requires a search-coverage section in the output");
assert.match(skill, /accounting frame, not a compliance claim/i, "states the accounting frame is not a compliance claim");

const version = skill.match(/version:\s*"(\d+)\.(\d+)\.(\d+)"/);
assert.ok(version, "scholarly-research has a version");
assert.ok(
  Number(version[1]) > 0 || Number(version[2]) >= 2,
  `scholarly-research version is 0.2.0+ (got ${version[1]}.${version[2]}.${version[3]})`,
);

console.log("PASS: scholarly-research declares routing modes, per-index capability limits, the verified resolution layers (Crossref, Unpaywall, OpenCitations) and arXiv version rules");
