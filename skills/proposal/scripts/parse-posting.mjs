/**
 * parse-posting.mjs — Extract structured data from position posting.
 *
 * Usage:
 *   node skills/proposal/scripts/parse-posting.mjs <slug> <posting-path-or-url>
 *
 * Input types:
 *   - PDF file (text-based or scanned)
 *   - Image file (PNG, JPG)
 *   - URL (web page)
 *
 * Output:
 *   projects/<slug>/posting-raw.txt (raw extracted text)
 *   projects/<slug>/posting.json (structured data — written by LLM)
 *
 * Note: This script extracts raw text. The LLM structures it into JSON.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');

const slug = process.argv[2];
const postingInput = process.argv[3];

if (!slug || !postingInput) {
  console.error('Usage: node skills/proposal/scripts/parse-posting.mjs <slug> <posting-path-or-url>');
  console.error('  posting: PDF file, image file, or URL');
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

  // Write a placeholder with instructions
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
  console.log('The LLM will read the image and extract structured data.');

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

// Handle PDF input
if (isPDF(postingInput)) {
  console.log(`PDF detected: ${postingInput}`);

  let pdfText = '';
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const pdfBuffer = readFileSync(postingInput);
    const pdfData = await pdfParse(pdfBuffer);
    pdfText = pdfData.text;
    console.log(`Extracted ${pdfText.length} characters (${pdfData.numpages} pages)`);
  } catch (err) {
    console.error('pdf-parse not installed. Install with: npm install pdf-parse');
    console.error('Falling back to raw buffer read.');

    const pdfBuffer = readFileSync(postingInput);
    pdfText = pdfBuffer.toString('utf-8');

    // Check for scanned PDF
    const sample = pdfText.slice(0, 1000);
    const nonPrintable = (sample.match(/[^\x20-\x7E\n\r\t]/g) || []).length;
    const ratio = nonPrintable / sample.length;

    if (ratio > 0.3) {
      console.error('');
      console.error('⚠️  WARNING: PDF appears to be scanned or image-based.');
      console.error(`   Non-printable character ratio: ${(ratio * 100).toFixed(0)}%`);
      console.error('   LLM vision extraction required.');
      console.error('');

      writeFileSync(rawPath, `# Position Posting (Scanned PDF)
# Source: ${postingInput}
# Status: VISION EXTRACTION REQUIRED

# Instructions for /proposal skill:
# 1. Use read_file to load the PDF: ${postingInput}
# 2. Extract all text from the scanned PDF
# 3. Save raw text to this file (posting-raw.txt)
# 4. Structure the data and save to posting.json
`);
      console.log(`Placeholder saved to: ${rawPath}`);
      process.exit(0);
    }
  }

  // Save raw text
  writeFileSync(rawPath, pdfText);
  console.log(`Raw text saved to: ${rawPath}`);
  console.log('Next: LLM structures this into posting.json');
  process.exit(0);
}

// Unknown input type
console.error(`Unknown input type: ${postingInput}`);
console.error('Expected: PDF file, image file, or URL');
process.exit(1);
