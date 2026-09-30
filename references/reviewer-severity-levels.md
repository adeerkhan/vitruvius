# Reviewer Severity Levels

Classify every finding as FATAL, MAJOR, or MINOR. Do not use vague severity
language ("this is a problem", "this could be better"). Every finding gets a
level, and every level has a concrete action.

## Levels

| Level | Meaning | Action |
|-------|---------|--------|
| **FATAL** | The artifact cannot be delivered as-is. The claim is unsupported, the evidence is fabricated, or the conclusion is wrong. | Fix before delivery. If unfixable, deliver with `Verification: BLOCKED` and list the issue. |
| **MAJOR** | The artifact can be delivered, but the issue must be noted in Open Questions and addressed in a revision. | Note in Open Questions. Fix in the next revision. |
| **MINOR** | The artifact is sound, but the issue affects clarity, completeness, or polish. | Fix if time permits. Do not block delivery. |

## Classification Rules

### FATAL — any of these:

- A claim marked `verified` without a direct source read
- A numeric claim without a unit, sign convention, and source
- A standard citation that does not say what is claimed
- A `repo` anchor that does not resolve to a non-blank line on disk
- A finding with no landing site (not `change`, `measure`, `defer`, `product-decision`, or `background`)
- A source that appears AI-generated with no primary backing
- A BLOCKED source used as load-bearing support for a claim

### MAJOR — any of these:

- A claim that is directionally correct but needs qualification (edition, jurisdiction, condition)
- A finding that is line-pinned but the anchor does not carry the claim's quoted spans
- A merged duplicate source used as support for a claim
- A search with no negative-coverage record
- A verifier disagreement with no recorded resolution
- A plan that was not updated at a phase boundary

### MINOR — any of these:

- A claim that is `verified` but could benefit from a second source
- A finding that is clear but could be more concise
- A source that is Tier 2 but could be replaced with a Tier 1 source
- A formatting or naming inconsistency that does not affect correctness

## Output Format

Every review produces two sections:

### Structured Review

```markdown
## Summary
1-2 paragraph summary of the artifact's strengths and weaknesses.

## Strengths
- [S1] ...
- [S2] ...

## Weaknesses
- [W1] **FATAL:** ...
- [W2] **MAJOR:** ...
- [W3] **MINOR:** ...

## Questions for Authors
- [Q1] ...

## Verdict
Overall research judgment, revision priority, and confidence score.

## Revision Plan
Prioritized, concrete steps to address each weakness.
```

### Inline Annotations

Quote specific passages from the artifact and annotate them directly:

```markdown
> "The design meets all code requirements"
**[W1] FATAL:** This claim is unsupported — the cited section does not cover the stated load case. Revise or remove.

> "We use a factor of 0.75"
**[Q1]:** Is this the resistance factor (phi) or the safety factor (omega)? This matters for reproducibility.
```

## Rules

- **Do not praise vaguely.** Every positive claim should be tied to specific evidence.
- **Keep looking after you find the first major problem.** Do not stop at one issue if others remain visible.
- **Preserve uncertainty.** When the parent asks about readiness, frame it as revision risk and evidence quality; do not predict acceptance.
- **Every weakness references a specific passage.** "The methodology is weak" is not a finding. "The methodology section does not state the sampling strategy" is a finding.
