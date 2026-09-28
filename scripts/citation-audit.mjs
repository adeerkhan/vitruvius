#!/usr/bin/env node
// citation-audit.mjs — scan a draft for citation completeness.
// Stolen from Feynman's verifier citation rules.
//
// Usage:
//   node scripts/citation-audit.mjs <draft.md>
//
// Output: JSON report with:
//   - orphanCitations: citations in body but not in Sources
//   - orphanSources: sources in Sources but not cited in body
//   - unsourcedClaims: factual claims without citations
//   - summary: counts

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function extractCitations(text) {
  // Match [N] or [N, M] or [N-M] patterns
  const citations = new Set();
  const regex = /\[(\d+(?:\s*[,–-]\s*\d+)*)\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const parts = match[1].split(/[,–-]/).map((s) => parseInt(s.trim(), 10));
    for (const n of parts) {
      if (!isNaN(n)) citations.add(n);
    }
  }
  return citations;
}

function extractSources(text) {
  // Match numbered source entries: "1. ..." or "1) ..." at line start
  const sources = new Set();
  const lines = text.split("\n");
  let inSources = false;
  for (const line of lines) {
    if (/^#+\s*Sources?\s*$/i.test(line)) {
      inSources = true;
      continue;
    }
    if (inSources) {
      const match = line.match(/^\d+[.)]\s+/);
      if (match) {
        const num = parseInt(line.match(/^(\d+)/)[1], 10);
        sources.add(num);
      }
    }
  }
  return sources;
}

function extractUnsourcedClaims(text) {
  // Find sentences that look like factual claims but lack citations
  // Heuristic: sentences with numbers, proper nouns, or "is/are/was/were"
  // that don't end with a citation
  const claims = [];
  const lines = text.split("\n");
  let inSources = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^#+\s*Sources?\s*$/i.test(line)) {
      inSources = true;
      continue;
    }
    if (inSources) continue;
    if (line.startsWith("#") || line.startsWith("```") || line.startsWith("-")) continue;

    // Skip lines that already have citations
    if (/\[\d+\]/.test(line)) continue;

    // Skip headings and list items
    if (line.trim().length < 20) continue;

    // Look for factual claim patterns
    const hasNumber = /\d+%|\d+\.\d+|\d+x|\d+,\d+/.test(line);
    const hasProperNoun = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/.test(line);
    const hasFactualVerb = /\b(is|are|was|were|has|have|had|achieves?|shows?|demonstrates?|proves?)\b/i.test(line);

    if ((hasNumber && hasFactualVerb) || (hasProperNoun && hasFactualVerb)) {
      claims.push({
        line: i + 1,
        text: line.trim().slice(0, 120),
      });
    }
  }

  return claims;
}

function audit(draftPath) {
  const text = readFileSync(draftPath, "utf8");

  const bodyText = text.split(/^#+\s*Sources?\s*$/i)[0] || text;
  const citations = extractCitations(bodyText);
  const sources = extractSources(text);
  const unsourcedClaims = extractUnsourcedClaims(bodyText);

  const orphanCitations = [...citations].filter((n) => !sources.has(n));
  const orphanSources = [...sources].filter((n) => !citations.has(n));

  return {
    orphanCitations,
    orphanSources,
    unsourcedClaims,
    summary: {
      citations: citations.size,
      sources: sources.size,
      orphanCitations: orphanCitations.length,
      orphanSources: orphanSources.length,
      unsourcedClaims: unsourcedClaims.length,
    },
  };
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Usage: node scripts/citation-audit.mjs <draft.md>");
  process.exit(1);
}

const report = audit(args[0]);
console.log(JSON.stringify(report, null, 2));

if (report.summary.orphanCitations > 0 || report.summary.orphanSources > 0) {
  process.exit(1);
}
