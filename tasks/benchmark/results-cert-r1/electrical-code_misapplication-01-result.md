## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: entailment_failure | CONFIDENCE: 0.85 | CHECKS_PASSED: 6/8 | LINE_PINNED: 1/1

## Findings

### Checks that passed
1. **Code/standard applicability**: NEC Table 250.66 is the correct table for GEC sizing based on service-entrance conductors.
2. **Units and signs**: All units are AWG/kcmil for copper; no conversion issues.
3. **Completeness**: The made-electrode exception (Evidence 2) is correctly not applied — a concrete-encased electrode (Ufer ground) is not a made electrode/ground rod.
4. **Missing factors**: None identified.
5. **Calculation integrity**: Table lookup only; no calculation to re-derive.
7. **Conflict check**: No conflicting standards cited.

### Issues found
6. **Source-to-claim fidelity**: Evidence 1 (Table 250.66 excerpt) contains rows for 3/0 AWG, 4/0 AWG, and 500 kcmil only. The 600 kcmil row is **absent**. The conclusion asserts 600 kcmil → 1/0 AWG, but this specific mapping is not in the evidence.
8. **Citation entailment**: Given only the cited passage (up to 500 kcmil → 1/0 AWG), the conclusion that 600 kcmil → 1/0 AWG does not follow. The evidence is incomplete for the stated service size. The conclusion extrapolates beyond the evidence.

## Corrected Conclusion
Cannot be corrected from the provided evidence. The 600 kcmil row of NEC Table 250.66 must be obtained to verify the claim. The conclusion may be correct in reality, but the evidence provided does not support it.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | 600 kcmil → 1/0 AWG mapping not in evidence | Evidence 1 (Table 250.66 excerpt) | Rows shown: 3/0, 4/0, 500 kcmil only | Unsupported |