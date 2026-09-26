#!/usr/bin/env node
/**
 * End-to-end demonstration of the entailment proxy against the real error
 * SOLVER-RESEARCH.md caught by hand.
 *
 * That report concluded, correctly, that the floorplanner's 1.2 m arrival
 * radius was not a sourced universal rule. Its supporting text reads:
 *
 *   "LDA's 1.2 m value is a entrance-hall width, not 'a public room within
 *    1.2 m of the door'."            -- SOLVER-RESEARCH.md:161
 *
 * The two mistakes that produce that finding are exactly what the proxy is for:
 *   1. citing a number the cited provision does not contain
 *   2. attributing a number on a line to the wrong subject
 *
 * Run: node examples/entailment-demo.mjs
 */
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validateProblemAnchor } from "../scripts/problem-anchor-contract.mjs";

const root = mkdtempSync(join(tmpdir(), "vitruvius-entailment-demo-"));
const digest = (t) => createHash("sha256").update(t).digest("hex");
const w = (rel, text) => {
  const p = join(root, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, text);
  return p;
};

// A faithful stand-in for the cited provision, LDA Apartment Typology Booklet
// Rev. 00 Sec 1.2.7, which is what SOLVER-RESEARCH.md:155 quotes.
const LDA = [
  "1.2.7 CORRIDOR AND HALL WIDTHS",
  "  Internal apartment corridors: minimum 1,050 mm.",
  "  Entrance halls: minimum 1,200 mm.",
  "  Communal corridors: minimum 1,500 mm.",
].join("\n") + "\n";
w("lda-1.2.7.txt", LDA);

const CORRIDOR_LINE = 2; // the 1,050 mm corridor line
const HALL_LINE = 3; // the 1,200 mm entrance-hall line

function record({ claim, line, status, reportLines }) {
  w("report.md", reportLines);
  return {
    schema: "vitruvius-problem-anchor.v1",
    question: "Is the solver's 1.2 m arrival radius a sourced rule?",
    commit: "1acba4d",
    anchor_root: root,
    artifacts: [{ id: "A1", path: "lda-1.2.7.txt", sha256: digest(LDA), bytes: LDA.length }],
    decisions: [{ id: "D1", text: "Whether the 1.2 m radius has a sourced basis" }],
    findings: [
      {
        id: "F1",
        decision_id: "D1",
        claim,
        type: "repo",
        anchor: { path: "lda-1.2.7.txt", line },
        artifact_id: "A1",
        changes: "change",
        status,
      },
    ],
    coverage: {
      negative: [
        {
          id: "N1",
          searched: "Reviewed primary sources for a universal geometric slack factor",
          not_found: "No universal factor exists",
          boundary: "Sources 1-13 in the cited brief",
        },
      ],
    },
    final: { path: "report.md", sha256: digest(reportLines), bytes: reportLines.length },
  };
}

const scenarios = [
  {
    name: "A. The error: a 1.2 m radius cited to the 1,050 mm corridor provision",
    line: CORRIDOR_LINE,
    claim: "The 1.2 m arrival radius is sourced to the internal corridor minimum",
    status: "verified",
    report: [
      "# Arrival radius",
      "",
      "F1 the 1.2 m radius comes from lda-1.2.7.txt:2",
      "N1 searched for a slack factor; not found.",
      "",
    ].join("\n"),
    expectValid: false,
    why: "the cited line carries 1,050 mm, not 1,200 mm, so the claim's 1.2 m is unsupported",
  },
  {
    name: "B. The fix, same anchor: the corridor figure, correctly stated",
    line: CORRIDOR_LINE,
    claim: "The internal corridor minimum is 1,050 mm",
    status: "verified",
    report: [
      "# Corridor width",
      "",
      "F1 the corridor minimum is 1,050 mm (lda-1.2.7.txt:2)",
      "N1 searched for a slack factor; not found.",
      "",
    ].join("\n"),
    expectValid: true,
    why: "the claim now states the number the cited line actually contains",
  },
  {
    name: "C. The fix, right anchor: the entrance hall is where 1,200 mm lives",
    line: HALL_LINE,
    claim: "The entrance hall minimum is 1.2 m",
    status: "verified",
    report: [
      "# Entrance hall",
      "",
      "F1 the hall minimum is 1.2 m (lda-1.2.7.txt:3)",
      "N1 searched for a slack factor; not found.",
      "",
    ].join("\n"),
    expectValid: true,
    why: "same value, anchored to the provision that carries it; 1.2 m converts to 1,200 mm",
  },
  {
    name: "D. Limit 1, made visible: right number, wrong subject on the same line",
    line: CORRIDOR_LINE,
    claim: "The entrance hall minimum is 1.05 m",
    status: "verified",
    report: [
      "# Wrong attribution",
      "",
      "F1 the hall minimum is 1.05 m (lda-1.2.7.txt:2)",
      "N1 searched for a slack factor; not found.",
      "",
    ].join("\n"),
    expectValid: true,
    why: "the 1,050 mm figure is present on the line, so the proxy passes it. Deciding that it belongs to the corridor and not the hall is reading comprehension, and it stays with the verifier. This is the limit, shown rather than hidden.",
  },
  {
    name: "E. A paraphrase is not a falsehood: it is `partial`",
    line: HALL_LINE,
    claim: "The provision sets a minimum width for entrance halls",
    status: "partial",
    report: [
      "# Paraphrase",
      "",
      "F1 the provision sets a minimum width for entrance halls (lda-1.2.7.txt:3)",
      "N1 searched for a slack factor; not found.",
      "",
    ].join("\n"),
    expectValid: true,
    why: "no high-precision token to check, and the status is honest about it",
  },
];

let failures = 0;
console.log("Entailment proxy, demonstrated on the SOLVER-RESEARCH.md:161 error class\n");
console.log("Cited provision, LDA Apartment Typology Booklet Rev. 00 Sec 1.2.7:\n");
for (const [i, line] of LDA.trimEnd().split("\n").entries()) {
  console.log(`   ${i + 1} | ${line}`);
}

for (const s of scenarios) {
  const r = record({ claim: s.claim, line: s.line, status: s.status, reportLines: s.report });
  const result = validateProblemAnchor(r, { recordPath: join(root, "problem-anchor.json") });
  const ok = result.valid === s.expectValid;
  if (!ok) failures++;
  console.log(`\n${ok ? "PASS" : "FAIL"}  ${s.name}`);
  console.log(`      claim   : "${s.claim}"  (status ${s.status}, anchor line ${s.line})`);
  console.log(`      expected: ${s.expectValid ? "valid" : "refused"}   got: ${result.valid ? "valid" : "refused"}`);
  if (result.errors.length) for (const e of result.errors) console.log(`      ${e}`);
  console.log(`      why     : ${s.why}`);
}

console.log(
  `\n${failures === 0 ? "PASS" : `FAIL: ${failures} scenario(s)`}: the proxy refuses the hand-caught error, accepts both grounded repairs, and shows its own limit.`,
);
console.log("A refusal here is a finding for the verifier, not a verdict: the contract narrows the gap, it does not close it.");
process.exit(failures === 0 ? 0 : 1);
