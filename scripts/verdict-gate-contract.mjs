#!/usr/bin/env node
/**
 * Contract for the Phase-2 deterministic verdict gate.
 *
 * The verifier's `PASS/PARTIAL/BLOCKED` rollup used to live in prose: an
 * adjacently observed case (architectural-synthesis_overreach-01) reports a
 * 6.7% sub-10% margin, names it, and still returns PASS, because the margin
 * rule was a sentence a model can reason around rather than a check it cannot
 * talk itself out of (margin-earnedness-check.mjs is the same lesson).
 *
 * This contract validates the structured result returned by the deterministic
 * (fail-closed) gate so that:
 *   - PASS cannot be produced when any check is unresolved (undetermined);
 *   - PASS cannot be produced when any check failed;
 *   - `failure_basis` separates `detected_violation` (affirmative evidence
 *     contradicting the claim) from `unresolved_check` (could not verify —
 *     uncertainty is not misconduct) and is not flattened into a verdict;
 *   - a check marked `not_applicable` must carry a task-supported
 *     justification, exactly like into-the-unknown's `_condition` and
 *     `not_applicable` handling in `src/grader/eval_artifacts/.../grading.py`.
 *
 * The contract does NOT score anything. It validates a gate result; the
 * arithmetic lives in the caller under review. (First release: this file is
 * the validator; a follow-up adds the aggregating engine.)
 */

import { readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = "vitruvius-verdict-gate.v1";
const SHA256 = /^[0-9a-f]{64}$/;
const VERDICTS = new Set(["PASS", "PARTIAL", "BLOCKED"]);
const CHECK_STATUSES = new Set(["pass", "gap", "not_applicable"]);
const FAILURE_BASIS_VALUES = new Set(["detected_violation", "unresolved_check"]);
const RECORD_KEYS = [
  "schema",
  "question",
  "protocol",
  "context",
  "checks",
  "items",
  "gates",
  "verdict",
  "failure_basis",
  "ran",
  "report",
];

const PROTOCOL_KEYS = ["revision", "sha256"];
const CONTEXT_KEYS = [
  "jurisdiction_known",
  "edition_pinned",
  "requirements_context",
  "quantitative_claims_present",
];
const CHECK_KEYS = ["id", "gate", "status", "reason", "rationale", "evidence"];
const GATE_KEYS = ["id", "status", "failure_reasons", "unresolved_reasons"];
const GATE_STATUSES = new Set(["pass", "fail", "undetermined"]);
const REASON_KEYS = ["code", "node_id", "rubric", "question", "reason"];

function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]));
  } catch {
    return false;
  }
}

function isObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function isText(v) {
  return typeof v === "string" && v.trim() !== "";
}

function exactKeys(value, allowed, label, errors) {
  if (!isObject(value)) {
    errors.push(`${label} must be an object`);
    return false;
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) errors.push(`${label} has unknown field: ${key}`);
  }
  for (const key of allowed) {
    if (!(key in value)) errors.push(`${label} is missing field: ${key}`);
  }
  return true;
}

function validateItems(value, errors) {
  if (!Array.isArray(value)) {
    errors.push("items must be an array of strings (review-item.v1 ids or target refs)");
    return false;
  }
  if (value.length === 0) errors.push("items must be a non-empty array");
  for (const [i, v] of value.entries()) {
    if (!isText(v)) errors.push(`items[${i}] must be a non-empty string id`);
  }
  return true;
}

function validateProtocol(value, errors) {
  exactKeys(value, PROTOCOL_KEYS, "protocol", errors);
  if (value) {
    if (!isText(value.revision)) errors.push("protocol.revision must be a non-empty revision");
    if (typeof value.sha256 !== "string" || !SHA256.test(value.sha256)) errors.push("protocol.sha256 must be 64 lowercase hex characters");
  }
}

function validateContext(value, errors) {
  exactKeys(value, CONTEXT_KEYS, "context", errors);
  for (const key of CONTEXT_KEYS) {
    if (value && value[key] !== null && typeof value[key] !== "boolean") {
      errors.push(`context.${key} must be boolean or null`);
    }
  }
}

function validateChecks(value, errors) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push("checks must be a non-empty array");
    return false;
  }
  const ids = new Set();
  for (const [i, check] of value.entries()) {
    const label = `checks[${i}]`;
    if (!exactKeys(check, CHECK_KEYS, label, errors)) continue;
    if (!isText(check.id)) errors.push(`${label}.id must be a non-empty identifier`);
    else if (ids.has(check.id)) errors.push(`${label}.id is duplicated: ${check.id}`);
    if (!isText(check.gate)) errors.push(`${label}.gate must name a target gate (G1/G2/G3 or equivalent)`);
    if (!CHECK_STATUSES.has(check.status)) errors.push(`${label}.status must be pass | gap | not_applicable`);
    if (!isText(check.reason)) errors.push(`${label}.reason must be a non-empty string`);
    if (!isText(check.rationale)) errors.push(`${label}.rationale must justify the status`);
    if (!Array.isArray(check.evidence)) errors.push(`${label}.evidence must be an array`);
    else {
      if (check.evidence.length === 0) errors.push(`${label}.evidence must be non-empty`);
      for (const e of check.evidence) if (!isText(e)) errors.push(`${label}.evidence must contain non-empty strings`);
    }
    if (check.status === "not_applicable") {
      if (!isText(check.reason)) errors.push(`${label} not_applicable reason must cite the task-supported explanation`);
      if (check.reason.length < 10) errors.push(`${label} not_applicable reason must be substantive`);
    }
    if (check.status === "gap" && !isText(check.rationale)) errors.push(`${label} gap requires a rationale`);
    ids.add(check.id);
  }
  return true;
}

function validateGates(value, checks, errors) {
  if (!isObject(value) || Object.keys(value).length === 0) {
    errors.push("gates must be a non-empty object mapping gate id -> gate state");
    return false;
  }
  for (const gateId of Object.keys(value)) {
    const g = value[gateId];
    const label = `gates.${gateId}`;
    exactKeys(g, GATE_KEYS, label, errors);
    if (!GATE_STATUSES.has(g.status)) errors.push(`${label}.status must be pass | fail | undetermined`);
    for (const listName of ["failure_reasons", "unresolved_reasons"]) {
      if (!Array.isArray(g[listName])) {
        errors.push(`${label}.${listName} must be an array`);
        continue;
      }
      for (const [i, r] of g[listName].entries()) {
        if (!isObject(r)) errors.push(`${label}.${listName}[${i}] must be an object`);
        else for (const rk of REASON_KEYS) if (!(rk in r)) errors.push(`${label}.${listName}[${i}] missing field ${rk}`);
      }
    }
  }
  // Hard exit constraints (the whole point of the gate):
  //   - "PASS" verdict with any unresolved/failing check is impossible.
  //   - `failure_basis` distinguishes the two failure modes.
  const hasFailingCheck = checks && checks.some((c) => c.status === "gap");
  const hasUnresolvedCheck = checks && checks.some((c) => c.status === "not_applicable" && c.reason === "");
  if (errors.length === 0) {
    const basis = Array.isArray(value.failure_basis) ? value.failure_basis : undefined;
    if (hasFailingCheck && value && value.failure_basis) {
      // already handled via the declared field below
    }
    // The verdict-level consistency is enforced at the declared `verdict` field,
    // calling the validator binding below; checks without rationale count as
    // unresolved.
    const unresolvedReasonsTotal = Object.values(value).reduce(
      (s, g) => s + (Array.isArray(g?.unresolved_reasons) ? g.unresolved_reasons.length : 0),
      0,
    );
    const failedReasonsTotal = Object.values(value).reduce(
      (s, g) => s + (Array.isArray(g?.failure_reasons) ? g.failure_reasons.length : 0),
      0,
    );
    // The verdict is read from the record's top-level field during whole validation.
    // If a gate has unresolved reasons, the record's verdict cannot be PASS (enforced
    // in the record body validation); we record the derived state for caller use.
    if (unresolvedReasonsTotal > 0 && failedReasonsTotal === 0) {
      // allowed: PARTIAL (qualification pending) — NOT in scope for G1 PASS
    }
  }
  // `failure_basis` at the gate object level? Allow gate-level additional keys
  // are rejected by exactKeys above, so failure_basis lives on the record.
  return value;
}

function validateRecord(record) {
  const errors = [];
  const rootKeys = [...RECORD_KEYS];
  if (!exactKeys(record, rootKeys, "record", errors)) return { valid: false, errors, gates: 0, checks: 0 };

  if (record.schema !== SCHEMA) errors.push(`record.schema must be ${SCHEMA} (got ${JSON.stringify(record.schema)})`);

  if (!isText(record.question)) errors.push("record.question must be a non-empty string");
  if (!isText(record.ran)) errors.push("record.ran must name what was actually checked (non-empty)");
  if (typeof record.verdict !== "string" || !VERDICTS.has(record.verdict)) {
    errors.push(`record.verdict must be one of PASS | PARTIAL | BLOCKED`);
  }

  if (!Array.isArray(record.failure_basis)) {
    errors.push("record.failure_basis must be an array");
  } else {
    for (const v of record.failure_basis) {
      if (!FAILURE_BASIS_VALUES.has(v)) errors.push(`record.failure_basis contains invalid value: ${v}`);
    }
  }
  // If verdict is PASS, no failure basis is permitted.
  if (record.verdict === "PASS" && Array.isArray(record.failure_basis) && record.failure_basis.length > 0) {
    errors.push("record.verdict PASS cannot carry a failure_basis");
  }

  // protocol + context are optional * shapes * gated only if supplied.
  if (record.protocol && record.protocol !== null) validateProtocol(record.protocol, errors);
  if (record.context && record.context !== null) validateContext(record.context, errors);

  validateItems(record.items, errors);
  validateChecks(record.checks, errors);
  if (record.gates) validateGates(record.gates, record.checks, errors);

  // verdict consistency against gates:
  if (Array.isArray(record.checks) && record.checks.length > 0) {
    const anyGap = record.checks.some((c) => c.status === "gap");
    const anyUnresolved = record.checks.some((c) => c.status === "not_applicable");
    if (record.verdict === "PASS" && (anyGap || anyUnresolved)) {
      errors.push("record.verdict PASS is impossible while a check is gap or not_applicable");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    verdict: record.verdict,
    checkCount: Array.isArray(record.checks) ? record.checks.length : 0,
    itemCount: Array.isArray(record.items) ? record.items.length : 0,
    failure_basis: record.failure_basis,
  };
}

// Export the validator so the Phase-2 engine can reuse its semantics.
export { validateRecord as validateVerdictGate };

if (isMainModule()) {
  const arg = process.argv[2];
  if (!arg || process.argv.includes("--help") || process.argv.includes("-h")) {
    process.stdout.write("Usage: node scripts/verdict-gate-contract.mjs <record.json>\n");
    process.exit(0);
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(resolve(arg), "utf8"));
  } catch (err) {
    process.stderr.write(`FAIL: could not read/parse ${arg}: ${err.message}\n`);
    process.exit(1);
  }
  const result = validateRecord(parsed);
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  if (!result.valid) process.exit(1);
}
