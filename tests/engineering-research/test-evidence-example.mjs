import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { validateEvidenceLedger } from "../../skills/engineering-research/scripts/evidence-ledger.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const exampleRoot = join(repoRoot, "outputs", ".q1-example");
const manifest = JSON.parse(readFileSync(join(exampleRoot, "manifest.json"), "utf8"));
const evidencePath = join(repoRoot, manifest.evidence.path);
const rawDraftPath = join(repoRoot, manifest.raw_draft.path);
const provenancePath = join(repoRoot, manifest.provenance.path);
const evidenceBytes = readFileSync(evidencePath);
const evidence = JSON.parse(evidenceBytes);
const report = validateEvidenceLedger(evidence, { repoRoot });

assert.equal(report.valid, true, report.errors.join("\n"));
assert.equal(report.completion, "partial");
assert.equal(manifest.completion, "partial");
assert.equal(manifest.session_id_status, "unverified_process_metadata");
assert.equal(existsSync(provenancePath), true);
assert.equal(evidenceBytes.length, manifest.evidence.bytes);
assert.equal(createHash("sha256").update(evidenceBytes).digest("hex"), manifest.evidence.sha256);
const rawBytes = readFileSync(rawDraftPath);
assert.equal(rawBytes.length, manifest.raw_draft.bytes);
assert.equal(createHash("sha256").update(rawBytes).digest("hex"), manifest.raw_draft.sha256);
for (const source of evidence.sources) {
  const sourceBytes = readFileSync(join(repoRoot, source.artifact_path));
  assert.equal(createHash("sha256").update(sourceBytes).digest("hex"), source.sha256, source.id);
}
const l1 = readFileSync(join(exampleRoot, "runs", "2026-09-25.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
assert.equal(l1.some((entry) => entry.schema === "run.v1" && entry.run_id === evidence.run_id), true);

console.log("PASS: retained Q1 example is L1-bound, byte-pinned, and honestly partial");
