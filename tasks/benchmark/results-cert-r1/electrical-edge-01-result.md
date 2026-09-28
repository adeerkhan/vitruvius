## Verdict: PARTIAL

MACHINE_VERDICT: PARTIAL | FLAW: calculation_error | CONFIDENCE: 0.85 | CHECKS_PASSED: 7/8 | LINE_PINNED: 3/5

## Findings

### Checks that passed
1. **Code/standard applicability** — NEC Ch.9 Table 8 and NEC 210.19(A) are the correct sources for conductor properties and voltage drop recommendations.
2. **Units and signs** — K [Ω/cmil-ft] × L [ft] × I [A] / CM [cmil] = V; the factor of 2 for single-phase go/return is correct.
3. **Completeness** — Main question (10 AWG VD) fully addressed; upsizing alternatives provided.
4. **Missing factors** — K = 12.9 Ω/cmil-ft is consistent with the stated R = 1.24 Ω/1000ft (12.9/10,380 = 1.243 Ω/1000ft).
5. **Source-to-claim fidelity** — All main claims (formula, CM value, 3% limit) trace to cited evidence.
6. **Conflict check** — No conflicting standards; evidence is internally consistent.
7. **Citation entailment** — The main conclusion (7.46V, 6.2%, exceeds 3%) follows from the evidence.

### Issues found
1. **Upsizing calculation errors (material)** — 8 AWG VD claimed as 4.66V; correct value is 77,400/16,510 = **4.69V**. 6 AWG VD claimed as 2.90V (2.4%); correct values are 77,400/26,240 = **2.95V (2.5%)**. These are detected discrepancies between the conclusion's assertions and what the formula yields, capping the verdict at PARTIAL per the severity gate.
2. **Unverified upsizing inputs** — The 8 AWG (16,510 CM) and 6 AWG (26,240 CM) circular-mil values used in the upsizing recommendations are **not present in the evidence items**. The evidence only provides 10 AWG properties. These load-bearing numbers for the recommendation rest on unverifiable sources within this brief.

### Quality gate
- CHECKS_PASSED 7/8 ≥ 6/8 ✓
- LINE_PINNED 3/5 = 60% < 80% → verdict MUST be PARTIAL or BLOCKED ✓
- Material finding present → verdict CANNOT be PASS ✓

## Corrected Conclusion
VD = 2 × 12.9 × 150 × 20 / 10,380 = **7.46V**. Percentage drop = 7.46V / 120V = **6.2%**. This exceeds the recommended 3% limit (3.6V). Upsizing to 8 AWG yields VD ≈ **4.69V (3.9%)**; upsizing to 6 AWG yields VD ≈ **2.95V (2.5%)**. The 10 AWG calculation and the exceedance conclusion are correct; the upsizing values require correction and their CM inputs require evidence support.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | VD formula VD = 2KLI/CM | Evidence 1 | NEC Ch.9 Table 8 note | Verified — correct |
| 2 | 10 AWG = 10,380 CM | Evidence 2 | NEC Ch.9 Table 8 | Verified — correct |
| 3 | 3% branch circuit limit | Evidence 3 | NEC 210.19(A) | Verified — correct |
| 4 | 8 AWG VD = 4.66V | — | Not in evidence | **Unverified input; correct value 4.69V** |
| 5 | 6 AWG VD = 2.90V (2.4%) | — | Not in evidence | **Unverified input; correct value 2.95V (2.5%)** |