## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: calculation_error | CONFIDENCE: 0.95 | CHECKS_PASSED: 4/8 | LINE_PINNED: 3/3

## Findings

### Checks that passed
1. **Code/standard applicability** — EN 1993-1-8 Table 3.4 is the correct standard and section for bolt shear resistance.
2. **Units and signs** — N/mm², mm², kN are consistent throughout.
3. **Completeness** — The conclusion addresses the specific question asked (double-shear capacity).
4. **Conflict check** — No conflicting standards cited.

### Issues found
1. **Wrong area used (P0)** — Evidence 1 explicitly states tension area As = 245 mm² for M20. Evidence 2 uses gross area 314 mm². The evidence does not support gross-area use; αv = 0.6 applies when the shear plane passes through the threaded portion, which requires As, not gross area.
2. **Calculation error (P0)** — Re-derivation with evidence values: Fv,Rd = 0.6 × 1000 × 245 / 1.25 = 117.6 kN/plane; double shear = 235.2 kN. The claimed 301 kN is wrong.
3. **Adequacy claim false (P0)** — With the evidence-supported capacity of 235.2 kN, the connection is NOT adequate for 250 kN factored shear (235.2 < 250). The claim of adequacy rests on the incorrect 301 kN value.

## Corrected Conclusion
The design shear capacity of one M20 8.8 bolt in double shear is 235.2 kN (using As = 245 mm² per EN 1993-1-8 Table 3.4). The connection is NOT adequate for 250 kN factored lap-splice shear.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | As = 245 mm² for M20 | Evidence 1 | EN 1993-1-8 Table 3.4 excerpt | Contradicts claim's use of 314 mm² |
| 2 | αv = 0.6 for threaded shear plane | Evidence 1 | EN 1993-1-8 Table 3.4 excerpt | Requires tension area, not gross |
| 3 | Claimed 301 kN unsupported | Evidence 2 | Project calc §4.2 | Wrong input; evidence gives As = 245 mm² |