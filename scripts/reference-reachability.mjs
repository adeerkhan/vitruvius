#!/usr/bin/env node
// reference-reachability.mjs — every file in references/ must be reachable from
// somewhere an agent actually loads: a skill, an agent role, a script, or the
// repo docs. An unreferenced reference is a dead file, not a capability.
//
// Usage: node scripts/reference-reachability.mjs [--json] [--allow <name>]
//
// Wired by hand on 2026-09-28 after six of twenty-four references turned out to
// be unreachable, three of them written and declared "done" the same session.
// `validate-contract.mjs` resolves links *inside* skills but never requires a
// reference to be cited, so this is the standing check that closes that gap.
//
// `--allow <name>` waives a file with a stated reason (e.g. gated behind a host
// capability that does not exist yet). A waiver is a claim that the file is
// reachable in principle but not yet wired, so it names the file in the chain
// and the reason belongs with the code that would cite it.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const REFERENCES_DIR = join(REPO_ROOT, "references");

// Directories whose contents an agent loads. `notes/` and the repo root files are
// human-facing, but they still count: a reference cited only from the README is
// discoverable, and that is better than uncited.
const SEARCH_ROOTS = ["skills", "agents", "installer", "scripts", "notes"];
const SEARCH_FILES = ["README.md", "AGENTS.md", "CONTRIBUTING.md"];

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Never descend into the reference corpus itself; that would make every
      // file self-referential and the check meaningless.
      if (full === REFERENCES_DIR) continue;
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".codegraph") continue;
      walk(full, out);
    } else if (entry.isFile() && [".md", ".mjs", ".js", ".ts", ".json", ".sh"].includes(extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function corpus() {
  try {
    return readdirSync(REFERENCES_DIR).filter((f) => f.endsWith(".md")).sort();
  } catch {
    return [];
  }
}

function allowedSet() {
  const allowed = new Set();
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--allow" && argv[i + 1]) allowed.add(argv[i + 1]);
  }
  return allowed;
}

const files = [
  // `.flat()` is load-bearing: without it the array holds one sub-array per root
  // and every lookup below silently matches nothing.
  ...SEARCH_ROOTS.flatMap((r) => walk(join(REPO_ROOT, r))),
  ...SEARCH_FILES.map((f) => join(REPO_ROOT, f)).filter((p) => {
    try {
      return statSync(p).isFile();
    } catch {
      return false;
    }
  }),
];

const haystacks = files.map((f) => {
  try {
    return { path: f, text: readFileSync(f, "utf8") };
  } catch {
    return null;
  }
}).filter(Boolean);

const allowed = allowedSet();
const missing = [];
const waived = [];

for (const name of corpus()) {
  const cited = haystacks.filter((h) => h.text.includes(name));
  if (cited.length === 0) {
    if (allowed.has(name)) waived.push(name);
    else missing.push(name);
  }
}

const report = {
  total: corpus().length,
  reachable: corpus().length - missing.length - waived.length,
  unreachable: missing,
  waived,
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`reference reachability: ${report.reachable}/${report.total} referenced from a loadable surface`);
  for (const name of report.unreachable) console.log(`  UNREACHABLE  references/${name}`);
  for (const name of report.waived) console.log(`  waived       references/${name}`);
  if (report.unreachable.length === 0) {
    console.log(
      waived.length > 0
        ? `\nAll references reachable (${waived.length} waived).`
        : "\nAll references reachable.",
    );
  }
}

if (missing.length > 0) {
  console.error(
    `\n${missing.length} reference file(s) are not cited from any skill, agent, script, or doc. ` +
      "An unreferenced reference is a dead file. Wire it, or waive it with --allow and record why.",
  );
  process.exit(1);
}
