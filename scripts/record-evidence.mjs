/**
 * Repository CLI wrapper for the engineering-research evidence ledger.
 * The implementation ships with the skill for copied-skill installations.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
if (!process.env.VITRUVIUS_RUNS_DIR && !process.env.VITRUVIUS_PROJECT_ROOT) {
  process.env.VITRUVIUS_PROJECT_ROOT = repositoryRoot;
}

await import("../skills/engineering-research/scripts/record-evidence.mjs");
