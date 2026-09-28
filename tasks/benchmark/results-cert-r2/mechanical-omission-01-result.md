## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: calculation_error | CONFIDENCE: 0.95 | CHECKS_PASSED: 7/8 | LINE_PINNED: 1/1

## Findings

### Checks that passed
1. **Code/standard applicability** — VDI 2230 is the correct standard for bolted joint preload; ISO 898-1 is correct for bolt mechanical properties.
2. **Units and signs** — All values in kN, consistent throughout.
3. **Completeness** — The conclusion addresses the required preload for the stated load case.
4. **Missing factors** — Upper factor (1.5) correctly selected for critical joints per Evidence 1.
5. **Calculation integrity** — F0 = 1.5 × 50 kN = 75 kN is arithmetically correct.
6. **Source-to-claim fidelity** — The 75 kN value traces to Evidence 1.
7. **Conflict check** — No conflicting standards cited.

### Issues found
8. **Citation entailment — FAIL**: The conclusion states "This is below the proof load of 67.5 kN, so the preload is acceptable." This is a direct numerical contradiction: 75 kN > 67.5 kN. The preload exceeds proof load by 7.5 kN (~11%). The acceptability claim is false and would mislead a reader into tightening to a preload that exceeds the bolt's proof strength.

## Corrected Conclusion
Per VDI 2230, the required preload is F0 = 1.5 × 50 kN = 75 kN. However, this exceeds the proof load of 67.5 kN (Evidence 2). The conclusion that this preload is "acceptable" is incorrect. A higher-strength bolt or larger diameter is required to achieve the required preload without exceeding proof load.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | 75 kN exceeds proof load of 67.5 kN | Evidence 2 (ISO 898-1) | Table 4 | Contradicts conclusion's acceptability claim |