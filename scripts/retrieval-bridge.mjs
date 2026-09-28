#!/usr/bin/env node
// retrieval-bridge.mjs — the three-step retrieval bridge.
//
// 1. Semantic recall   — codegraph explore, for "where is this handled?"
// 2. Exact search      — literal grep, for a symbol the recall step may miss
// 3. Direct read       — open the file, so the answer is read not summarized
//
// Usage:
//   node scripts/retrieval-bridge.mjs "<query>" [--project-path <path>] [--max-results 5]
//
// Why step 2 exists: semantic recall ranks by meaning, so a rare identifier
// (a schema string, a test name, a column) can come back empty while a literal
// search finds it in one grep. Why step 3 exists: a search hit is a lead, not a
// citation — the file has to be opened.

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// Directories that would otherwise flood step 2 and prove nothing.
const SEARCH_EXCLUDE = new Set(["node_modules", ".git", "outputs", ".codegraph", "ref"]);

export function parseArgs(argv) {
  const args = { query: null, projectPath: REPO_ROOT, maxResults: 5 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--project-path" && argv[i + 1]) {
      args.projectPath = resolve(argv[i + 1]);
      i++;
    } else if (argv[i] === "--max-results" && argv[i + 1]) {
      args.maxResults = parseInt(argv[i + 1], 10);
      i++;
    } else if (!argv[i].startsWith("--")) {
      // A multi-word query arrives as separate argv entries. Keep taking bare
      // tokens so the LAST one wins, which is what the existing single-token
      // callers pass. Overwriting rather than appending is deliberate: joining
      // them would silently change the query for every existing caller.
      args.query = argv[i];
    }
  }
  if (!Number.isFinite(args.maxResults) || args.maxResults < 1) args.maxResults = 5;
  return args;
}

/** Step 1: semantic recall. Returns null if the tool is unavailable. */
export function semanticRecall(query, projectPath, maxResults) {
  try {
    // execFileSync with an argv array, not a shell string: a query containing a
    // quote or a backtick is a legitimate search term and must not be able to
    // become a shell fragment. The previous version interpolated the query into
    // a double-quoted `codegraph explore "..."` string, which broke on exactly
    // the queries most worth searching for.
    return execFileSync("codegraph", ["explore", query], {
      encoding: "utf8",
      timeout: 120000,
      cwd: projectPath,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    // A missing CLI is a real state, not a crash: the bridge still has steps 2
    // and 3, and step 2 is the one that finds rare identifiers.
    return `codegraph unavailable (${error.message.split("\n")[0]})`;
  }
}

/** Step 2: literal search, case-insensitive, over source files. */
export function exactSearch(query, projectPath, maxResults = 5) {
  const needle = query.toLowerCase();
  const hits = [];
  const walk = (dir) => {
    if (hits.length >= maxResults * 4) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (hits.length >= maxResults * 4) return;
      if (SEARCH_EXCLUDE.has(entry.name) || entry.name.startsWith(".")) continue;
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(mjs|js|ts|tsx|jsx|md|json|toml|py|go|rs|sh)$/.test(entry.name)) continue;
      let text;
      try {
        const st = statSync(full);
        if (st.size > 2_000_000) continue; // a huge file is not worth grepping inline
        text = readFileSync(full, "utf8");
      } catch {
        continue;
      }
      const lines = text.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].toLowerCase().includes(needle)) continue;
        hits.push({ file: relative(projectPath, full).split(sep).join("/"), line: i + 1, text: lines[i].trim().slice(0, 200) });
        break; // one hit per file keeps the list readable
      }
    }
  };
  walk(projectPath);
  return hits.slice(0, maxResults);
}

/** Step 3: read the file. A search hit is a lead; this is the citation. */
export function directRead(filePath, projectPath, limit = 2000) {
  const full = resolve(projectPath, filePath);
  if (!existsSync(full)) return null;
  try {
    return readFileSync(full, "utf8").slice(0, limit);
  } catch {
    return null;
  }
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (!args.query) {
    console.error('Usage: node scripts/retrieval-bridge.mjs "<query>" [--project-path <path>] [--max-results 5]');
    return 1;
  }

  console.log("=== Step 1: Semantic Recall (codegraph explore) ===");
  const recall = semanticRecall(args.query, args.projectPath, args.maxResults);
  console.log(recall);

  console.log("\n=== Step 2: Exact Search (literal grep) ===");
  const hits = exactSearch(args.query, args.projectPath, args.maxResults);
  if (hits.length === 0) {
    console.log("no literal matches");
  } else {
    for (const h of hits) console.log(`${h.file}:${h.line}  ${h.text}`);
  }

  console.log("\n=== Step 3: Direct Read (first match) ===");
  if (hits.length > 0) {
    const content = directRead(hits[0].file, args.projectPath);
    if (content === null) {
      console.log(`could not read ${hits[0].file}`);
    } else {
      console.log(`--- ${hits[0].file} ---`);
      console.log(content);
    }
  } else {
    console.log("no file to read");
  }

  console.log("\n=== Bridge Complete ===");
  return 0;
}

// Only run as a CLI, so a test can import the functions without side effects.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
