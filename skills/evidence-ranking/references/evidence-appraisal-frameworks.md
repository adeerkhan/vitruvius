# Appraisal frameworks: certainty and risk of bias

Two dimensions that sit **beside** the tier system, not inside it. They answer a
different question, and conflating the two is the mistake that makes a ranked
table look more certain than it is.

- The **tier** (`references/evidence-quality-tiers.md`) answers *who says so*:
  the authority of the source — a code provision, a standard, a peer-reviewed
  paper.
- These dimensions answer *how much should I believe this*: the certainty the
  method can support and the bias it carries.

A Tier 1 source can publish a finding that deserves low certainty. Record both
numbers. Never let one overwrite the other, and never total them into a single
score — a Tier 1 rating is authority, not belief, and adding the two double-counts
the same work twice.

## GRADE certainty — a body of evidence, not a paper

GRADE rates a **body of evidence for a specified outcome and comparison**. It
starts from the study design and then downgrades for:

- **Risk of bias**
- **Inconsistency** across studies
- **Indirectness** — the wrong population, intervention, or outcome
- **Imprecision** — the effect estimate is not precise enough for the threshold
  that matters
- **Missing-evidence bias** (publication or reporting bias in the source body)

Two rules that are easy to break:

1. **Do not double-count.** A non-randomized body of evidence starts at low
   certainty *for that reason alone*. If you already rated its risk of bias down,
   do not downgrade again for the same defect — the design penalty and the bias
   penalty are the same defect seen twice.
2. **GRADE is outcome-specific.** One body of evidence can be high certainty for
   one outcome and low for another. A single GRADE rating for a whole paper is
   the wrong shape.

## Risk of bias — one tool per result, recorded with its version

Pick the tool that matches the result, and record which one and which version:

| Result type | Tool |
|---|---|
| Randomized comparison | RoB 2 |
| Non-randomized effect | ROBINS-I |
| Diagnostic accuracy | QUADAS-3 |

Keep the judgments distinct: **missing reporting**, **risk of bias**,
**applicability**, and **certainty** are four separate calls. "The paper does not
report the method" is not "the method was biased".

## Where these do not apply in engineering — state it, do not force it

Most engineering evidence is not a trial, and pretending otherwise produces a
confident number for a question nobody asked. Record `not-applicable` with the
reason rather than a score:

- **No randomization.** There is rarely a control arm, so the GRADE starting
  point and RoB 2's randomization domain have nothing to bite on. Say so.
- **Rarely a body of evidence.** A single test programme, handbook provision, or
  vendor report is one source. GRADE rates a *body*; applying it to one source
  invents certainty from a design that never happened.
- **"Publication bias" has no register.** It is defined against trial
  registration. Do not infer it; record it as unknown.
- **Blinding and consent do not transfer.** Engineering results are limited by
  instrumentation, boundary conditions, and analysis assumptions — those are the
  real bias sources.

When a domain does not apply, the honest engineer substitutes the engineering
analogue and names it as such:

| GRADE / RoB domain | Engineering analogue |
|---|---|
| Risk of bias | calibration, instrumentation, fixture compliance, analysis of specimens |
| Selection bias | sampling and coupon selection, exclusion of specimens, survivorship |
| Indirectness | material, geometry, environment, or loading that differs from the question |
| Imprecision | sample size, scatter, or test-to-test variability against the decision threshold |
| Inconsistency | disagreement between test programmes or published datasets |

## Output convention

Add both columns to the ranking table, and use `n/a` with a stated reason where
the framework does not apply:

| # | Source | Tier | Certainty | Bias | Applicability |
|---|--------|------|-----------|------|---------------|
| 1 | [Author](DOI) | 1 | high | RoB 2 v2 | direct |
| 2 | [Author](DOI) | 1 | low | n/a — no comparator; see rationale | indirect (material) |

`n/a` is a finding. A blank cell is a gap, and a gap that a reader cannot see is
the same failure as a search that silently disappeared.

## Basis

Method adapted from `ref/scientific-agent-skills` (K-Dense Inc., `src-07`),
`scientific-critical-thinking` — the GRADE downgrade domains, the
starting-certainty rule, the result-specific tools, and the instruction to keep
reporting, bias, applicability, and certainty separate. The engineering
applicability rules and the analogue table above are ours: they are where that
framework stops and the judgement of an engineer starts.
