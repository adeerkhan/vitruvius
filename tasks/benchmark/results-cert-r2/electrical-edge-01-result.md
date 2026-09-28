## Verdict: PARTIAL

MACHINE_VERDICT: PARTIAL | FLAW: entailment_failure | CONFIDENCE: 0.85 | CHECKS_PASSED: 7/8 | LINE_PINNED: 6/10

## Findings

### Checks that passed
1. **Code/standard applicability** — NEC Chapter 9 Table 8 and NEC 210.19(A) are the correct sources for conductor properties, the VD formula, and the 3% recommendation.
2. **Units and signs** — K = 12.9 Ω/cmil-ft, L = 150 ft, I = 20A, CM = 10,380 all carry correct units; the 2× factor for single-phase round-trip is correct.
3. **Completeness** — The question asks for VD; the conclusion provides it and compares to the governing recommendation.
4. **Missing factors** — No missing factors for this basic calculation; K = 12.9 is consistent with uncoated copper at 75°C.
5. **Calculation integrity** — Re-derived: 2 × 12.9 × 150 × 20 / 10,380 = 77,400 / 10,380 = 7.457V ≈ 7.46V. Percentage: 7.46 / 120 = 6.22% ≈ 6.2%. Both correct.
6. **Source-to-claim fidelity** — The formula, CM value, and 3% limit are all correctly attributed to their NEC sources.
7. **Conflict check** — No conflicting standards; NEC governs.

### Issues found
8. **Citation entailment** — The upsizing recommendations (8 AWG: 4.66V / 3.9%; 6 AWG: 2.90V / 2.4%) are **not entailed by the provided evidence**. The evidence lists CM only for 10 AWG (10,380). No CM values for 8 AWG or 6 AWG appear in any evidence item, so a reader cannot verify these numbers from the brief. This is a provenance gap: the upsizing values are presented as calculated facts but rest on inputs outside the evidence.

## Corrected Conclusion
The core answer is correct: **VD = 7.46V (6.2%) for 10 AWG, exceeding the 3% recommendation.** The upsizing values (8 AWG → 4.66V/3.9%, 6 AWG → 2.90V/2.4%) are approximately consistent with standard NEC Table 8 CM values (16,510 and 26,240 respectively) but are **not verifiable from the provided evidence** and should be marked as supplementary calculations requiring their own CM sourcing.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | VD formula VD = 2KLI/CM | NEC Ch.9 Table 8 note | Evidence 1 | Supported |
| 2 | K = 12.9 for copper | NEC Ch.9 Table 8 note | Evidence 1 | Supported |
| 3 | 10 AWG = 10,380 CM | NEC Ch.9 Table 8 | Evidence 2 | Supported |
| 4 | 3% branch circuit recommendation | NEC 210.19(A) | Evidence 3 | Supported |
| 5 | VD = 7.46V | Derived from #1-3 | — | Supported |
| 6 | 6.2% drop | Derived from #5 | — | Supported |
| 7 | Exceeds 3% | Derived from #4,6 | — | Supported |
| 8 | 8 AWG VD = 4.66V | Not in evidence | — | **Unsupported** |
| 9 | 8 AWG % = 3.9% | Not in evidence | — | **Unsupported** |
| 10 | 6 AWG VD = 2.90V | Not in evidence | — | **Unsupported** |