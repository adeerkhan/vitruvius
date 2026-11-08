#!/usr/bin/env node
// e1-model-run.mjs — the E1 model-run record layer.
//
// A CASE is a blind dispatch prompt (evals/e1-cases.json); a RECORD is the
// evidence that it ran: the raw answer, its hash, the subagent session, and an
// expectation grade with written evidence. The manifest's model_run_recorded
// count is DERIVED from valid records here — the previous hand-recorded number
// could not be contradicted by anything, which is the failure this replaces.
//
// Usage:
//   node scripts/e1-model-run.mjs                     validate and report
//   node scripts/e1-model-run.mjs --json              machine-readable report
//   node scripts/e1-model-run.mjs --count             number of valid records
//   node scripts/e1-model-run.mjs --prompt <skill>    print the blind prompt
//   node scripts/e1-model-run.mjs --hash <skill>      print the prompt sha256

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CASES_PATH = join(REPO_ROOT, "evals", "e1-cases.json");
const RUNS_PATH = join(REPO_ROOT, "evals", "e1-runs", "manifest.json");

const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex");

function load(path, expectedSchema, label, problems) {
  if (!existsSync(path)) {
    problems.push(`${label}: missing`);
    return null;
  }
  let doc;
  try {
    doc = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    problems.push(`${label}: unreadable JSON`);
    return null;
  }
  if (doc?.schema !== expectedSchema) {
    problems.push(`${label}: wrong schema (expected ${expectedSchema})`);
    return null;
  }
  return doc;
}

function indexCases(doc, problems) {
  const cases = new Map();
  for (const c of doc?.cases ?? []) {
    if (typeof c?.skill !== "string" || !c.skill) {
      problems.push("evals/e1-cases.json: a case has no skill");
      continue;
    }
    if (cases.has(c.skill)) problems.push(`evals/e1-cases.json: duplicate case for ${c.skill}`);
    if (typeof c.prompt !== "string" || c.prompt.trim() === "") {
      problems.push(`case ${c.skill}: empty prompt`);
    }
    const ids = (c.expectations ?? []).map((e) => e?.id);
    if (ids.length < 2) problems.push(`case ${c.skill}: needs at least 2 expectations`);
    if (new Set(ids).size !== ids.length) problems.push(`case ${c.skill}: duplicate expectation ids`);
    for (const e of c.expectations ?? []) {
      if (typeof e?.statement !== "string" || e.statement.trim() === "") {
        problems.push(`case ${c.skill}: expectation ${e?.id ?? "?"} has no statement`);
      }
    }
    cases.set(c.skill, c);
  }
  if (cases.size === 0) problems.push("evals/e1-cases.json: no cases");
  return cases;
}

function validateRecord(run, cases, repoRoot) {
  const problems = [];
  const where = `run ${run?.skill ?? "?"}`;
  const c = cases.get(run?.skill);
  if (!c) return { problems: [`${where}: no case for skill`] };

  if (typeof run.prompt !== "string" || run.prompt !== c.prompt) {
    problems.push(`${where}: prompt differs from the case`);
  }
  if (run.prompt_sha256 !== sha256(c.prompt)) problems.push(`${where}: prompt_sha256 mismatch`);
  if (run.fresh !== true) problems.push(`${where}: a blind run must be fresh`);
  if (!/^ses_/.test(String(run.session_id ?? ""))) problems.push(`${where}: missing subagent session id`);
  if (typeof run.run_id !== "string" || run.run_id === "") problems.push(`${where}: missing run_id`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(run.date ?? ""))) problems.push(`${where}: missing date`);
  if (typeof run.agent !== "string" || run.agent === "") problems.push(`${where}: missing agent`);

  const out = run.output ?? {};
  if (typeof out.path !== "string" || out.path === "") {
    problems.push(`${where}: output.path missing`);
  } else {
    const abs = join(repoRoot, out.path);
    if (!existsSync(abs)) {
      problems.push(`${where}: output file missing: ${out.path}`);
    } else {
      const text = readFileSync(abs, "utf8");
      if (text.trim() === "") problems.push(`${where}: output is empty`);
      if (sha256(text) !== out.sha256) problems.push(`${where}: output sha256 mismatch`);
      if (Buffer.byteLength(text, "utf8") !== out.bytes) problems.push(`${where}: output bytes mismatch`);
    }
  }

  const grade = run.grade ?? {};
  if (!["PASS", "PARTIAL", "FAIL"].includes(grade.status)) {
    problems.push(`${where}: grade.status must be PASS, PARTIAL, or FAIL`);
  }
  const graded = grade.expectations ?? [];
  const expected = (c.expectations ?? []).map((e) => e.id);
  if (graded.length !== expected.length) {
    problems.push(`${where}: grades ${graded.length} expectation(s), case has ${expected.length}`);
  }
  const seen = new Set();
  for (const g of graded) {
    if (seen.has(g?.id)) problems.push(`${where}: duplicate graded id ${g?.id}`);
    seen.add(g?.id);
    const exp = (c.expectations ?? []).find((e) => e.id === g?.id);
    if (!exp) {
      problems.push(`${where}: grade for unknown expectation ${g?.id}`);
      continue;
    }
    if (g.statement !== exp.statement) problems.push(`${where}: expectation ${g.id} statement differs from the case`);
    if (typeof g.passed !== "boolean") problems.push(`${where}: expectation ${g.id} passed is not boolean`);
    if (typeof g.evidence !== "string" || g.evidence.trim() === "") {
      problems.push(`${where}: expectation ${g.id} has no evidence`);
    }
  }
  for (const id of expected) {
    if (!seen.has(id)) problems.push(`${where}: expectation ${id} is ungraded`);
  }

  const passed = graded.filter((g) => g.passed === true).length;
  if (grade.status === "PASS" && passed !== expected.length) {
    problems.push(`${where}: PASS with ${passed}/${expected.length} passed`);
  }
  if (grade.status === "FAIL" && passed !== 0) {
    problems.push(`${where}: FAIL with ${passed} passed`);
  }
  if (grade.status === "PARTIAL" && (passed === 0 || passed === expected.length)) {
    problems.push(`${where}: PARTIAL must be mixed (${passed}/${expected.length} passed)`);
  }

  return { problems };
}

/**
 * Validate a cases document and a runs document.
 * @returns {{problems: string[], records: string[], cases: number}}
 */
export function validate(casesDoc, runsDoc, repoRoot = REPO_ROOT) {
  const problems = [];
  const cases = indexCases(casesDoc, problems);

  let runs = [];
  if (!runsDoc) {
    problems.push("evals/e1-runs/manifest.json: missing");
  } else {
    runs = runsDoc.runs ?? [];
  }
  const seenSkills = new Set();
  const records = [];
  for (const run of runs) {
    if (seenSkills.has(run?.skill)) problems.push(`run ${run?.skill}: duplicate record for skill`);
    seenSkills.add(run?.skill);
    const check = validateRecord(run, cases, repoRoot);
    problems.push(...check.problems);
    if (check.problems.length === 0) records.push(run.skill);
  }

  return { problems, records, cases: cases.size };
}

function loadAll() {
  const bootstrap = [];
  const casesDoc = load(CASES_PATH, "vitruvius-e1-cases.v1", "evals/e1-cases.json", bootstrap);
  const runsDoc = load(RUNS_PATH, "vitruvius-e1-runs.v1", "evals/e1-runs/manifest.json", bootstrap);
  const result = validate(casesDoc, runsDoc);
  result.problems.unshift(...bootstrap);
  return result;
}

const invokedDirectly =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (!invokedDirectly) {
  // Imported by a test: exports only, no CLI side effects.
} else {
const argv = process.argv.slice(2);
if (argv.includes("--help")) {
  console.log("Usage: node scripts/e1-model-run.mjs [--json | --count | --prompt <skill> | --hash <skill>]");
  process.exit(0);
}

if (argv[0] === "--prompt" || argv[0] === "--hash") {
  const skill = argv[1];
  const result = loadAll();
  if (!skill) {
    console.error(`usage: ${argv[0]} <skill>`);
    process.exit(2);
  }
  const cases = JSON.parse(readFileSync(CASES_PATH, "utf8")).cases ?? [];
  const c = cases.find((entry) => entry.skill === skill);
  if (!c) {
    console.error(`no case for skill "${skill}"`);
    process.exit(2);
  }
  console.log(argv[0] === "--hash" ? sha256(c.prompt) : c.prompt);
  process.exit(0);
}

const result = loadAll();
if (argv.includes("--count")) {
  console.log(String(result.records.length));
  process.exit(0);
}

const report = {
  cases: result.cases,
  valid_records: result.records.length,
  recorded_skills: result.records.slice().sort(),
  problems: result.problems,
};

if (argv.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`E1 model-run records: ${report.valid_records}/${report.cases} skills`);
  if (report.recorded_skills.length) console.log(`  recorded: ${report.recorded_skills.join(", ")}`);
  if (result.problems.length > 0) {
    console.error(`\nFAIL: ${result.problems.length} problem(s):`);
    for (const p of result.problems) console.error(`  ${p}`);
  } else {
    console.log("PASS: every record matches its case prompt and its graded output byte-for-byte");
  }
}

if (result.problems.length > 0) process.exit(1);
}
