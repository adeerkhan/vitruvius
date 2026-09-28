# Draft and Problem Anchor

Detail for Step 4 of `engineering-research`. The step stays short in the skill;
this file holds the drafting contract and the anchor-record rules it points to.
Every gate here is preserved from the skill body — moving detail out of the
skill does not weaken any of it.

## Draft structure

Write the brief yourself. Do not delegate synthesis. Save to
`outputs/.drafts/<slug>-draft.md`. Include:

- Executive summary
- Findings organized by question/theme
- Evidence-backed caveats and disagreements
- Open questions
- No invented sources, numbers, figures, tables, or claims

## Finding contract

Every finding carries an ID, a `type`, and a **changes** line naming its landing
site: `change`, `measure`, `defer`, `product-decision`, or `background`. This is
what separates an engineering report from a survey. A finding with no landing
site is either background or a product decision, and must say which. A finding
that recommends building something must first show it is absent — with an
anchor, not an assertion.

Two sections are mandatory, not optional:

- **`## What we did not find`** — what you searched for, did not find, and the
  boundary of the search. Silence reads as "no problems exist"; this section
  makes the gap itself evidence.
- **`## Impact vs. evidence`** — for each recommendation, the evidence behind it
  and the cost of being wrong. An unsupported priority ranking is a guess
  wearing a table.

## Problem anchor record

Write the `vitruvius-problem-anchor.v1` record beside the candidate from
`references/problem-anchor-contract.md`. Validate it with
`vitruvius-problem-anchor <record>` (or
`node scripts/problem-anchor-contract.mjs <record>` in a checkout).

**The record is mandatory even when the validator is not installed**: with no
validator, keep the record and mark its validation `BLOCKED` — never drop it. It
must pass (or be explicitly blocked) before the brief moves to verification:
every decision reached a position, every `repo` anchor resolves to a non-blank
line on disk, and the candidate actually cites them.

`verified` also requires the entailment proxy: the anchored line must carry the
claim's quoted spans, identifiers, and measures. A paraphrase is `partial`;
attribution and negative claims stay with the verifier.

Repair a failed record by fixing the claim or the anchor — never by deleting
the finding.

## Pre-citation sweep

Before citation, sweep the draft: every critical claim, number, figure, or table
must map to a source reference, research note, artifact path, or calculation.
Remove or downgrade unsupported claims; mark inferences as inferences. **A
numeric claim without a unit, sign convention, and source is not a claim — it
is noise.** Flag it.
