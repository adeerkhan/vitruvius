## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: omission | CONFIDENCE: 0.95 | CHECKS_PASSED: 5/8 | LINE_PINNED: 3/3

## Findings

### Checks that passed
1. **Code/standard applicability** — Terzaghi bearing capacity equation is the correct classical method for continuous footings on cohesionless soil.
2. **Units and signs** — All units consistent (pcf, ft, psf); no sign errors.
3. **Calculation integrity** — Arithmetic is correct: 0.5(120)(6)(22.0) = 7,920; (120)(3)(23.2) = 8,352; sum = 16,272 psf; /3.0 = 5,424 psf.
4. **Source-to-claim fidelity** — The formula and factors cited match the evidence passages provided.
5. **Citation entailment** — The conclusion follows from the cited passages taken at face value.

### Issues found
1. **OMISSION — Groundwater not accounted for (P0 blocker).** Evidence 3 states the groundwater table is 2 ft below ground surface with ±1 ft seasonal fluctuation. The footing base is at 3 ft depth — meaning the footing base is only 1 ft above the groundwater table, and seasonal high water (1 ft below surface) would submerge the footing base entirely. When the water table is within the footing depth, the effective unit weight of the soil below the water table must be reduced (submerged unit weight γ' = γ - 62.4 pcf), and the γDfNq term must account for the submerged condition. The conclusion uses the full γ = 120 pcf for both terms without any groundwater correction. This is a material omission that would significantly reduce the calculated bearing capacity. The conclusion as stated is wrong for the given site conditions.

2. **OMISSION — Shape/depth factors not applied (P1).** Evidence 2 explicitly states "Shape and depth factors must be applied for non-strip footings." The conclusion applies no shape or depth factors. While the footing is described as "continuous" (strip), the evidence flags this as a requirement, and the conclusion does not address it.

## Corrected Conclusion
The claimed allowable bearing pressure of 5,424 psf is **not valid** for the stated site conditions. The groundwater table at 2 ft depth (with seasonal fluctuation to 1 ft depth) requires reduction of the effective unit weight in the γDfNq term and potentially in the 0.5γBNγ term depending on the water table position relative to the footing base. Without this correction, the bearing capacity is overestimated. The conclusion must be revised to account for groundwater effects before it can be used.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | Terzaghi equation correctly cited | Evidence 1 | Passage | Supports formula |
| 2 | Nq=23.2, Nγ=22.0 for φ'=32° | Evidence 2 | Passage | Supports factors |
| 3 | Groundwater at 2 ft, ±1 ft fluctuation | Evidence 3 | Passage | **Contradicts conclusion** — not used in calculation |