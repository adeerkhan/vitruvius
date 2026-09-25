#!/usr/bin/env node
/**
 * Contract for a real-question V1 field pilot.
 *
 * It records observations and retained evidence; it does not fetch sources,
 * grade research quality, or turn a pilot into a product claim.
 */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { validateGoalCheck } from "./goal-check-contract.mjs";
import { parseMachineVerdict } from "./verifier-parser.mjs";

const SCHEMA = "vitruvius-field-pilot.v1";
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const TOP_KEYS = ["schema", "pilot_id", "question", "observed_on", "host", "model", "session_id", "sources", "plan", "final", "provenance", "verifier", "goal_check", "metrics", "completion"];
const ARTIFACT_KEYS = ["path", "sha256", "bytes"];
const SOURCE_KEYS = ["id", "kind", "locator", "status", "accessed_on", "artifact", "blocked_reason", "unblock_path"];
const METRIC_KEYS = ["wall_time_minutes", "wall_time_status", "cost_usd", "cost_status", "user_corrections", "decision_outcome", "notes"];
const DECISION_OUTCOMES = new Set(["useful", "not_useful", "unknown"]);
const COMPLETION_STATUSES = new Set(["complete", "partial", "blocked"]);

function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]));
  } catch {
    return false;
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isText(value) {
  return typeof value === "string" && value.trim() !== "";
}

function exactKeys(value, allowed, label, errors) {
  if (!isObject(value)) {
    errors.push(`${label} must be an object`);
    return false;
  }
  for (const key of Object.keys(value)) if (!allowed.includes(key)) errors.push(`${label} has unknown field: ${key}`);
  return true;
}

function isSafeRelativePath(value) {
  if (!isText(value) || isAbsolute(value) || value.includes("\\")) return false;
  const normalized = value.replaceAll("\\", "/");
  if (normalized.startsWith("/") || normalized.includes(":")) return false;
  return normalized.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

function isInside(root, candidate) {
  const pathFromRoot = relative(root, candidate);
  return !isAbsolute(pathFromRoot) && pathFromRoot !== ".." && !pathFromRoot.startsWith(`..${sep}`);
}

function physicalKey(repoRoot, value) {
  try {
    const real = realpathSync(resolve(repoRoot, value));
    return process.platform === "win32" ? real.toLowerCase() : real;
  } catch {
    return null;
  }
}

function samePhysicalPath(repoRoot, left, right) {
  const leftKey = physicalKey(repoRoot, left);
  const rightKey = physicalKey(repoRoot, right);
  return leftKey !== null && rightKey !== null && leftKey === rightKey;
}

function resolveFile(repoRoot, value, label, errors) {
  if (!isSafeRelativePath(value)) {
    errors.push(`${label} must be a confined repository-relative regular file`);
    return null;
  }
  const root = resolve(repoRoot);
  const expected = resolve(root, value);
  try {
    const rootReal = realpathSync(root);
    const stat = lstatSync(expected);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      errors.push(`${label} must be a regular non-symlink file`);
      return null;
    }
    const actual = realpathSync(expected);
    if (actual !== resolve(rootReal, value) || !isInside(rootReal, actual)) {
      errors.push(`${label} must be a confined regular file`);
      return null;
    }
    return expected;
  } catch (error) {
    errors.push(`${label} could not be read: ${error.message}`);
    return null;
  }
}

function validateDate(value, label, errors) {
  if (!isText(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    errors.push(`${label} must be a real ISO date`);
    return;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) errors.push(`${label} must be a real ISO date`);
}

function validateArtifact(artifact, repoRoot, label, errors) {
  if (!exactKeys(artifact, ARTIFACT_KEYS, label, errors)) return null;
  const path = resolveFile(repoRoot, artifact.path, `${label}.path`, errors);
  if (!SHA256_PATTERN.test(artifact.sha256)) errors.push(`${label}.sha256 must be 64 lowercase hex characters`);
  if (!Number.isInteger(artifact.bytes) || artifact.bytes < 1) errors.push(`${label}.bytes must be a positive integer`);
  if (path) {
    const bytes = readFileSync(path);
    if (SHA256_PATTERN.test(artifact.sha256) && createHash("sha256").update(bytes).digest("hex") !== artifact.sha256) errors.push(`${label} hash mismatch`);
    if (Number.isInteger(artifact.bytes) && artifact.bytes !== bytes.length) errors.push(`${label} byte count mismatch`);
  }
  return path;
}

function parseVerifierReport(text) {
  const errors = [];
  const headers = [...text.matchAll(/^\s*## Verdict:\s*(PASS|PARTIAL|BLOCKED)\s*$/gim)].map((match) => match[1].toUpperCase());
  const machineLines = [...text.matchAll(/^\s*#*\s*MACHINE_VERDICT:.*$/gim)].map((match) => match[0]);
  if (headers.length !== 1) errors.push("verifier must contain exactly one Verdict header");
  if (machineLines.length !== 1) errors.push("verifier must contain exactly one strict MACHINE_VERDICT line");
  const parsed = machineLines.length === 1 ? parseMachineVerdict(machineLines[0]) : null;
  if (machineLines.length === 1 && !parsed) errors.push("MACHINE_VERDICT does not match the canonical verifier grammar");
  if (headers[0] && parsed && headers[0] !== parsed.verdict) errors.push("verifier header and MACHINE_VERDICT must agree");
  return { valid: errors.length === 0, errors, verdict: headers[0], machineVerdict: parsed?.verdict };
}

function validateSource(source, index, repoRoot, errors) {
  const label = `sources[${index}]`;
  if (!exactKeys(source, SOURCE_KEYS, label, errors)) return "invalid";
  if (!/^SRC-[A-Z0-9-]+$/.test(source.id)) errors.push(`${label}.id must use a SRC- identifier`);
  if (!isText(source.kind) || !isText(source.locator)) errors.push(`${label} requires kind and locator`);
  validateDate(source.accessed_on, `${label}.accessed_on`, errors);
  if (source.status === "read") {
    if (source.blocked_reason !== null || source.unblock_path !== null) errors.push(`${label} block fields must be null for a read source`);
    if (!isObject(source.artifact)) errors.push(`${label} read source requires an artifact object`);
    else validateArtifact(source.artifact, repoRoot, `${label}.artifact`, errors);
  } else if (source.status === "blocked") {
    if (source.artifact !== null) errors.push(`${label}.artifact must be null for a blocked source`);
    if (!isText(source.blocked_reason)) errors.push(`${label}.blocked_reason must explain the block`);
    if (!isText(source.unblock_path)) errors.push(`${label}.unblock_path must state how to unblock the source`);
  } else {
    errors.push(`${label}.status must be read or blocked`);
  }
  return source.status;
}

export function validateFieldPilot(record, { repoRoot } = {}) {
  const errors = [];
  if (!repoRoot) return { valid: false, errors: ["repoRoot is required"], sourceCount: 0 };
  if (!exactKeys(record, TOP_KEYS, "pilot", errors)) return { valid: false, errors, sourceCount: 0 };
  if (record.schema !== SCHEMA) errors.push(`schema must be ${SCHEMA}`);
  if (typeof record.pilot_id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.pilot_id)) errors.push("pilot_id must be a lowercase hyphenated slug");
  if (!isText(record.question) || !isText(record.host) || !isText(record.model) || !isText(record.session_id)) errors.push("question, host, model, and session_id must be non-empty");
  validateDate(record.observed_on, "observed_on", errors);

  const sourceStatuses = [];
  if (!Array.isArray(record.sources) || record.sources.length === 0) errors.push("sources must be a non-empty array");
  else record.sources.forEach((source, index) => sourceStatuses.push(validateSource(source, index, repoRoot, errors)));
  const sourceIds = new Set();
  for (const source of Array.isArray(record.sources) ? record.sources : []) {
    if (source?.id && sourceIds.has(source.id)) errors.push(`duplicate source id: ${source.id}`);
    sourceIds.add(source.id);
  }

  const finalPath = validateArtifact(record.final, repoRoot, "final", errors);
  validateArtifact(record.plan, repoRoot, "plan", errors);
  validateArtifact(record.provenance, repoRoot, "provenance", errors);
  const verifierPath = validateArtifact(record.verifier, repoRoot, "verifier", errors);
  const goalPath = validateArtifact(record.goal_check, repoRoot, "goal_check", errors);
  let verifierReport = null;
  if (verifierPath) {
    const verifierText = readFileSync(verifierPath, "utf8");
    verifierReport = parseVerifierReport(verifierText);
    errors.push(...verifierReport.errors);
    if (!/Evidence Trail/i.test(verifierText)) errors.push("verifier artifact must contain Evidence Trail");
  }
  let goalRecord = null;
  if (goalPath) {
    try {
      goalRecord = JSON.parse(readFileSync(goalPath, "utf8"));
      const goalReport = validateGoalCheck(goalRecord, { repoRoot, recordPath: record.goal_check.path });
      errors.push(...goalReport.errors.map((error) => `goal_check: ${error}`));
      if (record.completion === "complete" && !goalReport.promotable) errors.push("complete pilot requires a promotable goal_check");
      if (record.completion !== "complete" && goalReport.valid && goalReport.verdict === "DONE" && !goalReport.promotable) errors.push("incomplete pilot cannot claim a promotable goal_check");
      if (goalRecord.question !== record.question) errors.push("goal_check question does not match pilot question");
      for (const [outerLabel, outer, inner] of [
        ["final", record.final, goalRecord.final],
        ["provenance", record.provenance, { path: goalRecord.provenance_path }],
        ["plan", record.plan, { path: goalRecord.plan_path }],
      ]) {
        if (!outer || !inner || !samePhysicalPath(repoRoot, outer.path, inner.path)) errors.push(`goal_check ${outerLabel} path does not match pilot artifact`);
      }
      if (goalRecord.final && record.final && (goalRecord.final.sha256 !== record.final.sha256 || goalRecord.final.bytes !== record.final.bytes)) errors.push("goal_check final binding does not match pilot artifact");
    } catch (error) {
      errors.push(`goal_check could not be parsed: ${error.message}`);
    }
  }

  const artifactPaths = [record.plan?.path, record.final?.path, record.provenance?.path, record.verifier?.path, record.goal_check?.path, ...(record.sources ?? []).filter((source) => source?.status === "read").map((source) => source.artifact?.path)].filter(Boolean);
  const physicalArtifactPaths = artifactPaths.map((path) => physicalKey(repoRoot, path)).filter(Boolean);
  if (new Set(physicalArtifactPaths).size !== physicalArtifactPaths.length) errors.push("plan, final, provenance, verifier, goal_check, and retained sources must be physically distinct artifacts");
  if (record.final?.path && record.provenance?.path) {
    const finalRelative = record.final.path.replaceAll("\\", "/");
    const provenanceRelative = record.provenance.path.replaceAll("\\", "/");
    const finalDir = physicalKey(repoRoot, record.final.path) ? dirname(physicalKey(repoRoot, record.final.path)) : dirname(finalRelative);
    const provenanceDir = physicalKey(repoRoot, record.provenance.path) ? dirname(physicalKey(repoRoot, record.provenance.path)) : dirname(provenanceRelative);
    if (finalDir !== provenanceDir || provenanceRelative !== `${finalRelative.replace(/\.md$/i, "")}.provenance.md`) errors.push("final and provenance must be adjacent with the expected sidecar name");
  }
  if (samePhysicalPath(repoRoot, record.plan?.path, record.final?.path) || samePhysicalPath(repoRoot, record.provenance?.path, record.final?.path)) errors.push("plan and provenance must be physically distinct from final");
  if (verifierReport?.valid && record.completion === "complete" && verifierReport.verdict !== "PASS") errors.push("complete pilot requires verifier verdict PASS");
  if (verifierReport?.verdict === "BLOCKED" && record.completion !== "blocked") errors.push("BLOCKED verifier requires a blocked pilot completion");

  if (!exactKeys(record.metrics, METRIC_KEYS, "metrics", errors)) {
    // Continue with the remaining top-level checks so the report is complete.
  } else {
    const metrics = record.metrics;
    if (metrics.wall_time_minutes === null) {
      if (metrics.wall_time_status !== "unavailable") errors.push("null wall_time_minutes requires wall_time_status=unavailable");
    } else if (typeof metrics.wall_time_minutes !== "number" || metrics.wall_time_minutes <= 0 || metrics.wall_time_status !== "available") errors.push("wall_time_minutes must be positive with wall_time_status=available");
    if (metrics.cost_usd === null) {
      if (metrics.cost_status !== "unavailable") errors.push("cost_usd null requires cost_status=unavailable");
    } else if (typeof metrics.cost_usd !== "number" || metrics.cost_usd < 0 || metrics.cost_status !== "available") errors.push("cost_usd must be non-negative with cost_status=available");
    if (!Number.isInteger(metrics.user_corrections) || metrics.user_corrections < 0) errors.push("user_corrections must be a non-negative integer");
    if (!DECISION_OUTCOMES.has(metrics.decision_outcome)) errors.push("decision_outcome must be useful, not_useful, or unknown");
    if (!isText(metrics.notes)) errors.push("metrics.notes must be non-empty");
  }

  if (!COMPLETION_STATUSES.has(record.completion)) errors.push("completion must be complete, partial, or blocked");
  const hasBlockedSource = sourceStatuses.includes("blocked");
  if (record.completion === "complete" && hasBlockedSource) errors.push("complete pilot cannot contain a blocked source");
  if (record.completion === "blocked" && !hasBlockedSource) errors.push("blocked pilot requires a blocked source");
  if (record.completion === "complete" && !finalPath) errors.push("complete pilot requires a readable final artifact");

  return { valid: errors.length === 0, errors, sourceCount: sourceStatuses.length };
}

if (isMainModule()) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/field-pilot-contract.mjs <pilot.json>");
    process.exit(1);
  }
  let record;
  try {
    record = JSON.parse(readFileSync(resolve(file), "utf8"));
  } catch (error) {
    console.error(`Could not read field-pilot record: ${error.message}`);
    process.exit(1);
  }
  const result = validateFieldPilot(record, { repoRoot: process.cwd() });
  if (!result.valid) {
    console.error(result.errors.map((error) => `- ${error}`).join("\n"));
    process.exit(1);
  }
  console.log(`PASS: field-pilot contract valid (${result.sourceCount} source record(s), ${record.completion})`);
}
