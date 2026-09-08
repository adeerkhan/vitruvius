/**
 * extract-document.mjs — 3-tier document extraction with fallback.
 *
 * Tiers:
 *   1. marker (Python) — best quality, OCR support for scanned PDFs
 *   2. pdf-parse (npm) — basic text extraction
 *   3. LLM vision — last resort for scanned/image PDFs
 *
 * Usage:
 *   node scripts/extract-document.mjs <file-path> [--json]
 *
 * Output (stdout):
 *   JSON object with extraction result
 *
 * Example:
 *   {
 *     "source": "path/to/file.pdf",
 *     "method": "marker",
 *     "pages": 5,
 *     "text": "full extracted text...",
 *     "markdown": "markdown formatted...",
 *     "ocrUsed": false,
 *     "warnings": []
 *   }
 */

import { readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = join(__dirname, '..');

const filePath = process.argv[2];
const outputJson = process.argv.includes('--json');

if (!filePath) {
  console.error('Usage: node scripts/extract-document.mjs <file-path> [--json]');
  console.error('  Extracts text from PDF, DOCX, PPTX, XLSX files');
  process.exit(1);
}

if (!existsSync(filePath)) {
  writeResult({
    source: filePath,
    method: 'error',
    pages: 0,
    text: '',
    markdown: '',
    ocrUsed: false,
    warnings: [`File not found: ${filePath}`],
  }, true);
  process.exit(1);
}

const ext = extname(filePath).toLowerCase();
const warnings = [];

/**
 * Write result to stdout as JSON
 */
function writeResult(result, isError = false) {
  if (outputJson || isError) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    // Human-readable output
    console.log(`Source: ${result.source}`);
    console.log(`Method: ${result.method}`);
    console.log(`Pages: ${result.pages}`);
    console.log(`OCR: ${result.ocrUsed ? 'Yes' : 'No'}`);
    if (result.warnings.length > 0) {
      console.log(`Warnings: ${result.warnings.join(', ')}`);
    }
    console.log('---');
    console.log(result.markdown || result.text);
  }
}

/**
 * Check if marker (Python) is available
 */
function isMarkerAvailable() {
  try {
    const result = spawnSync('python', ['-m', 'marker', '--version'], {
      encoding: 'utf-8',
      timeout: 5000,
    });
    return result.status === 0;
  } catch {
    return false;
  }
}

/**
 * Extract using marker (Python)
 * Returns { text, markdown, pages, ocrUsed }
 */
function extractWithMarker(filePath) {
  const tmpDir = join(REPO_ROOT, '.tmp-marker');
  const result = spawnSync('python', [
    '-m', 'marker',
    '--input', filePath,
    '--output_dir', tmpDir,
    '--format', 'markdown',
  ], {
    encoding: 'utf-8',
    timeout: 120000, // 2 min timeout for large PDFs
  });

  if (result.status !== 0) {
    throw new Error(`Marker failed: ${result.stderr || result.error?.message}`);
  }

  // Read marker output
  if (!existsSync(tmpDir)) {
    throw new Error('Marker output directory not created');
  }

  const files = readdirSync(tmpDir);
  const mdFile = files.find(f => f.endsWith('.md'));

  if (!mdFile) {
    throw new Error('No markdown output from marker');
  }

  const markdown = readFileSync(join(tmpDir, mdFile), 'utf-8');

  // Clean up temp directory
  try {
    rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }

  return {
    text: markdown,
    markdown,
    pages: estimatePages(markdown),
    ocrUsed: true, // marker uses OCR when needed
  };
}

/**
 * Extract using pdf-parse (npm)
 */
function extractWithPdfParse(filePath) {
  try {
    // Dynamic import — pdf-parse may not be installed
    const pdfParse = (await import('pdf-parse')).default;
    const buffer = readFileSync(filePath);
    const data = await pdfParse(buffer);

    return {
      text: data.text,
      markdown: data.text,
      pages: data.numpages || 0,
      ocrUsed: false,
    };
  } catch (err) {
    throw new Error(`pdf-parse failed: ${err.message}`);
  }
}

/**
 * Estimate page count from content length
 */
function estimatePages(text) {
  // Rough estimate: ~3000 chars per page
  return Math.max(1, Math.ceil(text.length / 3000));
}

/**
 * Check if PDF appears to be scanned (high non-printable ratio)
 */
function isScannedPdf(text) {
  if (!text || text.length < 100) return true;
  const sample = text.slice(0, 1000);
  const nonPrintable = (sample.match(/[^\x20-\x7E\n\r\t]/g) || []).length;
  return (nonPrintable / sample.length) > 0.3;
}

/**
 * Main extraction logic with 3-tier fallback
 */
async function extract(filePath) {
  const ext = extname(filePath).toLowerCase();

  // Tier 1: Try marker (best quality, OCR support)
  if (isMarkerAvailable()) {
    try {
      const result = extractWithMarker(filePath);
      return {
        source: filePath,
        method: 'marker',
        pages: result.pages,
        text: result.text,
        markdown: result.markdown,
        ocrUsed: result.ocrUsed,
        warnings,
      };
    } catch (err) {
      warnings.push(`Marker failed: ${err.message}, falling back to pdf-parse`);
    }
  } else {
    warnings.push('Marker not installed, using pdf-parse (install marker-pdf for better results)');
  }

  // Tier 2: Try pdf-parse (basic text extraction)
  if (ext === '.pdf') {
    try {
      const result = await extractWithPdfParse(filePath);

      // Check if scanned
      if (isScannedPdf(result.text)) {
        warnings.push('PDF appears to be scanned — text extraction may be poor');
        warnings.push('Install marker-pdf for OCR support');
      }

      return {
        source: filePath,
        method: 'pdf-parse',
        pages: result.pages,
        text: result.text,
        markdown: result.markdown,
        ocrUsed: false,
        warnings,
      };
    } catch (err) {
      warnings.push(`pdf-parse failed: ${err.message}, falling back to LLM vision`);
    }
  }

  // Tier 3: Flag for LLM vision
  warnings.push('Automated extraction failed — LLM vision required');
  return {
    source: filePath,
    method: 'vision',
    pages: 0,
    text: '',
    markdown: '',
    ocrUsed: false,
    warnings,
  };
}

// Run extraction
extract(filePath)
  .then(result => {
    writeResult(result);
    process.exit(result.method === 'vision' ? 1 : 0);
  })
  .catch(err => {
    writeResult({
      source: filePath,
      method: 'error',
      pages: 0,
      text: '',
      markdown: '',
      ocrUsed: false,
      warnings: [`Extraction error: ${err.message}`],
    }, true);
    process.exit(1);
  });
