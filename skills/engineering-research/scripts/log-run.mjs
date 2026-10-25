/**
 * log-run.mjs — append one validated run.v1 entry to the governance ledger.
 *
 * Usage:
 *   echo '{"skill":"gap-analysis","verdict":"PASS"}' | node scripts/log-run.mjs
 *   node scripts/log-run.mjs --runs-dir .runs --run-id <uuid>
 *   node scripts/log-run.mjs --begin --run-id <uuid> [--freeze <path>...]
 *
 * --begin writes a dispatch marker (no ledger entry): it records the start
 * time and the sha256 of any --freeze file, normally the goal-requirements
 * manifest that the method freezes before evidence gathering starts. The
 * matching completion entry then carries began_at, wall_ms, and frozen, so
 * wall time is measured rather than guessed and the Step-1 freeze is a gate:
 * a frozen file that changed before completion fails the entry unless
 * --refreeze records the change (was/now hashes) in the entry.
 */
import { createHash, randomUUID } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

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
// A crashed holder must not wedge the ledger forever (src-03
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
    "  --begin            Record a dispatch marker instead of a ledger entry;",
    "                     requires --run-id, ignores stdin",
    "  --freeze <path>    (with --begin) pin a file's sha256 at dispatch — the",
    "                     goal-requirements manifest frozen before evidence work",
    "  --refreeze         Allow a frozen file that changed, recording was/now",
    "                     hashes in the entry; a deleted file is never allowed",
    "  --help             Show this help",
    "Input: one JSON object on stdin",
  ].join("\n");
}

function parseOptions(args) {
  let runsDir = resolve(process.env.VITRUVIUS_RUNS_DIR || DEFAULT_RUNS_DIR);
  let runId = null;
  let begin = false;
  let refreeze = false;
  const freezePaths = [];
  for (let index = 0; index < args.length; index++) {
    const option = args[index];
    if (option === "--help") return { help: true, runsDir, runId, begin, refreeze, freezePaths };
    if (option === "--begin") { begin = true; continue; }
    if (option === "--refreeze") { refreeze = true; continue; }
    if (option === "--runs-dir" || option === "--run-id" || option === "--freeze") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${option} requires a value`);
      if (option === "--runs-dir") runsDir = resolve(value);
      if (option === "--run-id") runId = value;
      if (option === "--freeze") freezePaths.push(value);
      index++;
      continue;
    }
    throw new Error(`unknown option: ${option}`);
  }
  if (freezePaths.length > 0 && !begin) throw new Error("--freeze requires --begin");
  if (refreeze && begin) throw new Error("--refreeze applies to completion, not --begin");
  return { help: false, runsDir, runId, begin, refreeze, freezePaths };
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
  // Dispatch-measured fields are recorded by this tool from the begin marker,
  // never accepted from the caller: a wall_ms the caller asserts is a claim,
  // not a measurement, and a frozen hash the caller asserts is the exact
  // after-the-fact rewrite the freeze exists to catch.
  for (const field of ["began_at", "wall_ms", "frozen", "refrozen"]) {
    if (value[field] !== undefined) {
      throw new Error(`${field} is recorded from the dispatch marker, not stdin; use --begin${field === "refrozen" ? " --refreeze" : ""}`);
    }
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

function markerPath(runsDir, runId) {
  return join(runsDir, `.begin-${runId}.json`);
}

function sha256File(absolutePath) {
  return createHash("sha256").update(readFileSync(absolutePath)).digest("hex");
}

function hashFreezeTargets(projectRoot, freezePaths) {
  return freezePaths.map((given) => {
    if (typeof given !== "string" || given.trim() === "") throw new Error("--freeze requires a non-empty path");
    if (isAbsolute(given) || given.split(/[\\/]/).includes("..")) {
      throw new Error(`--freeze path must be relative to the project root and stay inside it: ${given}`);
    }
    const absolute = resolve(projectRoot, given);
    let st;
    try {
      st = statSync(absolute);
    } catch {
      throw new Error(`--freeze file does not exist: ${given} — freeze the goal-requirements manifest at dispatch, before evidence gathering`);
    }
    if (!st.isFile()) throw new Error(`--freeze target is not a regular file: ${given}`);
    return { path: given.replaceAll("\\", "/"), abs: absolute, sha256: sha256File(absolute) };
  });
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const runId = (options.runId || randomUUID()).toLowerCase();
  if (!UUID_PATTERN.test(runId)) throw new Error("run-id must be a valid UUID");

  if (options.begin) {
    if (!options.runId) throw new Error("--begin requires an explicit --run-id so the completion entry can match it");
    const frozen = hashFreezeTargets(PROJECT_ROOT, options.freezePaths);
    mkdirSync(options.runsDir, { recursive: true });
    const marker = {
      schema: "run-begin.v1",
      run_id: runId,
      began_at: new Date().toISOString(),
      frozen,
    };
    // Overwriting a previous marker restarts the dispatch window: that is the
    // resumed-run case (--run-id reuse after a failure), where the earlier
    // begin measured nothing that completed.
    writeFileSync(markerPath(options.runsDir, runId), `${JSON.stringify(marker)}\n`, "utf-8");
    console.log(`Begin: ${runId} -> ${markerPath(options.runsDir, runId)} (${frozen.length} frozen)`);
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

  // Reconcile the dispatch marker, if one exists for this run_id.
  const markerFile = markerPath(options.runsDir, runId);
  let dispatch = null;
  if (existsSync(markerFile)) {
    try {
      dispatch = JSON.parse(readFileSync(markerFile, "utf-8"));
    } catch (error) {
      throw new Error(`dispatch marker is not valid JSON (${markerFile}): ${error.message}`);
    }
    if (dispatch.run_id !== runId) throw new Error("dispatch marker run_id mismatch");
  } else if (options.refreeze) {
    throw new Error("--refreeze has no dispatch marker to compare against; run --begin first");
  }

  let frozen = null;
  let refrozen = null;
  if (dispatch) {
    frozen = [];
    refrozen = [];
    for (const pinned of dispatch.frozen ?? []) {
      let currentHash;
      try {
        currentHash = sha256File(pinned.abs);
      } catch {
        throw new Error(`frozen file was deleted after dispatch: ${pinned.path} — deleting the frozen requirements manifest is not a re-freeze; restore it or start a new run`);
      }
      if (currentHash === pinned.sha256) {
        frozen.push({ path: pinned.path, sha256: pinned.sha256 });
      } else if (options.refreeze) {
        frozen.push({ path: pinned.path, sha256: currentHash });
        refrozen.push({ path: pinned.path, was_sha256: pinned.sha256, now_sha256: currentHash });
      } else {
        throw new Error(`frozen file changed after dispatch: ${pinned.path} — pass --refreeze to record the change honestly, or restore the frozen bytes`);
      }
    }
    if (refrozen.length === 0) refrozen = null;
  }

  const entry = {
    ...input,
    schema: "run.v1",
    run_id: runId,
    timestamp: new Date().toISOString(),
  };
  if (dispatch) {
    entry.began_at = dispatch.began_at;
    entry.wall_ms = Math.max(0, Date.parse(entry.timestamp) - Date.parse(dispatch.began_at));
    entry.frozen = frozen;
    if (refrozen) entry.refrozen = refrozen;
  }

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
    if (dispatch) unlinkSync(markerFile);
    console.log(`Logged: ${entry.run_id} -> ${ledgerFile}${entry.wall_ms !== undefined ? ` (wall ${entry.wall_ms}ms)` : ""}`);
  } finally {
    releaseLock(lock);
  }
}

main().catch((error) => {
  console.error(`log-run: ${error.message}`);
  process.exitCode = 1;
});
