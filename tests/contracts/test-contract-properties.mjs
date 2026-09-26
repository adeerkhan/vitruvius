/**
 * Contract properties: an entailment proxy and metamorphic invariants.
 *
 * Two jobs.
 *
 * 1. G1 — pin the behaviour of the high-precision entailment proxy, including
 *    the three cases it deliberately does NOT catch, so it cannot be quietly
 *    over-claimed later.
 * 2. G3 — properties that must hold for every contract, independent of any
 *    particular case. The bug class this guards against has already shipped
 *    twice green: a citation to `:13` satisfying an anchor at `:1`, and a
 *    junction escaping the anchor root. Both were outcome tests. These are
 *    invariants.
 *
 * Fixtures mirror the shapes proven in tests/agents/test-goal-check.mjs and
 * tests/evals/test-field-pilot.mjs rather than re-guessing them.
 */
import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import { unsupportedTokens } from "../../scripts/entailment.mjs";
import { validateProblemAnchor } from "../../scripts/problem-anchor-contract.mjs";
import { validateGoalCheck } from "../../scripts/goal-check-contract.mjs";
import { validateFieldPilot } from "../../scripts/field-pilot-contract.mjs";
import { validateArtifactClosure } from "../../scripts/artifact-closure.mjs";

const repoRoot = join(fileURLToPath(new URL("../..", import.meta.url)));
void repoRoot;

const root = mkdtempSync(join(tmpdir(), "vitruvius-contract-props-"));
let failures = 0;
let passes = 0;

function check(label, condition, detail) {
  if (condition) {
    passes++;
    console.log(`  PASS  ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ""}`);
  }
}

function write(rel, text) {
  const p = join(root, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, text);
  return p;
}
const digest = (text) => createHash("sha256").update(text).digest("hex");
const bytesOf = (rel) => readFileSync(join(root, rel));

// ===========================================================================
// Part 1 — the entailment proxy
// ===========================================================================

console.log("\nEntailment proxy");

// Lines lifted from LDA Apartment Typology Booklet Sec 1.2.7, the case
// SOLVER-RESEARCH.md:161 turns on: corridors 1,050 mm, entrance halls 1,200 mm.
const LDA = " * internal corridors minimum 1,050 mm; entrance halls minimum 1,200 mm";
const CORE = "const CORE_MIN_H = 5;";
const ROOM = "bedroom: { minWidth: 2.7, minDepth: 3.0, maxAspectRatio: 2.0 },";

const entailCases = [
  ["The corridor width is 1050 mm", LDA, false, "exact match, comma-insensitive"],
  ["The entrance hall is 1,200 mm wide", LDA, false, "comma form"],
  ["The entrance hall is 1.2 m wide", LDA, false, "unit conversion: 1.2 m == 1200 mm"],
  ["The corridor is 1.05 m", LDA, false, "unit conversion: 1.05 m == 1050 mm"],
  ["The entrance hall is 900 mm", LDA, true, "value absent from the line"],
  ["The corridor is 1,050 mm and the hall 1,200 mm", LDA, false, "two measures, both present"],
  ["Requires `CORE_MIN_H`", CORE, false, "quoted identifier present"],
  ["Requires `SOME_OTHER`", CORE, true, "identifier absent"],
  ["The bedroom minDepth is 3.0", ROOM, false, "identifier and unitless value present"],
  ["Minimum bedroom dimension is 3.4 m", ROOM, true, "3.4 m == 3400 mm, absent from a unitless line"],
  ["Rooms are rectangular", ROOM, false, "no high-precision token, nothing to check"],
];

for (const [claim, line, expectUnsupported, why] of entailCases) {
  const unsupported = unsupportedTokens(claim, line);
  check(
    `${expectUnsupported ? "reject" : "accept"}  ${claim}`,
    unsupported.length > 0 === expectUnsupported,
    `expected ${expectUnsupported ? "rejection" : "acceptance"}; got ${JSON.stringify(unsupported)} (${why})`,
  );
}

console.log("\nEntailment proxy — the three documented limits");

check(
  "limit 1: presence, not attribution — a figure on the line satisfies the claim even when the claim names the wrong subject",
  unsupportedTokens("The entrance hall is 1.05 m", LDA).length === 0,
  "the proxy cannot tell which noun a figure belongs to; that stays with the verifier",
);
check(
  "limit 2: a unitless line value cannot satisfy a unit-bearing claim",
  unsupportedTokens("The depth is 3.0 m", ROOM).length === 1,
  "fail-closed direction: supplying the unit yourself makes the claim `partial`, not `verified`",
);
check(
  "limit 3: a negative claim is not checkable at all",
  unsupportedTokens("No universal geometric slack factor exists", LDA).length === 0,
  "the proxy reads tokens, not meaning; negative claims stay with the verifier",
);

// ===========================================================================
// Part 2 — fixtures
// ===========================================================================

const RUN = "Opened final artifact and checked A1 and A2";
const QUESTION = "Answer A1 and A2.";

// --- problem-anchor --------------------------------------------------------
const SRC = "src/solver.ts";
const SRC_TEXT =
  "// internal corridors minimum 1050 mm; entrance halls minimum 1200 mm\n" +
  "// minimum core height 5 m\n" +
  "const CORE_MIN_H = 5;\n";
write(SRC, SRC_TEXT);

const PRODUCT_FINDING = {
  id: "F3",
  decision_id: "D2",
  claim: "the room ceiling is product policy",
  type: "product",
  changes: "product-decision",
  status: "inferred",
};

const DEFAULT_CANDIDATE =
  "# Anchor\n\n" +
  "F1 the corridor minimum is 1050 mm (`src/solver.ts:1`).\n" +
  "F2 the core minimum height is 5 m (`src/solver.ts:2`).\n" +
  "F3 the room ceiling is product policy.\n" +
  "N1 searched for a slack factor; not found.\n";

function problemAnchor(overrides = {}) {
  const candidate = overrides.candidate ?? DEFAULT_CANDIDATE;
  write("pa/candidate.md", candidate);
  return {
    schema: "vitruvius-problem-anchor.v1",
    question: "Which corridor minimum applies?",
    commit: "1acba4d",
    anchor_root: root,
    artifacts: [{ id: "A1", path: SRC, sha256: digest(SRC_TEXT), bytes: SRC_TEXT.length }],
    decisions: [
      { id: "D1", text: "Which minimum applies" },
      { id: "D2", text: "Whether the ceiling changes" },
    ],
    findings: [
      {
        id: "F1",
        decision_id: "D1",
        claim: "the corridor minimum is 1050 mm",
        type: "repo",
        anchor: { path: SRC, line: 1 },
        artifact_id: "A1",
        changes: "measure",
        status: "verified",
      },
      {
        id: "F2",
        decision_id: "D1",
        claim: "the core minimum height is 5 m",
        type: "repo",
        anchor: { path: SRC, line: 2 },
        artifact_id: "A1",
        changes: "defer",
        status: "verified",
      },
      {
        id: "F3",
        decision_id: "D2",
        claim: "the room ceiling is product policy",
        type: "product",
        changes: "product-decision",
        status: "inferred",
      },
    ],
    coverage: {
      negative: [{ id: "N1", searched: "a slack factor", not_found: "none exists", boundary: "src 1-2" }],
    },
    final: { path: "candidate.md", sha256: digest(candidate), bytes: candidate.length },
    ...overrides.record,
  };
}

const anchorOpts = { recordPath: join(root, "pa", "problem-anchor.json") };
const runAnchor = (r) => validateProblemAnchor(r, anchorOpts);

// --- goal-check ------------------------------------------------------------
write("gc/plan.md", "# Plan\n\nAnswer A1 and A2.\n");
const GC_FINAL = "# Final\n\nA1 is answered.\nA2 is answered.\nThe brief is present.\n";
write("gc/final.md", GC_FINAL);
const GC_PROV = `# Provenance\n\n- **Final artifact:** \`final.md\`\n- **Final SHA-256:** \`${digest(GC_FINAL)}\`\n- **Final bytes:** ${GC_FINAL.length}\n- **GOAL-CHECK:** E2E: scope=pass prompt=pass flaws=0 ran=${RUN}\n`;
write("gc/final.provenance.md", GC_PROV);
const GC_REQ = [
  { id: "A1", text: "Answer the first ask" },
  { id: "A2", text: "Answer the second ask" },
];
const GC_MANIFEST = `${JSON.stringify(
  {
    schema: "vitruvius-goal-requirements.v1",
    question_sha256: createHash("sha256").update(QUESTION).digest("hex"),
    requirements: GC_REQ,
    scope: [{ id: "S1", text: "Deliver the requested brief" }],
  },
  null,
  2,
)}\n`;
write("gc/goal-requirements.json", GC_MANIFEST);

function goalCheck() {
  return {
    schema: "vitruvius-goal-check.v1",
    question: QUESTION,
    requirements: GC_REQ,
    requirements_manifest: {
      path: "goal-requirements.json",
      sha256: digest(GC_MANIFEST),
      bytes: GC_MANIFEST.length,
    },
    final: { path: "final.md", sha256: digest(GC_FINAL), bytes: GC_FINAL.length },
    provenance_path: "final.provenance.md",
    plan_path: "plan.md",
    scope: [
      { id: "S1", item: "Deliver the requested brief", status: "pass", evidence: "The brief is present." },
    ],
    prompt: [
      { id: "A1", item: "Answer the first ask", status: "pass", evidence: "A1 is answered." },
      { id: "A2", item: "Answer the second ask", status: "pass", evidence: "A2 is answered." },
    ],
    findings: [],
    ran: RUN,
    verdict: "DONE",
    report: `## Goal Check: DONE\n\nE2E: scope=pass prompt=pass flaws=0 ran=${RUN}\n`,
  };
}
const runGoal = (r) => validateGoalCheck(r, { repoRoot: join(root, "gc") });

// --- field-pilot -----------------------------------------------------------
function fieldPilot() {
  const question = "What does the source support?";
  const finalText = "# Final\n\nThe requested brief is delivered.\nThe requested answer is delivered.\n";
  write("fp/plan.md", "# Plan\n\nAnswer the request.\n");
  write("fp/final.md", finalText);
  write(
    "fp/final.provenance.md",
    `# Provenance\n\n- **Final artifact:** \`final.md\`\n- **Final SHA-256:** \`${digest(finalText)}\`\n- **Final bytes:** ${finalText.length}\n- **GOAL-CHECK:** E2E: scope=pass prompt=pass flaws=0 ran=Opened final artifact and checked the requested answer\n`,
  );
  write("fp/source.md", "# Source\n\nA primary source snapshot.\n");
  write(
    "fp/verifier.md",
    "# Verification\n\n## Verdict: PASS\n\nMACHINE_VERDICT: PASS | FLAW: none | CONFIDENCE: 0.9 | CHECKS_PASSED: 8/8 | LINE_PINNED: 1/1\n\n## Evidence Trail (Line-Pinned)\n| Claim | Evidence |\n",
  );
  const requirements = [{ id: "A1", text: "Answer the request" }];
  const manifest = `${JSON.stringify(
    {
      schema: "vitruvius-goal-requirements.v1",
      question_sha256: createHash("sha256").update(question).digest("hex"),
      requirements,
      scope: [{ id: "S1", text: "Deliver the requested brief" }],
    },
    null,
    2,
  )}\n`;
  write("fp/goal-requirements.json", manifest);
  const goalRan = "Opened final artifact and checked the requested answer";
  write(
    "fp/goal-check.json",
    `${JSON.stringify(
      {
        schema: "vitruvius-goal-check.v1",
        question,
        requirements,
        requirements_manifest: { path: "goal-requirements.json", sha256: digest(manifest), bytes: manifest.length },
        final: { path: "final.md", sha256: digest(finalText), bytes: finalText.length },
        provenance_path: "final.provenance.md",
        plan_path: "plan.md",
        scope: [{ id: "S1", item: "Deliver the requested brief", status: "pass", evidence: "The requested brief is delivered." }],
        prompt: [{ id: "A1", item: "Answer the request", status: "pass", evidence: "The requested answer is delivered." }],
        findings: [],
        ran: goalRan,
        verdict: "DONE",
        report: `## Goal Check: DONE\n\nE2E: scope=pass prompt=pass flaws=0 ran=${goalRan}\n`,
      },
      null,
      2,
    )}\n`,
  );
  const art = (rel) => ({ path: rel, sha256: digest(bytesOf(join("fp", rel))), bytes: bytesOf(join("fp", rel)).length });
  return {
    schema: "vitruvius-field-pilot.v1",
    pilot_id: "v1-contract-fixture",
    question,
    observed_on: "2026-09-26",
    host: "test-host",
    model: "test-model",
    session_id: "test-session",
    sources: [
      {
        id: "SRC-001",
        kind: "synthetic",
        locator: "source.md",
        status: "read",
        accessed_on: "2026-09-26",
        artifact: art("source.md"),
        blocked_reason: null,
        unblock_path: null,
      },
    ],
    plan: art("plan.md"),
    final: art("final.md"),
    provenance: art("final.provenance.md"),
    verifier: art("verifier.md"),
    goal_check: art("goal-check.json"),
    metrics: {
      wall_time_minutes: 1,
      wall_time_status: "available",
      cost_usd: null,
      cost_status: "unavailable",
      user_corrections: 0,
      decision_outcome: "unknown",
      notes: "Synthetic contract fixture; not a research result.",
    },
    completion: "complete",
  };
}
const runPilot = (r) => validateFieldPilot(r, { repoRoot: join(root, "fp") });

// ===========================================================================
// Part 3 — the properties
// ===========================================================================

console.log("\nP0 — every contract has a valid baseline");
for (const [label, record, run] of [
  ["problem-anchor", problemAnchor(), runAnchor],
  ["goal-check", goalCheck(), runGoal],
  ["field-pilot", fieldPilot(), runPilot],
]) {
  const errors = run === runAnchor
    ? validateProblemAnchor(record, anchorOpts).errors
    : run === runGoal
      ? validateGoalCheck(record, { repoRoot: join(root, "gc") }).errors
      : validateFieldPilot(record, { repoRoot: join(root, "fp") }).errors;
  check(`${label} baseline valid`, run(record), errors.join(" | "));
}

console.log("\nP1 — an unknown key is refused by name, on every record-shaped contract");
{
  const a = problemAnchor();
  a.surprise_key = true;
  check(
    "problem-anchor names the unknown key",
    validateProblemAnchor(a, anchorOpts).errors.some((e) => /surprise_key/.test(e)),
  );
  const g = goalCheck();
  g.surprise_key = true;
  check(
    "goal-check names the unknown key",
    validateGoalCheck(g, { repoRoot: join(root, "gc") }).errors.some((e) => /surprise_key/.test(e)),
  );
  const f = fieldPilot();
  f.surprise_key = true;
  check(
    "field-pilot names the unknown key",
    validateFieldPilot(f, { repoRoot: join(root, "fp") }).errors.some((e) => /surprise_key/.test(e)),
  );
}

console.log("\nP2 — every traversing path is refused");
{
  const confined = /confined/;
  for (const badPath of ["../outside.md", "a/../../outside.md", "/etc/passwd", "..\\..\\outside.md", "a//b.md"]) {
    const a = problemAnchor();
    a.final.path = badPath;
    check(
      `problem-anchor refuses final.path ${JSON.stringify(badPath)}`,
      validateProblemAnchor(a, anchorOpts).errors.some((e) => confined.test(e)),
    );
    const a2 = problemAnchor();
    a2.artifacts[0].path = badPath;
    check(
      `problem-anchor refuses artifact path ${JSON.stringify(badPath)}`,
      validateProblemAnchor(a2, anchorOpts).errors.some((e) => confined.test(e)),
    );
    const g = goalCheck();
    g.provenance_path = badPath;
    check(
      `goal-check refuses provenance_path ${JSON.stringify(badPath)}`,
      validateGoalCheck(g, { repoRoot: join(root, "gc") }).errors.some((e) => confined.test(e)),
    );
  }
}

console.log("\nP3 — a mutated hash or byte count is always refused");
{
  const a = problemAnchor();
  a.artifacts[0].sha256 = "0".repeat(64);
  check("problem-anchor artifact hash", validateProblemAnchor(a, anchorOpts).errors.some((e) => /sha256|hash/i.test(e)));
  const b = problemAnchor();
  b.artifacts[0].bytes = 1;
  check("problem-anchor artifact bytes", validateProblemAnchor(b, anchorOpts).errors.some((e) => /byte/i.test(e)));
  const c = problemAnchor();
  c.final.sha256 = "0".repeat(64);
  check("problem-anchor candidate hash", validateProblemAnchor(c, anchorOpts).errors.some((e) => /final\.sha256 does not match/.test(e)));
  const g = goalCheck();
  g.final.bytes = 1;
  check("goal-check candidate bytes", validateGoalCheck(g, { repoRoot: join(root, "gc") }).errors.some((e) => /byte/i.test(e)));
  const f = fieldPilot();
  f.final.sha256 = "0".repeat(64);
  check("field-pilot candidate hash", validateFieldPilot(f, { repoRoot: join(root, "fp") }).errors.some((e) => /sha256|hash/i.test(e)));
}

console.log("\nP4 — removing a required field never stays valid");
{
  const cases = [
    ["problem-anchor: question", "question", () => problemAnchor(), anchorOpts, validateProblemAnchor],
    ["problem-anchor: decisions", "decisions", () => problemAnchor(), anchorOpts, validateProblemAnchor],
    ["problem-anchor: coverage", "coverage", () => problemAnchor(), anchorOpts, validateProblemAnchor],
    ["goal-check: verdict", "verdict", () => goalCheck(), { repoRoot: join(root, "gc") }, validateGoalCheck],
    ["goal-check: prompt", "prompt", () => goalCheck(), { repoRoot: join(root, "gc") }, validateGoalCheck],
    ["field-pilot: metrics", "metrics", () => fieldPilot(), { repoRoot: join(root, "fp") }, validateFieldPilot],
  ];
  for (const [label, field, build, opts, fn] of cases) {
    const record = build();
    check(`${label} present in the baseline`, field in record);
    delete record[field];
    check(`${label} removed -> invalid`, !fn(record, opts).valid, fn(record, opts).errors.join(" | "));
  }
}

console.log("\nP5 — one well-formed addition is additive; one ill-formed addition is not");
{
  const candidate = DEFAULT_CANDIDATE + "F4 the corridor minimum is 1050 mm (`src/solver.ts:1`).\n";
  const r = problemAnchor({ candidate });
  r.final = { path: "candidate.md", sha256: digest(candidate), bytes: candidate.length };
  r.findings.push({
    id: "F4",
    decision_id: "D1",
    claim: "the corridor minimum is 1050 mm",
    type: "repo",
    anchor: { path: SRC, line: 1 },
    artifact_id: "A1",
    changes: "measure",
    status: "verified",
  });
  check("a well-formed extra finding is additive", runAnchor(r), validateProblemAnchor(r, anchorOpts).errors.join(" | "));
  const broken = structuredClone(r);
  broken.findings.at(-1).anchor.line = 9999;
  const brokenResult = validateProblemAnchor(broken, anchorOpts);
  check(
    "an extra finding with a bad anchor is still refused",
    !brokenResult.valid,
    `unexpectedly valid: ${brokenResult.errors.join(" | ")}`,
  );
}

console.log("\nP6 — an anchor reached through a link out of the root is refused (the M3 class)");
{
  const outside = mkdtempSync(join(tmpdir(), "vitruvius-props-outside-"));
  let linked = false;
  try {
    const secret = "export const secret = 1;\n";
    writeFileSync(join(outside, "secret.ts"), secret);
    try {
      symlinkSync(outside, join(root, "src", "escape"), process.platform === "win32" ? "junction" : "dir");
      linked = true;
    } catch {
      linked = false;
    }
    if (linked) {
      const r = problemAnchor();
      r.artifacts = [{ id: "A1", path: "src/escape/secret.ts", sha256: digest(secret), bytes: secret.length }];
      r.findings = [
        {
          id: "F1",
          decision_id: "D1",
          claim: "secret",
          type: "repo",
          anchor: { path: "src/escape/secret.ts", line: 1 },
          artifact_id: "A1",
          changes: "measure",
          status: "unverified",
        },
        PRODUCT_FINDING,
      ];
      const errors = validateProblemAnchor(r, anchorOpts).errors;
      check(
        "a link out of the anchor root is refused",
        errors.some((e) => /escapes anchor_root|resolves outside anchor_root/.test(e)),
        errors.join(" | "),
      );
    } else {
      console.log("  SKIP  link-escape property (no symlink/junction privilege on this host)");
    }
  } finally {
    rmSync(outside, { recursive: true, force: true });
  }
}

console.log("\nP7 — a longer line number does not satisfy a shorter anchor (the M2 class)");
{
  const big = Array.from({ length: 200 }, (_, i) => `export const v${i + 1} = ${i + 1};`).join("\n");
  write("src/big.ts", big);
  const build = (citationLine) => {
    const candidate = `F1 at src/big.ts:${citationLine}\nF3 product policy. N1 boundary.\n`;
    const r = problemAnchor({ candidate });
    r.artifacts = [{ id: "A1", path: "src/big.ts", sha256: digest(big), bytes: big.length }];
    r.findings = [
      {
        id: "F1",
        decision_id: "D1",
        claim: "v1",
        type: "repo",
        anchor: { path: "src/big.ts", line: 1 },
        artifact_id: "A1",
        changes: "measure",
        status: "unverified",
      },
      PRODUCT_FINDING,
    ];
    r.final = { path: "candidate.md", sha256: digest(candidate), bytes: candidate.length };
    return r;
  };
  check("the exact line is accepted", runAnchor(build(1)), validateProblemAnchor(build(1), anchorOpts).errors.join(" | "));
  for (const wrong of [13, 100]) {
    const wrongResult = validateProblemAnchor(build(wrong), anchorOpts);
    check(
      `a citation to :${wrong} does not satisfy an anchor at :1`,
      !wrongResult.valid,
      `unexpectedly valid: ${wrongResult.errors.join(" | ")}`,
    );
  }
  check("a range starting at the anchored line is accepted", runAnchor(build("1-13")));
}

console.log("\nP8 — re-serializing a record does not change the verdict");
{
  for (const [label, record, run] of [
    ["problem-anchor", problemAnchor(), runAnchor],
    ["goal-check", goalCheck(), runGoal],
    ["field-pilot", fieldPilot(), runPilot],
  ]) {
    const direct = run(record);
    const roundTripped = run(JSON.parse(JSON.stringify(record)));
    check(`${label} verdict is stable across serialization`, direct && roundTripped, `${direct} vs ${roundTripped}`);
  }
}

console.log("\nP9 — artifact closure is monotonic");
{
  const dir = join(root, "closure");
  mkdirSync(dir, { recursive: true });
  const body = "# Topic\n\nA final artifact.\n";
  writeFileSync(join(dir, "topic.md"), body);
  writeFileSync(
    join(dir, "topic.provenance.md"),
    `# Provenance\n- **Final artifact:** \`topic.md\`\n- **Final SHA-256:** \`${digest(body)}\`\n- **Final bytes:** ${body.length}\n`,
  );
  check("a matched final/provenance pair is valid", validateArtifactClosure(dir).valid, validateArtifactClosure(dir).errors.join(" | "));
  writeFileSync(join(dir, "orphan.md"), "# Orphan\n\nNo sidecar.\n");
  check("adding a final without a sidecar is refused", !validateArtifactClosure(dir).valid);
  rmSync(join(dir, "orphan.md"));
  writeFileSync(join(dir, "topic.md"), "# Changed\n");
  check("stale bytes are refused", !validateArtifactClosure(dir).valid);
  rmSync(join(dir, "topic.provenance.md"));
  check("a removed sidecar is refused", !validateArtifactClosure(dir).valid);
}

assert.ok(failures === 0, `${failures} of ${failures + passes} property checks failed`);
console.log(`\nPASS: ${passes} property checks hold across the entailment proxy and four contracts`);
rmSync(root, { recursive: true, force: true });
