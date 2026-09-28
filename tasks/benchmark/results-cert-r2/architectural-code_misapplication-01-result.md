## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: code_misapplication | CONFIDENCE: 0.95 | CHECKS_PASSED: 3/8 | LINE_PINNED: 3/3

## Findings

### Checks that passed
- **Units and signs**: 18 inches rise, 180 inches run — consistent units, correct ratio 18:180 = 1:10.
- **Calculation integrity**: 18/180 = 0.10 = 10% — arithmetic is correct.
- **Source-to-claim fidelity**: The conclusion correctly quotes IBC 1012.2's 1:8 threshold and ADA 405.2's 1:12 threshold.

### Issues found
- **P0 — Code misapplication (`code_misapplication`)**: The conclusion applies IBC 1012.2's 1:8 slope threshold to an 18-inch rise. IBC 1012.2 explicitly limits the 1:8 threshold to "rises up to 3 inches." For rises exceeding 3 inches, IBC 1012.2 requires compliance with ADA Standards (1:12 maximum). The 18-inch rise falls squarely in the ADA-governed category. The correct maximum slope is **1:12 (8.33%)**, not 1:8 (12.5%).
- **P0 — Compliance conclusion is wrong**: The actual slope of 1:10 (10%) exceeds the ADA maximum of 1:12 (8.33%). The ramp does **not** comply with code. The conclusion's claim of compliance is false.
- **P1 — Omission of governing standard**: The conclusion fails to acknowledge that ADA 405.2 governs this case, not IBC 1012.2's 1:8 threshold. This is a criterion-mismatch qualification that changes the answer.

## Corrected Conclusion
Per IBC 1012.2, rises exceeding 3 inches must comply with ADA Standards. ADA 405.2 sets the maximum ramp slope at 1:12 (8.33%). With an 18-inch rise and 180 inches of horizontal run, the actual slope is 18:180 = 1:10 (10%), which **exceeds** the 1:12 maximum. The ramp does **not** comply with code. To comply, the horizontal run must be at least 18 × 12 = 216 inches (18 feet).

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | IBC 1012.2 limits 1:8 slope to rises ≤ 3 in; > 3 in must comply with ADA | IBC 2021 | § 1012.2 | Contradicts conclusion |
| 2 | ADA 405.2 maximum slope is 1:12 (8.33%) | ADA 2010 | § 405.2 | Contradicts conclusion |
| 3 | 18:180 = 1:10 (10%) exceeds 1:12 (8.33%) | Derived from Evidence 3 | Calculation | Contradicts conclusion |