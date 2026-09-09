# Verifier Benchmark Results

First scored run: 2026-09-09. 20 blind verifier runs (fresh subagent per case,
ground truth stripped from prompts, verifier protocol from agents/verifier.md).

| Metric | Value |
|--------|-------|
| Cases | 20 (4 flaw types x 5 disciplines + PASS edge cases) |
| Correct verdicts | 13/20 (65.0%) |
| False approvals | 2/20 (10.0%) |
| False blocks | 0/20 (0.0%) |
| Line-pinned ratio | 107/115 (93%) |

Known weaknesses (tracked, not smoothed over):
- 2 false approvals (architectural-synthesis_overreach-01: verifier accepted a
  margin-claim reading; mechanical-edge-01 analog: verifier PASS on a case
  whose honest label is PARTIAL). The default-FAIL posture does not yet catch
  rhetorical overreach — tightening is queued.
- Electrical discipline scored 1/4: verifier returns PARTIAL where BLOCKED is
  expected (it flags the flaw but softens the verdict). Verdict-softening is
  the top training target.

Case revisions on 2026-09 (documented in each case file): civil-code_misapplication
premise fixed (was self-contradicting); mechanical-code_misapplication ground truth
BLOCKED->PARTIAL; architectural-synthesis_overreach ground truth BLOCKED->PARTIAL.

Raw scorer output follows.

---

Benchmark Results ΓÇö 2026-09-09
============================================================

  architectural (4 cases):
  --------------------------------------------------------
    Correct: 3/4 | False approvals: 1 | Avg checks: 5.3/8
    architectural-code_misapplication-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=code_misapplication conf=0.95 checks=4/8 pinned=6/6)
    architectural-edge-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=entailment_failure conf=0.85 checks=5/8 pinned=8/8)
    architectural-omission-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=omission conf=0.95 checks=4/8 pinned=5/5)
    architectural-synthesis_overreach-01: Γ£ù FALSE APPROVAL (expected=PARTIAL got=PASS flaw=none conf=0.85 checks=8/8 pinned=4/4)

  civil (4 cases):
  --------------------------------------------------------
    Correct: 4/4 | False approvals: 0 | Avg checks: 3.3/8
    civil-code_misapplication-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=code_misapplication conf=0.95 checks=3/8 pinned=7/7)
    civil-edge-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=calculation_error conf=0.92 checks=3/8 pinned=5/6)
    civil-omission-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=omission conf=0.90 checks=3/8 pinned=6/8)
    civil-synthesis_overreach-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=synthesis_overreach conf=0.95 checks=4/8 pinned=4/4)

  electrical (4 cases):
  --------------------------------------------------------
    Correct: 1/4 | False approvals: 0 | Avg checks: 5.0/8
    electrical-code_misapplication-01: Γ£ù WRONG VERDICT (expected=BLOCKED got=PARTIAL flaw=entailment_failure conf=0.55 checks=4/8 pinned=6/6)
    electrical-edge-01: Γ£ù WRONG VERDICT (expected=BLOCKED got=PARTIAL flaw=synthesis_overreach conf=0.85 checks=6/8 pinned=4/6)
    electrical-omission-01: Γ£ù WRONG VERDICT (expected=BLOCKED got=PARTIAL flaw=omission conf=0.80 checks=6/8 pinned=6/7)
    electrical-synthesis_overreach-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=synthesis_overreach conf=0.93 checks=4/8 pinned=4/5)

  mechanical (4 cases):
  --------------------------------------------------------
    Correct: 2/4 | False approvals: 1 | Avg checks: 6.0/8
    mechanical-code_misapplication-01: Γ£ù FALSE APPROVAL (expected=PARTIAL got=PASS flaw=none conf=0.85 checks=8/8 pinned=6/6)
    mechanical-edge-01: Γ£ù WRONG VERDICT (expected=PASS got=PARTIAL conf=0.90 checks=7/8 pinned=6/6)
    mechanical-omission-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=calculation_error conf=0.95 checks=3/8 pinned=6/6)
    mechanical-synthesis_overreach-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=synthesis_overreach conf=0.90 checks=6/8 pinned=7/7)

  software (4 cases):
  --------------------------------------------------------
    Correct: 3/4 | False approvals: 0 | Avg checks: 3.8/8
    software-code_misapplication-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=code_misapplication conf=0.98 checks=1/8 pinned=6/6)
    software-edge-01: Γ£ù WRONG VERDICT (expected=PASS got=PARTIAL conf=0.90 checks=6/8 pinned=2/3)
    software-omission-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=entailment_failure conf=0.95 checks=6/8 pinned=3/3)
    software-synthesis_overreach-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=synthesis_overreach conf=0.95 checks=2/8 pinned=6/6)

Overall Summary:
============================================================
  Cases scored:        20
  Correct verdicts:    13/20 (65.0%)
  False approvals:     2/20 (10.0%)
  False blocks:        0/20 (0.0%)
  Conservative over:   0/20
  Avg confidence:      0.89
  Avg checks passed:   4.7/8
  Line-pinned ratio:   107/115

  Entailment check (8th): 1/1 correct

Per-Discipline Breakdown:
------------------------------------------------------------
  architectural   3/4 correct, 1 false approvals
  civil           4/4 correct, 0 false approvals
  electrical      1/4 correct, 0 false approvals
  mechanical      2/4 correct, 1 false approvals
  software        3/4 correct, 0 false approvals
