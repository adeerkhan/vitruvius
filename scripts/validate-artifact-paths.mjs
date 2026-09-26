#!/usr/bin/env node
/**
 * validate-artifact-paths.mjs — guard the canonical research artifact paths.
 *
 * Transfer from ref/agent-skills/scripts/validate-artifact-paths.js. The shared
 * method writes plans, drafts, finals, provenance, the problem-anchor and
 * GOAL-CHECK records, and the evidence ledger to a fixed set of paths that
 * other skills and docs read back. When one surface moves a path and another is
 * not updated, the pipeline breaks and nothing else catches it (command parity
 * only compares descriptions).
 *
 * Scope is deliberately narrow: `outputs/`, `papers/`, and `.runs/` tokens in
 * the files that define the method. It is not a general path linter.
 *
 * Exit 0 = all clear; 1 = a drifted or generic artifact path.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
// Tests point this at a fixture tree to prove the guard can fail.
const ROOT = process.env.VITRUVIUS_ARTIFACT_ROOT
  ? resolve(process.env.VITRUVIUS_ARTIFACT_ROOT)
  : REPO_ROOT;

// The canonical artifact path families. To change a convention, edit this list
// and every guarded surface in the same change — CI fails until they agree.
const ALLOWED = [
  /^outputs\/$/,
  /^outputs\/\.drafts\/$/,
  /^outputs\/\.drafts\/[A-Za-z0-9._<>-]+\.(?:md|json)$/,
  /^outputs\/\.plans\/[A-Za-z0-9._<>-]+\.md$/,
  /^outputs\/\.habits\/[A-Za-z0-9._<>-]+\.(?:json|md)$/,
  /^outputs\/[A-Za-z0-9._<>-]+\.(?:md|json)$/,
  /^outputs\/[a-z0-9-]+\/[A-Za-z0-9._<>-]+\.(?:md|json)$/,
  /^papers\/[A-Za-z0-9._<>-]+\.(?:md|json)$/,
  /^\.runs\/[A-Za-z0-9._<>-]+$/,
];

// AGENTS.md bans generic names so concurrent runs do not collide.
const GENERIC = new Set(["research", "draft", "brief", "summary", "output", "report"]);

const TOKEN = /(?:outputs|papers|\.runs)\/[A-Za-z0-9._<>/-]+/g;

function listDir(relativeDir, predicate) {
  const out = [];
  try {
    for (const entry of readdirSync(join(ROOT, relativeDir), { withFileTypes: true })) {
      if (predicate(entry)) out.push(join(relativeDir, entry.name));
    }
  } catch {
    // directory absent in a fixture — nothing to guard
  }
  return out;
}

function guardedFiles() {
  const files = ["AGENTS.md", "README.md"];
  files.push(...listDir("references", (entry) => entry.isFile() && entry.name.endsWith(".md")));
  for (const skill of listDir("skills", (entry) => entry.isDirectory())) {
    const skillMd = join(skill, "SKILL.md");
    try {
      if (statSync(join(ROOT, skillMd)).isFile()) files.push(skillMd);
    } catch {
      // not a skill dir
    }
    files.push(...listDir(join(skill, "references"), (entry) => entry.isFile() && entry.name.endsWith(".md")));
  }
  return files;
}

const problems = [];
let checked = 0;

for (const rel of guardedFiles()) {
  let text;
  try {
    text = readFileSync(join(ROOT, rel), "utf-8");
  } catch {
    continue;
  }
  checked++;
  const shown = rel.replaceAll("\\", "/");
  text.split(/\r?\n/).forEach((line, index) => {
    const stripped = line.replace(/https?:\/\/\S+/g, "");
    for (const match of stripped.match(TOKEN) ?? []) {
      const token = match.replace(/[.,;:)\]]+$/, "");
      if (!ALLOWED.some((pattern) => pattern.test(token))) {
        problems.push(`${shown}:${index + 1}: \`${token}\` is not a canonical artifact path`);
        continue;
      }
      const base = token.split("/").pop();
      const generic = base.match(/^([a-z0-9-]+)\.md$/);
      if (generic && GENERIC.has(generic[1])) {
        problems.push(`${shown}:${index + 1}: \`${token}\` uses a generic basename banned by AGENTS.md`);
      }
    }
  });
}

if (problems.length > 0) {
  console.error(`FAIL: ${problems.length} artifact-path problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error("\nUse a canonical path, or update the allowlist and every guarded surface together.");
  process.exit(1);
}

console.log(`PASS: ${checked} guarded file(s) use canonical artifact paths`);
