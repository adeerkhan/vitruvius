## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: code_misapplication | CONFIDENCE: 0.95 | CHECKS_PASSED: 3/8 | LINE_PINNED: 3/3

## Findings

### Checks that passed
- **Units and signs**: 18 inches rise, 180 inches run — consistent.
- **Calculation integrity**: 18:180 = 1:10 (10%) — arithmetic correct.
- **Source-to-claim fidelity**: IBC 1012.2 passage quoted accurately.

### Issues found
1. **Code misapplication (P0)**: The conclusion applies the IBC 1:8 slope allowance, but that provision applies only to rises up to 3 inches. The site condition states an 18-inch rise, which exceeds 3 inches. IBC 1012.2 explicitly requires compliance with ADA Standards (1:12 maximum) for rises exceeding 3 inches. The conclusion uses the wrong code threshold.
2. **Omission (P0)**: The conclusion ignores ADA 2010 Section 405.2, which is the governing standard for this 18-inch rise. ADA 405.2 mandates a maximum slope of 1:12 (8.33%) and a maximum rise of 30 inches per run. The 1:10 (10%) slope exceeds the ADA maximum.
3. **Citation entailment failure**: The conclusion claims code compliance, but the evidence shows non-compliance with the applicable standard (ADA 405.2). The 1:10 slope is steeper than the 1:12 maximum.

## Corrected Conclusion
For an 18-inch rise, ADA 2010 Section 405.2 governs (IBC 1012.2 defers to ADA for rises > 3 inches). The maximum allowable slope is 1:12 (8.33%). The proposed 1:10 (10%) slope exceeds this maximum and does not comply with code. A minimum run of 216 inches (18 feet) is required for an 18-inch rise at 1:12 slope.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | IBC 1:8 applies only to rises ≤ 3 inches | IBC 2021 | § 1012.2 | Contradicts conclusion |
| 2 | ADA 1:12 maximum slope governs 18-inch rise | ADA 2010 | § 405.2 | Contradicts conclusion |
| 3 | 1:10 slope exceeds 1:12 maximum | ADA 2010 | § 405.2 | Contradicts conclusion |