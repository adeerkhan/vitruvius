import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

const SCHEMA = "evidence.v1";
const SOURCE_STATUSES = new Set(["verified", "blocked", "unverified", "inferred"]);
const CLAIM_STATUSES = new Set(["verified", "partial", "blocked", "unverified", "inferred", "failed"]);
const COVERAGE_STATUSES = new Set(["covered", "negative", "ambiguous"]);
const SEARCH_STATUSES = new Set(["completed", "partial", "blocked"]);
const NEGATIVE_STATUSES = new Set(["documented", "blocked", "not_reached"]);
const AMBIGUOUS_STATUSES = new Set(["open", "resolved"]);
const RELATIONS = new Set(["supports", "challenges", "contextual"]);
const COMPLETION_STATUSES = new Set(["complete", "partial", "blocked"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ID_LENGTH = 128;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" && value.trim() !== "" && !/[\u0000-\u001f\u007f]/.test(value);
}

function identifier(value, prefix) {
  return typeof value === "string" && value.length <= MAX_ID_LENGTH && new RegExp(`^${prefix}-[A-Z0-9][A-Z0-9._-]*$`).test(value);
}

function isoDate(value) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function timestamp(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));
}

function canonicalPath(path) {
  return process.platform === "win32" ? path.toLowerCase() : path;
}

function isSafeRelativePath(value) {
  if (typeof value !== "string" || value.trim() === "" || isAbsolute(value) || value.includes(":")) return false;
  const segments = value.replaceAll("\\", "/").split("/");
  return !segments.includes("..") && !segments.includes("");
}

function isSafeRepoFile(root, value) {
  if (!isSafeRelativePath(value)) return false;
  try {
    const rootReal = realpathSync(root);
    const path = resolve(root, value);
    if (!lstatSync(path).isFile()) return false;
    const actual = realpathSync(path);
    if (canonicalPath(actual) !== canonicalPath(resolve(rootReal, value))) return false;
    const pathFromRoot = relative(rootReal, actual);
    return !isAbsolute(pathFromRoot) && pathFromRoot !== ".." && !pathFromRoot.startsWith(`..${sep}`);
  } catch {
    return false;
  }
}

function fileHash(root, value) {
  return createHash("sha256").update(readFileSync(resolve(root, value))).digest("hex");
}

function exactKeys(record, allowed, label, errors) {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) errors.push(`${label} contains unknown field: ${key}`);
  }
}

function requireTextFields(record, fields, label, errors) {
  for (const field of fields) {
    if (!text(record[field])) errors.push(`${label}.${field} must be a non-empty string`);
  }
}

function addId(ids, value, prefix, label, errors) {
  if (!identifier(value, prefix)) {
    errors.push(`${label} must use a stable ${prefix}- identifier`);
    return false;
  }
  if (ids.has(value)) {
    errors.push(`duplicate ledger id: ${value}`);
    return false;
  }
  ids.add(value);
  return true;
}

export function validateEvidenceLedger(value, { repoRoot } = {}) {
  const errors = [];
  if (!isObject(value)) return { valid: false, completion: "invalid", errors: ["ledger must be an object"], sourceCount: 0, searchCount: 0, claimCount: 0 };
  exactKeys(value, ["schema", "run_id", "question", "sources", "searches", "claims", "coverage", "recorded_at", "completion"], "ledger", errors);
  if (value.schema !== SCHEMA) errors.push(`schema must be ${SCHEMA}`);
  if (!UUID_PATTERN.test(value.run_id)) errors.push("run_id must be a UUID");
  if (!text(value.question)) errors.push("question must be a non-empty string");
  if (value.recorded_at !== undefined && !timestamp(value.recorded_at)) errors.push("recorded_at must be an ISO timestamp when provided");
  if (value.completion !== undefined && !COMPLETION_STATUSES.has(value.completion)) errors.push("completion must be complete, partial, or blocked");
  if (/https?:\/\/|file:\/\//i.test(JSON.stringify(value))) errors.push("local-only ledger contains an external URL");

  const root = repoRoot ? resolve(repoRoot) : null;
  if (!root) errors.push("repoRoot is required for local artifact validation");
  const ids = new Set();
  const sourceById = new Map();
  const searchById = new Map();
  const claimById = new Map();
  const searchedSourceIds = new Set();
  const negativeByClaim = new Set();
  const ambiguousByClaim = new Set();
  const openAmbiguousByClaim = new Set();

  const sources = Array.isArray(value.sources) ? value.sources : [];
  const searches = Array.isArray(value.searches) ? value.searches : [];
  const claims = Array.isArray(value.claims) ? value.claims : [];
  if (!Array.isArray(value.sources) || sources.length === 0) errors.push("sources must be a non-empty array");
  if (!Array.isArray(value.searches) || searches.length === 0) errors.push("searches must be a non-empty array");
  if (!Array.isArray(value.claims) || claims.length === 0) errors.push("claims must be a non-empty array");

  for (const [index, source] of sources.entries()) {
    const label = `sources[${index}]`;
    if (!isObject(source)) {
      errors.push(`${label} must be an object`);
      continue;
    }
    exactKeys(source, ["id", "title", "locator", "artifact_path", "sha256", "accessed_on", "status", "notes"], label, errors);
    requireTextFields(source, ["title", "locator", "artifact_path", "sha256", "accessed_on"], label, errors);
    if (source.notes !== undefined && !text(source.notes)) errors.push(`${label}.notes must be a non-empty string when provided`);
    if (addId(ids, source.id, "SRC", label, errors)) sourceById.set(source.id, source);
    if (!SOURCE_STATUSES.has(source.status)) errors.push(`${label}.status must be verified, blocked, unverified, or inferred`);
    if (!isoDate(source.accessed_on)) errors.push(`${label}.accessed_on must be a real ISO date`);
    if (root && text(source.artifact_path)) {
      if (!isSafeRepoFile(root, source.artifact_path)) errors.push(`${label}.artifact_path must be a confined regular file`);
      else if (!/^[0-9a-f]{64}$/.test(source.sha256) || fileHash(root, source.artifact_path) !== source.sha256) errors.push(`${label}.sha256 must match artifact_path bytes`);
    }
  }

  for (const [index, search] of searches.entries()) {
    const label = `searches[${index}]`;
    if (!isObject(search)) {
      errors.push(`${label} must be an object`);
      continue;
    }
    exactKeys(search, ["id", "query", "boundary", "searched_on", "status", "screened_count", "result_source_ids"], label, errors);
    requireTextFields(search, ["query", "boundary"], label, errors);
    if (!isoDate(search.searched_on)) errors.push(`${label}.searched_on must be a real ISO date`);
    if (!SEARCH_STATUSES.has(search.status)) errors.push(`${label}.status must be completed, partial, or blocked`);
    if (search.status === "blocked") {
      if (search.screened_count !== null) errors.push(`${label}.screened_count must be null for a blocked search`);
    } else if (!Number.isInteger(search.screened_count) || search.screened_count < 0) {
      errors.push(`${label}.screened_count must be a non-negative integer for a completed/partial search`);
    }
    if (addId(ids, search.id, "SEARCH", label, errors)) searchById.set(search.id, search);
    if (!Array.isArray(search.result_source_ids)) {
      errors.push(`${label}.result_source_ids must be an array`);
    } else {
      const resultIds = new Set();
      for (const sourceId of search.result_source_ids) {
        if (!text(sourceId)) errors.push(`${label}.result_source_ids must contain non-empty strings`);
        else if (resultIds.has(sourceId)) errors.push(`${label}.result_source_ids contains duplicate ${sourceId}`);
        else {
          resultIds.add(sourceId);
          if (!sourceById.has(sourceId)) errors.push(`${label} references unknown source id: ${sourceId}`);
          else searchedSourceIds.add(sourceId);
        }
      }
    }
  }

  const supportByClaim = new Map();
  for (const [index, claim] of claims.entries()) {
    const label = `claims[${index}]`;
    if (!isObject(claim)) {
      errors.push(`${label} must be an object`);
      continue;
    }
    exactKeys(claim, ["id", "text", "status", "coverage_status", "support"], label, errors);
    requireTextFields(claim, ["text"], label, errors);
    if (!CLAIM_STATUSES.has(claim.status)) errors.push(`${label}.status must be verified, partial, blocked, unverified, inferred, or failed`);
    if (!COVERAGE_STATUSES.has(claim.coverage_status)) errors.push(`${label}.coverage_status must be covered, negative, or ambiguous`);
    if (addId(ids, claim.id, "CLAIM", label, errors)) claimById.set(claim.id, claim);
    if (!Array.isArray(claim.support) || claim.support.length === 0) {
      errors.push(`${label}.support must be a non-empty array`);
      supportByClaim.set(claim.id, []);
      continue;
    }
    const support = [];
    const pairs = new Set();
    for (const [supportIndex, mapping] of claim.support.entries()) {
      const supportLabel = `${label}.support[${supportIndex}]`;
      if (!isObject(mapping)) {
        errors.push(`${supportLabel} must be an object`);
        continue;
      }
      exactKeys(mapping, ["source_id", "locator", "relation", "status"], supportLabel, errors);
      requireTextFields(mapping, ["source_id", "locator"], supportLabel, errors);
      if (!RELATIONS.has(mapping.relation)) errors.push(`${supportLabel}.relation must be supports, challenges, or contextual`);
      if (!SOURCE_STATUSES.has(mapping.status)) errors.push(`${supportLabel}.status must be verified, blocked, unverified, or inferred`);
      const pair = `${mapping.source_id}|${mapping.locator}|${mapping.relation}`;
      if (pairs.has(pair)) errors.push(`${supportLabel} duplicates a source mapping`);
      pairs.add(pair);
      support.push(mapping);
    }
    supportByClaim.set(claim.id, support);
  }

  for (const [searchIndex, search] of searches.entries()) {
    if (!isObject(search) || !Array.isArray(search.result_source_ids)) continue;
    for (const sourceId of search.result_source_ids) {
      if (sourceById.has(sourceId) && !searchedSourceIds.has(sourceId)) errors.push(`searches[${searchIndex}] has an orphan source result: ${sourceId}`);
    }
  }
  for (const [sourceIndex, source] of sources.entries()) {
    if (isObject(source) && identifier(source.id, "SRC") && !searchedSourceIds.has(source.id)) errors.push(`sources[${sourceIndex}] is not linked to any search result`);
  }

  for (const [claimIndex, claim] of claims.entries()) {
    const support = supportByClaim.get(claim.id) || [];
    let hasVerifiedSupport = false;
    let hasBlockedSupport = false;
    let hasVerifiedChallenge = false;
    let hasNonCompletedSearch = false;
    for (const [supportIndex, mapping] of support.entries()) {
      const label = `claims[${claimIndex}].support[${supportIndex}]`;
      const source = sourceById.get(mapping.source_id);
      if (!source) {
        errors.push(`${label} references unknown source id: ${mapping.source_id}`);
        continue;
      }
      if (!searchedSourceIds.has(mapping.source_id)) errors.push(`${label} references a source not linked to any search: ${mapping.source_id}`);
      if (mapping.status === "verified" && source.status !== "verified") errors.push(`${label} cannot be verified while its source is ${source.status}`);
      if (mapping.relation === "supports" && mapping.status === "verified") hasVerifiedSupport = true;
      if (mapping.status === "blocked" || source.status === "blocked") hasBlockedSupport = true;
      if (mapping.relation === "challenges" && mapping.status === "verified") hasVerifiedChallenge = true;
      const linkedSearches = searches.filter((search) => isObject(search) && Array.isArray(search.result_source_ids) && search.result_source_ids.includes(mapping.source_id));
      if (linkedSearches.some((search) => search.status !== "completed")) hasNonCompletedSearch = true;
    }
    if (claim.status === "verified") {
      if (claim.coverage_status !== "covered") errors.push(`claims[${claimIndex}] verified claim must have covered coverage_status`);
      if (!hasVerifiedSupport) errors.push(`claims[${claimIndex}] verified claim requires verified support`);
      if (hasVerifiedChallenge && claim.coverage_status !== "ambiguous") errors.push(`claims[${claimIndex}] verified challenge requires ambiguous coverage`);
    }
    if (claim.status === "blocked" && !hasBlockedSupport) errors.push(`claims[${claimIndex}] blocked claim requires blocked support`);
    if (hasNonCompletedSearch && claim.coverage_status === "covered") errors.push(`claims[${claimIndex}] cannot be covered when its supporting search is incomplete`);
  }

  const coverage = value.coverage;
  if (!isObject(coverage) || !Array.isArray(coverage.negative) || !Array.isArray(coverage.ambiguous)) {
    errors.push("coverage must contain negative and ambiguous arrays");
  } else {
    exactKeys(coverage, ["negative", "ambiguous"], "coverage", errors);
    const negativeSearchIds = new Set();
    for (const [index, entry] of coverage.negative.entries()) {
      const label = `coverage.negative[${index}]`;
      if (!isObject(entry)) {
        errors.push(`${label} must be an object`);
        continue;
      }
      exactKeys(entry, ["id", "search_id", "claim_ids", "status", "note"], label, errors);
      requireTextFields(entry, ["search_id", "note"], label, errors);
      if (!NEGATIVE_STATUSES.has(entry.status)) errors.push(`${label}.status must be documented, blocked, or not_reached`);
      if (addId(ids, entry.id, "NEG", label, errors) && !searchById.has(entry.search_id)) errors.push(`${label} references unknown search id: ${entry.search_id}`);
      const search = searchById.get(entry.search_id);
      if (search?.status === "completed" && entry.status !== "documented") errors.push(`${label} completed search requires documented negative coverage`);
      if (search?.status === "blocked" && entry.status === "documented") errors.push(`${label} blocked search cannot have documented negative coverage`);
      if (entry.status === "not_reached" && search?.status === "completed") errors.push(`${label} completed search cannot be not_reached`);
      if (search) negativeSearchIds.add(search.id);
      if (!Array.isArray(entry.claim_ids)) {
        errors.push(`${label}.claim_ids must be an array`);
      } else {
        const seen = new Set();
        for (const claimId of entry.claim_ids) {
          if (seen.has(claimId)) errors.push(`${label}.claim_ids contains duplicate ${claimId}`);
          seen.add(claimId);
          if (!claimById.has(claimId)) errors.push(`${label} references unknown claim id: ${claimId}`);
          else negativeByClaim.add(claimId);
        }
      }
    }
    for (const searchId of searchById.keys()) {
      if (!negativeSearchIds.has(searchId)) errors.push(`every search requires negative coverage: ${searchId}`);
    }

    for (const [index, entry] of coverage.ambiguous.entries()) {
      const label = `coverage.ambiguous[${index}]`;
      if (!isObject(entry)) {
        errors.push(`${label} must be an object`);
        continue;
      }
      exactKeys(entry, ["id", "search_id", "claim_ids", "status", "note"], label, errors);
      requireTextFields(entry, ["search_id", "note"], label, errors);
      if (!AMBIGUOUS_STATUSES.has(entry.status)) errors.push(`${label}.status must be open or resolved`);
      if (addId(ids, entry.id, "AMB", label, errors) && !searchById.has(entry.search_id)) errors.push(`${label} references unknown search id: ${entry.search_id}`);
      if (!Array.isArray(entry.claim_ids) || entry.claim_ids.length === 0) {
        errors.push(`${label}.claim_ids must be a non-empty array`);
      } else {
        const seen = new Set();
        for (const claimId of entry.claim_ids) {
          if (seen.has(claimId)) errors.push(`${label}.claim_ids contains duplicate ${claimId}`);
          seen.add(claimId);
          const claim = claimById.get(claimId);
          if (!claim) errors.push(`${label} references unknown claim id: ${claimId}`);
          else {
            ambiguousByClaim.add(claimId);
            if (entry.status === "open") openAmbiguousByClaim.add(claimId);
            if (entry.status === "open" && claim.status === "verified") errors.push(`${label} open ambiguity must reference a non-verified claim`);
          }
        }
      }
    }
  }

  for (const [index, claim] of claims.entries()) {
    if (!isObject(claim)) continue;
    if (claim.coverage_status === "negative" && !negativeByClaim.has(claim.id)) errors.push(`claims[${index}] negative coverage is not recorded`);
    if (claim.coverage_status === "ambiguous" && !ambiguousByClaim.has(claim.id)) errors.push(`claims[${index}] ambiguous coverage is not recorded`);
    if (claim.coverage_status === "covered" && negativeByClaim.has(claim.id)) errors.push(`claims[${index}] covered claim cannot also have negative coverage`);
    if (claim.coverage_status === "covered" && openAmbiguousByClaim.has(claim.id)) errors.push(`claims[${index}] covered claim cannot have open ambiguity`);
  }

  let completion = "invalid";
  if (errors.length === 0) {
    const hasBlocked = claims.some((claim) => claim.status === "blocked") || searches.some((search) => search.status === "blocked") || (Array.isArray(value.coverage?.negative) && value.coverage.negative.some((entry) => entry.status === "blocked" || entry.status === "not_reached"));
    const hasPartial = searches.some((search) => search.status === "partial") || claims.some((claim) => claim.status !== "verified" || claim.coverage_status !== "covered") || (Array.isArray(value.coverage?.ambiguous) && value.coverage.ambiguous.some((entry) => entry.status === "open"));
    completion = hasBlocked ? "blocked" : hasPartial ? "partial" : "complete";
    if (value.completion !== undefined && value.completion !== completion) errors.push(`completion must be ${completion}`);
  }
  if (errors.length > 0) completion = "invalid";
  return { valid: errors.length === 0, completion, errors, sourceCount: sources.length, searchCount: searches.length, claimCount: claims.length };
}
