import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { validateEvidenceLedger } from "../../skills/engineering-research/scripts/evidence-ledger.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const requirementPath = "evals/fixtures/c1/supported-evidence/requirement.md";
const reportPath = "evals/fixtures/c1/supported-evidence/test-report.md";
const hash = (path) => createHash("sha256").update(readFileSync(join(repoRoot, path))).digest("hex");

function validLedger() {
  return {
    schema: "evidence.v1",
    run_id: "11111111-1111-4111-8111-111111111111",
    question: "Does the synthetic local fixture support the stated limit?",
    sources: [
      {
        id: "SRC-001",
        title: "Synthetic requirement",
        locator: "requirement.md#L3",
        artifact_path: requirementPath,
        sha256: hash(requirementPath),
        accessed_on: "2026-09-25",
        status: "verified",
      },
      {
        id: "SRC-002",
        title: "Synthetic test report",
        locator: "test-report.md#L3",
        artifact_path: reportPath,
        sha256: hash(reportPath),
        accessed_on: "2026-09-25",
        status: "verified",
      },
    ],
    searches: [
      {
        id: "SEARCH-001",
        query: "synthetic limit",
        boundary: "local C1 fixture set",
        searched_on: "2026-09-25",
        status: "completed",
        screened_count: 2,
        result_source_ids: ["SRC-001", "SRC-002"],
      },
    ],
    claims: [
      {
        id: "CLAIM-001",
        text: "The fixture result supports the stated limit.",
        status: "verified",
        coverage_status: "covered",
        support: [
          { source_id: "SRC-001", locator: "requirement.md#L3", relation: "supports", status: "verified" },
          { source_id: "SRC-002", locator: "test-report.md#L3", relation: "supports", status: "verified" },
        ],
      },
    ],
    coverage: {
      negative: [{ id: "NEG-001", search_id: "SEARCH-001", claim_ids: [], status: "documented", note: "The local set was screened for contradictory requirements." }],
      ambiguous: [],
    },
  };
}

function clone() {
  return structuredClone(validLedger());
}

function errorsFor(mutator) {
  const value = clone();
  mutator(value);
  return validateEvidenceLedger(value, { repoRoot }).errors;
}

const valid = validateEvidenceLedger(validLedger(), { repoRoot });
assert.equal(valid.valid, true, valid.errors.join("\n"));
assert.equal(valid.completion, "complete");
assert.equal(valid.sourceCount, 2);
assert.equal(valid.searchCount, 1);
assert.equal(valid.claimCount, 1);

assert.match(errorsFor((value) => { value.claims[0].support[0].source_id = "SRC-UNKNOWN"; }).join("\n"), /unknown source id/i);
assert.match(errorsFor((value) => { value.searches[0].result_source_ids.push("SRC-UNKNOWN"); }).join("\n"), /unknown source id/i);
assert.match(errorsFor((value) => { value.coverage.negative[0].search_id = "SEARCH-UNKNOWN"; }).join("\n"), /unknown search id/i);
assert.match(errorsFor((value) => { value.claims[0].support = [value.claims[0].support[0]]; value.claims[0].support[0].status = "unverified"; }).join("\n"), /verified claim requires verified support|cannot be verified/i);
assert.match(errorsFor((value) => { value.coverage.negative = []; }).join("\n"), /every search requires negative coverage/i);
assert.match(errorsFor((value) => { value.coverage.ambiguous.push({ id: "AMB-001", search_id: "SEARCH-001", claim_ids: ["CLAIM-001"], status: "open", note: "Unresolved." }); }).join("\n"), /open ambiguity must reference a non-verified claim/i);
assert.match(errorsFor((value) => { value.claims[0].support = []; }).join("\n"), /support must be a non-empty array/i);
assert.match(errorsFor((value) => { value.sources.push(structuredClone(value.sources[0])); }).join("\n"), /duplicate ledger id/i);
assert.match(errorsFor((value) => { value.run_id = "not-a-uuid"; }).join("\n"), /run_id must be a UUID/i);
assert.match(errorsFor((value) => { delete value.coverage.ambiguous; }).join("\n"), /coverage must contain negative and ambiguous arrays/i);
assert.match(errorsFor((value) => { value.sources[0].artifact_path = "evals/fixtures/c1/supported-evidence/../supported-evidence/requirement.md"; }).join("\n"), /confined regular file/i);
assert.match(errorsFor((value) => { value.sources[0].sha256 = "0".repeat(64); }).join("\n"), /sha256 must match artifact_path bytes/i);
assert.match(errorsFor((value) => { value.searches[0].searched_on = "2026-02-30"; }).join("\n"), /real ISO date/i);
assert.match(errorsFor((value) => { value.sources[0].accessed_on = "last tuesday"; }).join("\n"), /accessed_on must be a real ISO date/i);
assert.match(errorsFor((value) => { value.searches[0].screened_count = null; }).join("\n"), /screened_count must be a non-negative integer/i);
assert.match(errorsFor((value) => { value.unknown = true; }).join("\n"), /unknown field: unknown/i);
assert.match(errorsFor((value) => { value.claims[0].coverage_status = "ambiguous"; }).join("\n"), /ambiguous coverage is not recorded/i);
assert.match(errorsFor((value) => { value.coverage.negative[0].claim_ids.push("CLAIM-001"); }).join("\n"), /covered claim cannot also have negative coverage/i);
assert.match(errorsFor((value) => { value.completion = "partial"; }).join("\n"), /completion must be complete/i);
assert.match(errorsFor((value) => { const orphan = structuredClone(value.sources[0]); orphan.id = "SRC-ORPHAN"; value.sources.push(orphan); }).join("\n"), /not linked to any search/i);
assert.match(errorsFor((value) => { value.claims[0].support.push({ source_id: "SRC-001", locator: "challenge.md#L1", relation: "challenges", status: "verified" }); }).join("\n"), /verified challenge requires ambiguous coverage/i);
assert.match(errorsFor((value) => { value.searches.push({ id: "SEARCH-002", query: "blocked", boundary: "local", searched_on: "2026-09-25", status: "blocked", screened_count: 0, result_source_ids: [] }); value.coverage.negative.push({ id: "NEG-002", search_id: "SEARCH-002", claim_ids: ["CLAIM-001"], status: "blocked", note: "Not reached." }); }).join("\n"), /screened_count must be null for a blocked search/i);
const partialSearch = clone();
partialSearch.searches.push({ id: "SEARCH-002", query: "partial", boundary: "local", searched_on: "2026-09-25", status: "partial", screened_count: 1, result_source_ids: [] });
partialSearch.coverage.negative.push({ id: "NEG-002", search_id: "SEARCH-002", claim_ids: [], status: "documented", note: "The boundary was only partially screened." });
const partialSearchReport = validateEvidenceLedger(partialSearch, { repoRoot });
assert.equal(partialSearchReport.valid, true, partialSearchReport.errors.join("\n"));
assert.equal(partialSearchReport.completion, "partial");
const partial = clone();
partial.claims[0].status = "partial";
partial.claims[0].coverage_status = "ambiguous";
partial.coverage.ambiguous.push({ id: "AMB-001", search_id: "SEARCH-001", claim_ids: ["CLAIM-001"], status: "open", note: "Scope remains unresolved." });
const partialReport = validateEvidenceLedger(partial, { repoRoot });
assert.equal(partialReport.valid, true, partialReport.errors.join("\n"));
assert.equal(partialReport.completion, "partial");
assert.match(validateEvidenceLedger(validLedger()).errors.join("\n"), /repoRoot is required/i);

console.log("PASS: Q1 evidence.v1 contract accepts valid mappings and refuses malformed evidence");
