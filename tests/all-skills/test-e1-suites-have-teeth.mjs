import { join } from "node:path";

import { runMutationHarness } from "../_support/mutation-harness.mjs";

// Mutation harness for the E1 behavioural suites.
//
// A behavioural suite that cannot fail is decoration. These suites assert rules
// by matching prose in a SKILL.md, which is exactly the kind of assertion that
// silently stops asserting anything: the file is reworded, the regex no longer
// matches, and the suite goes green without ever checking the thing it claims
// to check.
//
// So each case below weakens ONE real rule in the target skill and asserts that
// its specific suite goes red. The rule that is weakened is named per case, so
// a reader can see what was proved rather than trusting a count.
//
// This mirrors tests/all-skills/test-part3-suites-have-teeth.mjs, which covers
// the four earlier suites. Same invariants, and the same one that bit this repo
// before: a mutation which silently fails to land is a HARNESS BUG and fails the
// run, never a pass.
//
// Each mutation runs against a throwaway COPY of the repository (see
// tests/_support/mutation-harness.mjs), so the tracked tree is never touched:
// no restore step, no lock retry, and no commit-before-gate constraint.

/**
 * find  — a regex matching the exact prose in the SKILL.md
 * replace — what it becomes when the rule is gutted
 */
const CASES = [
  // --- Thin discipline dispatchers ----------------------------------------
  {
    skill: "civil",
    // Weaken the whole bullet, because the suite's regex is whitespace-insensitive
    // and only needs the words to survive. Gutting the parenthetical alone left
    // "every load must state its basis" plus "combination" in the next clause,
    // which the regex still matched — the mutation landed but the rule did not.
    rule: "every load must state its basis and combination",
    // The rule now names the governing standard (ASCE 7 for buildings, AASHTO
    // for bridges), so the mutation weakens the whole clause rather than the
    // old ASCE-only wording.
    find: /every load must state its basis and combination with the\s*\n\s*governing standard and section[^.]*\./,
    replace: "state loads as convenient.",
  },
  {
    skill: "civil",
    rule: "material properties trace to a named grade and governing spec",
    find: /trace to a named grade \+ governing spec \(e\.g\. Gr\.\s*\n?\s*50 per ASTM A992, f'c per ACI 318\)/,
    replace: "trace to a named material",
  },
  {
    skill: "electrical",
    rule: "SI prefix traps (mA vs A, nF vs uF)",
    find: /\(mA vs A, nF vs uF\)/,
    replace: "(use consistent units)",
  },
  {
    skill: "electrical",
    rule: "a part number without a datasheet read is inferred, not verified",
    find: /a part number\s+without a datasheet read is `inferred`, not `verified`/,
    replace: "a part number is fine as stated",
  },
  {
    skill: "mechanical",
    rule: "handbooks are secondary, used only when a primary read is impossible",
    find: /use only when a direct primary read is possible/i,
    replace: "use freely",
  },
  {
    skill: "mechanical",
    // An earlier version replaced "not assumed." alone. The suite does not assert
    // that fragment, so the mutation landed and nothing went red — a case where
    // "the harness ran" was not the same as "the rule was weakened". Weaken the
    // whole clause the rule depends on.
    rule: "design factor must be stated and traced to code or practice",
    find: /design factor \/ factor of safety must be stated and traced\s*\n\s*to code or practice \(e\.g\. ASME BPVC design factor\), not assumed\./,
    replace: "use a sensible design factor.",
  },
  {
    skill: "architectural",
    rule: "an assembly traces to a named system and evaluation report",
    find: /must trace to a\s+named system \+ evaluation report or manufacturer data/i,
    replace: "describes the assembly as described",
  },
  {
    skill: "architectural",
    rule: "performance values trace to a named test method",
    find: /must\s+trace to a named standard\/test method/i,
    replace: "are given as performance values",
  },
  {
    skill: "software",
    rule: "a repo existing does not mean the feature exists",
    find: /A repo exists ≠ a feature exists/i,
    replace: "A repo existing suggests the feature exists",
  },
  {
    skill: "software",
    rule: "unversioned claims are inferred",
    find: /Unversioned claims are `inferred`/i,
    replace: "Unversioned claims are fine",
  },

  // --- Skills with real distinctive content -------------------------------
  {
    skill: "peer-review",
    rule: "never soften a FATAL to MAJOR to avoid being harsh",
    find: /Never soften a FATAL to MAJOR to avoid being harsh/i,
    replace: "Soften severity where it seems fair.",
  },
  {
    skill: "peer-review",
    rule: "a missing check must never read as a pass",
    find: /Never let a missing check read as a\s+pass/i,
    replace: "Treat unchecked items as passing.",
  },
  {
    skill: "peer-review",
    rule: "severity is grounded in the artifact's stated limitations",
    find: /Ground severity in the artifact's own claims\s+and stated limitations/,
    replace: "Grade severity by general expectations.",
  },
  {
    skill: "peer-review",
    rule: "a FATAL must state its refuted defense",
    find: /For a FATAL,\s+state the strongest defense and the evidence\s+that rules it out/,
    replace: "For a FATAL, act decisively.",
  },
  {
    skill: "peer-review",
    rule: "the reproducibility sweep names the missing piece (S5)",
    find: /\*\*Reproducibility and dependencies \(S5\)\*\* — could a reader rebuild the\s+result from the stated inputs, versions, and editions\? Name the missing\s+piece\./,
    replace: "**Reproducibility and dependencies — trust the inputs as given.**",
  },
  {
    skill: "artifact-reading",
    rule: "never fill a gap you could not read",
    find: /Never fill a gap you could not read/i,
    replace: "Fill any gap you could not read.",
  },
  {
    skill: "artifact-reading",
    rule: "never strip the location when handing findings to synthesis",
    find: /Never strip the location when handing\s+findings to synthesis/i,
    replace: "Hand findings over without locations.",
  },
  {
    skill: "artifact-reading",
    rule: "vision output must not silently enter the binder",
    find: /must not silently feed vision output into the\s+binder/i,
    replace: "may feed vision output into the binder",
  },

  // --- The distinction-pinning suites --------------------------------------
  {
    skill: "review",
    rule: "vague praise is forbidden",
    find: /Do not praise vaguely/i,
    replace: "Praise what works.",
  },
  {
    skill: "review",
    rule: "predicting approval is forbidden",
    find: /Do not predict ["“]approval["”]/i,
    replace: "Say whether it will pass.",
  },
  {
    skill: "review",
    rule: "severity is grounded in the artifact's stated limitations",
    find: /Ground severity in the artifact's own claims\s+and stated limitations/,
    replace: "Grade severity by general expectations.",
  },
  {
    skill: "review",
    rule: "a FATAL must state its refuted defense",
    find: /For a FATAL,\s+state the strongest defense and the evidence\s+that rules it out/,
    replace: "For a FATAL, act decisively.",
  },
  {
    skill: "eli5",
    rule: "accuracy is never traded for simplicity",
    find: /Never trade accuracy\s+for simplicity on anything that affects safety or a design decision/i,
    replace: "Simplify freely when it helps understanding.",
  },
  {
    skill: "eli5",
    rule: "a lossy analogy must be declared lossy",
    find: /When an analogy\s+is lossy — when it would mislead an engineer — say so in one line/i,
    replace: "Use analogies freely.",
  },
  {
    skill: "simplified-technical-english",
    rule: "the evidence must not be rewritten",
    find: /Do not rewrite the evidence/,
    replace: "Rewrite the evidence",
  },
  {
    skill: "simplified-technical-english",
    rule: "a value or risk must survive the rewrite",
    find: /STE shortens sentences; it never changes a value or drops a risk/i,
    replace: "STE may change a value when the sentence is clearer.",
  },
  {
    skill: "vitruvius",
    rule: "ask which discipline when none is named",
    find: /If the user names no discipline, ask which discipline the question belongs to\s+before starting/i,
    replace: "If the user names no discipline, pick the closest one and start.",
  },
  {
    skill: "vitruvius",
    rule: "all seven canonical roles are named",
    find: /`researcher`, `writer`, `verifier`, `reviewer`, `arbiter`, `goal-checker`, and `habit`/i,
    replace: "`researcher`, `writer`, `verifier`",
  },
  {
    skill: "evidence-ranking",
    rule: "the tier is never summed into the appraisal",
    find: /They are recorded side by side and never summed into one number\./,
    replace: "They are combined into one score.",
  },
  {
    skill: "evidence-ranking",
    rule: "a framework that does not apply is recorded as n/a with the reason",
    find: /- \[ \] Each item carries a certainty and a bias judgement, or `n\/a` with the reason stated/,
    replace: "- [ ] Each item scored on all criteria",
  },
  {
    skill: "evidence-ranking",
    rule: "the ranking table carries certainty, bias, and applicability",
    find: /\| # \| Source \| Year \| Venue \| Tier \| Score \| Certainty \| Bias \| Applicability \| Key Claim \| Status \|/,
    replace: "| # | Source | Year | Venue | Tier | Score | Key Claim | Status |",
  },
  {
    skill: "review",
    rule: "a criticism of an unread claim is blocked, not a finding",
    find: /a criticism of a claim you\s+did not open is not a finding/,
    replace: "state any criticism you can form",
  },
  {
    skill: "vitruvius-help",
    rule: "the card is one-shot and persists nothing",
    find: /One-shot; do not persist anything/i,
    replace: "Persistent mode.",
  },
  {
    skill: "vitruvius-help",
    rule: "the numeric-claim rule is stated",
    find: /A numeric claim without a unit, sign convention, and source is noise/i,
    replace: "Numbers are fine as written.",
  },
  {
    skill: "research-to-post",
    rule: "the draft is never posted or scraped by the agent",
    find: /It never posts, never\s+calls a social-media API, and never scrapes X\./,
    replace: "It may post the draft automatically.",
  },
  {
    skill: "research-to-post",
    rule: "the HTML card is generated by the deterministic renderer",
    find: /node skills\/research-to-post\/scripts\/render-post-card\.mjs/,
    replace: "node scripts/make-post.mjs",
  },
  {
    skill: "research-to-post",
    rule: "the no-ledger choice is deliberate",
    find: /By design\. The source\s+link is\s+the provenance\./,
    replace: "Add them back.",
  },
];

const report = runMutationHarness({
  label: `E1 behavioural suites (${new Set(CASES.map((c) => c.skill)).size} suites)`,
  cases: CASES.map((c) => ({
    name: `${c.skill} — "${c.rule}"`,
    file: join("skills", c.skill, "SKILL.md"),
    test: join("tests", c.skill, `test-${c.skill}.mjs`),
    mutate: (original) => original.replace(c.find, c.replace),
  })),
});

process.exit(report.ok ? 0 : 1);
