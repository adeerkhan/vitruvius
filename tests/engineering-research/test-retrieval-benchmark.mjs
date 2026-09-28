import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// The benchmark queries file must exist
const queriesPath = join(repoRoot, "tests", "retrieval-benchmark", "queries.json");
assert.ok(existsSync(queriesPath), "tests/retrieval-benchmark/queries.json must exist");

const queries = JSON.parse(readFileSync(queriesPath, "utf8"));

// Must have queries
assert.ok(Array.isArray(queries.queries), "queries must be an array");
assert.ok(queries.queries.length >= 10, `expected at least 10 queries, found ${queries.queries.length}`);

// Each query must have id, category, query, and expected_files
for (const q of queries.queries) {
  assert.ok(q.id, "query must have an id");
  assert.ok(q.category, "query must have a category");
  assert.ok(q.query, "query must have a query string");
  assert.ok(Array.isArray(q.expected_files), "query must have expected_files array");
  assert.ok(q.expected_files.length > 0, "query must have at least one expected file");
}

// Must have all three categories
const categories = new Set(queries.queries.map((q) => q.category));
assert.ok(categories.has("semantic"), "must have semantic queries");
assert.ok(categories.has("architecture"), "must have architecture queries");
assert.ok(categories.has("symbol"), "must have symbol queries");

// The ground truth file must exist
const groundTruthPath = join(repoRoot, "tests", "retrieval-benchmark", "ground-truth.json");
assert.ok(existsSync(groundTruthPath), "tests/retrieval-benchmark/ground-truth.json must exist");

const groundTruth = JSON.parse(readFileSync(groundTruthPath, "utf8"));

// Must have labels for all queries
for (const q of queries.queries) {
  assert.ok(groundTruth.labels[q.id], `ground truth must have labels for ${q.id}`);
  assert.ok(
    Array.isArray(groundTruth.labels[q.id].relevant),
    `ground truth for ${q.id} must have relevant array`,
  );
}

// Must document metrics
assert.ok(groundTruth.metrics, "ground truth must document metrics");
assert.ok(groundTruth.metrics.ndcg_at_10, "ground truth must document NDCG@10");

console.log(`PASS: retrieval benchmark has ${queries.queries.length} queries with ground truth labels`);
