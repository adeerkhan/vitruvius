import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const CASE_SCHEMA = "vitruvius-c1.v1";
const RESULT_SCHEMA = "vitruvius-c1-results.v1";
const RESEARCH_STATUSES = new Set(["verified", "partial", "blocked"]);
const GRADE_STATUSES = new Set(["PASS", "PARTIAL", "BLOCKED"]);
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isSafeRelativePath(value) {
  if (!isNonEmptyString(value) || isAbsolute(value)) return false;
  const segments = value.replaceAll("\\", "/").split("/");
  return !segments.includes("..") && !segments.includes("");
}

function isInside(root, candidate) {
  const pathFromRoot = relative(root, candidate);
  return !isAbsolute(pathFromRoot) && pathFromRoot !== "" && pathFromRoot !== ".." && !pathFromRoot.startsWith(`..${sep}`);
}

function isSafeRegularFile(root, value) {
  if (!isSafeRelativePath(value)) return false;
  try {
    const rootReal = realpathSync(root);
    const path = resolve(root, value);
    if (!lstatSync(path).isFile()) return false;
    const relativePath = relative(rootReal, realpathSync(path));
    return !isAbsolute(relativePath) && relativePath !== ".." && !relativePath.startsWith(`..${sep}`);
  } catch {
    return false;
  }
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function walkFixtureFiles(root) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`fixture symlink is not allowed: ${path}`);
    if (entry.isDirectory()) files.push(...walkFixtureFiles(path));
    else if (entry.isFile()) files.push(path);
    else throw new Error(`fixture entry is not a regular file: ${path}`);
  }
  return files.sort();
}

function hashFixtureTree(root, caseId) {
  const fixtureRoot = resolve(root, "evals", "fixtures", "c1", caseId);
  const rootReal = realpathSync(root);
  const fixtureReal = realpathSync(fixtureRoot);
  if (!isInside(rootReal, fixtureReal) || !lstatSync(fixtureRoot).isDirectory()) {
    throw new Error(`fixture root is not a confined directory: ${caseId}`);
  }
  const hash = createHash("sha256");
  for (const path of walkFixtureFiles(fixtureRoot)) {
    const relativePath = relative(root, path).replaceAll("\\", "/");
    hash.update(relativePath);
    hash.update("\0");
    hash.update(hashFile(path));
    hash.update("\n");
  }
  return hash.digest("hex");
}

function validateOutputs(outputs, label, errors) {
  if (!outputs || typeof outputs !== "object" || !isNonEmptyString(outputs.final) || !isNonEmptyString(outputs.provenance)) {
    errors.push(`${label} required_outputs must name final and provenance files`);
    return;
  }
  for (const [name, fileName] of Object.entries(outputs)) {
    if (!isNonEmptyString(fileName) || fileName.includes("/") || fileName.includes("\\") || fileName === "." || fileName === "..") {
      errors.push(`${label} required_outputs.${name} must be a plain file name`);
    }
  }
}

function validateCase(fixedCase, index, root, errors) {
  const label = `cases[${index}]`;
  if (!fixedCase || typeof fixedCase !== "object" || Array.isArray(fixedCase)) {
    errors.push(`${label} must be an object`);
    return;
  }
  if (!isNonEmptyString(fixedCase.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fixedCase.id)) {
    errors.push(`${label}.id must be a lowercase hyphenated slug`);
  }
  if (!RESEARCH_STATUSES.has(fixedCase.expected_status)) {
    errors.push(`${label}.expected_status must be verified, partial, or blocked`);
  }
  if (!isNonEmptyString(fixedCase.question)) errors.push(`${label}.question must be non-empty`);

  const sourceIds = new Set();
  const sourcePaths = [];
  if (!Array.isArray(fixedCase.sources) || fixedCase.sources.length === 0) {
    errors.push(`${label}.sources must be non-empty`);
  } else {
    for (const [sourceIndex, source] of fixedCase.sources.entries()) {
      const sourceLabel = `${label}.sources[${sourceIndex}]`;
      if (!source || !isNonEmptyString(source.id) || !isNonEmptyString(source.path)) {
        errors.push(`${sourceLabel} requires id and path`);
        continue;
      }
      if (sourceIds.has(source.id)) errors.push(`${sourceLabel} duplicate source id: ${source.id}`);
      sourceIds.add(source.id);
      const expectedPrefix = `evals/fixtures/c1/${fixedCase.id}/`;
      if (!isSafeRegularFile(root, source.path) || !source.path.startsWith(expectedPrefix)) {
        errors.push(`${sourceLabel} path must be a regular file under ${expectedPrefix}: ${source.path}`);
      } else {
        sourcePaths.push(source.path);
      }
    }
  }
  if (!SHA256_PATTERN.test(fixedCase.fixture_tree_sha256)) {
    errors.push(`${label}.fixture_tree_sha256 must be 64 lowercase hex characters`);
  } else {
    try {
      if (hashFixtureTree(root, fixedCase.id) !== fixedCase.fixture_tree_sha256) {
        errors.push(`${label}.fixture_tree_sha256 does not match the complete fixture directory`);
      }
    } catch (error) {
      errors.push(`${label}.fixture tree could not be hashed: ${error.message}`);
    }
  }

  const expectationIds = new Set();
  if (!Array.isArray(fixedCase.expectations) || fixedCase.expectations.length === 0) {
    errors.push(`${label}.expectations must be non-empty`);
  } else {
    for (const [expectationIndex, expectation] of fixedCase.expectations.entries()) {
      const expectationLabel = `${label}.expectations[${expectationIndex}]`;
      if (!expectation || !isNonEmptyString(expectation.id) || !isNonEmptyString(expectation.statement)) {
        errors.push(`${expectationLabel} requires id and statement`);
        continue;
      }
      if (expectationIds.has(expectation.id)) errors.push(`${expectationLabel} duplicate id: ${expectation.id}`);
      expectationIds.add(expectation.id);
    }
  }
  validateOutputs(fixedCase.required_outputs, label, errors);
}

export function validateFixedCase(suite, { repoRoot }) {
  const errors = [];
  const root = resolve(repoRoot);
  if (!suite || typeof suite !== "object" || Array.isArray(suite)) {
    return { valid: false, errors: ["suite must be an object"], caseCount: 0, caseIds: [] };
  }
  if (suite.schema !== CASE_SCHEMA) errors.push(`schema must be ${CASE_SCHEMA}`);
  if (!isNonEmptyString(suite.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(suite.id)) errors.push("suite id must be a lowercase hyphenated slug");
  if (suite.mode !== "local-only") errors.push("suite mode must be local-only");
  if (!Array.isArray(suite.cases) || suite.cases.length < 3 || suite.cases.length > 5) errors.push("suite must contain 3 to 5 fixed cases");

  const caseIds = new Set();
  for (const [index, fixedCase] of (Array.isArray(suite.cases) ? suite.cases : []).entries()) {
    validateCase(fixedCase, index, root, errors);
    if (fixedCase?.id) {
      if (caseIds.has(fixedCase.id)) errors.push(`duplicate case id: ${fixedCase.id}`);
      caseIds.add(fixedCase.id);
    }
  }
  return { valid: errors.length === 0, errors, caseCount: Array.isArray(suite.cases) ? suite.cases.length : 0, caseIds: [...caseIds] };
}

function validateArtifact(record, label, root, errors) {
  if (!record || typeof record !== "object" || !isSafeRegularFile(root, record.path)) {
    errors.push(`${label} must be a confined regular file`);
    return null;
  }
  const path = resolve(root, record.path);
  if (!SHA256_PATTERN.test(record.sha256)) errors.push(`${label} sha256 must be 64 lowercase hex characters`);
  if (!Number.isInteger(record.bytes) || record.bytes < 1) errors.push(`${label} bytes must be a positive integer`);
  try {
    const bytes = readFileSync(path);
    if (record.bytes !== bytes.length) errors.push(`${label} byte count mismatch`);
    if (record.sha256 !== hashFile(path)) errors.push(`${label} hash mismatch`);
    return path;
  } catch (error) {
    errors.push(`${label} could not be read: ${error.message}`);
    return null;
  }
}

function extractResearchStatuses(text) {
  const statuses = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:[-*]\s*)?(?:\*\*)?(?:research status|verification)(?:\*\*)?\s*:\s*(.*)$/i);
    if (!match) continue;
    const value = match[1].replace(/[`*]/g, "").trim().toLowerCase();
    const statusMatch = value.match(/^(verified|partial|blocked|unverified|inferred|failed)\b/);
    if (!statusMatch) {
      statuses.push(`invalid:${value}`);
      continue;
    }
    const remainder = value.slice(statusMatch[0].length).trim();
    if (remainder.startsWith("/") || /\b(verified|partial|blocked|unverified|inferred|failed)\b/.test(remainder)) {
      statuses.push(`invalid:${value}`);
    } else {
      statuses.push(statusMatch[1]);
    }
  }
  return statuses;
}

function hasExactResearchStatus(text, status) {
  return extractResearchStatuses(text).includes(status);
}

function readClaimCount(text, label) {
  for (const line of text.split(/\r?\n/)) {
    const value = line.replace(/[`*]/g, "").trim().replace(/^[-*]\s*/, "").replace(/^Claims\s+/i, "");
    const prefix = `${label}:`;
    if (!value.toLowerCase().startsWith(prefix)) continue;
    const countText = value.slice(prefix.length).trim().match(/^\d+/)?.[0];
    if (countText !== undefined) return Number(countText);
  }
  return null;
}

function validateGrade(grade, expectedIds, label, errors) {
  if (!grade || typeof grade !== "object" || !GRADE_STATUSES.has(grade.status)) {
    errors.push(`${label} grade status must be PASS, PARTIAL, or BLOCKED`);
    return;
  }
  if (!Array.isArray(grade.expectations) || grade.expectations.length !== expectedIds.length) {
    errors.push(`${label} expectation grading incomplete`);
    return;
  }
  const actualIds = new Set();
  for (const expectation of grade.expectations) {
    if (!expectation || !isNonEmptyString(expectation.id) || typeof expectation.passed !== "boolean" || !isNonEmptyString(expectation.evidence)) {
      errors.push(`${label} has an invalid expectation grade`);
      continue;
    }
    if (actualIds.has(expectation.id)) errors.push(`${label} has duplicate expectation grade: ${expectation.id}`);
    actualIds.add(expectation.id);
  }
  for (const id of expectedIds) if (!actualIds.has(id)) errors.push(`${label} missing expectation grade: ${id}`);
  const allPassed = grade.expectations.length > 0 && grade.expectations.every((expectation) => expectation?.passed === true);
  if (grade.status === "PASS" && !allPassed) errors.push(`${label} PASS grade requires every expectation to pass`);
  if (grade.status !== "PASS" && allPassed) errors.push(`${label} non-PASS grade requires at least one failed expectation`);
}

export function validateRunManifest(manifest, { repoRoot, artifactRoot = repoRoot, casePath }) {
  const errors = [];
  const root = resolve(repoRoot);
  const artifactBase = resolve(artifactRoot);
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return { valid: false, errors: ["run manifest must be an object"], caseCount: 0 };
  }
  if (manifest.schema !== RESULT_SCHEMA) errors.push(`schema must be ${RESULT_SCHEMA}`);
  if (!isNonEmptyString(manifest.suite_id)) errors.push("suite_id must be non-empty");
  if (manifest.reviewer_agent !== "reviewer" || !isNonEmptyString(manifest.reviewer_session_id)) errors.push("manifest must record an independent reviewer agent and session");
  if (!isSafeRelativePath(manifest.suite_path) || !manifest.suite_path.startsWith("evals/cases/")) errors.push("suite_path must point inside evals/cases/");
  if (!SHA256_PATTERN.test(manifest.suite_sha256)) errors.push("suite_sha256 must be 64 lowercase hex characters");
  if (!Number.isInteger(manifest.suite_bytes) || manifest.suite_bytes < 1) errors.push("suite_bytes must be a positive integer");

  let suite = null;
  try {
    const suiteFile = resolve(root, manifest.suite_path);
    if (casePath && resolve(casePath) !== suiteFile) errors.push("suite_path does not match supplied casePath");
    if (!isSafeRegularFile(root, manifest.suite_path) || !manifest.suite_path.startsWith("evals/cases/")) {
      errors.push("suite definition must be a confined regular file inside evals/cases/");
    } else {
      const bytes = readFileSync(suiteFile);
      if (bytes.length !== manifest.suite_bytes) errors.push("suite byte count mismatch");
      if (hashFile(suiteFile) !== manifest.suite_sha256) errors.push("suite hash mismatch");
      suite = JSON.parse(bytes.toString("utf8"));
    }
  } catch (error) {
    errors.push(`suite definition could not be read: ${error.message}`);
  }

  const suiteReport = suite ? validateFixedCase(suite, { repoRoot: root }) : { valid: false, caseIds: [] };
  errors.push(...suiteReport.errors.map((error) => `suite: ${error}`));
  const cases = Array.isArray(suite?.cases) ? suite.cases : [];
  if (suite && manifest.suite_id !== suite.id) errors.push("suite_id does not match the suite definition");
  if (!Array.isArray(manifest.runs) || manifest.runs.length !== cases.length || new Set((manifest.runs ?? []).map((run) => run?.case_id)).size !== cases.length) {
    errors.push("manifest must contain one result for each suite case");
  }

  const caseById = new Map(cases.map((fixedCase) => [fixedCase.id, fixedCase]));
  const runIds = new Set();
  const sessionIds = new Set();
  for (const [index, run] of (Array.isArray(manifest.runs) ? manifest.runs : []).entries()) {
    const label = `runs[${index}]`;
    if (!run || typeof run !== "object" || !isNonEmptyString(run.run_id) || runByIdHasDuplicate(runIds, run.run_id)) {
      errors.push(`${label} requires a unique run_id`);
      continue;
    }
    runIds.add(run.run_id);
    if (sessionIds.has(run.session_id)) errors.push(`duplicate subagent session_id: ${run.session_id}`);
    sessionIds.add(run.session_id);
    const fixedCase = caseById.get(run.case_id);
    if (!fixedCase) {
      errors.push(`${label} references unknown case: ${run.case_id}`);
      continue;
    }
    if (run.agent !== "general" || run.fresh !== true || !isNonEmptyString(run.session_id)) errors.push(`${label} must record a fresh general subagent session`);
    if (!isNonEmptyString(run.model)) errors.push(`${label}.model must be recorded`);
    if (run.cost_usd !== null && (typeof run.cost_usd !== "number" || run.cost_usd < 0)) errors.push(`${label}.cost_usd must be non-negative or null`);
    if (run.cost_usd === null && run.cost_status !== "unavailable") errors.push(`${label} null cost requires cost_status=unavailable`);
    if (run.research_status !== fixedCase.expected_status) errors.push(`${label} research_status must equal case expected_status`);
    const finalPath = validateArtifact(run.final, `${label}.final`, artifactBase, errors);
    const provenancePath = validateArtifact(run.provenance, `${label}.provenance`, artifactBase, errors);
    if (run.final?.path && basename(run.final.path) !== fixedCase.required_outputs.final) errors.push(`${label}.final must use required output name ${fixedCase.required_outputs.final}`);
    if (run.provenance?.path && basename(run.provenance.path) !== fixedCase.required_outputs.provenance) errors.push(`${label}.provenance must use required output name ${fixedCase.required_outputs.provenance}`);
    if (run.final?.path && dirname(run.final.path) !== run.case_id) errors.push(`${label}.final must be isolated under runs/${run.case_id}/`);
    if (run.provenance?.path && dirname(run.provenance.path) !== run.case_id) errors.push(`${label}.provenance must be isolated under runs/${run.case_id}/`);
    if (run.final?.path && run.provenance?.path && dirname(run.final.path) !== dirname(run.provenance.path)) errors.push(`${label} final and provenance must be adjacent`);
    if (run.final?.path && run.provenance?.path && run.final.path === run.provenance.path) errors.push(`${label} final and provenance must be different files`);
    if (finalPath && provenancePath) {
      const finalReal = realpathSync(finalPath);
      const provenanceReal = realpathSync(provenancePath);
      if (finalReal === provenanceReal) errors.push(`${label} final and provenance must resolve to different files`);
      if (dirname(finalReal) !== dirname(provenanceReal)) errors.push(`${label} final and provenance must be physically adjacent`);
    }
    const finalText = finalPath ? readFileSync(finalPath, "utf8") : "";
    const provenanceText = provenancePath ? readFileSync(provenancePath, "utf8") : "";
    if (finalPath) {
      if (!finalText.includes("## Sources")) errors.push(`${label}.final must contain a Sources section`);
      if (!hasExactResearchStatus(finalText, fixedCase.expected_status)) errors.push(`${label}.final must state expected research status: ${fixedCase.expected_status}`);
    }
    if (provenancePath) {
      for (const marker of ["Sources consulted", "Sources accepted", "Verification", "Plan"]) {
        if (!provenanceText.includes(marker)) errors.push(`${label}.provenance missing ${marker}`);
      }
      if (!hasExactResearchStatus(provenanceText, fixedCase.expected_status)) errors.push(`${label}.provenance must state expected research status: ${fixedCase.expected_status}`);
    }
    const statuses = [...extractResearchStatuses(finalText), ...extractResearchStatuses(provenanceText)];
    if (statuses.length === 0 || statuses.some((status) => status !== fixedCase.expected_status)) {
      errors.push(`${label} artifact status lines must consistently state ${fixedCase.expected_status}`);
    }
    for (const source of fixedCase.sources) {
      if (!finalText.includes(source.path)) errors.push(`${label}.final is missing source path ${source.path}`);
      if (!provenanceText.includes(source.id) || !provenanceText.includes(source.path)) errors.push(`${label}.provenance is missing source id/path ${source.id}`);
    }
    if (provenanceText) {
      const claimCounts = new Map();
      for (const claimLabel of ["verified", "partial", "blocked", "unverified", "inferred", "failed"]) {
        const count = readClaimCount(provenanceText, claimLabel);
        if (count === null) errors.push(`${label}.provenance missing numeric claim count ${claimLabel}`);
        else claimCounts.set(claimLabel, count);
      }
      if ((claimCounts.get("inferred") ?? 0) > 0 && !/^#+\s*derivations?\b/im.test(provenanceText)) {
        errors.push(`${label}.provenance has inferred claims without a Derivations section`);
      }
    }
    validateGrade(run.grade, fixedCase.expectations.map((expectation) => expectation.id), label, errors);
  }
  if (sessionIds.has(manifest.reviewer_session_id)) errors.push("reviewer session must be distinct from run sessions");
  if (sessionIds.size !== cases.length) errors.push("each suite case requires a distinct fresh subagent session");
  const summary = manifest.summary;
  if (!summary || typeof summary !== "object") {
    errors.push("summary must be an object");
  } else {
    if (summary.cases !== cases.length) errors.push("summary.cases does not match the suite");
    const passed = Array.isArray(manifest.runs) ? manifest.runs.filter((run) => run?.grade?.status === "PASS").length : 0;
    const failed = Array.isArray(manifest.runs) ? manifest.runs.filter((run) => run?.grade?.status !== "PASS").length : 0;
    const hasBlocked = Array.isArray(manifest.runs) && manifest.runs.some((run) => run?.grade?.status === "BLOCKED");
    const derivedReviewStatus = failed === 0 ? "PASS" : hasBlocked ? "BLOCKED" : "PARTIAL";
    if (summary.passed !== passed || summary.failed !== failed) errors.push("summary pass/fail counts do not match run grades");
    if (!GRADE_STATUSES.has(summary.review_status) || summary.review_status !== derivedReviewStatus) errors.push(`summary.review_status must be ${derivedReviewStatus}`);
    if (!isNonEmptyString(summary.cost_status)) errors.push("summary.cost_status must be recorded");
  }
  return { valid: errors.length === 0, errors, caseCount: cases.length };
}

function runByIdHasDuplicate(runIds, runId) {
  if (runIds.has(runId)) return true;
  return false;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const [mode, file] = process.argv.slice(2);
  if (!mode || !file || !["case", "results"].includes(mode)) {
    console.error("Usage: node scripts/fixed-case.mjs <case|results> <json-file> [artifact-root]");
    process.exit(1);
  }
  const json = JSON.parse(readFileSync(resolve(file), "utf8"));
  const report = mode === "case"
    ? validateFixedCase(json, { repoRoot: process.cwd() })
    : validateRunManifest(json, { repoRoot: process.cwd(), artifactRoot: process.argv[4] });
  if (!report.valid) {
    console.error(report.errors.map((error) => `- ${error}`).join("\n"));
    process.exit(1);
  }
  console.log(`PASS: fixed-case ${mode} contract valid`);
}
