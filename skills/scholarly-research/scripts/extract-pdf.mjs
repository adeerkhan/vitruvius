/**
 * extract-pdf.mjs — page-anchored PDF text extraction.
 *
 * Canonical Vitruvius PDF reader. It wraps the optional `pdf-parse`
 * dependency with a custom page renderer that:
 *   - keeps page boundaries as `[[page N]]` markers, so an extracted claim can
 *     be anchored back to a page instead of an undifferentiated text blob;
 *   - reconstructs lines from text items (`hasEOL` plus Y-position changes)
 *     instead of concatenating every item with a space, which is what makes
 *     two-column papers come out in reading order more often than not;
 *   - reports SHA-256 of the source bytes, so provenance survives deleting the
 *     binary.
 *
 * The repository `scripts/extract-pdf.mjs` file is a thin CLI wrapper around
 * this module, mirroring the proposal skill's document-extractor pattern.
 *
 * Limitations, stated rather than hidden:
 *   - pdf-parse is an optional dependency. Without it the extractor fails with
 *     an actionable error; it does not silently invent text.
 *   - A scanned PDF (image-only) has no text layer. This extractor does not
 *     OCR: it returns empty text and a warning, and refuses to delete a source
 *     it could not read.
 *   - Column detection is heuristic. Always cross-check numbers against the
 *     `[[page N]]` source before citing (see the artifact-reading skill).
 */
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Reconstruct reading-order lines from a pdfjs text-content object. */
export function textContentToLines(textContent) {
  const items = textContent && Array.isArray(textContent.items) ? textContent.items : [];
  const lines = [];
  let current = '';
  let lastY = null;

  const flush = () => {
    const line = current.replace(/\s+$/, '');
    if (line !== '') lines.push(line);
    current = '';
  };

  for (const item of items) {
    if (!item || typeof item.str !== 'string') continue;
    const y = Array.isArray(item.transform) ? item.transform[5] : null;
    const yChanged = lastY !== null && y !== null && Math.abs(y - lastY) > 0.5;
    if (yChanged) flush();
    current += item.str;
    if (item.hasEOL === true) {
      flush();
      lastY = null;
      continue;
    }
    if (y !== null) lastY = y;
  }
  flush();
  return lines.join('\n');
}

/**
 * Build a pdf-parse `pagerender` that stamps each page with a `[[page N]]`
 * marker. pdf-parse renders pages sequentially, so a closure counter is a
 * reliable page number.
 */
export function makePagerender() {
  let pageNumber = 0;
  return async function pagerender(pageData) {
    pageNumber += 1;
    const textContent = await pageData.getTextContent({
      normalizeWhitespace: false,
      disableCombineTextItems: true,
    });
    return `[[page ${pageNumber}]]\n${textContentToLines(textContent)}`;
  };
}

function isScannedPdf(text) {
  if (!text || text.trim() === '') return true;
  const sample = text.slice(0, 1000);
  const controlCharacters = (sample.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g) || []).length;
  return controlCharacters / sample.length > 0.3;
}

/**
 * Run `body` with process.stdout captured. `pdf-parse` prints diagnostics of
 * its own straight to stdout; left alone they corrupt the `--json` payload.
 */
async function withCapturedStdout(body) {
  const captured = [];
  const realWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk, ...rest) => {
    captured.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
    const callback = rest.find((argument) => typeof argument === 'function');
    if (callback) callback();
    return true;
  };
  try {
    return { value: await body(), stdout: captured.join('') };
  } finally {
    process.stdout.write = realWrite;
  }
}

async function runPdfParse(buffer) {
  let module;
  try {
    module = await import('pdf-parse');
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      throw new Error(
        'pdf-parse is not installed; install the optional dependency (npm install pdf-parse) or provide a text transcription',
      );
    }
    throw error;
  }
  const pdfParse = module.default ?? module;
  if (typeof pdfParse !== 'function') throw new Error('pdf-parse export is not callable');
  // pdf-parse 1.x bundles an old pdfjs that misreads a Node Buffer as a string
  // and throws "bad XRef entry" on valid PDFs. A Uint8Array is the input it
  // actually expects.
  const data = await pdfParse(new Uint8Array(buffer), { pagerender: makePagerender() });
  return {
    text: typeof data.text === 'string' ? data.text : '',
    pages: data.numpages || 0,
  };
}

export function sha256Hex(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Extract text from a local PDF file.
 *
 * @param {string} filePath
 * @param {{ removeSource?: boolean }} [options] `removeSource` deletes the PDF
 *   after a *usable* extraction, leaving text + SHA-256 as the record. A source
 *   that could not be read (scanned, no text layer) is never deleted.
 */
export async function extractPdf(filePath, { removeSource = false } = {}) {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new Error('PDF path is required');
  }
  if (!existsSync(filePath)) throw new Error(`file not found: ${filePath}`);
  if (extname(filePath).toLowerCase() !== '.pdf') throw new Error(`not a PDF: ${filePath}`);

  const bytes = readFileSync(filePath);
  const sha256 = sha256Hex(bytes);
  const byteLength = bytes.length;
  const warnings = [];

  const { value, stdout } = await withCapturedStdout(() => runPdfParse(bytes));
  if (stdout.trim() !== '') warnings.push(`pdf-parse wrote to stdout: ${stdout.trim()}`);

  const scanned = isScannedPdf(value.text);
  if (scanned) {
    warnings.push('PDF appears to be scanned or has no usable text layer; OCR is not performed');
  }

  let deleted = false;
  if (removeSource) {
    if (scanned) {
      warnings.push('source kept: extraction yielded no text, so deleting it would lose the only copy');
    } else {
      rmSync(filePath);
      deleted = true;
    }
  }

  return {
    source: filePath,
    sha256,
    pages: value.pages,
    text: scanned ? '' : value.text,
    bytes: byteLength,
    warnings,
    deleted,
  };
}

/** Download a URL to a temporary `.pdf` path and return that path. */
export async function downloadToTemp(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'vitruvius-research/1.0 (+https://github.com/adeerkhan/vitruvius)' },
  });
  if (!response.ok) {
    throw new Error(`fetch failed: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const dest = join(tmpdir(), `vitruvius-${randomUUID()}.pdf`);
  writeFileSync(dest, buffer);
  return dest;
}

function formatResult(result, outputJson) {
  if (outputJson) return JSON.stringify(result, null, 2);
  const lines = [
    `Source: ${result.url || result.source}`,
    `Pages: ${result.pages}`,
    `SHA-256: ${result.sha256}`,
    `Deleted: ${result.deleted ? 'yes' : 'no'}`,
  ];
  if (result.warnings.length > 0) lines.push(`Warnings: ${result.warnings.join(', ')}`);
  lines.push('---', result.text);
  return lines.join('\n');
}

export async function runExtractPdfCli(argv) {
  const positional = argv.filter((argument) => !argument.startsWith('--'));
  const source = positional[0];
  const outputJson = argv.includes('--json');
  const removeSource = argv.includes('--delete');

  if (!source) {
    console.error('Usage: node scripts/extract-pdf.mjs <pdf-path-or-url> [--json] [--delete]');
    process.exitCode = 1;
    return;
  }

  const isUrl = /^https?:\/\//i.test(source);
  let pdfPath = source;
  let url = null;
  try {
    if (isUrl) {
      url = source;
      pdfPath = await downloadToTemp(source);
    }
    const result = await extractPdf(pdfPath, { removeSource: removeSource || isUrl });
    if (url) {
      result.url = url;
      result.source = url;
    }
    console.log(formatResult(result, outputJson));
    process.exitCode = result.text.trim() === '' ? 1 : 0;
  } catch (error) {
    const result = {
      source,
      url,
      sha256: null,
      pages: 0,
      text: '',
      warnings: [`extraction error: ${error.message}`],
      deleted: false,
    };
    console.log(formatResult(result, true));
    process.exitCode = 1;
  }
}

export { isScannedPdf };

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  await runExtractPdfCli(process.argv.slice(2));
}
