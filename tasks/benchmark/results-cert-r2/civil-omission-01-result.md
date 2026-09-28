## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: omission | CONFIDENCE: 0.95 | CHECKS_PASSED: 7/8 | LINE_PINNED: 1/1

## Findings

### Checks that passed
1. **Code/standard applicability** — Terzaghi's equation is the correct method for continuous footings on cohesionless soil.
2. **Units and signs** — pcf, ft, psf are consistent throughout; no unit errors.
3. **Missing factors** — Factor of safety (3.0) is explicitly stated and applied.
4. **Calculation integrity** — Arithmetic is correct: 0.5(120)(6)(22.0) = 7,920; (120)(3)(23.2) = 8,352; sum = 16,272; /3.0 = 5,424.
5. **Source-to-claim fidelity** — Equation and bearing capacity factors are correctly attributed to cited sources.
6. **Conflict check** — No conflicting standards or methods are present.
7. **Citation entailment** — The conclusion follows logically from the formula and factors provided.

### Issues found
- **Completeness (omission)** — The groundwater table is at 2 ft depth, which is above the footing base at 3 ft. The conclusion uses total unit weight (γ = 120 pcf) for both the Nγ and Nq terms. Below the water table, the effective unit weight (γ' ≈ 120 − 62.4 = 57.6 pcf) must be used for the Nγ term. This omission overestimates ultimate capacity by ~25% and the allowable pressure by the same margin. The groundwater evidence is provided but not used; using it materially changes the answer.

## Corrected Conclusion
The conclusion is unusable as delivered. The allowable bearing pressure of 5,424 psf is overstated because it ignores buoyancy effects. With γ' = 57.6 pcf below the water table, the Nγ term becomes 0.5(57.6)(6)(22.0) = 3,802 psf (vs. 7,920 psf), yielding qult ≈ 12,154 psf and qall ≈ 4,051 psf — a 25% reduction. The deliverable fails because the specific value requested is wrong.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | Groundwater at 2 ft depth omitted from calculation | Site Investigation Report (fictional) | Evidence 3, line 18 | Contradicts conclusion — material omission |