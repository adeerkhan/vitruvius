## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: calculation_error | CONFIDENCE: 0.95 | CHECKS_PASSED: 5/8 | LINE_PINNED: 4/4

## Findings

### Checks that passed
- **Applicability:** VDI 2230 Part 1 is the correct standard for bolted-joint preload; ISO 898-1 is correct for bolt strength class (E1, E2).
- **Units/signs:** kN consistent throughout; axial tension sign convention consistent (E1, E3).
- **Formula application:** F0 = 1.5 × 50 kN = 75 kN is arithmetically correct and follows E1's "upper factor for critical joints".
- **Load-factor check:** ΔFb = Φ × Fe = 0.20 × 50 = 10 kN per E3, giving bolt working load Fb = 75 + 10 = 85 kN.

### Issues found
- **P0 — Direct contradiction of Evidence 2:** The conclusion asserts 75 kN "is below the proof load of 67.5 kN." 75 > 67.5. The preload *exceeds* the stated proof load, violating the acceptability claim. The deliverable's go/no-go statement is inverted.
- **P0 — Near-ultimate margin:** With E3, bolt load reaches ~85 kN vs stated ultimate 85.8 kN (~0.9% margin). The conclusion ignores the load factor entirely (omission) and asserts acceptability with no margin quantification.
- **P1 — Evidence 2 internal consistency:** Sp = 0.90 × UTS is stated, yet 67.5 kN / 85.8 kN ≈ 0.79, not 0.90. The cited proof-load value does not entail its own quoted relation; the strength basis is unreliable.

## Corrected Conclusion
On the evidence as given, F0 = 75 kN exceeds the stated proof load (67.5 kN) and, after load transfer (Fb ≈ 85 kN), essentially consumes the stated ultimate capacity (85.8 kN). The preload is NOT acceptable per these evidence items; "tighten to 75 kN" is unsupported. (Note: Evidence 2's strength values are internally inconsistent with its own 0.90 ratio; strength basis requires re-derivation before any preload can be approved.)

## Evidence Trail (Line-Pinned)

| # | Finding | Source | Location | Verdict on claim |
|---|---------|--------|----------|------------------|
| 1 | F0 = 1.5 × Fmax upper factor for critical joints | VDI 2230 Part 1 | §5.4 | Supported |
| 2 | Class 10.9 proof load Sp = 67.5 kN; 75 kN > 67.5 kN | ISO 898-1 | Table 4 | Contradicts conclusion's acceptability claim |
| 3 | ΔFb = Φ × Fe, Φ ≈ 0.20 → Fb ≈ 85 kN vs ult. 85.8 kN | VDI 2230 | Fig. 5.2 | Omitted by conclusion; near-ultimate |
| 4 | Sp/ult = 67.5/85.8 ≈ 0.79 ≠ stated 0.90 ratio | ISO 898-1 | Table 4 | Internal inconsistency in evidence |
