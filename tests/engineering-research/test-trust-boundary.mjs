import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { validateEvidenceLedger } from "../../skills/engineering-research/scripts/evidence-ledger.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const hash = (path) => createHash("sha256").update(readFileSync(join(repoRoot, path))).digest("hex");

// --- Trust-boundary negative tests (abrt idea-only) -----------------------
// abrt has no worktree; these patterns extend existing fixtures where a new
// boundary appears. Each test asserts that a path-escape or hash-mismatch
// is refused by the evidence ledger contract.

function validLedger() {
  return {
    schema: "evidence.v1",
    run_id: "11111111-1111-4111-8111-111111111111",
    question: "Trust-boundary fixture test",
    sources: [
      {
        id: "SRC-001",
        title: "Boundary fixture",
        locator: "fixture.md#L1",
        artifact_path: "evals/fixtures/c1/supported-evidence/requirement.md",
        sha256: hash("evals/fixtures/c1/supported-evidence/requirement.md"),
        accessed_on: "2026-09-25",
        status: "verified",
      },
    ],
    searches: [
      {
        id: "SEARCH-001",
        query: "boundary",
        boundary: "local fixture",
        searched_on: "2026-09-25",
        status: "completed",
        screened_count: 1,
        result_source_ids: ["SRC-001"],
      },
    ],
    claims: [
      {
        id: "CLAIM-001",
        text: "The fixture supports the boundary.",
        status: "verified",
        coverage_status: "covered",
        support: [
          { source_id: "SRC-001", locator: "requirement.md#L1", relation: "supports", status: "verified" },
        ],
      },
    ],
    coverage: {
      negative: [{ id: "NEG-001", search_id: "SEARCH-001", claim_ids: [], status: "documented", note: "No contradictory boundary found." }],
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

// Path escape attempts must be refused.
assert.match(
  errorsFor((v) => { v.sources[0].artifact_path = "evals/fixtures/c1/supported-evidence/../../../etc/passwd"; }).join("\n"),
  /confined regular file/i
);
assert.match(
  errorsFor((v) => { v.sources[0].artifact_path = "evals/fixtures/c1/supported-evidence/..\\..\\..\\etc\\passwd"; }).join("\n"),
  /confined regular file/i
);

// Hash mismatch must be refused.
assert.match(
  errorsFor((v) => { v.sources[0].sha256 = "0".repeat(64); }).join("\n"),
  /sha256 must match artifact_path bytes/i
);

// Non-existent artifact must be refused (path confinement check fires first).
assert.match(
  errorsFor((v) => { v.sources[0].artifact_path = "evals/fixtures/c1/supported-evidence/nonexistent.md"; }).join("\n"),
  /confined regular file/i
);

// Directory traversal via .. must be refused.
assert.match(
  errorsFor((v) => { v.sources[0].artifact_path = "evals/fixtures/c1/supported-evidence/../.."; }).join("\n"),
  /confined regular file/i
);

console.log("PASS: trust-boundary negative tests refuse path escape and hash mismatch");
