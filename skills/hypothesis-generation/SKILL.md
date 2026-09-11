---
name: hypothesis-generation
description: >
  Generate and freeze engineering research hypotheses before testing. Use when
  the user asks to "formulate hypotheses", "what could explain this", "propose
  mechanisms", or needs structured hypothesis generation for an engineering
  observation. Produces dated evidence boundaries, rival hypotheses, and
  discriminating predictions. Do NOT use for final hypothesis selection or
  experimental design — this skill generates candidates only, never scores or
  selects.
argument-hint: "<engineering observation or phenomenon>"
allowed-tools: Write Edit Bash Read
license: MIT
metadata:
  version: "0.1.0"

---

# Hypothesis Generation

Generate evidence-bounded engineering hypotheses. This skill freezes the observation, frames the question, establishes evidence boundaries, generates rival candidates, and derives discriminating predictions. It never scores, ranks, or selects hypotheses — that is a human decision.

## Invocation

```
/hypothesis-generation <observation>
```

Include: the observed phenomenon, context, and any relevant engineering domain (materials, structures, thermal, etc.).

## Methodology

1. **Freeze the observation** — write the exact observation before interpreting. Distinguish what was measured from what is inferred. Timestamp the observation date.

2. **Frame the research question** — restate as a falsifiable engineering question. Identify the claim type: descriptive, associational, predictive, causal, or mechanistic.

3. **Establish evidence boundary** — document: search date, databases consulted, query terms, inclusion/exclusion criteria, limitations. "Not located within documented search boundary" — never "no prior work exists".

4. **Generate rival hypotheses** — produce 3-5 candidates from DIFFERENT explanatory classes (e.g., material defect, design error, environmental, manufacturing process, maintenance). Each must be falsifiable. No two hypotheses from the same class.

5. **Declare claim type and estimand** — specify what would be measured, the expected direction/magnitude, and the population/context where it applies.

6. **Derive discriminating predictions** — for each hypothesis, state: condition, observable, expected pattern, falsifier (what result would be incompatible), and rival contrast (how does this prediction differ from the others?).

7. **Prevent HARKing** — timestamp the generation. Preserve this document as the pre-registration record. Any deviation in testing must be reported as a deviation, not hidden.

## Output

### Inline Summary (chat response)
- Observation (frozen, dated)
- Research question + claim type
- Evidence boundary (date, sources, queries, limitations)
- 3-5 rival hypotheses with class labels
- For each: discriminating prediction + falsifier

### Full Record (saved to disk)

Save to `outputs/hypothesis/<slug>.md`:

```markdown
# Hypothesis Generation: <observation>

## Observation (Frozen)
- **Date observed:** <date>
- **Phenomenon:** <exact description>
- **Distinguish:** measured vs inferred
- **Context:** <engineering domain, conditions>

## Research Question
- **Question:** <falsifiable formulation>
- **Claim type:** descriptive / associational / predictive / causal / mechanistic

## Evidence Boundary
- **Search date:** <date>
- **Databases:** <OpenAlex, arXiv, standards, etc.>
- **Query terms:** <exact queries>
- **Inclusion:** <criteria>
- **Exclusion:** <criteria>
- **Limitations:** <what was not searched>

## Rival Hypotheses

### H1: <name> (<explanatory class>)
- **Mechanism:** <how it would cause the observation>
- **Prediction:** <expected result under this hypothesis>
- **Falsifier:** <what result would rule this out>
- **Rival contrast:** <how this differs from H2, H3...>

(repeat for H2, H3...)

## Discriminating Tests
- **Test that separates H1 from H2:** <experiment or analysis>
- **Test that separates H1 from H3:** <experiment or analysis>
- ...

## Pre-registration Record
- **Generated:** <timestamp>
- **Status:** candidate (never scored/selected by tool)
- **Deviations:** none yet
```

## Scope and Boundaries

- This skill generates hypothesis candidates — it does NOT score, rank, or select. Status must remain `candidate`.
- **Research-only, not for final engineering sign-off.** Hypothesis selection requires human engineering judgment.
- Never fabricate evidence to support a hypothesis. If a hypothesis lacks evidence, mark it `unverified`, not `inferred`.
- Evidence quality: see `references/evidence-quality-tiers.md`.
