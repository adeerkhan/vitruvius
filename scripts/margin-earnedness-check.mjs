#!/usr/bin/env node
// margin-earnedness-check.mjs — enforce the margin-earnedness threshold as a
// deterministic integrity check rather than leaving it to verifier prose.
//
// `agents/verifier.md` and `skills/verifier/SKILL.md` both state:
//
//   "Margin/compliance language in the conclusion ("exceeds the minimum",
//    "provides margin", "safely above") must be quantified against the actual
//    numbers. Unqualified margin language with a margin under ~10% caps the
//    verdict at PARTIAL."
//
// On 2026-09-28 the checked-in run for architectural-synthesis_overreach-01
// identified the margin wording, computed it as 6.7% (< 10%), and still returned
// PASS — reasoning "I judge this compliant rather than material". The prose rule
// existed and was overridden in the same response that detected it.
//
// A rule a model can talk itself out of is not a gate. This check reads the
// result artifact and fails when the verdict contradicts a threshold the run
// itself computed. It cannot fix the model; it makes the override visible and
// non-shippable.
//
// Usage: node scripts/margin-earnedness-check.mjs <results-dir>
//        node scripts/margin-earnedness-check.mjs --json <results-dir>

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const RESULT_SUFFIX = "-result.md";
const MARGIN_PHRASES = [
  "exceeds the minimum",
  "exceeds the required",
  "provides margin",
  "safely above",
  "comfortably clears",
  "well above the minimum",
];

function isMarginLanguage(text) {
  return MARGIN_PHRASES.some((p) => text.includes(p));
}

function parseVerdict(text) {
  const m = text.match(/MACHINE_VERDICT:\s*(PASS|PARTIAL|BLOCKED)/);
  return m ? m[1] : null;
}

// A margin below this fraction triggers the cap. Kept in sync with the ~10%
// threshold documented in agents/verifier.md.
const MARGIN_CAP_PERCENT = 10;

function findSelfReportedMargin(text) {
  // The run stating its own sub-10% margin is the strongest evidence that the
  // threshold was engaged and then not applied.
  const patterns = [
    /margin[^.\n]{0,40}?([\d.]+)\s*%/i,
    /([\d.]+)\s*%[^.\n]{0,30}?margin/i,
    /margin[^.\n]{0,40}?of\s+([\d.]+)\s*%/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const value = Number.parseFloat(m[1]);
      if (Number.isFinite(value)) return value;
    }
  }
  return null;
}

export function checkResultFile(path) {
  let text;
  try {
    text = readFileSync(path, "utf-8");
  } catch {
    return [];
  }

  const verdict = parseVerdict(text);
  if (verdict !== "PASS") return [];

  const findings = [];
  const selfMargin = findSelfReportedMargin(text);

  if (!isMarginLanguage(text)) return findings;

  // Note there is deliberately no escape for "the run quantified the margin in
  // its own corrected conclusion". That is the run *repairing* the wording, not
  // evidence that the verified conclusion was qualified — and a repaired
  // conclusion with a sub-cap margin is precisely the case the cap exists for.
  // The gate is on the verdict, not on the prose around it.
  if (selfMargin !== null) {
    if (selfMargin < MARGIN_CAP_PERCENT) {
      findings.push(
        `${basename(path)}: PASS verdict with unqualified margin language; the run itself reports ` +
          `a ${selfMargin}% margin, under the ${MARGIN_CAP_PERCENT}% cap in agents/verifier.md, ` +
          "which requires PARTIAL",
      );
    }
    // A quantified margin at or above the cap is exactly what the rule asks for.
    return findings;
  }

  // Margin language with no number attached at all: the claim is unqualified,
  // which the cap treats the same as a sub-cap margin.
  findings.push(
    `${basename(path)}: PASS verdict with unqualified margin language and no quantified margin; ` +
      `agents/verifier.md caps this at PARTIAL`,
  );
  return findings;
}

export function checkResultsDir(resultsDir) {
  if (!existsSync(resultsDir)) {
    console.error(`Results directory not found: ${resultsDir}`);
    process.exit(1);
  }
  const findings = [];
  for (const name of readdirSync(resultsDir)) {
    if (!name.endsWith(RESULT_SUFFIX)) continue;
    findings.push(...checkResultFile(join(resultsDir, name)));
  }
  return findings;
}

function main(argv) {
  const asJson = argv.includes("--json");
  const positional = argv.filter((a) => !a.startsWith("--"));
  const dir = positional[0] ?? join(REPO_ROOT, "tasks", "benchmark", "results");
  const findings = checkResultsDir(dir);

  if (asJson) {
    console.log(JSON.stringify({ dir, violations: findings.length, findings }, null, 2));
  } else if (findings.length === 0) {
    console.log(`PASS: no margin-earnedness overrides in ${dir}`);
  } else {
    console.error(`FAIL: ${findings.length} margin-earnedness override(s):\n`);
    for (const f of findings) console.error(`  ${f}`);
    console.error(
      "\nA PASS verdict that names unqualified margin language while reporting a sub-10% margin " +
        "overrides agents/verifier.md. Fix the verdict or quantify the margin in the conclusion.",
    );
  }

  process.exit(findings.length > 0 ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith("margin-earnedness-check.mjs")) {
  main(process.argv.slice(2));
}
