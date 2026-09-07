/**
 * find-voice-sample.mjs — Copy voice sample from student-provided document.
 *
 * Usage:
 *   node skills/proposal/scripts/find-voice-sample.mjs <student-slug> --statement <path>
 *   node skills/proposal/scripts/find-voice-sample.mjs <student-slug> --sample <path>
 *
 * Priority: --sample > --statement > default neutral voice
 * Output: projects/<student-slug>/voice-sample.txt
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');

const args = process.argv.slice(2);
const slug = args[0];

if (!slug) {
  console.error('Usage: node skills/proposal/scripts/find-voice-sample.mjs <student-slug> --statement <path> OR --sample <path>');
  process.exit(1);
}

// Parse optional arguments
let sourcePath = null;
let sourceType = null;

for (let i = 1; i < args.length; i++) {
  if ((args[i] === '--statement' || args[i] === '--sample') && args[i + 1]) {
    sourcePath = args[i + 1];
    sourceType = args[i].slice(2);
    i++;
  }
}

const projectDir = join(REPO_ROOT, 'projects', slug);
if (!existsSync(projectDir)) {
  console.error(`Project not found: ${projectDir}. Run init-project.mjs first.`);
  process.exit(1);
}

const destPath = join(projectDir, 'voice-sample.txt');

if (!sourcePath) {
  // No sample provided — write placeholder for default neutral voice
  writeFileSync(destPath, '# Voice Sample\n\nStatus: NOT PROVIDED\nHumanizer will use default neutral voice.\n');
  console.log('No voice sample provided. Using default neutral voice.');
  process.exit(0);
}

if (!existsSync(sourcePath)) {
  console.error(`Source file not found: ${sourcePath}`);
  process.exit(1);
}

// Copy file and prepend source metadata
const content = readFileSync(sourcePath, 'utf-8');
writeFileSync(destPath, `# Voice Sample\n# Source: ${sourcePath}\n# Type: ${sourceType}\n\n${content}`);
console.log(`Voice sample saved: ${sourcePath} → ${destPath}`);
