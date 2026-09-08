/**
 * parse-cv.mjs — Extract structured profile from CV PDF.
 *
 * DEPRECATED: Use artifact-reading subagent instead.
 * This script is kept for backward compatibility and direct usage.
 *
 * Usage:
 *   node skills/proposal/scripts/parse-cv.mjs <student-slug> <cv-path.pdf>
 *
 * Outputs:
 *   projects/<student-slug>/cv-raw.txt
 *
 * Note: This script extracts raw text from the PDF. The LLM-based
 * structuring happens in the artifact-reading subagent (Phase 0b).
 * This script just handles PDF → text conversion.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');

const slug = process.argv[2];
const cvPath = process.argv[3];

if (!slug || !cvPath) {
  console.error('Usage: node skills/proposal/scripts/parse-cv.mjs <student-slug> <cv-path.pdf>');
  process.exit(1);
}

const projectDir = join(REPO_ROOT, 'projects', slug);
if (!existsSync(projectDir)) {
  console.error(`Project not found: ${projectDir}`);
  console.error('Run init-project.mjs first.');
  process.exit(1);
}

if (!existsSync(cvPath)) {
  console.error(`CV file not found: ${cvPath}`);
  process.exit(1);
}

// Use extract-document.mjs for robust extraction
console.log(`Extracting CV: ${cvPath}`);

const extractScript = join(REPO_ROOT, 'scripts', 'extract-document.mjs');
const result = spawnSync('node', [extractScript, cvPath, '--json'], {
  encoding: 'utf-8',
  timeout: 120000,
});

if (result.status !== 0) {
  console.error('Extraction failed:', result.stderr || result.error?.message);
  console.error('Falling back to raw buffer read.');

  // Fallback: read as text (works for text-based PDFs, fails for scanned)
  const cvBuffer = readFileSync(cvPath);
  const cvText = cvBuffer.toString('utf-8');

  const rawPath = join(projectDir, 'cv-raw.txt');
  writeFileSync(rawPath, cvText);
  console.log(`Read ${cvText.length} bytes (may contain binary data)`);
  process.exit(0);
}

// Parse the JSON result
let extractionResult;
try {
  extractionResult = JSON.parse(result.stdout);
} catch {
  console.error('Failed to parse extraction result');
  process.exit(1);
}

// Save raw text for LLM processing
const rawPath = join(projectDir, 'cv-raw.txt');
writeFileSync(rawPath, extractionResult.markdown || extractionResult.text || '');

console.log(`Method: ${extractionResult.method}`);
console.log(`Pages: ${extractionResult.pages}`);
if (extractionResult.warnings.length > 0) {
  console.log(`Warnings: ${extractionResult.warnings.join(', ')}`);
}
console.log(`Raw CV text saved to: ${rawPath}`);
