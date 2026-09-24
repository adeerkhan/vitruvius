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

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { commands, categories, hosts } from "./command-contract.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const CHECK_MODE = process.argv.includes("--check");
const mismatches = [];
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
    // Generate markdown command files
    for (const cmd of commands) {
      const mdContent = generateMarkdownCommand(cmd, host.id);
      const mdFile = join(hostDir, `${cmd.name}.${host.ext}`);
      emit(mdFile, mdContent);
    }
  }
}

if (CHECK_MODE) {
  if (mismatches.length > 0) {
    console.error(`FAIL: ${mismatches.length} generated adapter file(s) are out of date:`);
    for (const file of mismatches) console.error(`  ${file}`);
    process.exit(1);
  }
  console.log("PASS: generated adapter files are up to date");
} else {
  console.log(`\nDone: ${generated} adapter files generated`);
}

function generateMarkdownCommand(cmd, hostId) {
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

  return `${frontmatter}\n\n${body}\n`;
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
