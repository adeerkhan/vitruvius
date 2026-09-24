/**
 * document-extractor.mjs — local proposal intake extractor.
 *
 * This module is shipped inside the proposal skill so a host that copies only
 * skills/ does not need a repository-root runtime helper. The root
 * scripts/extract-document.mjs file is a thin CLI wrapper around this module.
 */
import { existsSync, readFileSync } from 'node:fs';
import { extname } from 'node:path';

const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.markdown', '.json']);

function looksBinary(buffer) {
  const signatures = [
    [0x89, 0x50, 0x4e, 0x47],
    [0xff, 0xd8, 0xff],
    [0x47, 0x49, 0x46, 0x38],
    [0x25, 0x50, 0x44, 0x46],
    [0x50, 0x4b, 0x03, 0x04],
  ];
  if (signatures.some((signature) => signature.every((byte, index) => buffer[index] === byte))) return true;
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  const controls = (sample.toString('binary').match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g) || []).length;
  return sample.length > 0 && controls / sample.length > 0.05;
}

function estimatePages(text) {
  return Math.max(1, Math.ceil(text.length / 3000));
}

function isScannedPdf(text) {
  if (!text || text.trim() === '') return true;
  const sample = text.slice(0, 1000);
  // Count control characters, not legitimate Unicode letters or punctuation.
  const controlCharacters = (sample.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g) || []).length;
  return (controlCharacters / sample.length) > 0.3;
}

async function extractWithPdfParse(filePath, sourceBuffer) {
  try {
    const module = await import('pdf-parse');
    const pdfParse = module.default ?? module;
    if (typeof pdfParse !== 'function') throw new Error('pdf-parse export is not callable');
    const data = await pdfParse(sourceBuffer);
    const text = typeof data.text === 'string' ? data.text : '';
    return { text, markdown: text, pages: data.numpages || 0, ocrUsed: false };
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      throw new Error('pdf-parse is not installed; install the optional pdf-parse dependency or provide plain text');
    }
    throw new Error(`pdf-parse failed: ${error.message}`);
  }
}

function extractPlainText(filePath, sourceBuffer) {
  if (looksBinary(sourceBuffer)) throw new Error('binary content is masquerading as a text document');
  const text = sourceBuffer.toString('utf-8');
  if (text.trim() === '') throw new Error('plain-text document is empty');
  return { text, markdown: text, pages: estimatePages(text), ocrUsed: false };
}

export async function extractDocument(filePath, sourceBuffer) {
  if (typeof filePath !== 'string' || filePath.trim() === '') throw new Error('document path is required');
  if (!existsSync(filePath)) throw new Error(`file not found: ${filePath}`);
  const bytes = sourceBuffer || readFileSync(filePath);

  const ext = extname(filePath).toLowerCase();
  const warnings = [];
  if (TEXT_EXTENSIONS.has(ext)) {
    return { source: filePath, method: 'text', ...extractPlainText(filePath, bytes), warnings };
  }
  if (ext !== '.pdf') {
    warnings.push(`unsupported document type ${ext || '(none)'}; provide plain text, Markdown, JSON, or PDF`);
    warnings.push('LLM vision is not part of deterministic proposal intake');
    return { source: filePath, method: 'vision', pages: 0, text: '', markdown: '', ocrUsed: false, warnings };
  }

  try {
    const result = await extractWithPdfParse(filePath, bytes);
    if (isScannedPdf(result.text)) {
      warnings.push('PDF appears to be scanned or has no usable text');
      warnings.push('OCR is BLOCKED in deterministic intake; provide a text-layer PDF or transcription');
      return { source: filePath, method: 'vision', pages: result.pages, text: '', markdown: '', ocrUsed: false, warnings };
    }
    return { source: filePath, method: 'pdf-parse', ...result, warnings };
  } catch (error) {
    warnings.push(`pdf-parse failed: ${error.message}`);
    warnings.push('LLM vision is not part of deterministic proposal intake');
    return { source: filePath, method: 'vision', pages: 0, text: '', markdown: '', ocrUsed: false, warnings };
  }
}

function formatResult(result, outputJson) {
  if (outputJson) return JSON.stringify(result, null, 2);
  const lines = [
    `Source: ${result.source}`,
    `Method: ${result.method}`,
    `Pages: ${result.pages}`,
    `OCR: ${result.ocrUsed === true ? 'Yes' : result.ocrUsed === false ? 'No' : 'Unknown'}`,
  ];
  if (result.warnings.length > 0) lines.push(`Warnings: ${result.warnings.join(', ')}`);
  lines.push('---', result.markdown || result.text);
  return lines.join('\n');
}

export async function runDocumentCli(filePath, outputJson) {
  if (!filePath) {
    console.error('Usage: node scripts/extract-document.mjs <file-path> [--json]');
    process.exitCode = 1;
    return;
  }
  try {
    const result = await extractDocument(filePath);
    console.log(formatResult(result, outputJson));
    process.exitCode = result.method === 'vision' ? 1 : 0;
  } catch (error) {
    const result = {
      source: filePath,
      method: 'error',
      pages: 0,
      text: '',
      markdown: '',
      ocrUsed: false,
      warnings: [`Extraction error: ${error.message}`],
    };
    console.log(formatResult(result, true));
    process.exitCode = 1;
  }
}
