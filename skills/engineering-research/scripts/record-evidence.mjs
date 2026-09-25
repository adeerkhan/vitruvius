import { randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

import { validateEvidenceLedger } from "./evidence-ledger.mjs";

const PROJECT_ROOT = resolve(process.env.VITRUVIUS_PROJECT_ROOT || process.cwd());
const DEFAULT_RUNS_DIR = join(PROJECT_ROOT, ".runs");
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function usage() {
  return [
    "Usage: node scripts/record-evidence.mjs [options]",
    "Options:",
    "  --runs-dir <path>  Override the ledger directory (or set VITRUVIUS_RUNS_DIR)",
    "  --run-id <uuid>    Require the input run_id to match this UUID",
    "  VITRUVIUS_PROJECT_ROOT  Select the project root for the default .runs/ path",
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

function acquireLock(path) {
  const token = randomUUID();
  try {
    const descriptor = openSync(path, "wx");
    writeFileSync(descriptor, `${process.pid}:${token}\n`, "utf-8");
    closeSync(descriptor);
    return token;
  } catch (error) {
    if (error.code === "EEXIST") throw new Error(`evidence ledger is locked: ${path}`);
    throw error;
  }
}

function releaseLock(path, token) {
  try {
    if (readFileSync(path, "utf-8").trim() !== `${process.pid}:${token}`) return;
    unlinkSync(path);
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
  let input;
  try {
    input = JSON.parse(raw);
  } catch (error) {
    throw new Error(`invalid JSON: ${error.message}`);
  }
  const report = validateEvidenceLedger(input);
  if (!report.valid) throw new Error(`invalid evidence ledger:\n${report.errors.map((error) => `- ${error}`).join("\n")}`);

  const runId = input.run_id.toLowerCase();
  if (options.runId && options.runId.toLowerCase() !== runId) throw new Error(`input run_id does not match --run-id: ${runId}`);
  if (!UUID_PATTERN.test(runId)) throw new Error("run_id must be a valid UUID");

  const outputPath = join(options.runsDir, `${runId}.evidence.json`);
  if (existsSync(outputPath)) throw new Error(`evidence ledger already exists: ${outputPath}`);
  mkdirSync(options.runsDir, { recursive: true });
  const lockPath = join(options.runsDir, `${runId}.evidence.lock`);
  const token = acquireLock(lockPath);
  const temporaryPath = join(options.runsDir, `${runId}.${randomUUID()}.tmp`);
  try {
    if (existsSync(outputPath)) throw new Error(`evidence ledger already exists: ${outputPath}`);
    const output = { ...input, run_id: runId, recorded_at: new Date().toISOString() };
    writeFileSync(temporaryPath, `${JSON.stringify(output, null, 2)}\n`, { encoding: "utf-8", flag: "wx" });
    renameSync(temporaryPath, outputPath);
    console.log(`Recorded: ${runId} -> ${outputPath}`);
  } finally {
    try { unlinkSync(temporaryPath); } catch { /* Nothing to clean up. */ }
    releaseLock(lockPath, token);
  }
}

main().catch((error) => {
  console.error(`record-evidence: ${error.message}`);
  process.exitCode = 1;
});
