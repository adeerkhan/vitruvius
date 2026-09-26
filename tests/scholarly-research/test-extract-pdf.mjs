/**
 * Behavioral test for the scholarly-research PDF extractor.
 *
 * The extractor wraps the optional `pdf-parse` dependency. These tests pin the
 * parts that must work with or without that dependency installed: reading-order
 * line reconstruction, page-marker stamping, hashing, and fail-closed errors.
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { check } from '../_contract/contract.mjs';
import {
  extractPdf,
  isScannedPdf,
  makePagerender,
  sha256Hex,
  textContentToLines,
} from '../../skills/scholarly-research/scripts/extract-pdf.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

console.log('\n[Test] scholarly-research — PDF extraction');

// 1. Reading-order line reconstruction from pdfjs text items.
const content = {
  items: [
    { str: 'Two-column paper', transform: [1, 0, 0, 1, 10, 700], hasEOL: true },
    { str: 'left column line 1', transform: [1, 0, 0, 1, 10, 680] },
    { str: ' continues', transform: [1, 0, 0, 1, 90, 680], hasEOL: true },
    { str: 'left column line 2', transform: [1, 0, 0, 1, 10, 660], hasEOL: true },
  ],
};
check(
  textContentToLines(content) ===
    'Two-column paper\nleft column line 1 continues\nleft column line 2',
  'textContentToLines reconstructs reading-order lines and honors hasEOL',
);

// 2. A Y-position change breaks a line even without hasEOL.
const yContent = {
  items: [
    { str: 'first', transform: [1, 0, 0, 1, 0, 100] },
    { str: 'second', transform: [1, 0, 0, 1, 0, 80] },
  ],
};
check(
  textContentToLines(yContent) === 'first\nsecond',
  'textContentToLines breaks on a Y-position change',
);

// 3. Page markers survive across pages via a closure counter.
const pagerender = makePagerender();
const fakePage = (label) => ({
  getTextContent: async () => ({
    items: [{ str: label, transform: [1, 0, 0, 1, 0, 10], hasEOL: true }],
  }),
});
const pageOne = await pagerender(fakePage('alpha'));
const pageTwo = await pagerender(fakePage('beta'));
check(pageOne.startsWith('[[page 1]]'), 'pagerender stamps page 1');
check(pageTwo.startsWith('[[page 2]]'), 'pagerender increments the page counter');

// 4. Deterministic hash for provenance after the binary is deleted.
check(
  sha256Hex(Buffer.from('abc')) ===
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  'sha256Hex matches the known digest',
);

// 5. Fail-closed errors.
let missing = false;
try {
  await extractPdf(join(tmpdir(), 'vitruvius-does-not-exist.pdf'));
} catch (error) {
  missing = /file not found/.test(error.message);
}
check(missing, 'extractPdf fails closed on a missing file');

const dir = mkdtempSync(join(tmpdir(), 'vitruvius-pdf-test-'));
const textPath = join(dir, 'note.txt');
writeFileSync(textPath, 'hello');
let notPdf = false;
try {
  await extractPdf(textPath);
} catch (error) {
  notPdf = /not a PDF/.test(error.message);
}
check(notPdf, 'extractPdf rejects non-PDF input');

const fakePdf = join(dir, 'fake.pdf');
writeFileSync(fakePdf, Buffer.from('%PDF-1.4\nthis is not really a pdf'));
let actionable = false;
try {
  await extractPdf(fakePdf);
} catch (error) {
  actionable = /pdf-parse is not installed|Invalid PDF|not callable|pdf-parse failed/i.test(
    error.message,
  );
}
check(actionable, 'extractPdf reports an actionable error for an unreadable/fake PDF');

check(isScannedPdf('') === true, 'isScannedPdf treats empty text as scanned');
check(isScannedPdf('Dummy PDF file') === false, 'isScannedPdf accepts a text layer');

rmSync(dir, { recursive: true, force: true });

console.log('\nPASS: scholarly-research PDF extraction');
