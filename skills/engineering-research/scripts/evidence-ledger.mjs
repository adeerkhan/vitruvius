const SCHEMA = "evidence.v1";
const SOURCE_STATUSES = new Set(["verified", "blocked", "unverified", "inferred"]);
const CLAIM_STATUSES = new Set(["verified", "partial", "blocked", "unverified", "inferred", "failed"]);
const SEARCH_STATUSES = new Set(["completed", "partial", "blocked"]);
const NEGATIVE_STATUSES = new Set(["documented", "blocked", "not_reached"]);
const AMBIGUOUS_STATUSES = new Set(["open", "resolved"]);
const RELATIONS = new Set(["supports", "challenges", "contextual"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" && value.trim() !== "" && !/[\u0000-\u001f\u007f]/.test(value);
}

function identifier(value, prefix) {
  return typeof value === "string" && new RegExp(`^${prefix}-[A-Z0-9][A-Z0-9._-]*$`).test(value);
}

function isoDate(value) {
  return typeof value === "string" && DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
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

function requireFields(record, fields, label, errors) {
  for (const field of fields) {
    if (!text(record[field])) errors.push(`${label}.${field} must be a non-empty string`);
  }
}

export function validateEvidenceLedger(value) {
  const errors = [];
  if (!isObject(value)) return { valid: false, errors: ["ledger must be an object"], sourceCount: 0, searchCount: 0, claimCount: 0 };
  if (value.schema !== SCHEMA) errors.push(`schema must be ${SCHEMA}`);
  if (!UUID_PATTERN.test(value.run_id)) errors.push("run_id must be a UUID");
  if (!text(value.question)) errors.push("question must be a non-empty string");
  if (value.recorded_at !== undefined && (!text(value.recorded_at) || Number.isNaN(Date.parse(value.recorded_at)))) {
    errors.push("recorded_at must be an ISO timestamp when provided");
  }

  const ids = new Set();
  const sourceIds = new Set();
  const searchIds = new Set();
  const claimIds = new Set();
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
    requireFields(source, ["title", "locator"], label, errors);
    if (addId(ids, source.id, "SRC", label, errors)) sourceIds.add(source.id);
    if (!SOURCE_STATUSES.has(source.status)) errors.push(`${label}.status must be verified, blocked, unverified, or inferred`);
  }

  for (const [index, search] of searches.entries()) {
    const label = `searches[${index}]`;
    if (!isObject(search)) {
      errors.push(`${label} must be an object`);
      continue;
    }
    requireFields(search, ["query", "boundary"], label, errors);
    if (!isoDate(search.searched_on)) errors.push(`${label}.searched_on must be an ISO date`);
    if (!SEARCH_STATUSES.has(search.status)) errors.push(`${label}.status must be completed, partial, or blocked`);
    if (addId(ids, search.id, "SEARCH", label, errors)) searchIds.add(search.id);
    if (!Array.isArray(search.result_source_ids)) {
      errors.push(`${label}.result_source_ids must be an array`);
    } else {
      const resultIds = new Set();
      for (const sourceId of search.result_source_ids) {
        if (!text(sourceId)) errors.push(`${label}.result_source_ids must contain non-empty strings`);
        else if (resultIds.has(sourceId)) errors.push(`${label}.result_source_ids contains duplicate ${sourceId}`);
        else resultIds.add(sourceId);
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
    if (!text(claim.text)) errors.push(`${label}.text must be a non-empty string`);
    if (!CLAIM_STATUSES.has(claim.status)) errors.push(`${label}.status must be verified, partial, blocked, unverified, inferred, or failed`);
    if (addId(ids, claim.id, "CLAIM", label, errors)) claimIds.add(claim.id);
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
      if (!text(mapping.source_id)) errors.push(`${supportLabel}.source_id must be a non-empty string`);
      if (!text(mapping.locator)) errors.push(`${supportLabel}.locator must be a non-empty string`);
      if (!RELATIONS.has(mapping.relation)) errors.push(`${supportLabel}.relation must be supports, challenges, or contextual`);
      if (!SOURCE_STATUSES.has(mapping.status)) errors.push(`${supportLabel}.status must match a source status`);
      const pair = `${mapping.source_id}|${mapping.locator}|${mapping.relation}`;
      if (pairs.has(pair)) errors.push(`${supportLabel} duplicates a source mapping`);
      pairs.add(pair);
      support.push(mapping);
    }
    supportByClaim.set(claim.id, support);
  }

  const sourceById = new Map(sources.filter(isObject).map((source) => [source.id, source]));
  for (const [index, search] of searches.entries()) {
    if (!isObject(search) || !Array.isArray(search.result_source_ids)) continue;
    for (const sourceId of search.result_source_ids) {
      if (!sourceIds.has(sourceId)) errors.push(`searches[${index}] references unknown source id: ${sourceId}`);
    }
  }
  for (const [claimIndex, claim] of claims.entries()) {
    const support = supportByClaim.get(claim.id) || [];
    for (const [supportIndex, mapping] of support.entries()) {
      const label = `claims[${claimIndex}].support[${supportIndex}]`;
      if (!sourceIds.has(mapping.source_id)) {
        errors.push(`${label} references unknown source id: ${mapping.source_id}`);
        continue;
      }
      const source = sourceById.get(mapping.source_id);
      if (source && mapping.status !== source.status) errors.push(`${label} source status must match support status`);
      if (claim.status === "verified" && mapping.relation === "supports" && mapping.status !== "verified") {
        errors.push(`${label} verified claim requires verified support`);
      }
    }
    if (claim.status === "verified" && !support.some((mapping) => mapping.relation === "supports" && mapping.status === "verified")) {
      errors.push(`claims[${claimIndex}] verified claim requires verified support`);
    }
    if (claim.status === "blocked" && !support.some((mapping) => mapping.status === "blocked")) {
      errors.push(`claims[${claimIndex}] blocked claim requires blocked support`);
    }
  }

  const coverage = value.coverage;
  if (!isObject(coverage) || !Array.isArray(coverage.negative) || !Array.isArray(coverage.ambiguous)) {
    errors.push("coverage must contain negative and ambiguous arrays");
  } else {
    const negativeSearches = new Set();
    for (const [index, entry] of coverage.negative.entries()) {
      const label = `coverage.negative[${index}]`;
      if (!isObject(entry)) {
        errors.push(`${label} must be an object`);
        continue;
      }
      if (!text(entry.note)) errors.push(`${label}.note must be a non-empty string`);
      if (!NEGATIVE_STATUSES.has(entry.status)) errors.push(`${label}.status must be documented, blocked, or not_reached`);
      if (addId(ids, entry.id, "NEG", label, errors) && !searchIds.has(entry.search_id)) errors.push(`${label} references unknown search id: ${entry.search_id}`);
      if (searchIds.has(entry.search_id)) negativeSearches.add(entry.search_id);
    }
    for (const searchId of searchIds) {
      if (!negativeSearches.has(searchId)) errors.push(`every search requires negative coverage: ${searchId}`);
    }

    for (const [index, entry] of coverage.ambiguous.entries()) {
      const label = `coverage.ambiguous[${index}]`;
      if (!isObject(entry)) {
        errors.push(`${label} must be an object`);
        continue;
      }
      if (!text(entry.note)) errors.push(`${label}.note must be a non-empty string`);
      if (!AMBIGUOUS_STATUSES.has(entry.status)) errors.push(`${label}.status must be open or resolved`);
      if (addId(ids, entry.id, "AMB", label, errors) && !searchIds.has(entry.search_id)) errors.push(`${label} references unknown search id: ${entry.search_id}`);
      if (!Array.isArray(entry.claim_ids) || entry.claim_ids.length === 0) {
        errors.push(`${label}.claim_ids must be a non-empty array`);
      } else {
        const seenClaims = new Set();
        for (const claimId of entry.claim_ids) {
          if (seenClaims.has(claimId)) errors.push(`${label}.claim_ids contains duplicate ${claimId}`);
          seenClaims.add(claimId);
          if (!claimIds.has(claimId)) errors.push(`${label} references unknown claim id: ${claimId}`);
          else if (entry.status === "open" && claims.find((claim) => claim.id === claimId)?.status === "verified") errors.push(`${label} open ambiguity must reference a non-verified claim`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sourceCount: sources.length,
    searchCount: searches.length,
    claimCount: claims.length,
  };
}
