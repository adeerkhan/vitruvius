## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: calculation_error | CONFIDENCE: 0.95 | CHECKS_PASSED: 5/8 | LINE_PINNED: 3/3

## Findings

### Checks that passed
1. **Code/standard applicability** — EN 1993-1-8 Table 3.4 is the correct standard and section for bolt shear resistance.
2. **Units and signs** — All units consistent (N/mm², mm², kN); no sign errors.
4. **Missing factors** — αv = 0.6, fub = 1000 N/mm², γM2 = 1.25 all present and correctly applied.
7. **Conflict check** — No conflicting standards cited.

### Issues found
5. **Calculation integrity FAIL** — Evidence 1 explicitly states tension area As = 245 mm² for M20. The calculation uses gross area 314 mm². Per EN 1993-1-8, when shear plane passes through threaded portion, As must be used. Correct value: 0.6 × 1000 × 245 / 1.25 = 117.6 kN/plane → 235.2 kN double shear.
6. **Source-to-claim fidelity FAIL** — The 301 kN claim contradicts the evidence-provided As = 245 mm². The "thick plates" justification for using gross area is unsupported by the evidence and incorrect per the standard.
8. **Citation entailment FAIL** — The conclusion does not follow from the cited evidence. Evidence supports 235.2 kN, not 301 kN.

**Material finding:** The claimed capacity is wrong by 28% (301 vs 235.2 kN). The adequacy claim for 250 kN is also wrong — correct capacity (235.2 kN) is 5.9% below demand.

## Corrected Conclusion
The design shear capacity of one M20 8.8 bolt in double shear is **235.2 kN** (using As = 245 mm² per EN 1993-1-8). The connection is **inadequate** for 250 kN factored shear (shortfall of 14.8 kN).

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | As = 245 mm² for M20 | Evidence 1 | EN 1993-1-8 Table 3.4 excerpt | Contradicts claim's use of 314 mm² |
| 2 | αv = 0.6, γM2 = 1.25 | Evidence 1 | EN 1993-1-8 Table 3.4 excerpt | Correctly applied |
| 3 | Claimed 301 kN | Evidence 2 | Project calc §4.2 | Wrong — uses gross area not As |