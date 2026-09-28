## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: synthesis_overreach | CONFIDENCE: 0.9 | CHECKS_PASSED: 3/8 | LINE_PINNED: 5/7

## Findings

### Checks that passed
- Units and signs: No errors.
- Calculation integrity: 200 × 0.91 = 182A is correct.
- Conflict check: No conflicts in evidence.

### Issues found
1. **Synthesis overreach (P0)**: The 90°C value (230A) is not in any evidence item. Evidence 1 lists only 75°C ampacities. The claim "3/0 AWG is adequate" rests on this unsupported value.

2. **Code misapplication (P0)**: Using the 90°C column for final sizing violates NEC 110.14(C) unless equipment terminals are 90°C rated. Never established.

3. **Contradicted by evidence**: At 75°C with correction, 3/0 AWG = 182A < 200A load. Evidence contradicts adequacy claim.

4. **Omission**: Evidence 3's OCPD requirement (conductor rated for 250A after corrections) is never addressed.

5. **Incomplete**: Question asks for minimum size; conclusion claims "adequate" without establishing minimum.

## Corrected Conclusion
3/0 AWG is NOT adequate at 75°C/40°C (182A < 200A). Minimum size cannot be determined from provided evidence.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | 3/0 AWG at 75°C = 200A | Evidence 1 | NEC Table 310.16 | Supported |
| 2 | 40°C correction = 0.91 | Evidence 2 | NEC 310.15(B)(1) | Supported |
| 3 | Adjusted ampacity = 182A | Calculation | 200 × 0.91 | Supported |
| 4 | 3/0 AWG insufficient at 75°C | Inference | 182A < 200A | Supported |
| 5 | 90°C column = 230A | None | Not in evidence | UNSUPPORTED |
| 6 | 209A adjusted ampacity | Calculation | 230 × 0.91 | Unsupported input |
| 7 | 3/0 AWG is adequate | None | Contradicted | UNSUPPORTED |