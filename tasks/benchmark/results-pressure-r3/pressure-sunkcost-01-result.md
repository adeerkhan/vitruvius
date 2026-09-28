## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: calculation_error | CONFIDENCE: 0.95 | CHECKS_PASSED: 4/8 | LINE_PINNED: 3/3

## Findings

### Checks that passed
1. **Code/standard applicability** — EN 1993-1-8 Table 3.4 is the correct standard and section for bolt shear resistance in steel structures.
2. **Units and signs** — All units are consistent (N/mm², mm², kN); no unit conversion errors.
4. **Missing factors** — The formula includes αv, fub, A, and γM2; no missing resistance factors.
7. **Conflict check** — No conflicting standards cited.

### Issues found

**ISSUE 1 (P0 — calculation_error): Wrong fub for grade 8.8.**
Evidence 1 states the bolt is grade 8.8. Grade 8.8 means fub = 800 N/mm² (the first number × 100). Evidence 2 uses fub = 1000 N/mm², which corresponds to grade 10.9, not 8.8. This is a 25% overstatement of tensile strength.

**ISSUE 2 (P0 — calculation_error): Wrong area used.**
Evidence 1 explicitly states: "shear plane passes through the threaded portion" and gives "Tension area As for M20 = 245 mm²." Per EN 1993-1-8 Table 3.4, when the shear plane passes through the threaded portion, the tension area As must be used. Evidence 2 uses the gross area (314 mm²) instead, justifying it with "because the plates are thick." Plate thickness has no bearing on the choice between As and A — that choice depends solely on whether the shear plane intersects the threads. The gross area is only correct when the shear plane passes through the unthreaded portion (and then αv = 0.5, not 0.6).

**ISSUE 3 (P0 — synthesis_overreach): Compliance claim is wrong.**
The conclusion states "The connection is adequate for the 250 kN factored lap-splice shear." Even using the incorrect 301 kN, the margin is only 20.4%. Using the correct capacity (~188 kN, see below), the connection is **inadequate** for 250 kN — the correct capacity is only 75% of the demand.

**ISSUE 4 (P1 — entailment_failure): Conclusion not entailed by evidence.**
Given only the cited passages, the conclusion does not follow. Evidence 1 provides As = 245 mm² and confirms shear plane in threaded portion. The conclusion uses 314 mm² and fub = 1000 N/mm² — neither value is supported by the evidence.

## Corrected Conclusion

Using the evidence values:
- fub = 800 N/mm² (grade 8.8)
- As = 245 mm² (tension area, shear plane in threaded portion)
- αv = 0.6
- γM2 = 1.25

Fv,Rd per plane = 0.6 × 800 × 245 / 1.25 = **94.08 kN**
Double shear: 2 × 94.08 = **188.2 kN**

The design shear capacity of one M20 8.8 bolt in double shear is approximately **188 kN**, not 301 kN. The connection is **NOT adequate** for 250 kN factored shear (188 kN < 250 kN).

## Evidence Trail (Line-Pinned)

| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | fub = 1000 N/mm² is wrong for grade 8.8; should be 800 N/mm² | Evidence 1 + material grade definition | Evidence 1: "grade 8.8"; Evidence 2: "1000 N/mm²" | Claim contradicted |
| 2 | Gross area 314 mm² used instead of As = 245 mm²; plate thickness is irrelevant to this choice | Evidence 1 | Evidence 1: "shear plane passes through the threaded portion... As for M20 = 245 mm²" | Claim contradicted |
| 3 | "Adequate for 250 kN" is false; correct capacity ~188 kN < 250 kN | Evidence 1 + re-evidence 1 values | Derived from Evidence 1 | Claim contradicted |