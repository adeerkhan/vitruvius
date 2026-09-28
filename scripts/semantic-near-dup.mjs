#!/usr/bin/env node
// semantic-near-dup.mjs — propose semantic near-duplicate merges for an
// evidence ledger. Advisory-only: proposes merges, never deletes evidence.
//
// Usage:
//   node scripts/semantic-near-dup.mjs <evidence-ledger.json>
//
// Output: JSON array of proposed merges, each with:
//   - sources: [id1, id2]
//   - reason: string
//   - confidence: "high" | "medium" | "low"

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// Type-normalizer: canonicalize equivalent labels to a single type.
// Stolen from BugTraceAI-CLI's dedup type-normalizer pattern.
const TYPE_NORMALIZER = {
  // RCE family
  "remote code execution": "rce",
  "rce": "rce",
  "command injection": "rce",
  "cmd injection": "rce",
  "os command injection": "rce",
  // SQLi family
  "sql injection": "sqli",
  "sqli": "sqli",
  "sql": "sqli",
  // XSS family
  "cross-site scripting": "xss",
  "xss": "xss",
  // CSRF family
  "cross-site request forgery": "csrf",
  "csrf": "csrf",
  // IDOR family
  "insecure direct object reference": "idor",
  "idor": "idor",
  // SSRF family
  "server-side request forgery": "ssrf",
  "ssrf": "ssrf",
  // XXE family
  "xml external entity": "xxe",
  "xxe": "xxe",
  // Path traversal family
  "path traversal": "path-traversal",
  "directory traversal": "path-traversal",
  "lfi": "path-traversal",
  "local file inclusion": "path-traversal",
};

function normalizeType(type) {
  const key = type.toLowerCase().trim();
  return TYPE_NORMALIZER[key] || key;
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function extractDoi(text) {
  const match = text.match(/(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);
  return match ? match[1].toLowerCase() : null;
}

function extractArxivId(text) {
  const match = text.match(/arxiv:(\d{4}\.\d{4,5})/i);
  return match ? match[1] : null;
}

function proposeMerges(ledger) {
  const proposals = [];
  const sources = ledger.sources || [];

  for (let i = 0; i < sources.length; i++) {
    for (let j = i + 1; j < sources.length; j++) {
      const a = sources[i];
      const b = sources[j];

      // Skip if already merged
      if (a.merged_into || b.merged_into) continue;

      // Check DOI match (high confidence)
      const doiA = extractDoi(a.locator || "");
      const doiB = extractDoi(b.locator || "");
      if (doiA && doiB && doiA === doiB) {
        proposals.push({
          sources: [a.id, b.id],
          reason: `Same DOI: ${doiA}`,
          confidence: "high",
        });
        continue;
      }

      // Check arXiv ID match (high confidence)
      const arxivA = extractArxivId(a.locator || "");
      const arxivB = extractArxivId(b.locator || "");
      if (arxivA && arxivB && arxivA === arxivB) {
        proposals.push({
          sources: [a.id, b.id],
          reason: `Same arXiv ID: ${arxivA}`,
          confidence: "high",
        });
        continue;
      }

      // Check title match (medium confidence)
      const titleA = normalizeTitle(a.title || "");
      const titleB = normalizeTitle(b.title || "");
      if (titleA && titleB && titleA === titleB) {
        proposals.push({
          sources: [a.id, b.id],
          reason: `Same title: "${a.title}"`,
          confidence: "medium",
        });
        continue;
      }

      // Check type + locator match (medium confidence)
      const typeA = normalizeType(a.type || "");
      const typeB = normalizeType(b.type || "");
      if (typeA === typeB && a.locator === b.locator && a.locator) {
        proposals.push({
          sources: [a.id, b.id],
          reason: `Same type (${typeA}) and locator: ${a.locator}`,
          confidence: "medium",
        });
        continue;
      }
    }
  }

  return proposals;
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Usage: node scripts/semantic-near-dup.mjs <evidence-ledger.json>");
  process.exit(1);
}

const ledgerPath = args[0];
const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
const proposals = proposeMerges(ledger);

console.log(JSON.stringify(proposals, null, 2));
console.log(`\n${proposals.length} merge proposal(s) found`);
