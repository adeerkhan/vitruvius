/**
 * log-run.mjs — append one validated run.v1 entry to the governance ledger.
 *
 * Usage:
 *   echo '{"skill":"gap-analysis","verdict":"PASS"}' | node scripts/log-run.mjs
 *   node scripts/log-run.mjs --runs-dir .runs --run-id <uuid>
 */
import { randomUUID } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

const PROJECT_ROOT = resolve(process.env.VITRUVIUS_PROJECT_ROOT || process.cwd());
const DEFAULT_RUNS_DIR = join(PROJECT_ROOT, ".runs");
const VALID_STATUSES = new Set(["started", "recorded", "completed", "blocked", "failed"]);
const VALID_VERDICTS = new Set([
  "PASS", "PARTIAL", "BLOCKED", "NOT_DONE",
  "verified", "partial", "blocked", "failed", "unverified", "inferred",
]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOCK_WAIT_MS = 10_000;
const LOCK_POLL_MS = 25;
// A crashed holder must not wedge the ledger forever (ref/autoprompt-skill
// transfer). A holder writes a bounded lease; only an *expired* lease is
// reclaimed, and only by one reclaimer at a time.
const LOCK_TTL_MS = Number(process.env.VITRUVIUS_LOCK_TTL_MS || 60_000);

function usage() {
  return [
    "Usage: node scripts/log-run.mjs [options]",
    "Options:",
    "  --runs-dir <path>  Override the ledger directory (or set VITRUVIUS_RUNS_DIR)",
    "  VITRUVIUS_PROJECT_ROOT  Select the project root for the default .runs/ path",
    "  --run-id <uuid>    Use an explicit UUID for a controlled/resumed run",
    "  --help              Show this help",
    "Input: one JSON object on stdin",
  ].join("\n");
}

function parseOptions(args) {
  let runsDir = resolve(process.env.VITRUVIUS_RUNS_DIR || DEFAULT_RUNS_DIR);
  let runId = null;
  for (let index = 0; index < args.length; index++) {
    const option = args[index];
    if (option === "--help") return { help: true, runsDir, runId };
    if (option === "--runs-dir" || option === "--run-id") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${option} requires a value`);
      if (option === "--runs-dir") runsDir = resolve(value);
      if (option === "--run-id") runId = value;
      index++;
      continue;
    }
    throw new Error(`unknown option: ${option}`);
  }
  return { help: false, runsDir, runId };
}

function validateInput(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("input must be a JSON object");
  }
  if (typeof value.skill !== "string" || value.skill.trim() === "") {
    throw new Error("input requires a non-empty skill");
  }
  for (const field of ["topic", "discipline", "phase"]) {
    if (value[field] !== undefined && (typeof value[field] !== "string" || value[field].trim() === "")) {
      throw new Error(`${field} must be a non-empty string when provided`);
    }
  }
  for (const field of ["sources_consulted", "claims_verified", "claims_blocked"]) {
    if (value[field] !== undefined && (!Number.isInteger(value[field]) || value[field] < 0)) {
      throw new Error(`${field} must be a non-negative integer when provided`);
    }
  }
  if (value.status !== undefined && !VALID_STATUSES.has(value.status)) {
    throw new Error(`status must be one of: ${[...VALID_STATUSES].join(", ")}`);
  }
  if (value.verdict !== undefined && !VALID_VERDICTS.has(value.verdict)) {
    throw new Error(`verdict must be one of: ${[...VALID_VERDICTS].join(", ")}`);
  }
  if (value.artifacts !== undefined && (!Array.isArray(value.artifacts) || value.artifacts.some((item) => typeof item !== "string" || item.trim() === ""))) {
    throw new Error("artifacts must be an array of non-empty strings when provided");
  }
  if (value.error !== undefined && value.error !== null && typeof value.error !== "string") {
    throw new Error("error must be a string or null when provided");
  }
  return value;
}

function readStdin() {
  return new Promise((resolveInput, rejectInput) => {
    let input = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => { input += chunk; });
    process.stdin.on("end", () => resolveInput(input));
    process.stdin.on("error", rejectInput);
  });
}

function readExistingEntries(runsDir) {
  if (!existsSync(runsDir)) return [];
  const entries = [];
  for (const name of readdirSync(runsDir)) {
    if (!name.endsWith(".jsonl")) continue;
    const path = join(runsDir, name);
    const text = readFileSync(path, "utf-8");
    if (text && !text.endsWith("\n")) throw new Error(`existing ledger is not newline-terminated: ${path}`);
    for (const line of text.split("\n").filter(Boolean)) {
      try {
        entries.push(JSON.parse(line));
      } catch (error) {
        throw new Error(`invalid JSONL in ${path}: ${error.message}`);
      }
    }
  }
  return entries;
}

function wait(milliseconds) {
  return new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));
}

// Parse a lock body. Current locks are JSON `{ pid, token, expires_at }`;
// legacy `pid:token` locks carry no expiry and are never reclaimed.
function parseLock(raw) {
  try {
    const value = JSON.parse(raw.trim());
    if (value && typeof value.token === "string") {
      return {
        token: value.token,
        expiresAt: typeof value.expires_at === "string" ? Date.parse(value.expires_at) : null,
      };
    }
  } catch {
    // legacy lock, not reclaimable
  }
  return null;
}

// Reclaim an expired lease with compare-and-delete. A sidecar `*.reclaim` file
// picks a single reclaimer, so two waiters cannot both delete the lock.
function reclaimExpiredLock(lockPath) {
  const reclaimPath = `${lockPath}.reclaim`;
  try {
    writeFileSync(reclaimPath, `${process.pid}:${randomUUID()}\n`, { encoding: "utf-8", flag: "wx" });
  } catch {
    return false; // another process is already reclaiming
  }
  try {
    let raw;
    try {
      raw = readFileSync(lockPath, "utf-8");
    } catch {
      return false; // lock already released
    }
    const parsed = parseLock(raw);
    if (parsed && parsed.expiresAt !== null && parsed.expiresAt <= Date.now()) {
      unlinkSync(lockPath);
      return true;
    }
    return false;
  } finally {
    try { unlinkSync(reclaimPath); } catch { /* nothing to clean up */ }
  }
}

async function acquireLock(runsDir) {
  const lockPath = join(runsDir, ".log-run.lock");
  const deadline = Date.now() + LOCK_WAIT_MS;
  while (Date.now() < deadline) {
    const token = randomUUID();
    const body = JSON.stringify({
      pid: process.pid,
      token,
      expires_at: new Date(Date.now() + LOCK_TTL_MS).toISOString(),
    });
    try {
      writeFileSync(lockPath, `${body}\n`, { encoding: "utf-8", flag: "wx" });
      return { path: lockPath, token };
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      reclaimExpiredLock(lockPath);
      await wait(LOCK_POLL_MS);
    }
  }
  throw new Error(`run ledger is busy or locked: ${lockPath}`);
}

function releaseLock(lock) {
  try {
    const parsed = parseLock(readFileSync(lock.path, "utf-8"));
    if (!parsed || parsed.token !== lock.token) return;
    unlinkSync(lock.path);
  } catch {
    // Never remove a lock whose ownership cannot be proven.
  }
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const raw = await readStdin();
  if (!raw.trim()) throw new Error(usage());
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`invalid JSON: ${error.message}`);
  }
  const input = validateInput(parsed);
  const runId = (options.runId || randomUUID()).toLowerCase();
  if (!UUID_PATTERN.test(runId)) throw new Error("run-id must be a valid UUID");
  const entry = {
    ...input,
    schema: "run.v1",
    run_id: runId,
    timestamp: new Date().toISOString(),
  };

  mkdirSync(options.runsDir, { recursive: true });
  const lock = await acquireLock(options.runsDir);
  try {
    const existing = readExistingEntries(options.runsDir);
    if (existing.some((item) => typeof item.run_id === "string" && item.run_id.toLowerCase() === runId)) {
      throw new Error(`duplicate run_id: ${runId}`);
    }

    const date = entry.timestamp.split("T")[0];
    const ledgerFile = join(options.runsDir, `${date}.jsonl`);
    if (existsSync(ledgerFile)) {
      const existingText = readFileSync(ledgerFile, "utf-8");
      if (existingText && !existingText.endsWith("\n")) throw new Error(`existing ledger is not newline-terminated: ${ledgerFile}`);
    }
    appendFileSync(ledgerFile, `${JSON.stringify(entry)}\n`, "utf-8");
    console.log(`Logged: ${entry.run_id} -> ${ledgerFile}`);
  } finally {
    releaseLock(lock);
  }
}

main().catch((error) => {
  console.error(`log-run: ${error.message}`);
  process.exitCode = 1;
});
