## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: calculation_error | CONFIDENCE: 0.95 | CHECKS_PASSED: 3/8 | LINE_PINNED: 3/3

## Findings

### Checks that passed
1. **Code/standard applicability** — VDI 2230 and ISO 898-1 are the correct standards for bolted joint preload and bolt strength. PASS.
2. **Units and signs** — All units are consistent (kN, mm²). PASS.
3. **Conflict check** — No conflict between the two cited standards. PASS.

### Issues found
1. **P0 — Calculation/comparison error (calculation_error):** The conclusion states "This is below the proof load of 67.5 kN." This is mathematically false. 75 kN > 67.5 kN. The preload exceeds the proof load by 11.1%. This is not a minor error — it inverts the safety logic of the entire conclusion.
2. **P0 — Source-to-claim fidelity failure (synthesis_overreach):** The evidence (ISO 898-1) states Sp = 67.5 kN. The conclusion claims 75 kN is below this value. The source directly contradicts the claim.
3. **P1 — Omission of governing criterion (omission):** The conclusion fails to address that preload must not exceed proof load (or yield strength). VDI 2230 requires preload ≤ proof load for static loading. The conclusion ignores this constraint entirely.

## Corrected Conclusion
Per VDI 2230, the required preload is F0 = 1.5 × 50 kN = 75 kN. However, this exceeds the proof load Sp = 67.5 kN (ISO 898-1). The preload is NOT acceptable as stated. The bolt is undersized for this load case — either a larger bolt size or higher property class is required, or the joint must be redesigned to reduce the required preload factor.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | F0 = 1.5 × 50 = 75 kN | VDI 2230 §5.4 | Evidence 1 | Correct calculation |
| 2 | 75 kN < 67.5 kN proof load | ISO 898-1 | Evidence 2 | FALSE — 75 > 67.5 |
| 3 | Preload acceptable | — | Conclusion | Contradicted by evidence |