#!/usr/bin/env node
/**
 * rejected-change-ledger.mjs — append-only ledger of changes rejected on
 * evidence (transfer from ref/agent-skills/evals/skill-impact.md).
 *
 * Usage:
 *   node scripts/rejected-change-ledger.mjs validate [path]
 *   node scripts/rejected-change-ledger.mjs append [path] --date YYYY-MM-DD \
 *     --artifact <skill> --change <what> --evidence <why> --outcome <result>
 *
 * Default path: docs/rejected-changes.md. `append` rebuilds the file as the old
 * bytes plus one validated row and refuses anything else, so a rejection record
 * cannot silently rewrite history.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const DEFAULT_PATH = join(REPO_ROOT, "docs", "rejected-changes.md");
const HEADER = ["Date", "Artifact", "Attempted change", "Rejection evidence", "Outcome"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function splitRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  return trimmed.slice(1, -1).split("|").map((cell) => cell.trim());
}

export function validateLedger(text) {
  const errors = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const headerIndex = lines.findIndex((line) => {
    const cells = splitRow(line);
    return cells !== null && cells.join("\u0000") === HEADER.join("\u0000");
  });
  if (headerIndex === -1) return [`missing header row: | ${HEADER.join(" | ")} |`];

  const separator = splitRow(lines[headerIndex + 1] ?? "");
  if (
    !separator ||
    separator.length !== HEADER.length ||
    !separator.every((cell) => /^:?-{3,}:?$/.test(cell))
  ) {
    errors.push("header must be followed by a separator row");
  }

  let previousDate = null;
  for (let index = headerIndex + 2; index < lines.length; index++) {
    const line = lines[index];
    if (line.trim() === "") continue;
    const cells = splitRow(line);
    const where = `line ${index + 1}`;
    if (cells === null) {
      errors.push(`${where}: not a table row`);
      continue;
    }
    if (cells.length !== HEADER.length) {
      errors.push(`${where}: expected ${HEADER.length} columns, found ${cells.length}`);
      continue;
    }
    cells.forEach((cell, column) => {
      if (cell === "") errors.push(`${where}: column \`${HEADER[column]}\` is empty`);
    });
    if (!DATE.test(cells[0])) {
      errors.push(`${where}: date \`${cells[0]}\` is not YYYY-MM-DD`);
      continue;
    }
    const date = new Date(`${cells[0]}T00:00:00Z`);
    if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== cells[0]) {
      errors.push(`${where}: date \`${cells[0]}\` is not a real date`);
    } else if (previousDate !== null && cells[0] < previousDate) {
      errors.push(`${where}: date ${cells[0]} is earlier than ${previousDate} (append-only)`);
    } else {
      previousDate = cells[0];
    }
  }
  return errors;
}

function parseArgs(args) {
  const options = {};
  const positional = [];
  for (let index = 0; index < args.length; index++) {
    const token = args[index];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const value = args[index + 1];
    if (value === undefined || value.startsWith("--")) throw new Error(`${token} requires a value`);
    options[token.slice(2)] = value;
    index++;
  }
  return { options, positional };
}

function usage() {
  return [
    "Usage: node scripts/rejected-change-ledger.mjs <validate|append> [path] [options]",
    "  validate [path]",
    "  append [path] --date YYYY-MM-DD --artifact <skill> --change <what> --evidence <why> --outcome <result>",
    `Default path: ${DEFAULT_PATH}`,
  ].join("\n");
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (command === undefined || command === "--help" || command === "-h") {
    console.log(usage());
    return;
  }
  const { options, positional } = parseArgs(rest);
  const path = resolve(options.path || positional[0] || DEFAULT_PATH);

  if (command === "validate") {
    if (!existsSync(path)) {
      console.error(`FAIL: ledger not found: ${path}`);
      process.exitCode = 1;
      return;
    }
    const errors = validateLedger(readFileSync(path, "utf-8"));
    if (errors.length > 0) {
      console.error(`FAIL: ${errors.length} rejected-change ledger problem(s):`);
      for (const error of errors) console.error(`  ${error}`);
      process.exitCode = 1;
      return;
    }
    console.log(`PASS: rejected-change ledger is append-only and well-formed (${path})`);
    return;
  }

  if (command === "append") {
    const required = ["date", "artifact", "change", "evidence", "outcome"];
    for (const field of required) {
      if (!options[field]) throw new Error(`--${field} is required`);
    }
    const cells = [options.date, options.artifact, options.change, options.evidence, options.outcome];
    if (cells.some((cell) => cell.includes("|"))) throw new Error("ledger cells must not contain '|'");
    if (!existsSync(path)) throw new Error(`ledger not found: ${path}`);
    const current = readFileSync(path, "utf-8");
    if (current !== "" && !current.endsWith("\n")) throw new Error("ledger is not newline-terminated");
    const next = `${current}| ${cells.join(" | ")} |\n`;
    const errors = validateLedger(next);
    if (errors.length > 0) {
      console.error(`append refused:\n- ${errors.join("\n- ")}`);
      process.exitCode = 1;
      return;
    }
    writeFileSync(path, next, "utf-8");
    console.log(`Recorded rejected change (${options.artifact}, ${options.date}).`);
    return;
  }

  console.error(usage());
  process.exitCode = 1;
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  try {
    main();
  } catch (error) {
    console.error(`rejected-change-ledger: ${error.message}`);
    process.exitCode = 1;
  }
}
