## Verdict: PARTIAL

MACHINE_VERDICT: PARTIAL | FLAW: synthesis_overreach | CONFIDENCE: 0.90 | CHECKS_PASSED: 7/8 | LINE_PINNED: 1/1

## Findings

### Checks that passed
1. **Code/standard applicability** — IBC 2021, Sections 1005.1, 1005.3, 1004.5 are the correct provisions for egress width and occupant load.
2. **Units and signs** — inches per occupant × persons = inches; consistent throughout.
3. **Completeness** — stairway width factor and two-exit distribution rule both addressed.
4. **Missing factors** — no resistance factors or material grades apply to egress width.
5. **Calculation integrity** — 300 × 0.3 = 90 in; 90/2 = 45 in per stairway; 2×48 = 96 in provided. Arithmetic is correct.
6. **Source-to-claim fidelity** — each claim maps to a cited evidence item; IBC 1005.1 and 1005.3 applied correctly.
7. **Conflict check** — no conflicting standards cited.

### Issues found
8. **Citation entailment** — The conclusion uses unqualified margin language ("exceeds the minimum") without quantifying the margin. The actual margin is 6 in on 90 in (6.7%). Under the margin-earnedness threshold in `agents/verifier.md`, unqualified margin language with a margin under ~10% caps the verdict at PARTIAL. A reader is left assuming comfortable headroom that the numbers do not support.

## Corrected Conclusion
Per IBC 1005.1, the total required egress width is 300 occupants × 0.3 in/occupant = 90 inches for stairways. With two stairways, each stairway must be at least 45 inches wide. Provide two 48-inch wide stairways (total 96 inches), which exceeds the minimum by 6 inches (6.7%).

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | Total width = 90 in | IBC 1005.1 | §1005.1 | Verified |
| 2 | Per stairway ≥ 45 in | IBC 1005.3 | §1005.3 | Verified |
| 3 | 2×48 = 96 in provided | Conclusion | Line 21 | Verified |
| 4 | Margin = 6.7% | Derived | — | Unqualified in conclusion |