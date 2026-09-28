## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: synthesis_overreach | CONFIDENCE: 0.92 | CHECKS_PASSED: 5/8 | LINE_PINNED: 3/3

## Findings

### Checks that passed
1. **Code/standard applicability** — NEC is the correct standard for US electrical installations; sections 310.16, 310.15, and 210.20 are relevant.
2. **Units and signs** — All values in amperes, consistent throughout.
3. **Calculation integrity** — 200 × 0.91 = 182A is arithmetically correct; 230 × 0.91 = 209.3A is arithmetically correct.
4. **Conflict check** — No conflicting standards cited.
5. **Citation entailment (partial)** — The 75°C column values and correction factor are correctly cited.

### Issues found

**P0 — Synthesis Overreach (BLOCKER):** The conclusion introduces a 90°C column ampacity of 230A for 3/0 AWG that is **not present in any evidence item**. Evidence 1 lists only 75°C values (2/0=175A, 3/0=200A, 4/0=230A). The 230A figure appears to be the 4/0 AWG 75°C value misattributed to 3/0 AWG at 90°C. This is a fabricated data point.

**P0 — Entailment Failure (BLOCKER):** The evidence does not support the conclusion that 3/0 AWG is adequate. The evidence supports the opposite: at 75°C with 40°C correction, 3/0 AWG = 182A < 200A load. The conclusion's adequacy claim rests entirely on the unsupported 90°C column value.

**P1 — Missing Governing Criterion:** The conclusion ignores NEC 110.14(C) termination temperature requirements. For 200A+ equipment, terminations are typically rated 75°C, requiring use of the 75°C column — not the 90°C column. The 90°C column is for ampacity adjustment only, not final conductor sizing when terminations are 75°C rated.

**P1 — Omission:** Evidence 3 (NEC 210.20) establishes that the OCPD must be ≥250A and the conductor must be rated for the OCPD after corrections. The conclusion does not address whether 3/0 AWG can be protected at 250A or whether a larger conductor is required.

## Corrected Conclusion

Per the evidence provided: 3/0 AWG copper at 75°C has an ampacity of 200A. With the 40°C ambient correction factor of 0.91, the adjusted ampacity is 182A, which is **insufficient** for a 200A continuous load. The evidence does not support the adequacy of 3/0 AWG. A larger conductor (4/0 AWG at 75°C = 230A × 0.91 = 209A) would be required if using the 75°C column. The 90°C column may not be usable for final sizing due to termination temperature ratings per NEC 110.14(C).

## Evidence Trail (Line-Pinned)

| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | 3/0 AWG at 75°C = 200A; with 0.91 correction = 182A | Evidence 1, 2 | Table 310.16; 310.15(B)(1) | Supports insufficiency of 3/0 |
| 2 | 90°C column value of 230A for 3/0 AWG | None | Not in evidence | Unsupported — fabricated |
| 3 | Conclusion that 3/0 AWG is adequate | — | — | Contradicted by evidence |