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
import { parseFrontmatterObject } from "./yaml-frontmatter.mjs";

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

// Role adapters are generated from the canonical agents/*.md manifest, so the
// OpenCode subagents cannot drift from their role contracts. A read-only role
// (declares neither Write nor Edit) gets the write/edit denials; a producer
// gets unrestricted tools.
const AGENTS_DIR = join(REPO_ROOT, "agents");
const AGENT_OUT_DIR = join(REPO_ROOT, ".opencode", "agent");

function parseToolsList(value) {
  const match = String(value ?? "").match(/^\[(.*)\]$/);
  return match ? match[1].split(",").map((entry) => entry.trim()).filter(Boolean) : [];
}

function agentAdapterContent(role, canonical) {
  const frontmatter = parseFrontmatterObject(canonical);
  const name = typeof frontmatter.name === "string" ? frontmatter.name : role;
  const purpose = typeof frontmatter.role === "string"
    ? frontmatter.role.charAt(0).toLowerCase() + frontmatter.role.slice(1)
    : role;
  const tools = parseToolsList(frontmatter.tools);
  const readOnly = !tools.includes("Write") && !tools.includes("Edit");
  return [
    "---",
    `description: Vitruvius ${name} role (${purpose}). Canonical definition: agents/${name}.md - Read it and follow it exactly.`,
    "mode: subagent",
    readOnly ? "tools:\n  write: false\n  edit: false" : "tools:",
    "---",
    "",
    `1. Read the file agents/${name}.md from the repo root and follow it exactly.`,
    `2. If that file is missing, refuse the task and report BLOCKED: role definition agents/${name}.md not found - do not improvise the role.`,
    "",
  ].join("\n");
}

if (existsSync(AGENTS_DIR)) {
  if (!CHECK_MODE && !existsSync(AGENT_OUT_DIR)) mkdirSync(AGENT_OUT_DIR, { recursive: true });
  const roleFiles = readdirSync(AGENTS_DIR).filter((file) => file.endsWith(".md")).sort();
  const expectedRoles = new Set(roleFiles);
  if (existsSync(AGENT_OUT_DIR)) {
    for (const entry of readdirSync(AGENT_OUT_DIR, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      if (expectedRoles.has(entry.name)) continue;
      orphans.push(relative(REPO_ROOT, join(AGENT_OUT_DIR, entry.name)));
      if (!CHECK_MODE) {
        rmSync(join(AGENT_OUT_DIR, entry.name));
        console.log(`Pruned: ${join(AGENT_OUT_DIR, entry.name)}`);
      }
    }
  }
  for (const file of roleFiles) {
    const canonical = readFileSync(join(AGENTS_DIR, file), "utf-8");
    emit(join(AGENT_OUT_DIR, file), agentAdapterContent(file.replace(/\.md$/, ""), canonical));
  }
}

if (CHECK_MODE) {
  if (orphans.length > 0) {
    console.error(`FAIL: ${orphans.length} orphaned adapter file(s) for commands/roles no longer in the contract:`);
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
