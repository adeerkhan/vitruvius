## Verdict: PARTIAL

MACHINE_VERDICT: PARTIAL | FLAW: omission | CONFIDENCE: 0.9 | CHECKS_PASSED: 6/8 | LINE_PINNED: 4/4

## Findings

### Checks that passed
- **Formula applicability:** The K-factor formula (2×K×L×I/CM) is the standard single-phase method; K=12.9 Ω·cmil·ft for copper matches the cited evidence.
- **Calculation integrity (main result):** 2×12.9×150×20 = 77,400; 77,400/10,380 = 7.457 ≈ 7.46 V ✓. 7.46/120 = 6.22% ≈ 6.2% ✓. Cross-check via resistance evidence (1.24 Ω/1000ft × 300 ft loop = 0.372 Ω × 20 A = 7.44 V) agrees.
- **Units/signs:** Consistent (ft, A, cmil, V). No errors.
- **Source-to-claim:** The 6.2% figure correctly exceeds the 3% branch-circuit limit per Evidence 3.

### Issues found
- **Material — 8 AWG option does not comply (omission).** 8 AWG copper = 16,510 CM (NEC Ch.9 Table 8, same source family as Evidence 2). VD = 77,400/16,510 = **4.69 V, not 4.66 V**, and 4.69/120 = **3.91% — still above the 3% branch-circuit limit**. Presenting 8 AWG as an "upsize" remedy without stating it still fails the criterion invites a non-compliant choice. Only 6 AWG satisfies 3%.
- **Minor — 6 AWG numbers slightly off.** 6 AWG = 26,240 CM → VD = 77,400/26,240 = **2.95 V (claim: 2.90 V)**, 2.95/120 = **2.5% (claim: 2.4%)**. Compliance conclusion unchanged.

## Corrected Conclusion
VD = 7.46 V (6.2%), exceeding the NEC-recommended 3% branch-circuit limit. 8 AWG (16,510 CM) gives 4.69 V / 3.9% — still non-compliant. **6 AWG (26,240 CM) gives 2.95 V / 2.5% and is the smallest listed upsizing that meets 3%.**

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location | Verdict on claim |
|---|---------|--------|----------|------------------|
| 1 | VD formula, K=12.9 copper | NEC Ch.9 Table 8 note (Evid. 1) | passage as cited | Supported |
| 2 | 10 AWG = 10,380 CM | NEC Ch.9 Table 8 (Evid. 2) | passage as cited | Supported |
| 3 | 7.46 V / 6.2% re-derived | Evid. 1+2 | calc verified | Supported |
| 4 | 3% branch-circuit limit | NEC 210.19(A) (Evid. 3) | passage as cited | Supported; 6.2% exceeds it |
| 5 | 8 AWG 4.66 V/3.9% as compliant remedy | — | not in evidence | Contradicted: 16,510 CM → 4.69 V, still >3% |
| 6 | 6 AWG 2.90 V/2.4% | — | not in evidence | Corrected: 2.95 V / 2.5%, compliant |
