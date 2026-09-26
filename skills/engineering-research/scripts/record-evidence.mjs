import { randomUUID } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

import { validateEvidenceLedger } from "./evidence-ledger.mjs";

const PROJECT_ROOT = resolve(process.env.VITRUVIUS_PROJECT_ROOT || process.cwd());
const DEFAULT_RUNS_DIR = join(PROJECT_ROOT, ".runs");
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOCK_WAIT_MS = 10_000;
const LOCK_POLL_MS = 25;
// A crashed holder must not wedge the ledger forever (ref/autoprompt-skill
// transfer). A holder writes a bounded lease; only an *expired* lease is
// reclaimed, and only by one reclaimer at a time.
const LOCK_TTL_MS = Number(process.env.VITRUVIUS_LOCK_TTL_MS || 60_000);

function usage() {
  return [
    "Usage: node scripts/record-evidence.mjs --run-id <uuid> [options]",
    "Options:",
    "  --runs-dir <path>  Override the ledger directory (or set VITRUVIUS_RUNS_DIR)",
    "  --run-id <uuid>    Required L1 run identity",
    "  VITRUVIUS_PROJECT_ROOT  Select the project root for local artifacts and default .runs/",
    "  --help              Show this help",
    "Input: one evidence.v1 JSON object on stdin",
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

function readStdin() {
  return new Promise((resolveInput, rejectInput) => {
    let input = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => { input += chunk; });
    process.stdin.on("end", () => resolveInput(input));
    process.stdin.on("error", rejectInput);
  });
}

function readRunEntries(runsDir) {
  if (!existsSync(runsDir)) throw new Error(`L1 runs directory does not exist: ${runsDir}`);
  const entries = [];
  for (const name of readdirSync(runsDir)) {
    if (!name.endsWith(".jsonl")) continue;
    const path = join(runsDir, name);
    const text = readFileSync(path, "utf-8");
    if (text && !text.endsWith("\n")) throw new Error(`existing L1 ledger is not newline-terminated: ${path}`);
    for (const [index, line] of text.split("\n").filter(Boolean).entries()) {
      try {
        const entry = JSON.parse(line);
        if (entry?.schema !== "run.v1" || typeof entry.run_id !== "string" || !UUID_PATTERN.test(entry.run_id)) {
          throw new Error(`invalid run.v1 entry at ${path}:${index + 1}`);
        }
        entries.push(entry);
      } catch (error) {
        throw new Error(`invalid L1 JSONL in ${path}: ${error.message}`);
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

async function acquireRunLock(runsDir) {
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

function releaseRunLock(lock) {
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
  if (!options.runId) throw new Error("--run-id is required and must identify an existing L1 run");

  const raw = await readStdin();
  if (!raw.trim()) throw new Error(usage());
  let input;
  try {
    input = JSON.parse(raw);
  } catch (error) {
    throw new Error(`invalid JSON: ${error.message}`);
  }
  const report = validateEvidenceLedger(input, { repoRoot: PROJECT_ROOT });
  if (!report.valid) throw new Error(`invalid evidence ledger:\n${report.errors.map((error) => `- ${error}`).join("\n")}`);

  const runId = options.runId.toLowerCase();
  if (!UUID_PATTERN.test(runId)) throw new Error("--run-id must be a valid UUID");
  if (input.run_id.toLowerCase() !== runId) throw new Error(`input run_id does not match --run-id: ${runId}`);

  if (!existsSync(options.runsDir)) throw new Error(`L1 runs directory does not exist: ${options.runsDir}`);
  const lock = await acquireRunLock(options.runsDir);
  let temporaryPath;
  try {
    const entries = readRunEntries(options.runsDir);
    const matches = entries.filter((entry) => entry.run_id.toLowerCase() === runId);
    if (matches.length === 0) throw new Error(`no L1 run entry found for run_id: ${runId}`);
    if (matches.length > 1) throw new Error(`duplicate L1 run_id: ${runId}`);

    const outputPath = join(options.runsDir, `${runId}.evidence.json`);
    if (existsSync(outputPath)) throw new Error(`evidence ledger already exists: ${outputPath}`);
    const output = { ...input, run_id: runId, completion: report.completion, recorded_at: new Date().toISOString() };
    temporaryPath = join(options.runsDir, `${runId}.${randomUUID()}.tmp`);
    writeFileSync(temporaryPath, `${JSON.stringify(output, null, 2)}\n`, { encoding: "utf-8", flag: "wx" });
    renameSync(temporaryPath, outputPath);
    console.log(`Recorded: ${runId} -> ${outputPath}`);
  } finally {
    if (temporaryPath) {
      try { unlinkSync(temporaryPath); } catch { /* Nothing to clean up. */ }
    }
    releaseRunLock(lock);
  }
}

main().catch((error) => {
  console.error(`record-evidence: ${error.message}`);
  process.exitCode = 1;
});
