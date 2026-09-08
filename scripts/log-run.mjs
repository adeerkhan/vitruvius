/**
 * log-run.mjs — Append a run entry to the governance ledger.
 *
 * Reads JSON from stdin, adds timestamp and run_id, appends to .runs/<date>.jsonl.
 *
 * Usage:
 *   echo '{"skill":"gap-analysis","verdict":"PASS"}' | node scripts/log-run.mjs
 *
 * Or pipe from a file:
 *   cat ledger-entry.json | node scripts/log-run.mjs
 */

import { appendFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const RUNS_DIR = join(REPO_ROOT, ".runs");

// Read stdin
let input = "";
process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  if (!input.trim()) {
    console.error("Usage: echo '{...}' | node scripts/log-run.mjs");
    process.exit(1);
  }

  // Parse input
  let entry;
  try {
    entry = JSON.parse(input);
  } catch (err) {
    console.error(`Invalid JSON: ${err.message}`);
    process.exit(1);
  }

  // Ensure .runs directory exists
  if (!existsSync(RUNS_DIR)) {
    mkdirSync(RUNS_DIR, { recursive: true });
  }

  // Add metadata
  entry.run_id = crypto.randomUUID();
  entry.timestamp = new Date().toISOString();

  // Append to daily ledger
  const date = entry.timestamp.split("T")[0];
  const ledgerFile = join(RUNS_DIR, `${date}.jsonl`);

  try {
    appendFileSync(ledgerFile, JSON.stringify(entry) + "\n");
    console.log(`Logged: ${entry.run_id} → ${ledgerFile}`);
  } catch (err) {
    console.error(`Failed to write: ${err.message}`);
    process.exit(1);
  }
});
