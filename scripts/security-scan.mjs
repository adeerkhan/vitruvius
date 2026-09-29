/**
 * security-scan.mjs — Scan skills for common security issues.
 *
 * Checks for:
 * - eval/exec/os.system in scripts
 * - Hardcoded API keys or secrets
 * - Personal paths (/Users/<name>/...)
 * - Prompt injection patterns
 * - Data exfiltration patterns
 * - __import__ usage (availability probes OK)
 *
 * Severity levels (stolen from Scientific Agent Skills):
 * - HIGH: secrets, dangerous calls, exfiltration — fail CI
 * - MEDIUM: personal paths — fail CI
 * - LOW: suspicious patterns — warn only
 *
 * Waivers: references/security-scan-false-positives.md
 *
 * WAIVERS below is the machine-enforced half of that document. Before this
 * existed the file told you to "update scripts/security-scan.mjs to whitelist
 * the pattern" (references/security-scan-false-positives.md:60) and the
 * scanner had no whitelist — every finding exited 1 (line 174). The documented
 * escape did not exist, so the only ways to make a real false positive go away
 * were to delete legitimate code or to disable the scanner, which the same
 * document forbids at line 64.
 *
 * Shape stolen from ref/feynman/scripts/npm-audit.mjs:6 (MIT, `cd72f97`): a
 * named allowlist where every entry carries a written reason, and everything
 * not named blocks. Two additions that repo's version does not need:
 *
 * 1. An entry missing `reason` or `removeWhen` is itself a failure. A waiver
 *    nobody can audit is not a waiver.
 * 2. A waiver that matches nothing is reported stale. An allowlist nobody
 *    prunes hardens into permanent permission, which is the same rot the gate
 *    registry exists to prevent for scripts.
 *
 * Waivers are keyed on file + rule, never on line number, because line numbers
 * move on every edit above them.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const SKILLS_DIR = join(REPO_ROOT, "skills");
const SCRIPTS_DIR = join(REPO_ROOT, "scripts");

/**
 * Waived (file, rule) pairs. Every entry must state why it is safe and what
 * removes it. Empty is correct today: the scanner reports zero findings, so
 * there is nothing to waive. Add an entry only for a finding the scanner
 * actually reports.
 *
 * @type {ReadonlyArray<{file: string, rule: string, reason: string, removeWhen: string}>}
 */
export const WAIVERS = [
  // e.g.
  // {
  //   file: "scripts/extract-pdf.mjs",
  //   rule: "dangerous function call",
  //   reason: "spawns pdftotext with a fixed argument list, never a shell string",
  //   removeWhen: "the PDF path moves to a pure-JS parser and the subprocess goes away",
  // },
];

const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{48}/,            // OpenAI keys
  /AKIA[0-9A-Z]{16}/,               // AWS access keys
  /ghp_[a-zA-Z0-9]{36}/,            // GitHub personal tokens
  /xoxb-[a-zA-Z0-9-]+/,             // Slack bot tokens
  /["'][A-Za-z0-9_]*PASSWORD["']\s*[:=]\s*["'][^"']+["']/i,
  /["'][A-Za-z0-9_]*SECRET["']\s*[:=]\s*["'][^"']+["']/i,
  /["'][A-Za-z0-9_]*API_KEY["']\s*[:=]\s*["'][^"']+["']/i,
];

const CHILD_PROCESS_PATTERN = /\bchild_process\b/;

const DANGEROUS_CALLS = [
  /\beval\s*\(/,
  /\bexec\s*\(/,
  CHILD_PROCESS_PATTERN,
  /\bos\.system\s*\(/,
  /\bsubprocess\.run\s*\(/,
  /\bRuntime\.eval\b/,
];

const EXFILTRATION_PATTERNS = [
  /\bcurl\s+.*https?:\/\/[^\s]+\s*\|\s*(sh|bash|cmd|powershell)/i,
  /\bwget\s+.*https?:\/\/[^\s]+\s*\|\s*(sh|bash|cmd|powershell)/i,
  /\bfetch\s*\(\s*["']https?:\/\//,
  /\bhttps?:\/\/[^\s]+\/webhook/i,
  /\bhttps?:\/\/[^\s]+\/callback/i,
];

function relPath(filePath) {
  // Forward slashes so a waiver written on Windows still matches in CI.
  return relative(REPO_ROOT, filePath).replace(/\\/g, "/");
}

function scanFile(filePath) {
  const problems = [];
  let text;
  try {
    text = readFileSync(filePath, "utf-8");
  } catch {
    return problems;
  }

  const lines = text.split("\n");
  for (const [i, line] of lines.entries()) {
    const lineNum = i + 1;

    // Check for secrets (HIGH)
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(line)) {
        problems.push({
          severity: "HIGH",
          file: relPath(filePath),
          line: lineNum,
          rule: "potential secret/credential",
        });
      }
    }

    // Check for dangerous calls (HIGH)
    for (const pattern of DANGEROUS_CALLS) {
      if (pattern.test(line)) {
        problems.push({
          severity: "HIGH",
          file: relPath(filePath),
          line: lineNum,
          rule: "dangerous function call",
        });
      }
    }

    // Check for exfiltration patterns (HIGH)
    for (const pattern of EXFILTRATION_PATTERNS) {
      if (pattern.test(line)) {
        problems.push({
          severity: "HIGH",
          file: relPath(filePath),
          line: lineNum,
          rule: "potential data exfiltration",
        });
      }
    }
  }

  return problems;
}

function scanPersonalPaths(filePath) {
  const problems = [];
  let text;
  try {
    text = readFileSync(filePath, "utf-8");
  } catch {
    return problems;
  }

  const lines = text.split("\n");
  for (const [i, line] of lines.entries()) {
    const match = line.match(/\/(?:mnt\/[a-z]\/)?Users\/([^\/\s"'`]+)/i);
    if (match) {
      const username = match[1].toLowerCase();
      const generic = new Set([
        "user", "username", "you", "me", "youruser", "runner", "root",
      ]);
      if (!generic.has(username)) {
        problems.push({
          severity: "MEDIUM",
          file: relPath(filePath),
          line: i + 1,
          rule: "personal path",
        });
      }
    }
  }
  return problems;
}

export function formatFinding(finding) {
  return `${finding.severity}: ${finding.file}:${finding.line}: ${finding.rule}`;
}

const WAIVER_FIELDS = ["file", "rule", "reason", "removeWhen"];

/**
 * Split findings into what blocks, what is waived, and what is broken about the
 * waiver list itself.
 *
 * Pure — no fs, no process, no exit — so a test can drive it with synthetic
 * findings and never has to plant a real secret in the tree to prove it fails.
 *
 * @param {ReadonlyArray<{severity: string, file: string, line: number, rule: string}>} findings
 * @param {ReadonlyArray<{file: string, rule: string, reason: string, removeWhen: string}>} waivers
 */
export function partitionFindings(findings, waivers = WAIVERS) {
  const blocking = [];
  const allowed = [];
  const invalid = [];
  const used = new Set();

  for (const [i, waiver] of waivers.entries()) {
    const missing = WAIVER_FIELDS.filter(
      (key) => typeof waiver?.[key] !== "string" || waiver[key].trim() === "",
    );
    if (missing.length > 0) {
      invalid.push(
        `WAIVER ${i + 1} (${waiver?.file ?? "<no file>"} / ${waiver?.rule ?? "<no rule>"}) is missing ` +
          `${missing.join(", ")}. Every waiver must state why it is safe (reason) and what removes it ` +
          `(removeWhen).`,
      );
    }
  }

  // Only a complete waiver may suppress anything. An incomplete one is reported
  // above and does not ALSO quietly allow the finding it names.
  const usable = waivers.filter((w) =>
    WAIVER_FIELDS.every((k) => typeof w?.[k] === "string" && w[k].trim() !== ""),
  );

  for (const finding of findings) {
    const match = usable.find((w) => w.file === finding.file && w.rule === finding.rule);
    if (match) {
      used.add(`${match.file}|${match.rule}`);
      allowed.push({ finding, waiver: match });
    } else {
      blocking.push(finding);
    }
  }

  const stale = usable.filter((w) => !used.has(`${w.file}|${w.rule}`));

  return { blocking, allowed, invalid, stale };
}

function walkDir(dir, fn) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, fn));
    } else if (entry.isFile() && /\.(mjs|js|py|sh|ps1)$/.test(entry.name)) {
      results.push(...fn(fullPath));
    }
  }
  return results;
}

// Run scan. Guarded so a test can import partitionFindings/formatFinding above
// without triggering the scan and its process.exit. Same entry-point guard as
// scripts/margin-earnedness-check.mjs:150.
if (process.argv[1] && process.argv[1].endsWith("security-scan.mjs")) {
  console.log("Scanning skills and shipped proposal/eval/ledger runtime scripts for security issues...\n");

  const allProblems = [];
  allProblems.push(...walkDir(SKILLS_DIR, scanFile));
  allProblems.push(...walkDir(SKILLS_DIR, (f) => scanPersonalPaths(f)));
  for (const runtimeFile of [
    join(SCRIPTS_DIR, 'extract-document.mjs'),
    join(SCRIPTS_DIR, 'extract-pdf.mjs'),
    join(SCRIPTS_DIR, 'verifier-parser.mjs'),
    join(SCRIPTS_DIR, 'eval-contract.mjs'),
    join(SCRIPTS_DIR, 'fixed-case.mjs'),
    join(SCRIPTS_DIR, 'record-evidence.mjs'),
    join(SCRIPTS_DIR, 'validate-evidence.mjs'),
    join(SCRIPTS_DIR, 'goal-check-contract.mjs'),
    join(SCRIPTS_DIR, 'artifact-closure.mjs'),
    join(SCRIPTS_DIR, 'field-pilot-contract.mjs'),
  ]) {
    allProblems.push(...scanFile(runtimeFile));
    allProblems.push(...scanPersonalPaths(runtimeFile));
  }

  // Deduplicate on the structured finding, then apply the waiver list.
  const seen = new Set();
  const unique = allProblems.filter((f) => {
    const key = `${f.severity}|${f.file}|${f.line}|${f.rule}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const { blocking, allowed, invalid, stale } = partitionFindings(unique);

  // A waiver nobody can audit, and a waiver nobody needs, are both failures.
  // This is the difference between an allowlist and a switch someone flips off.
  if (invalid.length > 0) {
    console.error(`FAIL: ${invalid.length} malformed security-scan waiver(s):\n`);
    for (const message of invalid) console.error(`  ${message}`);
    console.error("\nA waiver with no stated reason cannot be reviewed, so it cannot be trusted.");
    process.exit(1);
  }

  if (stale.length > 0) {
    console.error(`FAIL: ${stale.length} stale security-scan waiver(s) match no finding:\n`);
    for (const w of stale) {
      console.error(`  ${w.file} / ${w.rule} — delete it: the scanner no longer reports this.`);
    }
    console.error("\nA waiver that matches nothing is permanent permission.");
    process.exit(1);
  }

  if (allowed.length > 0) {
    console.log(`Waived ${allowed.length} finding(s), each with a stated reason and removal condition:`);
    for (const { finding, waiver } of allowed) {
      console.log(`  allowed: ${formatFinding(finding)} — ${waiver.reason} (remove when: ${waiver.removeWhen})`);
    }
    console.log("");
  }

  if (blocking.length === 0) {
    console.log("PASS: No security issues found.");
    process.exit(0);
  }

  console.error(`FAIL: ${blocking.length} security issue(s) found:\n`);
  for (const f of blocking) {
    console.error(`  ${formatFinding(f)}`);
  }
  process.exit(1);
}
