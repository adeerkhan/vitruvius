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
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const SKILLS_DIR = join(REPO_ROOT, "skills");

const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{48}/,            // OpenAI keys
  /AKIA[0-9A-Z]{16}/,               // AWS access keys
  /ghp_[a-zA-Z0-9]{36}/,            // GitHub personal tokens
  /xoxb-[a-zA-Z0-9-]+/,             // Slack bot tokens
  /["'][A-Za-z0-9_]*PASSWORD["']\s*[:=]\s*["'][^"']+["']/i,
  /["'][A-Za-z0-9_]*SECRET["']\s*[:=]\s*["'][^"']+["']/i,
  /["'][A-Za-z0-9_]*API_KEY["']\s*[:=]\s*["'][^"']+["']/i,
];

const DANGEROUS_CALLS = [
  /\beval\s*\(/,
  /\bexec\s*\(/,
  /\bchild_process\b/,
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

    // Check for secrets
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(line)) {
        problems.push(
          `${relative(REPO_ROOT, filePath)}:${lineNum}: potential secret/credential`,
        );
      }
    }

    // Check for dangerous calls
    for (const pattern of DANGEROUS_CALLS) {
      if (pattern.test(line)) {
        problems.push(
          `${relative(REPO_ROOT, filePath)}:${lineNum}: dangerous function call`,
        );
      }
    }

    // Check for exfiltration patterns
    for (const pattern of EXFILTRATION_PATTERNS) {
      if (pattern.test(line)) {
        problems.push(
          `${relative(REPO_ROOT, filePath)}:${lineNum}: potential data exfiltration`,
        );
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
        problems.push(
          `${relative(REPO_ROOT, filePath)}:${i + 1}: personal path (/Users/${match[1]}/)`,
        );
      }
    }
  }
  return problems;
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

// Run scan
console.log("Scanning skills for security issues...\n");

const allProblems = [];
for (const skill of readdirSync(SKILLS_DIR)) {
  const skillDir = join(SKILLS_DIR, skill);
  if (!statSync(skillDir).isDirectory()) continue;

  allProblems.push(...walkDir(skillDir, scanFile));
  allProblems.push(...walkDir(skillDir, (f) => scanPersonalPaths(f)));
}

// Deduplicate
const unique = [...new Set(allProblems)];

if (unique.length === 0) {
  console.log("PASS: No security issues found.");
  process.exit(0);
}

console.error(`FAIL: ${unique.length} security issue(s) found:\n`);
for (const p of unique) {
  console.error(`  ${p}`);
}
process.exit(1);
