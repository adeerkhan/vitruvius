/**
 * extract-pdf.mjs — repository CLI wrapper for the scholarly-research PDF reader.
 * Usage: node scripts/extract-pdf.mjs <pdf-path-or-url> [--json] [--delete]
 */
import { runExtractPdfCli } from '../skills/scholarly-research/scripts/extract-pdf.mjs';

await runExtractPdfCli(process.argv.slice(2));
