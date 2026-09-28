#!/usr/bin/env node
// result-provenance-audit.mjs — scan a draft for quantitative claims and
// verify they map to traceable sources.
// Stolen from Feynman's result provenance audit pattern.
//
// Usage:
//   node scripts/result-provenance-audit.mjs <draft.md>
//
// Output: JSON report with:
//   - quantitativeClaims: claims with numbers/percentages
//   - unsourcedClaims: claims without traceable sources
//   - summary: counts

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// Patterns that indicate a quantitative claim
const QUANT_PATTERNS = [
  /\b\d+(?:\.\d+)?%/,                    // percentages
  /\b\d+(?:\.\d+)?x\b/,                  // multipliers
  /\b\d+(?:\.\d+)?\s*(?:ms|s|ns|mb|kb|gb|tb|hz|khz|mhz|ghz)\b/i,  // units
  /\b\d{1,3}(?:,\d{3})+\b/,              // large numbers (10,000)
  /\b\d+\.\d+\b/,                        // decimals
  /\b(?:accuracy|precision|recall|f1|score|latency|throughput|speedup)\b/i,  // metrics
  /\b(?:benchmark|dataset|samples?|epochs?|iterations?|fold)\b/i,  // experimental setup
];

// Patterns that indicate a traceable source
const SOURCE_PATTERNS = [
  /\[(\d+)\]/,                           // citation [N]
  /https?:\/\/[^\s)]+/,                  // URL
  /`[^`]+\.(?:md|json|txt|csv|log)`/,    // artifact path
  /`[^`]+\.mjs`/,                        // script path
  /outputs\/[^\s`]+/,                    // outputs path
  /references\/[^\s`]+/,                 // references path
  /scripts\/[^\s`]+/,                    // scripts path
];

function extractQuantitativeClaims(text) {
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
    if (line.startsWith("#") || line.startsWith("```")) continue;

    for (const pattern of QUANT_PATTERNS) {
      if (pattern.test(line)) {
        claims.push({
          line: i + 1,
          text: line.trim().slice(0,150),
          pattern: pattern.source,
        });
      }
    }
  }

  return claims;
}

function hasTraceableSource(line) {
  return SOURCE_PATTERNS.some((pattern) => pattern.test(line));
}

function audit(draftPath) {
  const text = readFileSync(draftPath, "utf8");
  const claims = extractQuantitativeClaims(text);

  const sourced = [];
  const unsourced = [];

  for (const claim of claims) {
    if (hasTraceableSource(claim.text)) {
      sourced.push(claim);
    } else {
      unsourced.push(claim);
    }
  }

  return {
    quantitativeClaims: claims,
    sourcedClaims: sourced,
    unsourcedClaims: unsourced,
    summary: {
      total: claims.length,
      sourced: sourced.length,
      unsourced: unsourced.length,
    },
  };
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Usage: node scripts/result-provenance-audit.mjs <draft.md>");
  process.exit(1);
}

const report = audit(args[0]);
console.log(JSON.stringify(report, null, 2));

if (report.summary.unsourced > 0) {
  process.exit(1);
}
