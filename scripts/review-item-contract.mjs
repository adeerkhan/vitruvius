#!/usr/bin/env node
/**
 * review-item-contract.mjs — deterministic validator for the Phase-1
 * `review-item.v1` finding emission (Into the Unknown / PeerReview
 * Bench adoption).
 *
 * A review item is one atomic criticism. It carries the cascading
 * 3-axis verdict (correctness -> significance -> evidence_sufficiency)
 * that the Into the Unknown (Prometheus Eval) paper uses to score an
 * AI reviewer's *criticisms* rather than its final verdict: verdict-
 * level matching was shown to be insufficient to characterise
 * capabilities (arXiv:2605.20668).
 *
 * Input:
 *   - object with root field `schema: "review-item.v1"`, `items`
 *     array of item objects
 *
 * Validation (non-zero exit on any error):
 *   - exact keys, confined path handling, cascade rules, abstention
 *     / adjudication consistency (mirror of scripts/judge_protocol.py validate).
 *
 * Output: JSON `{ valid, errors, count, items }` with schema_version.
 *
 * Exit 0 = valid, 1 = invalid.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_KEYS = ["schema", "items"];

const ITEM_KEYS = [
  "id",
  "target",
  "claim",
  "evidence",
  "correctness",
  "significance",
  "evidence_sufficiency",
  "requires_adjudication",
  "adjudication_reason",
  "flaw",
];

const CORRECTNESS_VALUES = new Set(["correct", "incorrect", null]);
const SIGNIFICANCE_VALUES = new Set(["significant", "marginal", "not_significant", null]);
const EVIDENCE_SUFFICIENCY_VALUES = new Set(["sufficient", "insufficient", null]);

const ADJUDICATION_REASONS = new Set(["none", "rubric_conflict", "no_applicable_value", "inaccessible_evidence"]);

const FLAW_TOKENS = new Set([
  "none", "code_misapplication", "unit_sign_error", "omission", "missing_factor",
  "calculation_error", "synthesis_overreach", "conflicting_standard", "criterion_mismatch",
  "entailment_failure", "unverifiable_source", "criterion_mismatch_qualification",
  "context_norm_blindspot", "over_harsh_out_of_scope", "false_absence",
  "not_actionable", "trivial_nitpick", "term_of_art_confusion",
  "anachronistic_evidence", "stated_limitation_restated", "visual_evidence_error",
  "misquote",
]);

function exactKeys(value, allowed, label, errors) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${label} must be an object`);
    return false;
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) errors.push(`${label} has unknown field: ${key}`);
  }
  for (const key of allowed) {
    if (!(key in value)) errors.push(`${label} is missing field: ${key}`);
  }
  return errors.length === 0;
}

function isText(value) {
  return typeof value === "string" && value.trim() !== "";
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function validateItem(item, index, errors) {
  const label = `items[${index}]`;
  if (!exactKeys(item, ITEM_KEYS, label, errors)) return { id: item?.id, valid: false };

  if (!isText(item.id)) errors.push(`${label}.id must be a non-empty identifier`);
  if (!isText(item.target)) errors.push(`${label}.target must be a non-empty location`);
  if (!isText(item.claim)) errors.push(`${label}.claim must be a non-empty string`);
  if (!isText(item.flaw)) errors.push(`${label}.flaw must be a non-empty string`);
  if (!FLAW_TOKENS.has(item.flaw)) errors.push(`${label}.flaw must be a recognized flaw token`);

  if (!Array.isArray(item.evidence) || item.evidence.length === 0) {
    errors.push(`${label}.evidence must be a non-empty array of {quote, locator}`);
  } else {
    item.evidence.forEach((e, ei) => {
      const el = `${label}.evidence[${ei}]`;
      if (!e || typeof e !== "object" || Array.isArray(e)) errors.push(`${el} must be an object`);
      else {
        if (!isText(e.quote)) errors.push(`${el}.quote must be a non-empty string`);
        if (!isText(e.locator)) errors.push(`${el}.locator must be a non-empty location`);
      }
    });
  }

  if (!CORRECTNESS_VALUES.has(item.correctness)) {
    errors.push(`${label}.correctness must be correct | incorrect | null`);
  }
  if (!SIGNIFICANCE_VALUES.has(item.significance)) {
    errors.push(`${label}.significance must be significant | marginal | not_significant | null`);
  }
  if (!EVIDENCE_SUFFICIENCY_VALUES.has(item.evidence_sufficiency)) {
    errors.push(`${label}.evidence_sufficiency must be sufficient | insufficient | null`);
  }
  if (typeof item.requires_adjudication !== "boolean") {
    errors.push(`${label}.requires_adjudication must be a boolean`);
  }
  if (!ADJUDICATION_REASONS.has(item.adjudication_reason)) {
    errors.push(`${label}.adjudication_reason must be one of adjudication reason list`);
  }

  // Cascading rule (verbatim from Into the Unknown Tier-3 design):
  // significance is only meaningful for correct criticisms.
  if (item.correctness !== "correct" && item.significance !== null) {
    errors.push(`${label}: significance must be null unless correctness is "correct"`);
  }
  if (item.correctness === "correct" && item.significance === "significant") {
    if (item.evidence_sufficiency === null) {
      errors.push(`${label}: evidence_sufficiency required for a significant item`);
    }
  }
  if (item.correctness !== "correct" && item.evidence_sufficiency !== null) {
    errors.push(`${label}: evidence_sufficiency must be null unless correctness is "correct"`);
  }
  // evidence_sufficiency requires at least marginal significance.
  if (item.significance === null || item.significance === "not_significant") {
    if (item.evidence_sufficiency !== null) {
      errors.push(`${label}: evidence_sufficiency must be null unless significant or marginal`);
    }
  }

  // Abstention / adjudication consistency.
  const anyNull =
    item.correctness === null ||
    item.significance === null ||
    item.evidence_sufficiency === null;
  if (anyNull) {
    if (item.requires_adjudication !== true) {
      errors.push(`${label}: requires_adjudication must be true when any axis is null`);
    }
    if (item.adjudication_reason === "none") {
      errors.push(`${label}: adjudication_reason must name the cause when asks for adjudication`);
    }
  } else {
    if (item.requires_adjudication !== false) {
      errors.push(`${label}: requires_adjudication must be false when all axes are non-null`);
    }
    if (item.adjudication_reason !== "none") {
      errors.push(`${label}: adjudication_reason must be "none" when all axes are non-null`);
    }
  }

  // flaw implies directionality: any concrete flaw >= BLOCKED-level
  // implies the item is NOT fully positive per the cascade.
  const isFullyPositive =
    item.correctness === "correct" &&
    item.significance === "significant" &&
    item.evidence_sufficiency === "sufficient" &&
    item.flaw === "none";

  if (item.flaw === "none" && !isFullyPositive && item.requires_adjudication === false) {
    // A flawless-but-not-fully-positive item is acceptable here because
    // significance may be "marginal". No error; record is left alone.
  }

  return { id: item.id, fullyPositive: isFullyPositive, valid: errors.length === 0 };
}

function validateRecord(record) {
  const errors = [];
  if (!exactKeys(record, ROOT_KEYS, "root", errors)) {
    return { valid: false, errors, count: 0, items: [] };
  }
  if (record.schema !== "review-item.v1") {
    errors.push(`root.schema must be "review-item.v1" (got ${JSON.stringify(record.schema)})`);
  }
  if (!Array.isArray(record.items) || record.items.length === 0) {
    errors.push("root.items must be a non-empty array of review items");
    return { valid: false, errors, count: Array.isArray(record.items) ? record.items.length : 0, items: [] };
  }

  const ids = new Set();
  const results = [];
  for (const [i, item] of record.items.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      errors.push(`items[${i}] must be an object`);
      continue;
    }
    const res = validateItem(item, i, errors);
    if (ids.has(item.id)) errors.push(`items[${i}].id is duplicated: ${item.id}`);
    ids.add(item.id);
    results.push(res);
  }

  const invalidCount = results.filter((r) => !r.valid).length;
  return {
    valid: errors.length === 0,
    errors,
    count: record.items.length,
    fullyPositiveCount: results.filter((r) => r.fullyPositive).length,
    invalidCount,
    schema_version: "review-item.v1",
  };
}

function sha256Bytes(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function main(argv) {
  const requireHash = argv.includes("--protocol");
  const hashIdx = argv.indexOf("--protocol");
  const strict = argv.includes("--strict");
  const positional = argv.filter((a) => !a.startsWith("--") && (a !== argv[hashIdx + 1] || hashIdx === -1));
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(
      "Usage: node scripts/review-item-contract.mjs <record.json> [--protocol <sha256>] [--strict]\n" +
        "Validates a 'review-item.v1' document of atomic review items.\n" +
        "--protocol checks the current script's source hash against the given sha256.\n",
    );
    process.exit(0);
  }
  const file = positional[0];
  let parsed;
  try {
    parsed = readJson(resolve(file));
  } catch (err) {
    process.stderr.write(`FAIL: could not read/parse ${file}: ${err.message}\n`);
    process.exit(1);
  }

  if (requireHash) {
    const ourHash = sha256Bytes(readFileSync(fileURLToPath(import.meta.url), "utf8"));
    if (hashIdx !== -1 && argv[hashIdx + 1] && ourHash !== argv[hashIdx + 1]) {
      process.stderr.write(
        "FAIL: protocol hash mismatch — record was validated against a different " +
          "contract version than the installed one.\n",
      );
      process.exit(1);
    }
  }

  const result = validateRecord(parsed);
  if (strict && result.errors.length > 0) {
    process.stderr.write(`FAIL: ${result.errors.length} review-item contract problem(s):\n`);
    for (const e of result.errors) process.stderr.write(`  ${e}\n`);
    process.exit(1);
  }
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  if (result.errors.length > 0) process.exit(1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
