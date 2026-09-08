/**
 * parse-posting.mjs — Extract text from position posting (PDF/image/URL).
 *
 * DEPRECATED: Use artifact-reading subagent instead.
 * This script is kept for backward compatibility and direct usage.
 *
 * Usage:
 *   node skills/proposal/scripts/parse-posting.mjs <slug> <posting-path-or-url>
 *
 * Output:
 *   projects/<slug>/posting-raw.txt (raw extracted text)
 *   projects/<slug>/posting.json (structured data — written by LLM)
 *
 * Note: This script extracts raw text. The LLM structures it into JSON.
 * For full document parsing with structure extraction, use artifact-reading subagent.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');

const slug = process.argv[2];
const postingInput = process.argv[3];

if (!slug || !postingInput) {
  console.error('Usage: node skills/proposal/scripts/parse-posting.mjs <slug> <posting-path-or-url>');
  console.error('  posting: PDF file, image file, or URL');
  console.error('');
  console.error('NOTE: For full document parsing, use artifact-reading subagent instead.');
  process.exit(1);
}

const projectDir = join(REPO_ROOT, 'projects', slug);
if (!existsSync(projectDir)) {
  console.error(`Project not found: ${projectDir}. Run init-project.mjs first.`);
  process.exit(1);
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
const PDF_EXTENSIONS = ['.pdf'];

function isURL(input) {
  return input.startsWith('http://') || input.startsWith('https://');
}

function isImage(input) {
  return IMAGE_EXTENSIONS.includes(extname(input).toLowerCase());
}

function isPDF(input) {
  return PDF_EXTENSIONS.includes(extname(input).toLowerCase());
}

const rawPath = join(projectDir, 'posting-raw.txt');

// Handle URL input
if (isURL(postingInput)) {
  console.log(`URL detected: ${postingInput}`);
  console.log('Use web_fetch to get content, then save to posting-raw.txt');
  console.log('The LLM will structure it into posting.json');

  writeFileSync(rawPath, `# Position Posting (URL)
# Source: ${postingInput}
# Status: FETCH REQUIRED

# Instructions for /proposal skill:
# 1. Use web_fetch to get the content of: ${postingInput}
# 2. Extract all text from the posting
# 3. Save raw text to this file (posting-raw.txt)
# 4. Structure the data and save to posting.json
`);
  console.log(`Placeholder saved to: ${rawPath}`);
  process.exit(0);
}

// Handle file input
if (!existsSync(postingInput)) {
  console.error(`File not found: ${postingInput}`);
  process.exit(1);
}

// Handle image input (needs LLM vision)
if (isImage(postingInput)) {
  console.log(`Image detected: ${postingInput}`);
  console.log('Image requires LLM vision extraction.');

  writeFileSync(rawPath, `# Position Posting (Image)
# Source: ${postingInput}
# Status: VISION EXTRACTION REQUIRED

# Instructions for /proposal skill:
# 1. Use read_file to load the image: ${postingInput}
# 2. Extract all text from the posting image
# 3. Save raw text to this file (posting-raw.txt)
# 4. Structure the data and save to posting.json
`);
  console.log(`Placeholder saved to: ${rawPath}`);
  process.exit(0);
}

// Handle PDF input — use extract-document.mjs
if (isPDF(postingInput)) {
  console.log(`PDF detected: ${postingInput}`);
  console.log('Using extract-document.mjs for robust extraction...');

  const extractScript = join(REPO_ROOT, 'scripts', 'extract-document.mjs');
  const result = spawnSync('node', [extractScript, postingInput, '--json'], {
    encoding: 'utf-8',
    timeout: 120000,
  });

  if (result.status !== 0) {
    console.error('Extraction failed:', result.stderr || result.error?.message);
    console.error('Falling back to placeholder.');

    writeFileSync(rawPath, `# Position Posting (PDF - Extraction Failed)
# Source: ${postingInput}
# Status: MANUAL EXTRACTION REQUIRED
# Error: ${result.stderr || 'Unknown error'}

# Instructions for /proposal skill:
# 1. Use read_file to load the PDF: ${postingInput}
# 2. Extract all text from the PDF
# 3. Save raw text to this file (posting-raw.txt)
# 4. Structure the data and save to posting.json
`);
    process.exit(1);
  }

  // Parse the JSON result
  let extractionResult;
  try {
    extractionResult = JSON.parse(result.stdout);
  } catch {
    console.error('Failed to parse extraction result');
    process.exit(1);
  }

  // Save raw text
  writeFileSync(rawPath, extractionResult.markdown || extractionResult.text || '');

  console.log(`Method: ${extractionResult.method}`);
  console.log(`Pages: ${extractionResult.pages}`);
  if (extractionResult.warnings.length > 0) {
    console.log(`Warnings: ${extractionResult.warnings.join(', ')}`);
  }
  console.log(`Raw text saved to: ${rawPath}`);
  console.log('Next: LLM structures this into posting.json');
  process.exit(0);
}

// Unknown input type
console.error(`Unknown input type: ${postingInput}`);
console.error('Expected: PDF file, image file, or URL');
process.exit(1);
