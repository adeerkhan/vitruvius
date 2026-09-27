# Verification Escalation Contract

Verification escalates based on **claim criticality** and **verifier disagreement**.
Keep the flat agent structure — escalation is conditional, not hierarchical.

## Escalation Rules

| Scenario | Action | Agents |
|----------|--------|--------|
| Routine claim (informational) | Single verifier | 1 |
| Critical claim (safety, code-backed, structural) | Parallel verify | 2 |
| Verifiers disagree (different verdicts) | Escalate to arbiter | 3 |
| All three disagree | BLOCKED, document disagreement | — |

## When to Use 2 or 3 Verifiers

Use 2 verifiers when `--deep` is set, when the claim involves life-safety
(structural, fire, electrical, pressure vessels), when a specific code provision
is the sole basis, when a numerical result governs a design decision, or when
the claim spans multiple engineering fields. Escalate to 3 when the first two
return different verdicts, when a safety-critical claim carries high stakes of
being wrong, or when the evidence is ambiguous or conflicting.

## Arbiter and Independence

The arbiter is dispatched from `agents/arbiter.md` with the original question,
the evidence, the two prior verdicts and their evidence trails, and the
instruction: "Two verifiers disagree. Review both trails and render a majority
verdict." It does NOT re-research — it adjudicates between the two existing
verdicts. Majority wins; all three disagree returns BLOCKED with documentation.

## Documenting Disagreement and Independence

On disagreement the provenance sidecar records one `## Verifier Disagreement` block:
each verdict and reason, the arbiter's, and the resolution. No recorded
resolution means an open finding, not a closed one.

Every verifier/reviewer MUST be a fresh subagent instance; no agent reviews
work it authored; concurrent verifiers share no verdict channel; negative
verdicts loop back to the lead agent, never sideways. For routine
(informational, non-safety) claims a single verifier is sufficient.
