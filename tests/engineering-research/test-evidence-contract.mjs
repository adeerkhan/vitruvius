import { strict as assert } from "node:assert";

import { validateEvidenceLedger } from "../../skills/engineering-research/scripts/evidence-ledger.mjs";

const validLedger = {
  schema: "evidence.v1",
  run_id: "11111111-1111-4111-8111-111111111111",
  question: "Does the synthetic local fixture support the stated limit?",
  sources: [
    {
      id: "SRC-001",
      title: "Synthetic requirement",
      locator: "local://fixtures/requirement.md",
      status: "verified",
    },
    {
      id: "SRC-002",
      title: "Synthetic challenge",
      locator: "local://fixtures/challenge.md",
      status: "verified",
    },
  ],
  searches: [
    {
      id: "SEARCH-001",
      query: "synthetic limit",
      boundary: "local fixture set",
      searched_on: "2026-09-25",
      status: "completed",
      result_source_ids: ["SRC-001", "SRC-002"],
    },
  ],
  claims: [
    {
      id: "CLAIM-001",
      text: "The fixture supports the stated limit.",
      status: "verified",
      support: [
        {
          source_id: "SRC-001",
          locator: "requirement.md#L1",
          relation: "supports",
          status: "verified",
        },
        {
          source_id: "SRC-002",
          locator: "challenge.md#L1",
          relation: "challenges",
          status: "verified",
        },
      ],
    },
  ],
  coverage: {
    negative: [
      {
        id: "NEG-001",
        search_id: "SEARCH-001",
        status: "documented",
        note: "The local set was screened for contradictory requirements.",
      },
    ],
    ambiguous: [],
  },
};

function clone() {
  return structuredClone(validLedger);
}

function errorsFor(mutator) {
  const value = clone();
  mutator(value);
  return validateEvidenceLedger(value).errors;
}

const valid = validateEvidenceLedger(validLedger);
assert.equal(valid.valid, true, valid.errors.join("\n"));
assert.equal(valid.sourceCount, 2);
assert.equal(valid.searchCount, 1);
assert.equal(valid.claimCount, 1);

assert.match(
  errorsFor((value) => { value.claims[0].support[0].source_id = "SRC-UNKNOWN"; }).join("\n"),
  /unknown source id/i,
);
assert.match(
  errorsFor((value) => { value.searches[0].result_source_ids.push("SRC-UNKNOWN"); }).join("\n"),
  /unknown source id/i,
);
assert.match(
  errorsFor((value) => { value.coverage.negative[0].search_id = "SEARCH-UNKNOWN"; }).join("\n"),
  /unknown search id/i,
);
assert.match(
  errorsFor((value) => { value.claims[0].status = "verified"; value.claims[0].support[0].status = "unverified"; }).join("\n"),
  /source status must match support status|verified claim requires verified support/i,
);
assert.match(
  errorsFor((value) => { value.coverage.negative = []; }).join("\n"),
  /every search requires negative coverage/i,
);
assert.match(
  errorsFor((value) => {
    value.coverage.ambiguous.push({
      id: "AMB-001",
      search_id: "SEARCH-001",
      claim_ids: ["CLAIM-001"],
      status: "open",
      note: "The conflict is unresolved.",
    });
  }).join("\n"),
  /open ambiguity must reference a non-verified claim/i,
);
assert.match(
  errorsFor((value) => { value.claims[0].support = []; }).join("\n"),
  /support must be a non-empty array/i,
);
assert.match(
  errorsFor((value) => { value.sources.push(structuredClone(value.sources[0])); }).join("\n"),
  /duplicate ledger id/i,
);
assert.match(
  errorsFor((value) => { value.run_id = "not-a-uuid"; }).join("\n"),
  /run_id must be a UUID/i,
);
assert.match(
  errorsFor((value) => { delete value.coverage.ambiguous; }).join("\n"),
  /coverage must contain negative and ambiguous arrays/i,
);

console.log("PASS: Q1 evidence.v1 contract accepts valid mappings and refuses malformed evidence");
