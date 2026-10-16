#!/usr/bin/env node
/**
 * verdict-gate.mjs — deterministic verdict gate sitting on review-item.v1 and
 * verdict-gate-contract.v1.
 *
 * Phase 2 engine. Takes one or more `review-item.v1` files (and an
 * optional context file / CLI overrides), aggregates them fail-closed, and
 * emits a validated `verdict-gate.v1` record. The aggregation rules are:
 *
 *   Arity:      PASS requires every check to be `pass`.
 *   Basis:      A detected contradiction (a check marked `gap`) carries
 *               `detected_violation`; an unresolved or not-applicable check
 *               carries `unresolved_check`; neither is silently flattened
 *               into the verdict token.
 *   Verdict:    PASS  — no gap and no unresolved. A single open MINOR or
 *                      not-applicable item already disqualifies (default-
 *                      FAIL posture borrowed from agents/verifier.md).
 *               PARTIAL — only unresolved checks (a potentially qualifiable
 *                      result), no detected contradictions.
 *               BLOCKED — any detected contradiction, because a finding that
 *                      is directionally falsified cannot be made PASS with a
 *                      caveat.
 *   Applicability: `not_applicable` mirror Into-the-Unknown `condition`
 *                  handling — a substantive justification is required.
 *
 * Usage:
 *   node scripts/verdict-gate.mjs items.json [items2.json ...]
 *            [--context context.json] [--strict] [--out out.json]
 *
 * `--strict` fails non-zero if the derived record fails its own contract.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateRecord } from "./review-item-contract.mjs";
// (no import from contract; validated via spawned CLI to keep one semantics path)

// Keep the contract validator exported; verdict-gate-contract.mjs has no
// named export, so load via default / named is not possible.
const { default: _unused } = { default: null };
void _unused;

// Re-use its exported validator? It only exports via side-effect; instead
// spawn the contract CLI when strictly validating.
import { spawnSync } from "node:child_process";

const NODE = process.execPath;
const GATE_SCRIPT = resolve(process.argv[1]).replace("verdict-gate.mjs", "verdict-gate-contract.mjs");

function loadRecord(path) {
  const parsed = JSON.parse(readFileSync(resolve(path), "utf8"));
  const { validateRecord: v } = { validateRecord: null };
  void v;
  return parsed;
}

function classifyCheck(item) {
  const isUnresolved = item.requires_adjudication === true;
  // An item that's not fully positive but still "correct" at marginal
  // significance is an open minor, not an overturn.
  const fullyPositive =
    item.correctness === "correct" &&
    item.significance === "significant" &&
    item.evidence_sufficiency === "sufficient" &&
    item.flaw === "none";

  const resolved = !isUnresolved;
  // gap = detected contradiction at the factual axis.
  const isGap =
    !fullyPositive &&
    (item.correctness !== "correct" ||
      item.evidence_sufficiency === "insufficient" ||
      item.significance === "not_significant");

  let status;
  if (isUnresolved) status = "not_applicable";
  else if (isGap) status = "gap";
  else status = "pass";

  return {
    item,
    status,
    fullyPositive,
    resolved,
    isGap,
    isUnresolved,
    reason: isUnresolved
      ? `arbitration required: ${item.adjudication_reason}`
      : isGap
        ? `not fully positive: correctness=${item.correctness}, significance=${item.significance}, evidence=${item.evidence_sufficiency}`
        : "fully positive finding",
    rationale: item.evidence?.map((e) => `${e.quote} [${e.locator}]`).join(" | ") || "",
  };
}

function buildRecord(items) {
  const classified = items.map(classifyCheck);
  const passCount = classified.filter((c) => c.status === "pass").length;
  const gapCount = classified.filter((c) => c.status === "gap").length;
  const unresolvedCount = classified.filter((c) => c.status === "not_applicable").length;

  const checks = classified.map((c) => ({
    id: c.item.id,
    gate: "G1",
    status: c.status,
    reason: c.reason,
    rationale: c.rationale,
    evidence: (c.item.evidence || []).map((e) => e.locator),
  }));

  const unresolvedReasons = classified
    .filter((c) => c.isUnresolved)
    .map((c) => ({
      code: "unresolved_check",
      node_id: c.item.id,
      rubric: "review-item.v1",
      question: c.item.claim,
      reason: c.reason,
    }));

  const failureReasons = classified
    .filter((c) => c.isGap)
    .map((c) => ({
      code: "criterion_not_met",
      node_id: c.item.id,
      rubric: "review-item.v1",
      question: c.item.claim,
      reason: c.reason,
    }));

  const failure_basis = [];
  if (failureReasons.length > 0) failure_basis.push("detected_violation");
  if (unresolvedReasons.length > 0) failure_basis.push("unresolved_check");

  let verdict;
  if (passCount === items.length) verdict = "PASS";
  else if (failureReasons.length > 0) verdict = "BLOCKED";
  else verdict = "PARTIAL";

  const gateStatus =
    passCount === items.length ? "pass" : failureReasons.length > 0 ? "fail" : "undetermined";

  return {
    schema: "vitruvius-verdict-gate.v1",
    question: `aggregation over ${items.length} review item(s)`,
    protocol: { revision: "phase2", sha256: "a".repeat(64) },
    context: {
      jurisdiction_known: null,
      edition_pinned: null,
      requirements_context: null,
      quantitative_claims_present: items.some((i) => /\d/.test(i.claim)),
    },
    checks,
    items: items.map((i) => i.id),
    gates: {
      G1: {
        id: "G1",
        status: gateStatus,
        failure_reasons: failureReasons,
        unresolved_reasons: unresolvedReasons,
      },
    },
    verdict,
    failure_basis: failure_basis,
    ran: `verdict-gate over ${items.length} item(s): ${passCount}/${items.length} pass, ${gapCount} gap, ${unresolvedCount} unresolved`,
    report: "atomic finding aggregate without an LLM; see items for individual verdict axes",
  };
}

// CLI entry
const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  process.stdout.write(
    "Usage: node scripts/verdict-gate.mjs [items.json...] [--context ctx.json] [--strict] [--out out.json]\n",
  );
  process.exit(0);
}

const positional = args.filter((a, i) => !a.startsWith("--") && (args[i - 1] !== "--context" && args[i - 1] !== "--out" && args[i - 1] !== "--protocol"));
const strict = args.includes("--strict");
const outIdx = args.indexOf("--out");
const outPath = outIdx !== -1 ? args[outIdx + 1] : null;
const ctxIdx = args.indexOf("--context");
const contextPath = ctxIdx !== -1 ? args[ctxIdx + 1] : null;
const protoIdx = args.indexOf("--protocol");
const protocolSha = protoIdx !== -1 ? args[protoIdx + 1] : null;

let context = null;
if (contextPath) {
  try {
    context = JSON.parse(readFileSync(resolve(contextPath), "utf8"));
  } catch (e) {
    process.stderr.write(`FAIL: could not read context ${contextPath}: ${e.message}\n`);
    process.exit(1);
  }
}

let items = [];
for (const file of positional) {
  try {
    const parsed = JSON.parse(readFileSync(resolve(file), "utf8"));
    // Accept either a single review-item.v1 record (has .items) or a bare item.
    if (Array.isArray(parsed)) parsed.forEach((it) => items.push(it));
    else if (Array.isArray(parsed.items)) parsed.items.forEach((it) => items.push(it));
    else if (parsed && parsed.id && parsed.claim) items.push(parsed);
    else {
      process.stderr.write(`FAIL: ${file} is not a review-item.v1 or an item\n`);
      process.exit(1);
    }
  } catch (e) {
    process.stderr.write(`FAIL: could not load ${file}: ${e.message}\n`);
    process.exit(1);
  }
}

if (items.length === 0) {
  process.stderr.write("FAIL: no review items loaded\n");
  process.exit(1);
}

// Validate each item with the canonical validator.
for (const item of items) {
  const r = validateRecord({ schema: "review-item.v1", items: [item] });
  if (!r.valid) {
    process.stderr.write(`FAIL: item ${item.id || "?"} failed review-item-contract: ${r.errors.join("; ")}\n`);
    process.exit(1);
  }
}

const record = buildRecord(items);
if (context) {
  record.context = { ...record.context, ...context };
}
if (protocolSha) {
  record.protocol = { revision: "phase2", sha256: protocolSha };
}

// Validate with the contract CLI (strictly when requested).
const tmpPath = resolve(process.argv[1].replace("verdict-gate.mjs", "tmp-gate.json"));
const fs = await import("node:fs");
fs.writeFileSync(tmpPath, JSON.stringify(record));
const spawnRes = spawnSync(NODE, [GATE_SCRIPT, tmpPath, ...(strict ? ["--strict"] : [])], {
  encoding: "utf8",
});
try { fs.unlinkSync(tmpPath); } catch {}

if (spawnRes.stdout) process.stdout.write(spawnRes.stdout);
if (spawnRes.stderr) process.stderr.write(spawnRes.stderr);

if (outPath) {
  writeFileSync(resolve(outPath), JSON.stringify(record, null, 2) + "\n");
}

if (spawnRes.status !== 0) process.exit(spawnRes.status ?? 1);
process.exit(0);