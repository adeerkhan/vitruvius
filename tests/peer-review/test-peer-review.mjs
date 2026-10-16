import { strict as assert } from "node:assert";
import { ws } from "../_support/ws.mjs";
import { validateRecord } from "../../scripts/review-item-contract.mjs";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// peer-review — behavioral.
//
// Shape checks live in tests/all-skills. This suite covers the decisions that
// make an independent adversarial review worth running, and pins what separates
// peer-review from its neighbour `review`.
//
// The two skills are close enough to be confused, and the confusion is
// expensive: a peer reviewer that has seen the author's reasoning is not
// independent, and an independent review that softens a FATAL to be agreeable
// has measured nothing. Those two are the headline assertions below.
//
// The characteristic failure: a verdict softened to avoid being harsh, a
// blocked check reported as a pass, or a finding with no location so the author
// cannot act on it.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const text = readFileSync(join(repoRoot, "skills", "peer-review", "SKILL.md"), "utf8");
const reviewText = readFileSync(join(repoRoot, "skills", "review", "SKILL.md"), "utf8");


// --- Independence is the whole point ---------------------------------------
// A reviewer who has seen the author's reasoning will find the author's
// reasoning persuasive. That is the defect peer-review exists to prevent, so it
// is stated as a property of the skill, not left implicit.
assert.match(
  text,
  ws("The reviewer has NOT seen the author's reasoning — independence is the point"),
  "peer-review must state that the reviewer has not seen the author's reasoning",
);
assert.match(
  text,
  ws("independence is the point"),
  "peer-review must name independence as the reason the skill exists separately from review",
);

// --- Default-FAIL: every claim starts unverified ---------------------------
assert.match(
  text,
  ws("Default-FAIL posture: every claim starts unverified, must be traced to source"),
  "peer-review must default to FAIL with every claim unverified until traced to source",
);

// --- Never soften a severity ----------------------------------------------
// This is the assertion that keeps the review adversarial. A FATAL softened to
// MAJOR to avoid being harsh is worse than no review, because it launders a
// real problem into a to-do item.
assert.match(
  text,
  ws("Never soften a FATAL to MAJOR to avoid being harsh"),
  "peer-review must forbid softening a FATAL to MAJOR",
);
assert.match(
  text,
  /Engineering accountability requires honest verdicts/i,
  "peer-review must state why honest verdicts matter, so the rule is not read as optional tone",
);

// --- The severity ladder is graded, not binary ----------------------------
for (const level of ["FATAL", "MAJOR", "MINOR"]) {
  assert.match(text, new RegExp(`\\*\\*${level}\\*\\*`), `peer-review must define the ${level} tier`);
}
assert.match(
  text,
  /\*\*FATAL\*\* — unsafe, non-compliant, or unsupported; must fix before use/i,
  "FATAL must mean unsafe, non-compliant, or unsupported and must be fixed before use",
);
assert.match(
  text,
  /\*\*MAJOR\*\* — likely wrong or a real gap; fix before finalizing/i,
  "MAJOR must mean likely wrong or a real gap",
);
assert.match(
  text,
  /\*\*MINOR\*\* — clarity, consistency, polish/i,
  "MINOR must mean clarity, consistency, and polish, so the tiers stay ordered",
);

// --- A missing check must never read as a pass ----------------------------
assert.match(
  text,
  ws("Check what was NOT verified"),
  "peer-review must require checking what was NOT verified",
);
assert.match(
  text,
  /never let a missing check read as a\s+pass/i,
  "peer-review must forbid letting a missing check read as a pass; an unrun check reported as a pass is the worst outcome",
);
assert.match(
  text,
  /\*\*Blocked:\*\* <count> claims \(source unreachable\)/i,
  "peer-review must report blocked claims as a distinct count, not fold them into verified or unverified",
);

// --- Every finding is actionable -------------------------------------------
assert.match(
  text,
  /Each finding cites the specific section\/line\/claim it\s+targets/i,
  "peer-review must require each finding to cite the specific section/line/claim it targets",
);
assert.match(
  text,
  /- \*\*Location:\*\* <section\/line>/i,
  "peer-review's output contract must carry a Location field per finding",
);
assert.match(
  text,
  /- \*\*Fix:\*\* <concrete action>/i,
  "peer-review's output contract must carry a concrete Fix, not just a problem statement",
);

// --- No filler: fully substantiated or not at all --------------------------
// arXiv:2605.20668 Table 9: a cap that output stays under is selection; padding
// to a count is noise. An invented MINOR buries the real findings.
assert.match(
  text,
  /Every\s+finding must be fully substantiated/i,
  "peer-review must require every finding to be fully substantiated",
);
assert.match(
  text,
  /An empty tier is a valid result: write `none`\s+rather\s+than padding to a count/i,
  "peer-review must treat an empty tier as valid and forbid padding to a count",
);

// --- Severity is grounded; a FATAL carries its refuted defense -------------
// arXiv:2605.20668 W1: field-norm miscalibration was the most frequent reviewer
// weakness. A FATAL is only a FATAL once the author's strongest defense fails.
assert.match(
  text,
  ws("Ground severity in the artifact's own claims and stated limitations"),
  "peer-review must ground severity in the artifact's own claims and limitations",
);
assert.match(
  text,
  ws("For a FATAL, state the strongest defense and the evidence that rules it out"),
  "peer-review must require a refuted defense for every FATAL",
);

// --- Load-bearing items are re-derived, not accepted -----------------------
assert.match(
  text,
  /Re-derive any calculation from stated formula, inputs, and\s+units/i,
  "peer-review must re-derive calculations from stated formula, inputs, and units",
);
assert.match(
  text,
  /Check code\/standard applicability \(right domain\? right edition\? right jurisdiction\?\)/i,
  "peer-review must check applicability across domain, edition, and jurisdiction",
);
assert.match(
  text,
  ws("Confirm the source actually supports the claim at the pinned location"),
  "peer-review must confirm the source supports the claim at the pinned location",
);

// --- The artifact contract ------------------------------------------------
assert.match(
  text,
  /outputs\/peer-review\/<slug>\.md/,
  "peer-review must save to outputs/peer-review/<slug>.md",
);
assert.match(
  text,
  /outputs\/peer-review\/<slug>\.provenance\.md/,
  "peer-review must write a provenance sidecar beside the review",
);
assert.match(
  text,
  /## Evidence Trail \(Line-Pinned\)/i,
  "peer-review must emit a line-pinned evidence trail",
);
assert.match(
  text,
  /contradicts \/ partially supports \/ missing/i,
  "peer-review's evidence trail must record a verdict per finding, not just a source",
);
assert.match(
  text,
  /## Revision Plan/i,
  "peer-review must emit a prioritized revision plan",
);

// --- Boundaries ------------------------------------------------------------
assert.match(
  text,
  /it does NOT approve or sign off/i,
  "peer-review must state it identifies issues and does not approve or sign off",
);
assert.match(
  text,
  /research-only, not for final engineering sign-off/i,
  "peer-review must carry the S7 research-only boundary",
);
assert.match(
  text,
  /evidence-quality-tiers\.md/,
  "peer-review must point at the evidence-quality tiers reference",
);

// --- What separates peer-review from review -------------------------------
// They share a severity ladder, so the suite must pin the difference rather
// than let one be deleted as a duplicate of the other.
assert.match(
  reviewText,
  /the artifact is the subject,\s+not a question to research/i,
  "review must frame the artifact as the subject, which is what peer-review is for",
);
assert.match(
  text,
  /Run an independent adversarial review of an engineering artifact/i,
  "peer-review must frame itself as an independent adversarial review",
);
assert.match(
  reviewText,
  /Do not praise vaguely/i,
  "review must forbid vague praise",
);
assert.match(
  reviewText,
  /Do not predict ["“]approval["”]/i,
  "review must forbid predicting approval",
);

// --- A review can be scored item-by-item, and the first pass is on file -----
// review-item.v1 (arXiv:2605.20668 Tier-3) scores a reviewer's criticisms rather
// than its verdict: one atomic item per finding, cascading correctness ->
// significance -> evidence_sufficiency, plus the flaw vocabulary whose
// field-norm tokens lesson 6 reserves for miscalibration incidents. The record
// below is the first qualitative pass over a real run; this gate keeps it and
// its example review from drifting apart.
const passRecord = JSON.parse(
  readFileSync(join(repoRoot, "tests", "peer-review", "example-am-ti6al4v-review-items.json"), "utf8"),
);
const passResult = validateRecord(passRecord);
assert.equal(
  passResult.valid,
  true,
  "the pass record validates against review-item.v1: " + JSON.stringify(passResult.errors),
);
assert.equal(passResult.invalidCount, 0, "every scored item satisfies the cascading rules");

const exampleReview = readFileSync(
  join(repoRoot, "tests", "peer-review", "example-am-ti6al4v-review.md"),
  "utf8",
);
const findingIds = [...exampleReview.matchAll(/^####\s+([FmM]\d+):/gm)].map((m) => m[1]);
assert.ok(findingIds.length >= 1, "the example review carries severity-prefixed findings");
for (const id of findingIds) {
  assert.ok(
    passRecord.items.some((item) => item.id === id),
    `the pass record scores every finding in the review (missing ${id})`,
  );
}
assert.ok(
  existsSync(join(repoRoot, "tests", "gap-analysis", "02-am-ti6al4v-variable-amplitude.md")),
  "the scored review's target fixture stays on disk",
);

console.log(
  "PASS: peer-review asserts independence, default-FAIL, the no-softening rule, " +
    "blocked-not-pass, actionable, grounded, and fully-substantiated findings, " +
    "the line-pinned evidence trail, and a scored review-item.v1 pass record",
);
