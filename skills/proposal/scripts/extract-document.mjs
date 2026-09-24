/**
 * Local proposal-skill document extractor entry point.
 * Usage: node skills/proposal/scripts/extract-document.mjs <file-path> [--json]
 */
import { runDocumentCli } from './document-extractor.mjs';

await runDocumentCli(process.argv[2], process.argv.includes('--json'));
