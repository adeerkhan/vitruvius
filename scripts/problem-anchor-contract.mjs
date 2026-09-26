#!/usr/bin/env node
/**
 * Problem-anchor contract for engineering research deliverables.
 *
 * The research loop can produce a well-cited literature review that never
 * touches the artifact it was commissioned about. This validator closes that
 * gap deterministically: it binds a run to the artifacts it studied, requires
 * every finding to name the decision it informs and what it changes, requires
 * negative coverage, and resolves every repository anchor against real bytes.
 *
 * It does not judge whether an anchored line entails its claim. That remains
 * the verifier's and goal-checker's job. What it guarantees is that a claim
 * about a codebase cannot be made without pointing at the codebase.
 */

import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { unsupportedTokens } from "./entailment.mjs";

const SCHEMA = "vitruvius-problem-anchor.v1";
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const COMMIT_PATTERN = /^[0-9a-f]{7,40}$/;
const LINE_PATTERN = /^[1-9]\d*$/;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

const TYPES = new Set(["external", "repo", "product", "background"]);
const CHANGES = new Set(["change", "measure", "defer", "product-decision", "background"]);
const STATUSES = new Set(["verified", "partial", "blocked", "unverified", "inferred", "failed"]);
const ACTION_CHANGES = new Set(["change", "measure", "defer"]);

const ROOT_KEYS = [
  "schema",
  "question",
  "commit",
  "anchor_root",
  "artifacts",
  "decisions",
  "findings",
  "coverage",
  "final",
];
const ARTIFACT_KEYS = ["id", "path", "sha256", "bytes"];
const DECISION_KEYS = ["id", "text"];
const FINDING_KEYS = ["id", "decision_id", "claim", "type", "locator", "anchor", "artifact_id", "changes", "status"];
const ANCHOR_KEYS = ["path", "line"];
const NEGATIVE_KEYS = ["id", "searched", "not_found", "boundary"];
const FINAL_KEYS = ["path", "sha256", "bytes"];

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

function isIdentifier(value) {
  return typeof value === "string" && IDENTIFIER_PATTERN.test(value);
}

function exactKeys(value, allowed, label, errors, optional = []) {
  if (!isObject(value)) {
    errors.push(`${label} must be an object`);
    return false;
  }
  let ok = true;
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      errors.push(`${label}.${key} is not allowed`);
      ok = false;
    }
  }
  for (const key of allowed) {
    if (optional.includes(key)) continue;
    if (Object.prototype.hasOwnProperty.call(value, key)) continue;
    errors.push(`${label} is missing ${key}`);
    ok = false;
  }
  return ok;
}

function normalize(value) {
  return value.replaceAll("\\", "/");
}

function isConfinedRelativePath(value) {
  if (!isText(value) || value.includes("\\")) return false;
  if (isAbsolute(value) || /^[A-Za-z]:/.test(value)) return false;
  return value.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

function isInside(root, path) {
  const from = relative(root, path);
  return from === "" || (!from.startsWith(`..${sep}`) && from !== ".." && !isAbsolute(from));
}

function lineCount(text) {
  return text.split(/\r?\n/).length;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A report may cite a range (`path:9-13`) as well as a single line. The line
 * number must be delimited on both sides, or an anchor at line 1 is satisfied
 * by a citation to line 13 or 100, and the binding proves nothing.
 */
function anchorPattern(path, line) {
  return new RegExp(`(?<![\\w./-])${escapeRegExp(path)}:${line}(?![0-9])(?:\\s*[-\u2013\u2014]\\s*\\d+)?`);
}

/**
 * Resolve a confined path under a root, following links before the containment
 * test. A lexical check alone lets a junction inside the root point outside it.
 */
function readAnchoredFile(anchorRoot, relativePath, errors, label) {
  const absolute = resolve(anchorRoot, relativePath);
  if (!isInside(anchorRoot, absolute)) {
    errors.push(`${label} escapes anchor_root`);
    return null;
  }
  let actual;
  try {
    actual = realpathSync(absolute);
  } catch {
    errors.push(`${label} path does not resolve to a readable file: ${relativePath}`);
    return null;
  }
  if (!isInside(anchorRoot, actual)) {
    errors.push(`${label} resolves outside anchor_root through a link`);
    return null;
  }
  let text;
  try {
    text = readFileSync(actual, "utf8");
  } catch {
    errors.push(`${label} path does not resolve to a readable file: ${relativePath}`);
    return null;
  }
  return { absolute: actual, text };
}

export function validateProblemAnchor(record, { anchorRoot: anchorRootOption, recordPath } = {}) {
  const errors = [];
  if (!exactKeys(record, ROOT_KEYS, "problem-anchor", errors)) {
    return { valid: false, errors, counts: null };
  }
  if (record.schema !== SCHEMA) errors.push(`schema must be ${SCHEMA}`);
  if (!isText(record.question)) errors.push("question must be non-empty");
  if (typeof record.commit !== "string" || !COMMIT_PATTERN.test(record.commit)) {
    errors.push("commit must be 7-40 lowercase hex characters");
  }

  // --- anchor root -------------------------------------------------------
  let anchorRoot = null;
  const rootLabel = isText(record.anchor_root) ? record.anchor_root : "";
  if (!rootLabel) {
    errors.push("anchor_root must be non-empty");
  } else if (isAbsolute(rootLabel) || /^[A-Za-z]:/.test(rootLabel)) {
    anchorRoot = resolve(rootLabel);
  } else if (recordPath) {
    anchorRoot = resolve(resolve(recordPath), "..", rootLabel);
  } else {
    anchorRoot = resolve(rootLabel);
  }
  if (anchorRoot) {
    try {
      anchorRoot = realpathSync(anchorRoot);
      if (!statSync(anchorRoot).isDirectory()) throw new Error("not a directory");
    } catch {
      errors.push(`anchor_root does not resolve to a directory: ${rootLabel}`);
      anchorRoot = null;
    }
  }

  // --- artifacts under study -------------------------------------------
  const artifacts = new Map();
  if (!Array.isArray(record.artifacts) || record.artifacts.length === 0) {
    errors.push("artifacts must be a non-empty array of the files under study");
  } else {
    record.artifacts.forEach((artifact, index) => {
      const label = `artifacts[${index}]`;
      if (!exactKeys(artifact, ARTIFACT_KEYS, label, errors)) return;
      if (!isIdentifier(artifact.id)) errors.push(`${label}.id must be a short identifier`);
      else if (artifacts.has(artifact.id)) errors.push(`${label}.id is duplicated`);
      if (!isConfinedRelativePath(artifact.path)) {
        errors.push(`${label}.path must be a confined relative path using / separators`);
        return;
      }
      if (artifacts.has(artifact.id)) return;
      const file = anchorRoot ? readAnchoredFile(anchorRoot, artifact.path, errors, label) : null;
      if (!file) {
        artifacts.set(artifact.id, { ...artifact, present: false });
        return;
      }
      const bytes = readFileSync(file.absolute);
      const digest = createHash("sha256").update(bytes).digest("hex");
      if (typeof artifact.sha256 !== "string" || !SHA256_PATTERN.test(artifact.sha256)) {
        errors.push(`${label}.sha256 must be 64 lowercase hex characters`);
      } else if (artifact.sha256 !== digest) {
        errors.push(`${label}.sha256 does not match the bytes on disk`);
      }
      if (!Number.isInteger(artifact.bytes) || artifact.bytes < 1) {
        errors.push(`${label}.bytes must be a positive integer`);
      } else if (artifact.bytes !== bytes.length) {
        errors.push(`${label}.bytes does not match the file on disk`);
      }
      artifacts.set(artifact.id, { ...artifact, present: true, digest, size: bytes.length, lines: lineCount(file.text) });
    });
  }

  // --- decisions the report must inform ---------------------------------
  const decisions = new Map();
  if (!Array.isArray(record.decisions) || record.decisions.length === 0) {
    errors.push("decisions must be a non-empty array of the decisions this report must inform");
  } else {
    record.decisions.forEach((decision, index) => {
      const label = `decisions[${index}]`;
      if (!exactKeys(decision, DECISION_KEYS, label, errors)) return;
      if (!isIdentifier(decision.id)) errors.push(`${label}.id must be a short identifier`);
      else if (decisions.has(decision.id)) errors.push(`${label}.id is duplicated`);
      if (!isText(decision.text)) errors.push(`${label}.text must be non-empty`);
      if (isIdentifier(decision.id)) decisions.set(decision.id, decision);
    });
  }

  // --- final candidate ---------------------------------------------------
  let finalPath = null;
  let finalText = "";
  if (!exactKeys(record.final, FINAL_KEYS, "final", errors)) {
    // fall through; findings still validate structurally
  } else if (!isConfinedRelativePath(record.final.path)) {
    errors.push("final.path must be a confined relative path using / separators");
  } else {
    const base = recordPath ? resolve(resolve(recordPath), "..") : resolve();
    finalPath = resolve(base, record.final.path);
    let bytes;
    try {
      bytes = readFileSync(finalPath);
    } catch {
      errors.push(`final.path does not resolve to a readable file: ${record.final.path}`);
    }
    // `final.path` is confined, so it cannot climb out with `..`. That makes
    // "the record sits beside its candidate" a structural requirement, not a
    // convention — say so, because a record in a drafts directory cannot
    // describe a candidate one level up.
    if (recordPath && normalize(dirname(resolve(recordPath))) !== normalize(dirname(finalPath))) {
      errors.push("problem-anchor record must be beside the final candidate");
    }
    if (bytes) {
      finalText = bytes.toString("utf8");
      const digest = createHash("sha256").update(bytes).digest("hex");
      if (typeof record.final.sha256 !== "string" || !SHA256_PATTERN.test(record.final.sha256)) {
        errors.push("final.sha256 must be 64 lowercase hex characters");
      } else if (record.final.sha256 !== digest) {
        errors.push("final.sha256 does not match the candidate on disk");
      }
      if (!Number.isInteger(record.final.bytes) || record.final.bytes < 1) {
        errors.push("final.bytes must be a positive integer");
      } else if (record.final.bytes !== bytes.length) {
        errors.push("final.bytes does not match the candidate on disk");
      }
    }
  }

  // --- findings ----------------------------------------------------------
  const findingIds = new Set();
  const coveredDecisions = new Set();
  if (!Array.isArray(record.findings) || record.findings.length === 0) {
    errors.push("findings must be a non-empty array");
  } else {
    record.findings.forEach((finding, index) => {
      const label = `findings[${index}]`;
      if (!exactKeys(finding, FINDING_KEYS, label, errors, ["locator", "anchor", "artifact_id"])) return;
      if (!isIdentifier(finding.id)) errors.push(`${label}.id must be a short identifier`);
      else if (findingIds.has(finding.id)) errors.push(`${label}.id is duplicated`);
      else findingIds.add(finding.id);
      if (!isText(finding.claim)) errors.push(`${label}.claim must be non-empty`);
      if (!decisions.has(finding.decision_id)) errors.push(`${label}.decision_id does not name a declared decision`);
      else coveredDecisions.add(finding.decision_id);
      if (!TYPES.has(finding.type)) errors.push(`${label}.type must be one of ${[...TYPES].join(", ")}`);
      if (!CHANGES.has(finding.changes)) errors.push(`${label}.changes must be one of ${[...CHANGES].join(", ")}`);
      if (!STATUSES.has(finding.status)) errors.push(`${label}.status must be one of ${[...STATUSES].join(", ")}`);

      const anchored = finding.anchor !== undefined;
      if (finding.type === "repo" && !anchored) {
        errors.push(`${label} is a repo finding and must carry an anchor (path + line)`);
      }
      if (finding.anchor !== undefined && !exactKeys(finding.anchor, ANCHOR_KEYS, `${label}.anchor`, errors)) {
        return;
      }

      // product/background findings are not about the artifact and must not
      // smuggle in an anchor; external findings cite a locator instead.
      if ((finding.type === "product" || finding.type === "background") && anchored) {
        errors.push(`${label} is a ${finding.type} finding and cannot carry a repository anchor`);
      }
      if (finding.type === "product" && finding.changes !== "product-decision") {
        errors.push(`${label} is a product finding and must set changes=product-decision`);
      }
      if (finding.type === "background" && finding.changes !== "background") {
        errors.push(`${label} is a background finding and must set changes=background`);
      }
      if (finding.type === "external") {
        if (!isText(finding.locator)) errors.push(`${label} is an external finding and must carry a locator`);
      } else if (finding.locator !== undefined) {
        errors.push(`${label}.locator is only valid on external findings`);
      }

      // An actionable finding must name the artifact it lands on; a `repo`
      // finding is always about a declared artifact, so its bytes are always
      // hash-pinned. Otherwise a claim could rest on a file no artifact entry
      // pins, and the snapshot check would bless bytes nobody declared.
      if (ACTION_CHANGES.has(finding.changes) || finding.type === "repo") {
        if (!isIdentifier(finding.artifact_id)) {
          errors.push(`${label} must name the artifact it rests on via artifact_id`);
        } else if (!artifacts.has(finding.artifact_id)) {
          errors.push(`${label}.artifact_id does not name a declared artifact`);
        } else if (anchored) {
          const artifact = artifacts.get(finding.artifact_id);
          if (finding.anchor.path !== artifact.path) {
            errors.push(`${label}.anchor.path must match artifact_id path ${artifact.path}`);
          }
        }
      } else if (finding.artifact_id !== undefined) {
        errors.push(`${label}.artifact_id is only valid on a repo finding or an action`);
      }

      // resolve the anchor against real bytes, and check that a `verified`
      // repo claim's high-precision content is actually carried by that line
      let anchoredLine = null;
      if (anchored) {
        const anchorLabel = `${label}.anchor`;
        if (!isConfinedRelativePath(finding.anchor.path)) {
          errors.push(`${anchorLabel}.path must be a confined relative path using / separators`);
        } else if (!Number.isInteger(finding.anchor.line) || !LINE_PATTERN.test(String(finding.anchor.line))) {
          errors.push(`${anchorLabel}.line must be a positive integer`);
        } else if (anchorRoot) {
          const file = readAnchoredFile(anchorRoot, finding.anchor.path, errors, anchorLabel);
          if (file) {
            const lines = file.text.split(/\r?\n/);
            if (finding.anchor.line > lines.length) {
              errors.push(`${anchorLabel}.line ${finding.anchor.line} is past end of file (${lines.length} lines)`);
            } else if ((lines[finding.anchor.line - 1] ?? "").trim() === "") {
              errors.push(`${anchorLabel}.line ${finding.anchor.line} is blank; anchor a line that carries the claim`);
            } else {
              anchoredLine = lines[finding.anchor.line - 1];
            }
          }
        }
      }

      // Entailment proxy. `verified` now means: the anchor resolved AND it
      // carries the claim's quoted spans, identifiers, and measures. A finding
      // that paraphrases should be `partial`, which is why this is gated on
      // the status rather than applied to everything. See references/
      // problem-anchor-contract.md for what this still cannot catch.
      if (
        finding.type === "repo" &&
        finding.status === "verified" &&
        isText(finding.claim) &&
        anchoredLine !== null
      ) {
        for (const { token, kind } of unsupportedTokens(finding.claim, anchoredLine)) {
          errors.push(
            `${label} is verified but the anchored line does not carry its ${kind} ${token}; ` +
              `downgrade to partial or anchor the line that does`,
          );
        }
      }

      if (finding.status === "verified" && !anchored && !isText(finding.locator)) {
        errors.push(`${label} is verified but carries neither a resolvable anchor nor a locator`);
      }

      // the candidate must actually carry the finding and its anchor
      if (finalText) {
        if (isIdentifier(finding.id) && !finalText.includes(finding.id)) {
          errors.push(`${label}.id does not appear in the final artifact`);
        }
        if (
          anchored &&
          isConfinedRelativePath(finding.anchor.path) &&
          Number.isInteger(finding.anchor.line)
        ) {
          if (!anchorPattern(finding.anchor.path, finding.anchor.line).test(finalText)) {
            errors.push(
              `${label} anchor ${normalize(finding.anchor.path)}:${finding.anchor.line} is not cited in the final artifact`,
            );
          }
        }
      }
    });
  }

  for (const id of decisions.keys()) {
    if (!coveredDecisions.has(id)) {
      errors.push(`decision ${id} has no finding; a report must reach a position on every decision it claims to inform`);
    }
  }

  // --- negative coverage -------------------------------------------------
  if (!isObject(record.coverage)) {
    errors.push("coverage must be an object");
  } else {
    exactKeys(record.coverage, ["negative"], "coverage", errors);
    if (!Array.isArray(record.coverage.negative) || record.coverage.negative.length === 0) {
      errors.push("coverage.negative must record at least one searched-for-and-not-found boundary");
    } else {
      const negativeIds = new Set();
      record.coverage.negative.forEach((entry, index) => {
        const label = `coverage.negative[${index}]`;
        if (!exactKeys(entry, NEGATIVE_KEYS, label, errors)) return;
        if (!isIdentifier(entry.id)) errors.push(`${label}.id must be a short identifier`);
        else if (negativeIds.has(entry.id)) errors.push(`${label}.id is duplicated`);
        else negativeIds.add(entry.id);
        for (const key of ["searched", "not_found", "boundary"]) {
          if (!isText(entry[key])) errors.push(`${label}.${key} must be non-empty`);
        }
        // Bound to the candidate for the same reason findings are: a boundary
        // recorded only in the JSON is a boundary the reader never sees.
        if (finalText && isIdentifier(entry.id) && !finalText.includes(entry.id)) {
          errors.push(`${label}.id does not appear in the final artifact`);
        }
      });
    }
  }

  const counts = {
    artifacts: artifacts.size,
    decisions: decisions.size,
    findings: findingIds.size,
    negative: isObject(record.coverage) && Array.isArray(record.coverage.negative) ? record.coverage.negative.length : 0,
  };
  return { valid: errors.length === 0, errors, counts };
}

if (isMainModule()) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/problem-anchor-contract.mjs <problem-anchor.json>");
    process.exit(1);
  }
  let record;
  try {
    record = JSON.parse(readFileSync(resolve(file), "utf8"));
  } catch (error) {
    console.error(`Could not read problem-anchor record: ${error.message}`);
    process.exit(1);
  }
  const result = validateProblemAnchor(record, { recordPath: resolve(file) });
  if (!result.valid) {
    console.error(result.errors.map((error) => `- ${error}`).join("\n"));
    process.exit(1);
  }
  const c = result.counts;
  console.log(
    `PASS: problem anchor valid — ${c.findings} finding(s) across ${c.decisions} decision(s), ` +
      `${c.artifacts} anchored artifact(s), ${c.negative} negative-coverage entr(ies)`,
  );
}
