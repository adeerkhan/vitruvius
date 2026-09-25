/**
 * generate-adapters.mjs — Generate host adapter files from command contract.
 *
 * Reads scripts/command-contract.mjs and generates adapter files for each host.
 * Run this after adding or modifying commands.
 *
 * Usage:
 *   node scripts/generate-adapters.mjs
 *   node scripts/generate-adapters.mjs --check
 *
 * Output:
 *   .opencode/command/*.md
 *   .cursor/commands/*.md
 *   .claude/commands/*.md
 *   .codex/commands/*.md
 *   .commandcode/mods/vitruvius.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { commands, categories, hosts, rulesetHosts } from "./command-contract.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const CHECK_MODE = process.argv.includes("--check");
const mismatches = [];
const orphans = [];
const normalizeLineEndings = (value) => value.replace(/\r\n/g, "\n");

function emit(file, content) {
  if (CHECK_MODE) {
    if (!existsSync(file) || normalizeLineEndings(readFileSync(file, "utf-8")) !== normalizeLineEndings(content)) {
      mismatches.push(relative(REPO_ROOT, file));
    }
    return;
  }
  writeFileSync(file, content);
  generated++;
  console.log(`Generated: ${file}`);
}

let generated = 0;

/**
 * A command dropped from the contract leaves its adapter behind, and a stale
 * adapter still answers to its slash command — a routing dead end that looks
 * alive. Prune any file in a generated tree the contract no longer emits.
 */
function pruneOrphans(hostDir, ext) {
  if (!existsSync(hostDir)) return;
  const expected = new Set(commands.map((cmd) => `${cmd.name}.${ext}`));
  for (const entry of readdirSync(hostDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(`.${ext}`)) continue;
    if (expected.has(entry.name)) continue;
    const stale = join(hostDir, entry.name);
    orphans.push(relative(REPO_ROOT, stale));
    if (!CHECK_MODE) {
      rmSync(stale);
      console.log(`Pruned: ${stale}`);
    }
  }
}

for (const host of hosts) {
  const hostDir = join(REPO_ROOT, host.dir);

  // Ensure directory exists
  if (!CHECK_MODE && !existsSync(hostDir)) {
    mkdirSync(hostDir, { recursive: true });
  }

  if (host.id === "commandcode") {
    // Generate TypeScript mod file
    const tsContent = generateCommandCodeMod(commands);
    const tsFile = join(hostDir, "vitruvius.ts");
    emit(tsFile, tsContent);
  } else {
    pruneOrphans(hostDir, host.ext);
    // Generate markdown command files
    for (const cmd of commands) {
      const mdContent = generateMarkdownCommand(cmd);
      const mdFile = join(hostDir, `${cmd.name}.${host.ext}`);
      emit(mdFile, mdContent);
    }
  }
}

// The free-standing ruleset is authored once and copied to every host that
// loads one, so three identical files can never drift apart unnoticed.
const rulesetSource = join(REPO_ROOT, "references", "host-rules.md");
const ruleset = readFileSync(rulesetSource, "utf-8");
for (const host of rulesetHosts) {
  const target = join(REPO_ROOT, host.file);
  if (!CHECK_MODE && !existsSync(dirname(target))) mkdirSync(dirname(target), { recursive: true });
  emit(target, normalizeLineEndings(ruleset));
}

if (CHECK_MODE) {
  if (orphans.length > 0) {
    console.error(`FAIL: ${orphans.length} orphaned adapter file(s) for commands no longer in the contract:`);
    for (const file of orphans) console.error(`  ${file}  (run: node scripts/generate-adapters.mjs)`);
  }
  if (mismatches.length > 0) {
    console.error(`FAIL: ${mismatches.length} generated adapter file(s) are out of date:`);
    for (const file of mismatches) console.error(`  ${file}`);
  }
  if (orphans.length > 0 || mismatches.length > 0) process.exit(1);
  console.log("PASS: generated adapter files are up to date and free of orphans");
} else {
  console.log(`\nDone: ${generated} adapter files generated, ${orphans.length} pruned`);
}

function generateMarkdownCommand(cmd) {
  const frontmatter = `---
name: ${cmd.name}
description: ${cmd.description}
argument-hint: ${cmd.argumentHint}
---`;

  const body = `# ${cmd.name}

${cmd.description}

## Usage

\`\`\`
/${cmd.name} ${cmd.argumentHint}
\`\`\`

## Category

${categories[cmd.category]?.label || cmd.category}
`;

  return `${frontmatter}\n\n${body.trimEnd()}\n`;
}

function generateCommandCodeMod(commands) {
  const commandList = commands
    .map((cmd) => `  {\n    name: "${cmd.name}",\n    description: "${cmd.description}",\n    argumentHint: "${cmd.argumentHint}",\n  },`)
    .join("\n\n");

  return `/**
 * Command Code mod — auto-generated from scripts/command-contract.mjs
 * Do not edit directly. Run: node scripts/generate-adapters.mjs
 */

export const commands = [
${commandList}
];
`;
}
