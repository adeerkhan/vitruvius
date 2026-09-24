/**
 * extract-document.mjs — repository CLI wrapper for the proposal document extractor.
 * Usage: node scripts/extract-document.mjs <file-path> [--json]
 */
import { runDocumentCli } from '../skills/proposal/scripts/document-extractor.mjs';

await runDocumentCli(process.argv[2], process.argv.includes('--json'));
