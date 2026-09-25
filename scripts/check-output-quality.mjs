/**
 * check-output-quality.mjs — Drift detection for Vitruvius research outputs.
 *
 * Checks for common quality issues that indicate skill drift:
 * - Missing MACHINE_VERDICT line (verifier outputs)
 * - Missing inline citations [1], [2]
 * - Missing Sources section
 * - Missing evidence trail table
 * - Final research deliverables that answer nobody's question: no artifact
 *   anchor, no negative coverage, or a recommendation with no stated evidence
 *
 * The grounding checks are deliberately narrow. They apply only to files with
 * positive evidence of being a final research deliverable — a provenance
 * sidecar, a GOAL-CHECK record, or a problem-anchor record beside them. Guessing
 * from a filename would fail provenance sidecars, FMEA tables, and comparison
 * matrices, and would train agents to satisfy a checker instead of a reader.
 *
 * These checks are a cheap net, not the contract. `vitruvius-problem-anchor`
 * is the real gate: it resolves anchors against bytes and binds findings to
 * decisions, which no heading check can do.
 *
 * Usage: node scripts/check-output-quality.mjs <file-or-dir>
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";

const target = process.argv[2] || "outputs";

// --- artifact anchors -------------------------------------------------------
// A file anchor: `path:line` or `path:9-13`, delimited so a citation to
// packages/solver/x.ts:13 cannot satisfy an anchor of solver/x.ts:1.
const FILE_ANCHOR = /(?:^|[\s`([])(?<![\w./-])[\w.][\w./-]*\.(?:ts|tsx|js|mjs|cjs|py|json|md|ya?ml|go|rs|java|c|cc|cpp|h|hpp|sql|sh|ps1):\d+(?![0-9])(?:\s*[-\u2013\u2014]\s*\d+)?/;
// A measured command: an invocation paired with a result, so a report grounded
// in `npx vitest run` -> 13 passed counts as anchored.
const COMMAND = /\b(?:npm|npx|yarn|pnpm|node|deno|bun|python3?|pytest|go|cargo|make|bash|sh|powershell|dotnet|java|mvn|gradle|vitest|tsc|eslint|ruff|git)\b[^\n]{0,120}/i;
const RESULT = /\b\d+\s*(?:pass(?:ing|ed)?|fail(?:ing|ed|ures?)?|error(?:s)?|test(?:s)?|assertions?|ok|green|red)\b/i;
const MEASURED_COMMAND = new RegExp(`(?:${COMMAND.source}[\\s\\S]{0,80}?${RESULT.source}|${RESULT.source}[\\s\\S]{0,80}?${COMMAND.source})`, "i");

// --- required sections ------------------------------------------------------
// A heading is not evidence. Each match must be followed by real body text, so
// a bare `## Not found` cannot satisfy the check.
const SECTION_BODY = 40;
const NEGATIVE_COVERAGE = [
  "what we did not find",
  "what we could not find",
  "what we did not establish",
  "what the literature does not settle",
  "negative coverage",
  "negative findings",
  "negative results",
  "evidence gaps?",
  "gaps? (?:and|,) (?:limits?|boundaries)",
  "sources? deliberately not used",
  "not found",
  "open questions",
  "caveats? and limitations",
  "limits? of the evidence",
  "boundaries of (?:this|the) study",
];
const IMPACT_VS_EVIDENCE = [
  "impact vs\\.? evidence",
  "impact\\s*/\\s*evidence",
  "impact-vs-evidence",
  "priority vs\\.? evidence",
  "recommendations? and evidence",
  "evidence behind each recommendation",
  "confidence and cost of being wrong",
];

function hasSectionWithBody(text, patterns) {
  const source = patterns.join("|");
  const heading = new RegExp(`^#{1,4}\\s*(?:${source})\\b[\\s\\S]*?$`, "im");
  const match = heading.exec(text);
  if (!match) return false;
  const after = text.slice(match.index + match[0].length);
  const nextHeading = /^#{1,4}\s+/m.exec(after);
  const body = (nextHeading ? after.slice(0, nextHeading.index) : after).replace(/[#*`_\-\s>]/g, "");
  return body.trim().length >= SECTION_BODY;
}

function isFinalDeliverable(filePath) {
  const name = basename(filePath);
  if (name.endsWith(".provenance.md")) return false;
  if (name.startsWith(".")) return false;
  if (/(?:draft|cited|plan|verifier|verification)/.test(name)) return false;
  // Positive evidence only. A provenance sidecar is not enough: every shaped
  // artifact in the outputs tree (FMEA tables, comparison matrices, ranked
  // evidence) has one too. The GOAL-CHECK and problem-anchor records are
  // produced only by the shared engineering-research method, so their presence
  // is what identifies a graded research deliverable. Absent that, the file is
  // not ours to judge.
  const stem = name.slice(0, -extname(name).length);
  const markers = [`${stem}-goal-check.json`, `${stem}-problem-anchor.json`];
  return markers.some((marker) => existsSync(join(dirname(filePath), marker)));
}

function checkFile(filePath) {
  const problems = [];
  const text = readFileSync(filePath, "utf-8");
  const filename = basename(filePath);
  const isVerifier = filename.includes("verifier") || filename.includes("verification");
  const isDraft = filename.includes("draft") || filename.includes("cited");
  const isPlan = filename.includes("plan");

  if (isVerifier && !text.includes("MACHINE_VERDICT:")) {
    problems.push(`${filename}: missing MACHINE_VERDICT line`);
  }

  if (isDraft && !/\[\d+\]/.test(text)) {
    problems.push(`${filename}: missing inline citations [1], [2]`);
  }

  if (isDraft && !text.includes("## Sources") && !text.includes("## sources")) {
    problems.push(`${filename}: missing Sources section`);
  }

  if (isVerifier && !text.includes("Evidence Trail") && !text.includes("evidence trail")) {
    problems.push(`${filename}: missing Evidence Trail table`);
  }

  if (isPlan && !text.includes("Key Questions") && !text.includes("key questions")) {
    problems.push(`${filename}: missing Key Questions section`);
  }

  if (isPlan && !text.includes("Evidence Needed") && !text.includes("evidence needed")) {
    problems.push(`${filename}: missing Evidence Needed section`);
  }

  if (isFinalDeliverable(filePath)) {
    if (!FILE_ANCHOR.test(text) && !MEASURED_COMMAND.test(text)) {
      problems.push(
        `${filename}: no artifact anchor — ground a claim in path:line or in a command and its result`,
      );
    }
    if (!hasSectionWithBody(text, NEGATIVE_COVERAGE)) {
      problems.push(`${filename}: no negative-coverage section with content (what was searched for and not found)`);
    }
    if (!hasSectionWithBody(text, IMPACT_VS_EVIDENCE)) {
      problems.push(`${filename}: no impact-vs-evidence section with content`);
    }
  }

  return problems;
}

function collectFiles(dir) {
  const files = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        // Hidden dirs (.plans, .drafts, .archive) are working/backup space,
        // not checked artifacts
        if (entry.name.startsWith(".")) continue;
        files.push(...collectFiles(fullPath));
      } else if (entry.isFile() && extname(entry.name) === ".md") {
        files.push(fullPath);
      }
    }
  } catch { /* dir doesn't exist */ }
  return files;
}

// Collect files
let files = [];
if (existsSync(target)) {
  files = statSync(target).isDirectory() ? collectFiles(target) : [target];
} else {
  console.log(`PASS: ${target} does not exist yet (no outputs to check)`);
  process.exit(0);
}

let totalProblems = 0;
const results = [];

for (const file of files) {
  const problems = checkFile(file);
  if (problems.length > 0) {
    results.push({ file: basename(file), problems });
    totalProblems += problems.length;
  }
}

// Output
if (totalProblems === 0) {
  console.log(`PASS: ${files.length} files checked, no drift detected`);
  console.log("  - All verifier outputs have MACHINE_VERDICT");
  console.log("  - All drafts have inline citations + Sources");
  console.log("  - All plans have Key Questions + Evidence Needed");
  console.log("  - All verifier outputs have Evidence Trail");
  console.log("  - Every final deliverable is anchored and records what it did not find");
  process.exit(0);
}

console.error(`DRIFT DETECTED: ${totalProblems} issue(s) across ${results.length} file(s):\n`);
for (const { file, problems } of results) {
  for (const p of problems) {
    console.error(`  ${p}`);
  }
}
process.exit(1);
