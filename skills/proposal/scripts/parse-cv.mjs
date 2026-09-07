/**
 * parse-cv.mjs — Extract structured profile from CV PDF.
 *
 * Usage:
 *   node skills/proposal/scripts/parse-cv.mjs <student-slug> <cv-path.pdf>
 *
 * Outputs:
 *   projects/<student-slug>/profile.json
 *
 * Note: This script extracts raw text from the PDF. The LLM-based
 * structuring happens in the /proposal skill itself (Phase 0).
 * This script just handles PDF → text conversion.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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

// Try to use pdf-parse if available, otherwise use a fallback
let pdfText = '';

try {
  // Dynamic import — pdf-parse may not be installed
  const pdfParse = (await import('pdf-parse')).default;
  const cvBuffer = readFileSync(cvPath);
  const pdfData = await pdfParse(cvBuffer);
  pdfText = pdfData.text;
  console.log(`Extracted ${pdfText.length} characters from CV (${pdfData.numpages} pages)`);
} catch (err) {
  console.error('pdf-parse not installed. Install with: npm install pdf-parse');
  console.error('Falling back to raw buffer read (limited).');

  // Fallback: read as text (works for text-based PDFs, fails for scanned)
  const cvBuffer = readFileSync(cvPath);
  pdfText = cvBuffer.toString('utf-8');

  // Check for scanned PDF (high ratio of non-printable chars)
  const sample = pdfText.slice(0, 1000);
  const nonPrintable = (sample.match(/[^\x20-\x7E\n\r\t]/g) || []).length;
  const ratio = nonPrintable / sample.length;

  if (ratio > 0.3) {
    console.error('');
    console.error('⚠️  WARNING: PDF appears to be scanned or image-based.');
    console.error(`   Non-printable character ratio: ${(ratio * 100).toFixed(0)}% (threshold: 30%)`);
    console.error('   The extracted text may be garbled or empty.');
    console.error('   Consider: (1) using a text-based PDF, (2) running OCR first, or (3) installing pdf-parse.');
    console.error('');
  }

  console.log(`Read ${pdfText.length} bytes (may contain binary data)`);
}

// Save raw text for LLM processing
const rawPath = join(projectDir, 'cv-raw.txt');
writeFileSync(rawPath, pdfText);
console.log(`Saved raw CV text to: ${rawPath}`);

// Output instructions for next step
console.log('\nNext: The /proposal skill will structure this into profile.json');
console.log('Raw text is ready for LLM extraction.');
