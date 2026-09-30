# Research State Machine

The research loop is a formal state machine. Each state has entry conditions,
exit conditions, and allowed transitions. A run that cannot name its current
state is a run that cannot be audited, resumed, or goal-checked.

## States

| State | Entry condition | Exit condition |
|-------|----------------|----------------|
| `PLANNED` | Input gate passed; plan written to `outputs/.plans/<slug>.md` | Problem anchor frozen; scale decision made |
| `GATHERING` | Scale decision made; owners assigned | Evidence checklist satisfied (≥3 queries, ≥5 sources, ≥2 tiers) |
| `DRAFTING` | Evidence sufficient; findings have IDs and landing sites | Draft saved to `outputs/.drafts/<slug>-draft.md` |
| `VERIFYING` | Draft exists; verifier dispatched with fresh context | Verifier returns PASS/PARTIAL/BLOCKED with evidence trail |
| `REVIEWING` | Verifier passed; self-review complete | All PARTIAL qualifications noted; FATAL issues fixed |
| `AUDITING` | Review complete; post-edit citation audit run | Quality gate passed (≥80% claims verified/partial, ≥80% line-pinned) |
| `DELIVERING` | Quality gate passed; GOAL-CHECK record written and validated | Final artifact copied to `outputs/`; provenance sidecar complete |
| `COMPLETE` | All artifacts on disk; provenance records hashes and GOAL-CHECK | Run ledger entry logged; evidence ledger recorded |

## Transition Rules

| From | Event | To | Guard |
|------|-------|----|-------|
| — | Research question received | `PLANNED` | Input gate passed |
| `PLANNED` | Plan written, anchor frozen | `GATHERING` | Scale decision made |
| `GATHERING` | Evidence checklist satisfied | `DRAFTING` | ≥3 queries, ≥5 sources, ≥2 tiers |
| `DRAFTING` | Draft saved | `VERIFYING` | Dispatcher has fresh context |
| `VERIFYING` | Verifier returns PASS/PARTIAL | `REVIEWING` | Evidence trail recorded |
| `VERIFYING` | Verifier returns BLOCKED | `DRAFTING` | Fatal issues identified |
| `VERIFYING` | Verifiers disagree | `ARBITING` | Two verifiers returned different verdicts |
| `ARBITING` | Arbiter renders majority verdict | `REVIEWING` | Majority verdict recorded |
| `REVIEWING` | Self-review complete | `AUDITING` | All PARTIAL qualifications noted |
| `AUDITING` | Quality gate passed | `DELIVERING` | ≥80% claims verified/partial |
| `AUDITING` | Quality gate failed | `GATHERING` | Specific failures identified |
| `DELIVERING` | GOAL-CHECK returns DONE | `COMPLETE` | All artifacts on disk |
| `DELIVERING` | GOAL-CHECK returns NOT-DONE | (responsible step) | Named items to repair |

## Crash Recovery

If a run is interrupted, the plan's Task/Verification/Decision logs record the
last completed state. To resume:

1. Read the plan from `outputs/.plans/<slug>.md`
2. Identify the last completed state from the Task log
3. Re-enter at the next state — do not redo completed work
4. Record the interruption and resume in the Decision log

## GOAL-CHECK Integration

GOAL-CHECK verifies that the run reached `COMPLETE` and that every ask in the
original question was delivered. A run that never reached `COMPLETE` is
NOT-DONE by definition, regardless of how much work was done.

## State Recording

Record state transitions in the plan's Task log:

```
- [x] PLANNED: plan written, anchor frozen
- [x] GATHERING: 5 queries, 12 sources, 3 tiers
- [x] DRAFTING: draft saved, 8 findings with landing sites
- [x] VERIFYING: verifier PASS (16/20 claims verified)
- [x] REVIEWING: 2 PARTIAL qualifications noted
- [x] AUDITING: quality gate passed (85% verified, 90% line-pinned)
- [x] DELIVERING: GOAL-CHECK DONE
- [x] COMPLETE: artifacts on disk, provenance recorded
```

This is the plan-as-working-memory convention made formal. The state machine
gives it structure; the plan gives it persistence.
