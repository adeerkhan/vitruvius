/**
 * habit-ledger.mjs — Validate and operate an explicit, local Habit ledger.
 *
 * The role proposes candidates. The lead validates them, records an explicit
 * human approval, and activates selected rules into a project-local store.
 * Nothing here scans a transcript or writes AGENTS.md.
 *
 * Commands:
 *   node scripts/habit-ledger.mjs validate <ledger>
 *   node scripts/habit-ledger.mjs approve <ledger> --id <id> [--id <id>] --by user
 *   node scripts/habit-ledger.mjs reject <ledger> --id <id> [--id <id>] --by user
 *   node scripts/habit-ledger.mjs activate <ledger> [--store <path>]
 *   node scripts/habit-ledger.mjs load [--store <path>] [--scope <scope>]
 *   node scripts/habit-ledger.mjs revoke <store> --id <id>
 *   node scripts/habit-ledger.mjs redact <ledger> [--output <path>]
 *   node scripts/habit-ledger.mjs redact-file <brief> --output <brief>
 */

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const HABIT_SCHEMA = "habit.v1";
export const STORE_SCHEMA = "habit-store.v1";

const CANDIDATE_STATUSES = new Set([
  "proposed",
  "approved",
  "rejected",
  "superseded",
  "revoked",
]);
const STORE_STATUSES = new Set(["active", "superseded", "revoked", "expired"]);
const STORE_ACTIONS = new Set(["activated", "superseded", "revoked"]);
const ID_PATTERN = /^[a-z][a-z0-9_-]{0,79}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SECRET_PATTERNS = [
  /-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/gi,
  /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|password|passwd|secret)\s*[:=]\s*["']?[^\s"',;]+/gi,
  /\b(?:sk|pk|ghp|gho|github_pat|xox[baprs])[-_][A-Za-z0-9_-]{12,}\b/g,
];

function nowIso(now) {
  if (now instanceof Date) {
    if (Number.isNaN(now.getTime())) throw new Error("invalid timestamp");
    return now.toISOString();
  }
  if (typeof now === "string") {
    if (Number.isNaN(Date.parse(now))) throw new Error(`invalid timestamp: ${now}`);
    return new Date(now).toISOString();
  }
  throw new Error("timestamp is required");
}

function isDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function clone(value) {
  return structuredClone(value);
}

function freshPattern(pattern) {
  return new RegExp(pattern.source, pattern.flags);
}

function containsSecret(text) {
  return SECRET_PATTERNS.some((pattern) => freshPattern(pattern).test(text));
}

function redactString(text) {
  let result = text;
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(freshPattern(pattern), (match) => {
      const separator = match.search(/[:=]/);
      return separator >= 0 ? `${match.slice(0, separator + 1)}[REDACTED]` : "[REDACTED]";
    });
  }
  return result;
}

export function redactSecrets(value) {
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map((item) => redactSecrets(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, redactSecrets(item)]),
    );
  }
  return value;
}

function validateWindow(window, errors) {
  if (!Array.isArray(window) || window.length === 0 || window.length > 100) {
    errors.push("window must contain 1-100 turns");
    return new Map();
  }
  const turns = new Map();
  for (const turn of window) {
    if (!turn || typeof turn !== "object") {
      errors.push("window turn must be an object");
      continue;
    }
    if (typeof turn.id !== "string" || !ID_PATTERN.test(turn.id)) {
      errors.push(`invalid window id: ${String(turn.id)}`);
    } else if (turns.has(turn.id)) {
      errors.push(`duplicate window id: ${turn.id}`);
    } else {
      turns.set(turn.id, turn);
    }
    if (turn.role !== "user" && turn.role !== "assistant") {
      errors.push(`invalid role for window id ${turn.id}`);
    }
    if (typeof turn.text !== "string" || turn.text.length > 2000) {
      errors.push(`window text too long or missing for ${turn.id}`);
    } else if (containsSecret(turn.text)) {
      errors.push(`secret pattern in window text ${turn.id}`);
    }
    if (!isDate(turn.createdAt)) {
      errors.push(`invalid createdAt for window id ${turn.id}`);
    }
  }
  return turns;
}

function validateCandidates(candidates, turns, errors) {
  if (!Array.isArray(candidates) || candidates.length > 20) {
    errors.push("candidates must be an array with at most 20 entries");
    return new Map();
  }
  const byId = new Map();
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") {
      errors.push("candidate must be an object");
      continue;
    }
    if (typeof candidate.id !== "string" || !ID_PATTERN.test(candidate.id)) {
      errors.push(`invalid candidate id: ${String(candidate.id)}`);
    } else if (byId.has(candidate.id)) {
      errors.push(`duplicate candidate id: ${candidate.id}`);
    } else {
      byId.set(candidate.id, candidate);
    }
    if (typeof candidate.t !== "string" || candidate.t.length < 1 || candidate.t.length > 200) {
      errors.push(`candidate ${candidate.id}: t must be 1-200 characters`);
    }
    if (typeof candidate.d !== "string" || candidate.d.length > 400) {
      errors.push(`candidate ${candidate.id}: d must be at most 400 characters`);
    }
    if (!CANDIDATE_STATUSES.has(candidate.status)) {
      errors.push(`candidate ${candidate.id}: invalid status`);
    }
    if (typeof candidate.scope !== "string" || candidate.scope.length < 1 || candidate.scope.length > 80) {
      errors.push(`candidate ${candidate.id}: invalid scope`);
    }
    if (!isDate(candidate.createdAt)) {
      errors.push(`candidate ${candidate.id}: invalid createdAt`);
    }
    if (!Array.isArray(candidate.e) || candidate.e.length < 1 || candidate.e.length > 3) {
      errors.push(`candidate ${candidate.id}: e must contain 1-3 evidence ids`);
    } else {
      const seen = new Set();
      for (const evidenceId of candidate.e) {
        if (seen.has(evidenceId)) errors.push(`candidate ${candidate.id}: duplicate evidence id ${evidenceId}`);
        seen.add(evidenceId);
        const turn = turns.get(evidenceId);
        if (!turn) errors.push(`candidate ${candidate.id}: evidence ${evidenceId} is outside the window`);
        else if (turn.role !== "user") errors.push(`candidate ${candidate.id}: evidence ${evidenceId} is not a user turn`);
      }
    }
    if (candidate.supersedes !== undefined) {
      if (!Array.isArray(candidate.supersedes) || candidate.supersedes.length > 3) {
        errors.push(`candidate ${candidate.id}: supersedes must be an array of at most 3 ids`);
      } else {
        const supersedesIds = new Set();
        for (const oldId of candidate.supersedes) {
          if (typeof oldId !== "string" || !ID_PATTERN.test(oldId)) {
            errors.push(`candidate ${candidate.id}: invalid supersedes id ${String(oldId)}`);
          } else if (supersedesIds.has(oldId)) {
            errors.push(`candidate ${candidate.id}: duplicate supersedes id ${oldId}`);
          } else {
            supersedesIds.add(oldId);
          }
        }
      }
    }
    if (containsSecret(candidate.t) || containsSecret(candidate.d)) {
      errors.push(`candidate ${candidate.id}: secret pattern`);
    }
  }
  return byId;
}

export function validateLedger(ledger, { now = new Date() } = {}) {
  const errors = [];
  if (!ledger || typeof ledger !== "object" || Array.isArray(ledger)) {
    return { valid: false, errors: ["ledger must be an object"] };
  }
  if (ledger.schema !== HABIT_SCHEMA) errors.push(`schema must be ${HABIT_SCHEMA}`);
  if (ledger.version !== 1) errors.push("version must be 1");
  if (typeof ledger.run !== "string" || !SLUG_PATTERN.test(ledger.run)) {
    errors.push("run must be a lowercase hyphenated slug");
  }
  if (typeof ledger.scope !== "string" || ledger.scope.length < 1 || ledger.scope.length > 80) {
    errors.push("scope must be 1-80 characters");
  }
  if (!isDate(ledger.createdAt)) errors.push("createdAt must be an ISO date");
  if (ledger.expiresAt !== undefined && ledger.expiresAt !== null && !isDate(ledger.expiresAt)) {
    errors.push("expiresAt must be an ISO date or null");
  }
  if (isDate(ledger.createdAt) && isDate(ledger.expiresAt) && Date.parse(ledger.expiresAt) <= Date.parse(ledger.createdAt)) {
    errors.push("expiresAt must be after createdAt");
  }
  if (isDate(ledger.expiresAt) && Date.parse(ledger.expiresAt) <= new Date(nowIso(now)).getTime()) {
    errors.push("ledger is expired");
  }

  const turns = validateWindow(ledger.window, errors);
  const candidates = validateCandidates(ledger.c, turns, errors);

  if (ledger.approval !== undefined) {
    const approval = ledger.approval;
    if (!approval || typeof approval !== "object") {
      errors.push("approval must be an object");
    } else {
      if (approval.status !== "approved" && approval.status !== "rejected") {
        errors.push("approval.status must be approved or rejected");
      }
      if (typeof approval.approvedBy !== "string" || approval.approvedBy.length < 1) {
        errors.push("approval.approvedBy is required");
      }
      if (!isDate(approval.approvedAt)) errors.push("approval.approvedAt must be an ISO date");
      if (!Array.isArray(approval.candidateIds) || approval.candidateIds.length < 1) {
        errors.push("approval.candidateIds must be non-empty");
      } else {
        const seen = new Set();
        for (const id of approval.candidateIds) {
          const candidate = candidates.get(id);
          if (!candidate) errors.push(`approval references unknown candidate ${id}`);
          else if (candidate.status !== approval.status) {
            errors.push(`approval status ${approval.status} does not match candidate ${id} status ${candidate.status}`);
          }
          if (seen.has(id)) errors.push(`approval repeats candidate ${id}`);
          seen.add(id);
        }
      }
    }
  }

  if (typeof ledger.c !== "undefined" && !Array.isArray(ledger.c)) {
    errors.push("c must be an array");
  }
  const decidedCandidates = [...candidates.values()].filter((candidate) => candidate.status !== "proposed");
  if (decidedCandidates.length > 0 && !ledger.approval) {
    errors.push("approval metadata is required for decided candidates");
  }
  if (ledger.approval?.candidateIds) {
    const approvedIds = new Set(ledger.approval.candidateIds);
    for (const candidate of decidedCandidates) {
      if (!approvedIds.has(candidate.id)) {
        errors.push(`approval metadata omits decided candidate ${candidate.id}`);
      }
    }
  }
  for (const candidate of candidates.values()) {
    if (candidate.scope !== ledger.scope) {
      errors.push(`candidate ${candidate.id}: scope must match ledger scope`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function ensureValidLedger(ledger, options) {
  const report = validateLedger(ledger, options);
  if (!report.valid) throw new Error(`invalid habit ledger: ${report.errors.join("; ")}`);
}

function ensureValidStore(store) {
  if (!store || store.schema !== STORE_SCHEMA || !Array.isArray(store.rules) || !Array.isArray(store.events)) {
    throw new Error("invalid habit store");
  }
  const ids = new Set();
  const activeKeys = new Set();
  for (const rule of store.rules) {
    if (!rule || typeof rule.id !== "string" || !ID_PATTERN.test(rule.id) || ids.has(rule.id)) {
      throw new Error("invalid or duplicate store rule id");
    }
    ids.add(rule.id);
    if (!STORE_STATUSES.has(rule.status)) throw new Error(`invalid store rule status: ${rule.status}`);
    if (typeof rule.t !== "string" || rule.t.length < 1 || rule.t.length > 200) throw new Error("invalid store rule text");
    if (typeof rule.d !== "string" || rule.d.length > 400) throw new Error("invalid store rule details");
    if (containsSecret(rule.t) || containsSecret(rule.d)) throw new Error(`secret pattern in store rule ${rule.id}`);
    if (typeof rule.scope !== "string" || rule.scope.length < 1 || rule.scope.length > 80) throw new Error("invalid store rule scope");
    if (typeof rule.sourceRun !== "string" || !SLUG_PATTERN.test(rule.sourceRun)) throw new Error("invalid store source run");
    if (!Array.isArray(rule.e) || rule.e.length < 1 || rule.e.length > 3 || rule.e.some((id) => typeof id !== "string" || !ID_PATTERN.test(id))) {
      throw new Error("invalid store evidence");
    }
    if (!isDate(rule.activatedAt)) throw new Error(`invalid activatedAt for store rule ${rule.id}`);
    if (rule.expiresAt !== null && !isDate(rule.expiresAt)) throw new Error(`invalid expiresAt for store rule ${rule.id}`);
    if (rule.expiresAt && Date.parse(rule.expiresAt) <= Date.parse(rule.activatedAt)) throw new Error(`invalid expiry order for store rule ${rule.id}`);
    if (rule.status === "active") {
      const key = normalizedRuleKey(rule);
      if (activeKeys.has(key)) throw new Error(`duplicate active store rule: ${rule.id}`);
      activeKeys.add(key);
    }
    if (rule.status === "revoked" && !isDate(rule.revokedAt)) throw new Error(`revoked rule ${rule.id} lacks revokedAt`);
    if (rule.status === "superseded" && (!ID_PATTERN.test(rule.supersededBy || "") || !isDate(rule.supersededAt))) {
      throw new Error(`superseded rule ${rule.id} lacks supersession metadata`);
    }
  }
  const eventKeys = new Set();
  const ruleById = new Map(store.rules.map((rule) => [rule.id, rule]));
  for (const event of store.events) {
    if (!event || !STORE_ACTIONS.has(event.action) || typeof event.id !== "string" || !ID_PATTERN.test(event.id) || !isDate(event.at)) {
      throw new Error("invalid habit store event");
    }
    const eventKey = `${event.action}:${event.id}`;
    if (eventKeys.has(eventKey)) throw new Error(`duplicate habit store event: ${eventKey}`);
    eventKeys.add(eventKey);
    const rule = ruleById.get(event.id);
    if (!rule) throw new Error(`habit store event references unknown rule: ${event.id}`);
    if (event.action === "superseded" && (rule.status !== "superseded" || rule.supersededBy !== event.by || rule.supersededAt !== event.at)) {
      throw new Error(`invalid supersession event for ${event.id}`);
    }
    if (event.action === "revoked" && (rule.status !== "revoked" || rule.revokedAt !== event.at)) {
      throw new Error(`invalid revocation event for ${event.id}`);
    }
    if (event.action === "activated" && (typeof event.by !== "string" || event.by.length < 1)) {
      throw new Error(`activated event lacks actor for ${event.id}`);
    }
  }
}

export function emptyStore() {
  return { schema: STORE_SCHEMA, rules: [], events: [] };
}

function setApproval(ledger, ids, status, actor, at) {
  ensureValidLedger(ledger);
  const next = clone(ledger);
  const byId = new Map(next.c.map((candidate) => [candidate.id, candidate]));
  for (const id of ids) {
    const candidate = byId.get(id);
    if (!candidate) throw new Error(`unknown candidate: ${id}`);
    if (candidate.status !== "proposed") throw new Error(`candidate ${id} is not proposed`);
    candidate.status = status;
  }
  next.approval = {
    status,
    approvedBy: actor,
    approvedAt: at,
    candidateIds: [...ids],
  };
  ensureValidLedger(next);
  return next;
}

export function approveCandidates(ledger, ids, { approvedBy, approvedAt = new Date().toISOString() } = {}) {
  if (!Array.isArray(ids) || ids.length === 0) throw new Error("at least one candidate id is required");
  if (typeof approvedBy !== "string" || approvedBy.length < 1) throw new Error("approvedBy is required");
  return setApproval(ledger, ids, "approved", approvedBy, approvedAt);
}

export function rejectCandidates(ledger, ids, { actor, at = new Date().toISOString() } = {}) {
  if (!Array.isArray(ids) || ids.length === 0) throw new Error("at least one candidate id is required");
  if (typeof actor !== "string" || actor.length < 1) throw new Error("actor is required");
  return setApproval(ledger, ids, "rejected", actor, at);
}

function normalizedRuleKey(rule) {
  return `${rule.scope}\u0000${rule.t.toLowerCase().replace(/\s+/g, " ").trim()}`;
}

export function activateLedger(ledger, store = emptyStore(), { now = new Date() } = {}) {
  const at = nowIso(now);
  ensureValidLedger(ledger, { now: at });
  ensureValidStore(store);
  if (ledger.approval?.status !== "approved") throw new Error("ledger must be explicitly approved before activation");
  const approvedIds = new Set(ledger.approval.candidateIds);
  const next = clone(store);
  const activeById = new Map(next.rules.map((rule) => [rule.id, rule]));
  const activeKeys = new Set(
    next.rules
      .filter((rule) => rule.status === "active" && (!rule.expiresAt || Date.parse(rule.expiresAt) > Date.parse(at)))
      .map(normalizedRuleKey),
  );
  const pendingKeys = new Set(activeKeys);
  const supersededIds = new Set();

  for (const candidate of ledger.c) {
    if (!approvedIds.has(candidate.id)) continue;
    if (candidate.status !== "approved") throw new Error(`approved candidate ${candidate.id} is not approved`);
    const candidateKey = normalizedRuleKey(candidate);
    if (pendingKeys.has(candidateKey)) {
      throw new Error(`habit conflict: an active or pending rule already exists for ${candidate.id}`);
    }
    pendingKeys.add(candidateKey);
    for (const oldId of candidate.supersedes ?? []) {
      if (supersededIds.has(oldId)) throw new Error(`habit supersession conflict: ${oldId}`);
      supersededIds.add(oldId);
      const old = activeById.get(oldId);
      if (!old || old.status !== "active" || (old.expiresAt && Date.parse(old.expiresAt) <= Date.parse(at))) {
        throw new Error(`cannot supersede inactive habit ${oldId}`);
      }
    }
  }

  for (const candidate of ledger.c) {
    if (!approvedIds.has(candidate.id)) continue;
    for (const oldId of candidate.supersedes ?? []) {
      const old = activeById.get(oldId);
      old.status = "superseded";
      old.supersededBy = candidate.id;
      old.supersededAt = at;
      activeKeys.delete(normalizedRuleKey(old));
      next.events.push({ action: "superseded", id: oldId, by: candidate.id, at });
    }
    const rule = {
      id: candidate.id,
      t: candidate.t,
      d: candidate.d,
      e: [...candidate.e],
      scope: candidate.scope,
      sourceRun: ledger.run,
      status: "active",
      activatedAt: at,
      expiresAt: ledger.expiresAt ?? null,
    };
    next.rules.push(rule);
    activeById.set(rule.id, rule);
    activeKeys.add(normalizedRuleKey(rule));
    next.events.push({ action: "activated", id: rule.id, by: ledger.approval.approvedBy, at });
  }
  ensureValidStore(next);
  return next;
}

export function loadHabits(store, { scope, now = new Date() } = {}) {
  ensureValidStore(store);
  const timestamp = new Date(nowIso(now)).getTime();
  return store.rules
    .filter((rule) => rule.status === "active")
    .filter((rule) => !scope || rule.scope === scope || rule.scope === "*")
    .filter((rule) => !rule.expiresAt || Date.parse(rule.expiresAt) > timestamp)
    .map((rule) => ({
      id: rule.id,
      t: rule.t,
      d: rule.d,
      e: [...rule.e],
      scope: rule.scope,
      sourceRun: rule.sourceRun,
      expiresAt: rule.expiresAt ?? null,
    }));
}

export function revokeHabit(store, id, { now = new Date() } = {}) {
  ensureValidStore(store);
  const at = nowIso(now);
  const next = clone(store);
  const rule = next.rules.find((item) => item.id === id);
  if (!rule) throw new Error(`unknown habit: ${id}`);
  if (rule.status !== "active") throw new Error(`habit ${id} is not active`);
  rule.status = "revoked";
  rule.revokedAt = at;
  next.events.push({ action: "revoked", id, at });
  ensureValidStore(next);
  return next;
}

export function readJson(path) {
  return JSON.parse(readFileSync(resolve(path), "utf-8"));
}

function assertProjectLocal(target, projectRoot) {
  const root = resolve(projectRoot);
  const relativeTarget = relative(root, target);
  if (relativeTarget.startsWith("..") || isAbsolute(relativeTarget)) {
    throw new Error(`refusing path outside project root: ${target}`);
  }
  if (existsSync(target) && lstatSync(target).isSymbolicLink()) {
    throw new Error(`refusing symbolic-link path: ${target}`);
  }
  let current = dirname(target);
  while (true) {
    if (existsSync(current)) {
      if (lstatSync(current).isSymbolicLink()) {
        throw new Error(`refusing symbolic-link path component: ${current}`);
      }
      const real = realpathSync(current);
      const relativeReal = relative(root, real);
      if (relativeReal.startsWith("..") || isAbsolute(relativeReal)) {
        throw new Error(`refusing path outside project root: ${current}`);
      }
    }
    if (current === root) break;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

function writeTextAtomic(path, text, { projectRoot = process.cwd() } = {}) {
  const target = resolve(path);
  if (basename(target).toLowerCase() === "agents.md") throw new Error("refusing to write AGENTS.md");
  assertProjectLocal(target, projectRoot);
  if (existsSync(target) && lstatSync(target).isSymbolicLink()) {
    throw new Error("refusing to write through a symbolic link");
  }
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.tmp-${process.pid}-${randomUUID()}`;
  writeFileSync(temporary, text, { encoding: "utf-8", flag: "wx", mode: 0o600 });
  renameSync(temporary, target);
}

export function writeJsonAtomic(path, value, options = {}) {
  writeTextAtomic(path, `${JSON.stringify(value, null, 2)}\n`, options);
}

export function withStoreLock(storePath, callback, { projectRoot = process.cwd() } = {}) {
  const target = resolve(storePath);
  assertProjectLocal(`${target}.lock`, projectRoot);
  mkdirSync(dirname(target), { recursive: true });
  const lockPath = `${target}.lock`;
  try {
    writeFileSync(lockPath, `${process.pid}\n`, { encoding: "utf-8", flag: "wx", mode: 0o600 });
  } catch (error) {
    if (error.code === "EEXIST") throw new Error(`habit store is locked: ${target}`);
    throw error;
  }
  try {
    return callback();
  } finally {
    unlinkSync(lockPath);
  }
}

const COMMAND_OPTIONS = {
  validate: new Set(["--root"]),
  approve: new Set(["--id", "--by", "--at", "--root"]),
  reject: new Set(["--id", "--by", "--at", "--root"]),
  redact: new Set(["--output", "--root"]),
  "redact-file": new Set(["--output", "--replace", "--root"]),
  activate: new Set(["--store", "--at", "--root"]),
  load: new Set(["--store", "--scope", "--at", "--root"]),
  revoke: new Set(["--store", "--id", "--at", "--root"]),
};

function assertCommandOptions(command, args) {
  const allowed = COMMAND_OPTIONS[command];
  if (!allowed) throw new Error(`unknown command: ${command}`);
  for (const arg of args) {
    if (arg.startsWith("--") && !allowed.has(arg)) {
      throw new Error(`option ${arg} is not valid for ${command}`);
    }
  }
}

function parseOptions(args) {
  const options = { ids: [], positional: [] };
  const valueOptions = new Set(["--id", "--by", "--at", "--store", "--scope", "--output", "--root"]);
  const flags = new Set(["--replace"]);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      options.positional.push(arg);
      continue;
    }
    if (flags.has(arg)) {
      options.replace = true;
      continue;
    }
    if (!valueOptions.has(arg)) throw new Error(`unknown option: ${arg}`);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`missing value for ${arg}`);
    index += 1;
    if (arg === "--id") options.ids.push(value);
    else if (arg === "--by") options.approvedBy = value;
    else if (arg === "--at") options.at = value;
    else if (arg === "--store") options.store = value;
    else if (arg === "--scope") options.scope = value;
    else if (arg === "--output") options.output = value;
    else if (arg === "--root") options.root = value;
  }
  return options;
}

function usage() {
  console.error("Usage: node scripts/habit-ledger.mjs <validate|approve|reject|activate|load|revoke|redact|redact-file> ...");
}

function defaultStore() {
  return process.env.VITRUVIUS_HABIT_STORE || join(process.cwd(), "outputs", ".habits", "active.json");
}

function sidecarForLedger(ledgerPath) {
  return ledgerPath.replace(/\.json$/i, ".provenance.md");
}

function assertLedgerSidecar(ledgerPath) {
  if (!/\.json$/i.test(ledgerPath)) throw new Error("ledger path must end in .json for sidecar pairing");
  const sidecarPath = sidecarForLedger(ledgerPath);
  if (!existsSync(sidecarPath)) throw new Error(`missing provenance sidecar: ${sidecarPath}`);
  if (lstatSync(sidecarPath).isSymbolicLink()) throw new Error(`provenance sidecar must not be a symbolic link: ${sidecarPath}`);
  const text = readFileSync(sidecarPath, "utf-8");
  if (!/^## Verification\s*$/im.test(text) || !/^## Sources\s*$/im.test(text)) {
    throw new Error(`provenance sidecar must contain Verification and Sources sections: ${sidecarPath}`);
  }
}

function runCli(argv) {
  const [command, ...rest] = argv;
  assertCommandOptions(command, rest);
  const options = parseOptions(rest);
  const positional = options.positional;
  const projectRoot = resolve(options.root || process.env.VITRUVIUS_PROJECT_ROOT || process.cwd());
  const storePath = resolve(options.store || defaultStore());

  if (command === "validate") {
    if (positional.length !== 1) return usage(), 1;
    assertProjectLocal(resolve(positional[0]), projectRoot);
    const report = validateLedger(readJson(positional[0]));
    console.log(JSON.stringify(report, null, 2));
    return report.valid ? 0 : 1;
  }
  if (command === "approve" || command === "reject") {
    if (positional.length !== 1 || options.ids.length === 0 || !options.approvedBy) return usage(), 1;
    assertProjectLocal(resolve(positional[0]), projectRoot);
    const ledger = readJson(positional[0]);
    const next = command === "approve"
      ? approveCandidates(ledger, options.ids, { approvedBy: options.approvedBy, approvedAt: options.at })
      : rejectCandidates(ledger, options.ids, { actor: options.approvedBy, at: options.at });
    writeJsonAtomic(positional[0], next, { projectRoot });
    console.log(`updated ${positional[0]}`);
    return 0;
  }
  if (command === "redact") {
    if (positional.length !== 1) return usage(), 1;
    assertProjectLocal(resolve(positional[0]), projectRoot);
    const redacted = redactSecrets(readJson(positional[0]));
    if (options.output) {
      writeJsonAtomic(options.output, redacted, { projectRoot });
      console.log(`wrote redacted ledger ${options.output}`);
    } else {
      console.log(JSON.stringify(redacted, null, 2));
    }
    return 0;
  }
  if (command === "redact-file") {
    if (positional.length !== 1 || !options.output) return usage(), 1;
    const input = resolve(positional[0]);
    const output = resolve(options.output);
    assertProjectLocal(input, projectRoot);
    if (output !== input && !options.replace) {
      throw new Error("refusing to leave an unredacted source; use --replace or write in place");
    }
    const text = readFileSync(input, "utf-8");
    writeTextAtomic(output, redactSecrets(text), { projectRoot });
    if (output !== input) unlinkSync(input);
    console.log(`wrote redacted file ${output}`);
    return 0;
  }
  if (command === "activate") {
    if (positional.length !== 1) return usage(), 1;
    const ledgerPath = resolve(positional[0]);
    assertProjectLocal(ledgerPath, projectRoot);
    assertLedgerSidecar(ledgerPath);
    const ledger = readJson(ledgerPath);
    const next = withStoreLock(storePath, () => {
      const store = existsSync(storePath) ? readJson(storePath) : emptyStore();
      const activated = activateLedger(ledger, store, { now: options.at });
      writeJsonAtomic(storePath, activated, { projectRoot });
      return activated;
    }, { projectRoot });
    console.log(`activated ${next.rules.filter((rule) => rule.status === "active").length} rule(s) in ${storePath}`);
    return 0;
  }
  if (command === "load") {
    if (!options.scope) return usage(), 1;
    assertProjectLocal(storePath, projectRoot);
    if (!existsSync(storePath)) {
      console.error(`habit store not found: ${storePath}`);
      return 1;
    }
    const context = loadHabits(readJson(storePath), { scope: options.scope, now: options.at });
    console.log(JSON.stringify({ context }, null, 2));
    return 0;
  }
  if (command === "revoke") {
    if (positional.length > 1 || options.ids.length !== 1) return usage(), 1;
    const targetStore = resolve(positional[0] || storePath);
    assertProjectLocal(targetStore, projectRoot);
    if (!existsSync(targetStore)) {
      console.error(`habit store not found: ${targetStore}`);
      return 1;
    }
    withStoreLock(targetStore, () => {
      const next = revokeHabit(readJson(targetStore), options.ids[0], { now: options.at });
      writeJsonAtomic(targetStore, next, { projectRoot });
    }, { projectRoot });
    console.log(`revoked ${options.ids[0]}`);
    return 0;
  }
  return usage(), 1;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = runCli(process.argv.slice(2));
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}
