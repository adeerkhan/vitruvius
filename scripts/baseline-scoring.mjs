#!/usr/bin/env node
// baseline-scoring.mjs — contract and scorer for the Vitruvius-vs-baseline
// comparison (evals/baseline/).
//
// The claim under test is comparative: on the same question, does running the
// Vitruvius method produce more read sources, fewer fabricated references, and
// better-supported citations than a plain prompt? That cannot be scored from
// prose alone. Each run therefore produces a `vitruvius-baseline.v1` record
// that pins, per citation, whether the source was READ (with a byte-pinned
// artifact), RECALLED (cited without retrieval), or FABRICATED (no such source),
// and whether the source supports the claim it is attached to.
//
// This module validates those records fail-closed and scores them against the
// case oracle. It does not fetch sources, judge writing quality, or turn a
// comparison into a product claim.
//
// Usage:
//   node scripts/baseline-scoring.mjs <resultsDir> [--cases <path>] [--json]
//
// The scorer proves itself on fixtures in tests/baseline/test-baseline.mjs.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isNonEmptyString as isText, resolveRealFile } from "./path-safety.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

export const RECORD_SCHEMA = "vitruvius-baseline.v1";
export const CASES_SCHEMA = "vitruvius-baseline-cases.v1";
export const CONDITIONS = ["with-vitruvius", "baseline"];
export const CITATION_STATUSES = ["read", "recalled", "fabricated"];
export const COMPLETION_STATUSES = ["complete", "partial", "blocked"];
// Whether the run was isolated from the Vitruvius skills/rules/tools. A baseline
// that shared the host's context is not a clean baseline and is flagged.
export const CONTEXTS = ["isolated", "shared-harness", "unknown"];
const SHA256 = /^[0-9a-f]{64}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const RECORD_KEYS = ["schema", "case_id", "condition", "observed_on", "host", "model", "session_id", "context", "answer", "citations", "metrics", "completion", "notes"];
const CASE_KEYS = ["id", "discipline", "question", "real_sources", "fabrication_traps"];
const ANSWER_KEYS = ["path", "sha256", "bytes"];
const CITATION_KEYS = ["locator", "status", "supported", "artifact"];
const METRIC_KEYS = ["wall_time_minutes", "wall_time_status", "cost_usd", "cost_status", "notes"];

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

function exactKeys(value, allowed, label, errors) {
  if (!isObject(value)) {
    errors.push(`${label} must be an object`);
    return false;
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) errors.push(`${label} has unknown field: ${key}`);
  }
  return true;
}

function validateDate(value, label, errors) {
  if (!isText(value) || !ISO_DATE.test(value) || Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())) {
    errors.push(`${label} must be a real ISO date`);
  }
}

function validateArtifact(artifact, root, label, errors) {
  if (!exactKeys(artifact, ANSWER_KEYS, label, errors)) return;
  if (!isText(artifact.path)) {
    errors.push(`${label}.path must be a repository-relative path`);
  } else {
    const resolved = resolveRealFile(root, artifact.path);
    if (!resolved.ok) {
      errors.push(`${label}.path must be a confined repository-relative regular file`);
    } else if (SHA256.test(artifact.sha256) && Number.isInteger(artifact.bytes) && artifact.bytes >= 0) {
      const buf = readFileSync(resolved.path);
      if (buf.length !== artifact.bytes) errors.push(`${label}.bytes does not match ${artifact.path}`);
      if (createHash("sha256").update(buf).digest("hex") !== artifact.sha256) {
        errors.push(`${label}.sha256 does not match ${artifact.path}`);
      }
    }
  }
  if (!SHA256.test(artifact.sha256)) errors.push(`${label}.sha256 must be 64 lowercase hex characters`);
  if (!Number.isInteger(artifact.bytes) || artifact.bytes < 0) errors.push(`${label}.bytes must be a non-negative integer`);
}

export function validateCaseSet(caseSet) {
  const errors = [];
  if (!exactKeys(caseSet, ["schema", "id", "_comment", "cases"], "cases", errors)) return errors;
  if (caseSet.schema !== CASES_SCHEMA) errors.push(`cases.schema must be ${CASES_SCHEMA}`);
  if (!Array.isArray(caseSet.cases) || caseSet.cases.length === 0) {
    errors.push("cases.cases must be a non-empty array");
    return errors;
  }
  const seen = new Set();
  caseSet.cases.forEach((c, i) => {
    const label = `cases[${i}]`;
    if (!exactKeys(c, CASE_KEYS, label, errors)) return;
    if (!isText(c.id)) errors.push(`${label}.id must be non-empty`);
    else if (seen.has(c.id)) errors.push(`${label}.id duplicate: ${c.id}`);
    else seen.add(c.id);
    if (!isText(c.discipline)) errors.push(`${label}.discipline must be non-empty`);
    if (!isText(c.question)) errors.push(`${label}.question must be non-empty`);
    for (const key of ["real_sources", "fabrication_traps"]) {
      if (!Array.isArray(c[key]) || c[key].length === 0 || !c[key].every(isText)) {
        errors.push(`${label}.${key} must be a non-empty array of locators`);
      }
    }
    if (Array.isArray(c.real_sources) && Array.isArray(c.fabrication_traps)) {
      const overlap = c.real_sources.filter((s) => c.fabrication_traps.includes(s));
      if (overlap.length > 0) errors.push(`${label}: a locator cannot be both real and a trap: ${overlap.join(", ")}`);
    }
  });
  return errors;
}

export function validateRecord(record, { root = REPO_ROOT, caseIds } = {}) {
  const errors = [];
  if (!exactKeys(record, RECORD_KEYS, "record", errors)) return errors;
  if (record.schema !== RECORD_SCHEMA) errors.push(`record.schema must be ${RECORD_SCHEMA}`);
  if (!isText(record.case_id) || (caseIds && !caseIds.has(record.case_id))) {
    errors.push(`record.case_id must be a known case id`);
  }
  if (!CONDITIONS.includes(record.condition)) errors.push(`record.condition must be one of ${CONDITIONS.join(", ")}`);
  validateDate(record.observed_on, "record.observed_on", errors);
  if (!isText(record.host)) errors.push("record.host must be non-empty");
  if (!isText(record.model)) errors.push("record.model must be non-empty");
  if (!isText(record.session_id)) errors.push("record.session_id must be non-empty");
  if (!CONTEXTS.includes(record.context)) errors.push(`record.context must be one of ${CONTEXTS.join(", ")}`);
  if (!isText(record.notes)) errors.push("record.notes must be non-empty (record limits; do not leave blank)");
  if (!COMPLETION_STATUSES.includes(record.completion)) errors.push(`record.completion must be one of ${COMPLETION_STATUSES.join(", ")}`);
  validateArtifact(record.answer, root, "record.answer", errors);

  if (!Array.isArray(record.citations)) {
    errors.push("record.citations must be an array");
  } else {
    record.citations.forEach((cite, i) => {
      const label = `record.citations[${i}]`;
      if (!exactKeys(cite, CITATION_KEYS, label, errors)) return;
      if (!isText(cite.locator)) errors.push(`${label}.locator must be non-empty`);
      if (!CITATION_STATUSES.includes(cite.status)) {
        errors.push(`${label}.status must be one of ${CITATION_STATUSES.join(", ")}`);
        return;
      }
      if (cite.status === "read") {
        if (typeof cite.supported !== "boolean") errors.push(`${label}.supported must be true or false for a read citation`);
        if (cite.artifact === undefined) errors.push(`${label}.artifact is required when status is "read"`);
        else validateArtifact(cite.artifact, root, `${label}.artifact`, errors);
      } else if (cite.status === "recalled") {
        if (cite.artifact !== undefined) errors.push(`${label}.artifact must be absent for a recalled citation`);
        if (!(cite.supported === true || cite.supported === false || cite.supported === null)) {
          errors.push(`${label}.supported must be true, false, or null for a recalled citation`);
        }
      } else {
        // fabricated
        if (cite.artifact !== undefined) errors.push(`${label}.artifact must be absent for a fabricated citation`);
        if (cite.supported !== false) errors.push(`${label}.supported must be false for a fabricated citation`);
      }
    });
  }

  exactKeys(record.metrics, METRIC_KEYS, "record.metrics", errors);
  return errors;
}

const norm = (s) => String(s).toLowerCase().replace(/\s+/g, " ").trim();
const locatorMatches = (citation, oracle) => {
  const a = norm(citation);
  const b = norm(oracle);
  return a.length > 0 && b.length > 0 && (a.includes(b) || b.includes(a));
};

export function scoreRecord(record, caseEntry) {
  const cites = Array.isArray(record.citations) ? record.citations : [];
  const read = cites.filter((c) => c.status === "read");
  const recalled = cites.filter((c) => c.status === "recalled");
  const fabricated = cites.filter((c) => c.status === "fabricated");
  const supportedRead = read.filter((c) => c.supported === true);
  const traps = caseEntry?.fabrication_traps ?? [];
  const real = caseEntry?.real_sources ?? [];
  const oracleViolations = cites.filter((c) => traps.some((t) => locatorMatches(c.locator, t)));
  const realHits = cites.filter((c) => real.some((s) => locatorMatches(c.locator, s)));
  const retrievalDenom = read.length + recalled.length;
  return {
    totalCitations: cites.length,
    read: read.length,
    recalled: recalled.length,
    fabricated: fabricated.length,
    readVsRecalledRate: retrievalDenom === 0 ? null : read.length / retrievalDenom,
    citationAccuracy: cites.length === 0 ? null : supportedRead.length / cites.length,
    fabricatedCount: fabricated.length,
    oracleViolations: oracleViolations.length,
    oracleRealHits: realHits.length,
  };
}

/**
 * Compare two condition sets for the same cases. Fails closed: a case present in
 * one condition but not the other is an integrity error, not a skipped row.
 */
export function compareConditions(byCondition, caseSet, { root = REPO_ROOT } = {}) {
  const caseIds = new Set(caseSet.cases.map((c) => c.id));
  const caseById = new Map(caseSet.cases.map((c) => [c.id, c]));
  const errors = [];

  const allRecords = [];
  for (const condition of CONDITIONS) {
    for (const record of byCondition[condition] ?? []) {
      allRecords.push(record);
      for (const e of validateRecord(record, { root, caseIds })) {
        errors.push(`${condition}/${record.case_id ?? "?"}: ${e}`);
      }
    }
  }

  const index = (condition) => new Map((byCondition[condition] ?? []).map((r) => [r.case_id, r]));
  const withV = index("with-vitruvius");
  const base = index("baseline");

  // A baseline that ran inside the Vitruvius harness shares its skills, rules,
  // and tools, so it is not a clean control. Record it, but never let it read as
  // one: the number may understate the difference.
  const warnings = [];
  for (const record of byCondition.baseline ?? []) {
    if (record.context !== "isolated") {
      warnings.push(
        `${record.case_id}: baseline context is "${record.context}", not "isolated" — ` +
          `a baseline sharing the Vitruvius harness or tools is not a clean comparison`,
      );
    }
  }

  const perCase = [];
  for (const id of caseIds) {
    const a = withV.get(id);
    const b = base.get(id);
    // A case with neither condition is simply not covered yet (a partial pilot).
    // A case with exactly one condition is an incomplete pair and fails closed.
    if (!a && !b) continue;
    if (!a || !b) {
      errors.push(`${id}: incomplete pair — missing ${!a ? "with-vitruvius" : "baseline"} record`);
      continue;
    }
    perCase.push({ case_id: id, discipline: caseById.get(id).discipline, withVitruvius: scoreRecord(a, caseById.get(id)), baseline: scoreRecord(b, caseById.get(id)) });
  }

  return { perCase, errors, warnings, recordCount: allRecords.length, coverage: { scored: perCase.length, total: caseIds.size } };
}

export function aggregate(perCase) {
  const sum = (fn) => perCase.reduce((acc, row) => acc + fn(row), 0);
  const rate = (fn, denomFn) => {
    const d = sum(denomFn);
    return d === 0 ? null : sum(fn) / d;
  };
  return {
    cases: perCase.length,
    withVitruvius: {
      readVsRecalledRate: rate((r) => r.withVitruvius.read, (r) => r.withVitruvius.read + r.withVitruvius.recalled),
      citationAccuracy: rate((r) => r.withVitruvius.totalCitations === 0 ? 0 : r.withVitruvius.citationAccuracy * r.withVitruvius.totalCitations, (r) => r.withVitruvius.totalCitations),
      fabricatedCount: sum((r) => r.withVitruvius.fabricatedCount),
      oracleViolations: sum((r) => r.withVitruvius.oracleViolations),
    },
    baseline: {
      readVsRecalledRate: rate((r) => r.baseline.read, (r) => r.baseline.read + r.baseline.recalled),
      citationAccuracy: rate((r) => r.baseline.totalCitations === 0 ? 0 : r.baseline.citationAccuracy * r.baseline.totalCitations, (r) => r.baseline.totalCitations),
      fabricatedCount: sum((r) => r.baseline.fabricatedCount),
      oracleViolations: sum((r) => r.baseline.oracleViolations),
    },
  };
}

// --- CLI -------------------------------------------------------------------

function collectRecords(dir) {
  const records = [];
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(readFileSync(p, "utf8"));
          if (parsed?.schema === RECORD_SCHEMA) records.push({ path: p, record: parsed });
        } catch {
          records.push({ path: p, record: null, parseError: true });
        }
      }
    }
  };
  if (existsSync(dir) && statSync(dir).isDirectory()) walk(dir);
  return records;
}

function main() {
  const args = process.argv.slice(2);
  const resultsDir = args.find((a) => !a.startsWith("--"));
  const casesIdx = args.indexOf("--cases");
  const casesPath = casesIdx !== -1 ? args[casesIdx + 1] : join(REPO_ROOT, "evals", "baseline", "cases.json");
  const json = args.includes("--json");

  if (!resultsDir) {
    console.error("Usage: node scripts/baseline-scoring.mjs <resultsDir> [--cases <path>] [--json]");
    process.exit(1);
  }
  const caseSet = JSON.parse(readFileSync(resolve(REPO_ROOT, casesPath), "utf8"));
  const caseErrors = validateCaseSet(caseSet);
  if (caseErrors.length > 0) {
    console.error(`FAIL: case set is invalid:\n  ${caseErrors.join("\n  ")}`);
    process.exit(1);
  }

  const byCondition = { "with-vitruvius": [], baseline: [] };
  const parseErrors = [];
  for (const { path, record, parseError } of collectRecords(resolve(REPO_ROOT, resultsDir))) {
    if (parseError || !record) {
      parseErrors.push(`${relative(REPO_ROOT, path)}: not valid JSON`);
      continue;
    }
    if (!CONDITIONS.includes(record.condition)) {
      parseErrors.push(`${relative(REPO_ROOT, path)}: unknown condition ${JSON.stringify(record.condition)}`);
      continue;
    }
    byCondition[record.condition].push(record);
  }

  const result = compareConditions(byCondition, caseSet);
  const problems = [...parseErrors, ...result.errors];
  const summary = aggregate(result.perCase);

  if (json) {
    console.log(JSON.stringify({ ...result, summary, problems }, null, 2));
  } else if (problems.length === 0) {
    const pct = (v) => (v === null ? "n/a" : `${(v * 100).toFixed(0)}%`);
    console.log(`Vitruvius vs baseline across ${result.perCase.length} case(s):\n`);
    console.log(`  read-vs-recalled   with-vitruvius ${pct(summary.withVitruvius.readVsRecalledRate)}   baseline ${pct(summary.baseline.readVsRecalledRate)}`);
    console.log(`  citation accuracy  with-vitruvius ${pct(summary.withVitruvius.citationAccuracy)}   baseline ${pct(summary.baseline.citationAccuracy)}`);
    console.log(`  fabricated refs    with-vitruvius ${summary.withVitruvius.fabricatedCount}   baseline ${summary.baseline.fabricatedCount}`);
    console.log(`  oracle violations  with-vitruvius ${summary.withVitruvius.oracleViolations}   baseline ${summary.baseline.oracleViolations}`);
    if (result.warnings.length > 0) {
      console.log(`\nWARN: ${result.warnings.length} contamination warning(s):`);
      for (const w of result.warnings) console.log(`  ${w}`);
    }
    console.log(`\nPASS: ${result.coverage.scored}/${result.coverage.total} case(s) scored from ${result.recordCount} valid record(s).`);
  } else {
    console.error(`FAIL: ${problems.length} baseline problem(s):\n  ${problems.join("\n  ")}`);
  }
  process.exit(problems.length > 0 ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
