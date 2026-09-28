#!/usr/bin/env node
// certify-report.mjs — render the majority-of-3 certification table.
//
// The point of this file is that the certification must be re-checkable. A
// majority table whose underlying runs are not shown is a claim; a table
// generated from committed run artifacts by a committed script is a measurement
// anyone can recompute.
//
// It reads ONLY:
//   - tasks/benchmark/cases/**      for ground truth (never from a result)
//   - tasks/benchmark/results-cert-r{1,2,3}/*-result.md  for the runs
// and writes nothing. Every number in the output is traceable to those files.
//
// Usage:
//   node tasks/benchmark/certify-report.mjs
//   node tasks/benchmark/certify-report.mjs --json            machine report
//   node tasks/benchmark/certify-report.mjs --out <file>      also write JSON
//   node tasks/benchmark/certify-report.mjs --prefix results-pressure \
//     --cases-dir tasks/benchmark/pressure                     pressure suite
//
// Exit is 0 whenever the table was produced, complete or not. Completeness is
// reported in the output and in `incomplete`, because a report that exits 1 for
// "the sweep is still running" cannot be read mid-sweep, which is when it is
// most useful. The sweep runner is what exits non-zero on incompleteness.

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const RESULT_SUFFIX = "-result.md";
const RUNS = [1, 2, 3];

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : d;
};

const CASES_DIR = join(REPO_ROOT, opt("cases-dir", "tasks/benchmark/cases"));
const PREFIX = opt("prefix", "results-cert");

function discoverCaseFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      for (const f of readdirSync(join(dir, e.name))) {
        if (f.endsWith(".md") && f !== "README.md") out.push({ name: f.replace(/\.md$/, ""), path: join(dir, e.name, f) });
      }
    } else if (e.name.endsWith(".md") && e.name !== "README.md") {
      out.push({ name: e.name.replace(/\.md$/, ""), path: join(dir, e.name) });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// Ground truth is read from the case, never inferred from a result.
function groundTruth(path) {
  const text = readFileSync(path, "utf8");
  const v = /\*\*Ground-truth verdict:\*\*\s*(\S+)/.exec(text);
  const f = /\*\*Flaw type:\*\*\s*(\S+)/.exec(text);
  return { verdict: v ? v[1] : null, flaw: f ? f[1] : null };
}

function readRun(r, name) {
  const p = join(REPO_ROOT, "tasks", "benchmark", `${PREFIX}-r${r}`, `${name}${RESULT_SUFFIX}`);
  if (!existsSync(p)) return null;
  const text = readFileSync(p, "utf8");
  const m = /MACHINE_VERDICT:\s*(\S+)\s*\|\s*FLAW:\s*(\S+)/.exec(text);
  if (!m) return { verdict: "(UNPARSEABLE)", flaw: null, file: relative(REPO_ROOT, p) };
  return { verdict: m[1], flaw: m[2], file: relative(REPO_ROOT, p) };
}

const cases = discoverCaseFiles(CASES_DIR);
const rows = [];

for (const c of cases) {
  const gt = groundTruth(c.path);
  const runs = RUNS.map((r) => readRun(r, c.name));
  const got = runs.filter(Boolean);
  if (got.length === 0) continue;

  const counts = {};
  for (const g of got) counts[g.verdict] = (counts[g.verdict] ?? 0) + 1;
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const majority = ranked[0][0];
  const topCount = ranked[0][1];

  // SPLIT is a distinct, recorded outcome. A 3-way split, or a 2-1 that the
  // 3rd run could break, is never silently resolved into the plurality.
  const threeWaySplit = got.length === RUNS.length && ranked.length === 3 && ranked.every(([, n]) => n === 1);
  const unanimous = got.length === RUNS.length && ranked.length === 1;
  const split = threeWaySplit;

  const flaws = got.map((g) => g.flaw);
  const flawCounts = {};
  for (const f of flaws) if (f) flawCounts[f] = (flawCounts[f] ?? 0) + 1;
  const flawUnanimous = Object.keys(flawCounts).length === 1 && got.every((g) => g.flaw);

  const verdictCorrect = majority === gt.verdict;
  // A wrong-direction error is materially worse than a conservative one, so the
  // classes are kept distinct rather than collapsed into "wrong".
  let classification;
  if (verdictCorrect) classification = "correct";
  else if (majority === "PASS") classification = "FALSE-APPROVAL";
  else if (majority === "BLOCKED" && gt.verdict === "PASS") classification = "FALSE-BLOCK";
  else if (majority === "PARTIAL" && gt.verdict === "BLOCKED") classification = "overcall";
  else classification = "wrong";

  rows.push({
    case: c.name,
    runs: got.length,
    verdicts: got.map((g) => g.verdict),
    flaws,
    majority,
    majorityCount: `${topCount}/${got.length}`,
    unanimous,
    split,
    expected: gt.verdict,
    expectedFlaw: gt.flaw,
    classification,
    verdictCorrect,
    flawUnanimous,
    flawMatches: flaws.filter((f) => f === gt.flaw).length,
    sources: got.map((g) => g.file),
  });
}

const complete = rows.filter((r) => r.runs === RUNS.length);
const incomplete = rows.filter((r) => r.runs < RUNS.length);
const missing = cases.filter((c) => !rows.some((r) => r.case === c.name)).map((c) => c.name);

const totals = {
  cases: cases.length,
  certified: complete.length,
  correct: complete.filter((r) => r.verdictCorrect).length,
  falseApprovals: complete.filter((r) => r.classification === "FALSE APPROVAL").length,
  falseBlocks: complete.filter((r) => r.classification === "FALSE BLOCK").length,
  conservativeOvercalls: complete.filter((r) => r.classification === "conservative overcall").length,
  splits: complete.filter((r) => r.split).length,
  verdictUnanimous: complete.filter((r) => r.unanimous).length,
  flawUnanimous: complete.filter((r) => r.flawUnanimous).length,
  flawExactAll: complete.filter((r) => r.flawMatches === RUNS.length).length,
  flawExactAny: complete.filter((r) => r.flawMatches > 0).length,
};

const result = { prefix: PREFIX, casesDir: relative(REPO_ROOT, CASES_DIR), totals, rows, incomplete: incomplete.map((r) => ({ case: r.case, runs: r.runs })), missing };

const outPath = opt("out", null);
if (outPath) {
  writeFileSync(outPath, JSON.stringify(result, null, 2), "utf8");
}

if (flag("json")) {
  console.log(JSON.stringify(result, null, 2));
} else {
  const label = PREFIX === "results-cert" ? "ADVERSARIAL" : "PRESSURE";
  console.log(`=== ${label} CERTIFICATION — majority of ${RUNS.length} ===`);
  console.log(`source: ${result.casesDir}  runs: ${PREFIX}-r{1,2,3}\n`);
  console.log("case".padEnd(44) + "runs  majority   n/3  expected  verdict        flaw-types");
  console.log("-".repeat(132));
  for (const r of rows) {
    const mark = r.split ? "  SPLIT" : r.unanimous ? "" : "     *";
    console.log(
      r.case.padEnd(44) +
        String(r.runs).padEnd(6) +
        r.majority.padEnd(11) +
        r.majorityCount.padEnd(6) +
        String(r.expected).padEnd(10) +
        r.classification.padEnd(14) +
        `${r.flaws.join(" / ")}${r.flawUnanimous ? "" : "   <- FLAW VARIES"}${mark}`,
    );
  }
  console.log(`\nverdict: correct | FALSE-APPROVAL | FALSE-BLOCK | overcall (PARTIAL where BLOCKED expected) | wrong`);

  if (complete.length > 0) {
    console.log(`\n=== CERTIFIED TOTALS (${complete.length}/${cases.length} cases) ===\n`);
    console.log(`  correct verdicts       ${totals.correct}/${complete.length}`);
    console.log(`  false approvals        ${totals.falseApprovals}`);
    console.log(`  false blocks           ${totals.falseBlocks}`);
    console.log(`  conservative overcalls ${totals.conservativeOvercalls}`);
    console.log(`  3-way splits           ${totals.splits}`);
    console.log(`\n  verdict unanimous      ${totals.verdictUnanimous}/${complete.length}`);
    console.log(`  flaw-type unanimous    ${totals.flawUnanimous}/${complete.length}`);
    console.log(`  flaw-type exact 3/3    ${totals.flawExactAll}/${complete.length}`);
    console.log(`  flaw-type exact >=1    ${totals.flawExactAny}/${complete.length}`);
  }
  if (incomplete.length > 0) {
    console.log(`\n=== INCOMPLETE (${incomplete.length}) ===`);
    for (const r of incomplete) console.log(`  ${r.case}: ${r.runs}/${RUNS.length} runs`);
  }
  if (missing.length > 0) {
    console.log(`\n=== NOT STARTED (${missing.length}) ===`);
    console.log(`  ${missing.join(", ")}`);
  }
  console.log(`\nA "*" in the margin column marks a non-unanimous majority that is not a 3-way split.`);
}

process.exit(0);
