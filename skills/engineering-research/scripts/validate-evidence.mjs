import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateEvidenceLedger } from "./evidence-ledger.mjs";

const PROJECT_ROOT = resolve(process.env.VITRUVIUS_PROJECT_ROOT || process.cwd());
const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/validate-evidence.mjs <evidence.json>");
  process.exitCode = 1;
} else {
  try {
    const value = JSON.parse(readFileSync(resolve(file), "utf-8"));
    const report = validateEvidenceLedger(value, { repoRoot: PROJECT_ROOT });
    if (!report.valid) {
      console.error(report.errors.map((error) => `- ${error}`).join("\n"));
      process.exitCode = 1;
    } else {
      console.log(`PASS: evidence.v1 valid (${report.sourceCount} sources, ${report.searchCount} searches, ${report.claimCount} claims; completion=${report.completion})`);
      // Taken from ref/scientific-agent-skills' evidence validator, which prints
      // the same sentence. A structural pass proves the ledger is well-formed
      // and its hashes match the artifacts on disk. It does not establish that
      // the sources say what the claims say — only a reader can do that, and
      // until they do, the verdict is `unverified`.
      console.log("  Structural check only. A pass here means the ledger is well-formed and its hashes match the artifacts; it does not establish that the sources support the claims.");
    }
  } catch (error) {
    console.error(`validate-evidence: ${error.message}`);
    process.exitCode = 1;
  }
}
