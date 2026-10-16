#!/usr/bin/env node
/**
 * Deterministic contract for the final GOAL-CHECK gate.
 *
 * This does not dispatch an agent or infer whether a natural-language ask was
 * answered. It validates the structured result returned by the goal-checker and
 * binds it to the candidate artifact. A valid NOT-DONE result is useful evidence
 * but is never promotable.
 *
 * Pattern reference: references/schema-validation-patterns.md
 * (exact-key refusal, path confinement, hash/byte binding, serialization stability)
 */

import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { isInside, isNonEmptyString as isText, resolveRealFile } from "./path-safety.mjs";

const SCHEMA = "vitruvius-goal-check.v2";
const REQUIREMENTS_SCHEMA = "vitruvius-goal-requirements.v1";
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const CHECK_STATUSES = new Set(["pass", "gap"]);
const FINDING_STATUSES = new Set(["open", "wontfix", "blocked"]);
const RECORD_KEYS = ["schema", "question", "requirements", "requirements_manifest", "final", "provenance_path", "plan_path", "attempts", "gates", "scope", "prompt", "findings", "ran", "verdict", "report"];
const FINAL_KEYS = ["path", "sha256", "bytes"];
const MAX_ATTEMPTS = 5;

// The gate rubric belongs to the contract, not to the record: a record's
// `gates` entries must reproduce these definitions verbatim, so a stored
// record is always readable against the exact rubric it was written for (the
// schema string is the rubric version). Changing this text is a schema bump,
// not a quiet redefinition.
const GATE_RUBRIC = [
  { id: "G1", item: "Integrity: fabricated or mismatched sources; softened blocked verdicts; artifact text treated as instructions" },
  { id: "G2", item: "Completeness: required work actually delivered, scoped correctly, not substituted" },
  { id: "G3", item: "Scientist's bar: validity, significance, evidence quality, units, honesty" },
];

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

function isIdentifier(value) {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value);
}

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


function physicalKey(path) {
  try {
    const real = realpathSync(path);
    return process.platform === "win32" ? real.toLowerCase() : real;
  } catch {
    return process.platform === "win32" ? resolve(path).toLowerCase() : resolve(path);
  }
}

function resolveRepoFile(repoRoot, value, label, errors) {
  // The containment decision belongs to path-safety.mjs. This function only
  // decides which refusal to report: an unsafe path and an escaping one are
  // different mistakes, and collapsing them into one message is what let the
  // two copies drift in the first place.
  const result = resolveRealFile(resolve(repoRoot), value);
  if (result.ok) return result.path;
  if (result.reason === "unsafe") {
    errors.push(`${label} must be a confined repository-relative regular file`);
    return null;
  }
  errors.push(
    result.reason === "escapes-root"
      ? `${label} must be a confined regular file`
      : `${label} must be a regular non-symlink file`,
  );
  return null;
}

function normalizeRelative(value) {
  return value.replaceAll("\\", "/");
}

function parseGoalCheckReport(text) {
  const errors = [];
  if (!isText(text)) return { valid: false, errors: ["report must be non-empty text"] };
  const headers = [...text.matchAll(/^## Goal Check:\s*(DONE|NOT-DONE)\s*$/gm)].map((match) => match[1]);
  if (headers.length !== 1) errors.push("report must contain exactly one Goal Check header");
  const lines = [...text.matchAll(/^E2E:\s*scope=(pass|gap)\s+prompt=(pass|gap)\s+gates=G1:(pass|gap),G2:(pass|gap),G3:(pass|gap)\s+flaws=(\d+)\s+resolved=(\d+)\s+unresolved=(\d+)\s+ran=(.+)$/gm)];
  if (lines.length !== 1) errors.push("report must contain exactly one E2E machine line");
  const line = lines[0];
  return {
    valid: errors.length === 0,
    errors,
    verdict: headers[0],
    scope: line?.[1],
    prompt: line?.[2],
    gates: line ? `G1:${line[3]},G2:${line[4]},G3:${line[5]}` : undefined,
    flaws: line ? Number(line[6]) : undefined,
    resolved: line ? Number(line[7]) : undefined,
    unresolved: line ? Number(line[8]) : undefined,
    ran: line?.[9]?.trim(),
  };
}

function validateRequirementList(requirements, label, errors) {
  if (!Array.isArray(requirements) || requirements.length === 0) {
    errors.push(`${label} must be a non-empty frozen list from the original question`);
    return new Set();
  }
  const ids = new Set();
  requirements.forEach((requirement, index) => {
    const itemLabel = `${label}[${index}]`;
    if (!exactKeys(requirement, ["id", "text"], itemLabel, errors)) return;
    if (!isIdentifier(requirement.id)) errors.push(`${itemLabel}.id must be a stable identifier`);
    if (!isText(requirement.text)) errors.push(`${itemLabel}.text must be non-empty`);
    if (ids.has(requirement.id)) errors.push(`${itemLabel}.id is duplicated`);
    ids.add(requirement.id);
  });
  return ids;
}

function validateRequirements(requirements, errors) {
  return validateRequirementList(requirements, "requirements", errors);
}

function validateRequirementsManifest(reference, repoRoot, question, errors) {
  const path = validateFileBinding(reference, repoRoot, "requirements_manifest", errors);
  if (!path) return null;
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    errors.push(`requirements_manifest could not be parsed: ${error.message}`);
    return null;
  }
  if (!exactKeys(manifest, ["schema", "question_sha256", "requirements", "scope"], "requirements_manifest", errors)) return null;
  if (manifest.schema !== REQUIREMENTS_SCHEMA) errors.push(`requirements_manifest schema must be ${REQUIREMENTS_SCHEMA}`);
  const questionHash = isText(question) ? createHash("sha256").update(question, "utf8").digest("hex") : null;
  if (!questionHash || manifest.question_sha256 !== questionHash) errors.push("requirements_manifest question_sha256 does not match the original question");
  const requirementIds = validateRequirementList(manifest.requirements, "requirements_manifest.requirements", errors);
  const scopeIds = validateRequirementList(manifest.scope, "requirements_manifest.scope", errors);
  return { path, manifest, requirementIds, scopeIds };
}

function validateEvidenceArray(evidence, label, errors) {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    errors.push(`${label}.evidence must be a non-empty array of inspectable strings`);
    return false;
  }
  let ok = true;
  evidence.forEach((item, index) => {
    if (!isText(item)) {
      errors.push(`${label}.evidence[${index}] must be a non-empty string`);
      ok = false;
    }
  });
  return ok;
}

function validateCheck(check, label, finalText, errors) {
  if (!exactKeys(check, ["id", "item", "status", "evidence", "required_fix"], label, errors)) return;
  if (!isIdentifier(check.id)) errors.push(`${label}.id must be a stable identifier`);
  if (!isText(check.item)) errors.push(`${label}.item must be non-empty`);
  if (!CHECK_STATUSES.has(check.status)) {
    errors.push(`${label}.status must be pass or gap`);
    return;
  }
  const evidencesOk = validateEvidenceArray(check.evidence, label, errors);
  if (check.status === "pass") {
    if (evidencesOk) {
      check.evidence.forEach((item, index) => {
        if (isText(item) && !finalText.includes(item)) errors.push(`${label}.evidence[${index}] is not present in the final artifact`);
      });
    }
    if (check.required_fix !== undefined) errors.push(`${label}.required_fix is only valid for a gap`);
  } else {
    if (!isText(check.required_fix)) errors.push(`${label}.required_fix must be non-empty for a gap`);
  }
}

function validateGates(gates, errors) {
  const statuses = new Map(GATE_RUBRIC.map((gate) => [gate.id, "gap"]));
  if (!Array.isArray(gates) || gates.length !== GATE_RUBRIC.length) {
    errors.push(`gates must be an array of exactly the ${GATE_RUBRIC.length} gates (${GATE_RUBRIC.map((gate) => gate.id).join(", ")})`);
    return statuses;
  }
  gates.forEach((gate, index) => {
    const rubric = GATE_RUBRIC[index];
    const label = `gates[${index}]`;
    if (!exactKeys(gate, ["id", "item", "status", "evidence", "required_fix"], label, errors)) return;
    if (gate.id !== rubric.id) errors.push(`${label}.id must be ${rubric.id}`);
    if (gate.item !== rubric.item) errors.push(`${label}.item must be the canonical ${rubric.id} definition from the contract`);
    if (!CHECK_STATUSES.has(gate.status)) {
      errors.push(`${label}.status must be pass or gap`);
      return;
    }
    validateEvidenceArray(gate.evidence, label, errors);
    if (gate.status === "pass") {
      if (gate.required_fix !== undefined) errors.push(`${label}.required_fix is only valid for a gap`);
      statuses.set(rubric.id, "pass");
    } else if (!isText(gate.required_fix)) {
      errors.push(`${label}.required_fix must be non-empty for a gap`);
    }
  });
  return statuses;
}

function validateFinding(finding, label, finalText, errors) {
  if (!exactKeys(finding, ["id", "severity", "status", "summary", "evidence", "required_fix", "justification", "unblock_path"], label, errors)) return;
  if (!isIdentifier(finding.id)) errors.push(`${label}.id must be a stable identifier`);
  if (!isText(finding.severity)) errors.push(`${label}.severity must be non-empty`);
  if (!FINDING_STATUSES.has(finding.status)) {
    errors.push(`${label}.status must be open, wontfix, or blocked`);
    return;
  }
  if (!isText(finding.summary)) errors.push(`${label}.summary must be non-empty`);
  if (validateEvidenceArray(finding.evidence, label, errors)) {
    finding.evidence.forEach((item, index) => {
      if (isText(item) && !finalText.includes(item)) errors.push(`${label}.evidence[${index}] is not present in the final artifact`);
    });
  }
  if (finding.status === "open") {
    if (!isText(finding.required_fix)) errors.push(`${label}.required_fix must be non-empty for an open finding`);
    if (finding.justification !== undefined || finding.unblock_path !== undefined) errors.push(`${label} open finding cannot carry justification or unblock_path`);
  }
  if (finding.status === "wontfix") {
    if (!isText(finding.justification)) errors.push(`${label}.justification must be non-empty for a wontfix finding`);
    if (finding.required_fix !== undefined || finding.unblock_path !== undefined) errors.push(`${label} wontfix finding cannot carry required_fix or unblock_path`);
  }
  if (finding.status === "blocked") {
    if (!isText(finding.unblock_path)) errors.push(`${label}.unblock_path must be non-empty for a blocked finding`);
    if (finding.required_fix !== undefined || finding.justification !== undefined) errors.push(`${label} blocked finding cannot carry required_fix or justification`);
  }
}

function readBindingFields(text, label) {
  const values = [];
  for (const line of text.split(/\r?\n/)) {
    let cleaned = line.trim().replace(/^[-*]\s*/, "");
    if (cleaned.startsWith("**")) cleaned = cleaned.slice(2);
    const colon = cleaned.indexOf(":");
    if (colon < 0) continue;
    const key = cleaned.slice(0, colon).replace(/\*\*$/, "").trim();
    if (key.toLowerCase() !== label.toLowerCase()) continue;
    values.push(cleaned.slice(colon + 1).trim().replace(/^\*\*|\*\*$/g, "").trim().replace(/^`|`$/g, "").trim());
  }
  return values;
}

function validateProvenanceBinding(provenancePath, finalPath, errors) {
  if (!provenancePath || !finalPath) return;
  const text = readFileSync(provenancePath, "utf8");
  const names = readBindingFields(text, "Final artifact");
  const hashes = readBindingFields(text, "Final SHA-256");
  const byteCounts = readBindingFields(text, "Final bytes");
  if (names.length !== 1) errors.push("provenance must contain exactly one Final artifact field");
  else if (names[0] !== finalPath.split(/[\\/]/).at(-1)) errors.push("provenance Final artifact does not match the candidate");
  if (hashes.length !== 1 || !SHA256_PATTERN.test(hashes[0])) errors.push("provenance must contain exactly one valid Final SHA-256 field");
  if (byteCounts.length !== 1 || !/^\d+$/.test(byteCounts[0]) || Number(byteCounts[0]) < 1) errors.push("provenance must contain exactly one positive Final bytes field");
  const bytes = readFileSync(finalPath);
  if (hashes.length === 1 && hashes[0] !== createHash("sha256").update(bytes).digest("hex")) errors.push("provenance Final SHA-256 does not match the candidate");
  if (byteCounts.length === 1 && Number(byteCounts[0]) !== bytes.length) errors.push("provenance Final bytes does not match the candidate");
}

function validateFileBinding(value, repoRoot, label, errors) {
  if (!exactKeys(value, FINAL_KEYS, label, errors)) return null;
  const path = resolveRepoFile(repoRoot, value.path, `${label}.path`, errors);
  if (path) {
    const bytes = readFileSync(path);
    if (!SHA256_PATTERN.test(value.sha256)) errors.push(`${label}.sha256 must be 64 lowercase hex characters`);
    else if (createHash("sha256").update(bytes).digest("hex") !== value.sha256) errors.push(`${label} hash mismatch`);
    if (!Number.isInteger(value.bytes) || value.bytes < 1) errors.push(`${label}.bytes must be a positive integer`);
    else if (bytes.length !== value.bytes) errors.push(`${label} byte count mismatch`);
  }
  return path;
}

function validateFinal(final, repoRoot, errors) {
  return validateFileBinding(final, repoRoot, "final", errors);
}

export function validateGoalCheck(record, { repoRoot, recordPath } = {}) {
  const errors = [];
  if (!repoRoot) return { valid: false, promotable: false, verdict: record?.verdict, derived: { scope: "gap", prompt: "gap", gates: "G1:gap,G2:gap,G3:gap", flaws: 0, resolved: 0, unresolved: 0, ran: false }, errors: ["repoRoot is required"] };
  if (exactKeys(record, RECORD_KEYS, "record", errors)) {
    if (record.schema !== SCHEMA) errors.push(`schema must be ${SCHEMA}`);
    if (!isText(record.question)) errors.push("question must be non-empty");
    const inlineRequirementIds = validateRequirements(record.requirements, errors);
    const requirementsManifest = validateRequirementsManifest(record.requirements_manifest, repoRoot, record.question, errors);
    let requirementIds = inlineRequirementIds;
    let requiredScopeIds = new Set();
    if (requirementsManifest) {
      requirementIds = requirementsManifest.requirementIds;
      requiredScopeIds = requirementsManifest.scopeIds;
      if (JSON.stringify(record.requirements) !== JSON.stringify(requirementsManifest.manifest.requirements)) errors.push("inline requirements do not match requirements_manifest");
    }
    if (!isText(record.ran) || record.ran.trim().toLowerCase() === "none") errors.push("ran must name a non-empty check");
    if (!new Set(["DONE", "NOT-DONE"]).has(record.verdict)) errors.push("verdict must be DONE or NOT-DONE");
    if (!Number.isInteger(record.attempts) || record.attempts < 1 || record.attempts > MAX_ATTEMPTS) {
      errors.push(`attempts must be an integer between 1 and ${MAX_ATTEMPTS} (the bounded completion loop stops at ${MAX_ATTEMPTS})`);
    }

    const finalPath = validateFinal(record.final, repoRoot, errors);
    const provenancePath = resolveRepoFile(repoRoot, record.provenance_path, "provenance_path", errors);
    const planPath = resolveRepoFile(repoRoot, record.plan_path, "plan_path", errors);
    validateProvenanceBinding(provenancePath, finalPath, errors);
    if (finalPath && provenancePath) {
      const finalRelative = normalizeRelative(record.final.path);
      const provenanceRelative = normalizeRelative(record.provenance_path);
      if (dirname(finalRelative) !== dirname(provenanceRelative)) errors.push("provenance_path must be adjacent to final.path");
      const expectedProvenance = `${finalRelative.replace(/\.md$/i, "")}.provenance.md`;
      if (provenanceRelative !== expectedProvenance) errors.push(`provenance_path must be ${expectedProvenance}`);
    }
    const goalArtifactPaths = [finalPath, provenancePath, planPath, requirementsManifest?.path].filter(Boolean).map(physicalKey);
    if (new Set(goalArtifactPaths).size !== goalArtifactPaths.length) errors.push("final, provenance, plan, and requirements_manifest must be physically distinct artifacts");
    if (requirementsManifest && finalPath && dirname(normalizeRelative(record.requirements_manifest.path)) !== dirname(normalizeRelative(record.final.path))) errors.push("requirements_manifest must be beside the final candidate");
    if (recordPath && finalPath && repoRoot) {
      const root = resolve(repoRoot);
      const recordAbsolute = resolve(root, recordPath);
      const recordRelative = normalizeRelative(relative(root, recordAbsolute));
      if (!isInside(root, recordAbsolute)) errors.push("recordPath must be inside repoRoot");
      else if (dirname(recordRelative) !== dirname(normalizeRelative(record.final.path))) errors.push("goal-check record must be beside the final candidate");
    }

    const gateStatuses = validateGates(record.gates, errors);
    const finalText = finalPath ? readFileSync(finalPath, "utf8") : "";
    for (const [name, checks] of [["scope", record.scope], ["prompt", record.prompt]]) {
      if (!Array.isArray(checks) || checks.length === 0) {
        errors.push(`${name} must be a non-empty array`);
        continue;
      }
      const ids = new Set();
      checks.forEach((check, index) => {
        const label = `${name}[${index}]`;
        validateCheck(check, label, finalText, errors);
        if (isIdentifier(check?.id)) {
          if (ids.has(check.id)) errors.push(`${label}.id is duplicated within ${name}`);
          ids.add(check.id);
        }
      });
    }
    if (Array.isArray(record.prompt)) {
      const promptIds = new Set(record.prompt.map((check) => check?.id).filter(isIdentifier));
      for (const id of requirementIds) if (!promptIds.has(id)) errors.push(`prompt is missing required ask: ${id}`);
      for (const id of promptIds) if (!requirementIds.has(id)) errors.push(`prompt contains unknown ask: ${id}`);
    }
    if (requiredScopeIds.size > 0 && Array.isArray(record.scope)) {
      const scopeIds = new Set(record.scope.map((check) => check?.id).filter(isIdentifier));
      for (const id of requiredScopeIds) if (!scopeIds.has(id)) errors.push(`scope is missing required item: ${id}`);
      for (const id of scopeIds) if (!requiredScopeIds.has(id)) errors.push(`scope contains unknown item: ${id}`);
    }
    if (!Array.isArray(record.findings)) errors.push("findings must be an array");
    else record.findings.forEach((finding, index) => validateFinding(finding, `findings[${index}]`, finalText, errors));

    const report = parseGoalCheckReport(record.report);
    errors.push(...report.errors);
    const scopePass = Array.isArray(record.scope) && record.scope.length > 0 && record.scope.every((check) => check?.status === "pass");
    const promptPass = Array.isArray(record.prompt) && record.prompt.length > 0 && record.prompt.every((check) => check?.status === "pass");
    const countFindings = (status) => (Array.isArray(record.findings) ? record.findings.filter((finding) => finding?.status === status).length : 0);
    const ran = isText(record.ran) && record.ran.trim().toLowerCase() !== "none";
    const derived = {
      scope: scopePass ? "pass" : "gap",
      prompt: promptPass ? "pass" : "gap",
      gates: GATE_RUBRIC.map((gate) => `${gate.id}:${gateStatuses.get(gate.id)}`).join(","),
      flaws: countFindings("open"),
      resolved: countFindings("wontfix"),
      unresolved: countFindings("blocked"),
      ran: ran ? record.ran : "",
    };
    const gatesPass = GATE_RUBRIC.every((gate) => gateStatuses.get(gate.id) === "pass");
    const done = derived.scope === "pass" && derived.prompt === "pass" && gatesPass && derived.flaws === 0 && ran;
    const expectedVerdict = done ? "DONE" : "NOT-DONE";
    if (record.verdict !== expectedVerdict) errors.push(`verdict must be ${expectedVerdict}`);
    if (report.valid) {
      if (report.verdict !== record.verdict) errors.push("report verdict does not match record verdict");
      for (const field of ["scope", "prompt", "gates", "flaws", "resolved", "unresolved", "ran"]) {
        if (report[field] !== derived[field]) errors.push(`report E2E ${field} does not match derived gate`);
      }
    }
    if (provenancePath) {
      const provenanceText = readFileSync(provenancePath, "utf8");
      const goalLines = provenanceText.split(/\r?\n/).filter((line) => line.includes("GOAL-CHECK:"));
      if (goalLines.length !== 1) errors.push("provenance must contain exactly one GOAL-CHECK line");
      const normalizedGoalLine = goalLines[0]?.replace(/^\s*[-*]\s*/, "").replaceAll("*", "").trim();
      const expectedGoalLine = `GOAL-CHECK: E2E: scope=${derived.scope} prompt=${derived.prompt} gates=${derived.gates} flaws=${derived.flaws} resolved=${derived.resolved} unresolved=${derived.unresolved} ran=${record.ran}`;
      if (goalLines.length === 1 && normalizedGoalLine !== expectedGoalLine) errors.push("provenance GOAL-CHECK line does not match the derived gate");
    }
    const valid = errors.length === 0;
    return { valid, promotable: valid && done, verdict: record.verdict, derived, errors };
  }
  return { valid: false, promotable: false, verdict: record?.verdict, derived: { scope: "gap", prompt: "gap", gates: "G1:gap,G2:gap,G3:gap", flaws: 0, resolved: 0, unresolved: 0, ran: false }, errors };
}

if (isMainModule()) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/goal-check-contract.mjs <goal-check.json>");
    process.exit(1);
  }
  let record;
  try {
    record = JSON.parse(readFileSync(resolve(file), "utf8"));
  } catch (error) {
    console.error(`Could not read goal-check record: ${error.message}`);
    process.exit(1);
  }
  const result = validateGoalCheck(record, { repoRoot: process.cwd(), recordPath: file });
  if (!result.valid) {
    console.error(result.errors.map((error) => `- ${error}`).join("\n"));
    process.exit(1);
  }
  if (!result.promotable) {
    console.error("NOT-DONE: goal-check is valid but the candidate is not promotable");
    process.exit(1);
  }
  console.log("PASS: goal-check contract valid and candidate is promotable");
}
