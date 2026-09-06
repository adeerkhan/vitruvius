# Draft: ASCE 7-22 Seismic Base Shear

## Research Question
How is seismic base shear V calculated per ASCE 7-22 Chapter 12?

## Evidence Table

| # | Claim | Source | Section | Confidence |
|---|-------|--------|---------|------------|
| 1 | V = Cs × W | ASCE 7-22 | §12.8, Eq. 12.8-1 | High |
| 2 | Cs = SDS / (R/Ie) | ASCE 7-22 | §12.8.1.1, Eq. 12.8-2 | High |
| 3 | Cs,max = SD1 / (T × R/Ie) for T ≤ TL | ASCE 7-22 | §12.8.1.1, Eq. 12.8-3 | High |
| 4 | Cs,max = SD1×TL / (T² × R/Ie) for T > TL | ASCE 7-22 | §12.8.1.1, Eq. 12.8-4 | High |
| 5 | Cs,min = 0.044 × SDS × Ie ≥ 0.01 | ASCE 7-22 | §12.8.1.1, Eq. 12.8-5 | High |
| 6 | Cs,min = 0.5×S1 / (R/Ie) when S1 ≥ 0.6g | ASCE 7-22 | §12.8.1.1, Eq. 12.8-6 | High |
| 7 | Ta = Ct × hn^x | ASCE 7-22 | §12.8.2.1, Eq. 12.8-7 | High |
| 8 | T ≤ Cu × Ta | ASCE 7-22 | §12.8.2, Table 12.8-1 | High |
| 9 | SDS = (2/3) × Fa × Ss | ASCE 7-22 | §11.4 | High |
| 10 | SD1 = (2/3) × Fv × S1 | ASCE 7-22 | §11.4 | High |
| 11 | Fx = Cvx × V (vertical distribution) | ASCE 7-22 | §12.8.3, Eq. 12.8-11 | High |
| 12 | Cvx = wx×hx^k / Σ(wi×hi^k) | ASCE 7-22 | §12.8.3, Eq. 12.8-12 | High |

## Findings

### W — Effective Seismic Weight
W includes dead load plus applicable portions of live load, snow load, and partition loads per ASCE 7-22 §12.7.2. It does NOT include earthquake load, wind load, or accidental torsion.

### Cs — Seismic Response Coefficient
Cs is the ratio of base shear to effective seismic weight. It depends on:
- SDS: design spectral acceleration at short period
- SD1: design spectral acceleration at 1-second period
- R: response modification factor (ductility + overstrength)
- Ie: importance factor
- T: fundamental period
- TL: long-period transition period

### Period Limits
- Approximate period: Ta = Ct × hn^x (Table 12.8-2)
- Upper limit: T ≤ Cu × Ta where Cu depends on SD1
- Cu ranges from 1.4 (SD1 ≥ 0.4) to 1.7 (SD1 ≤ 0.1)

### Analysis Methods (§12.6-12.9)
- ELF (§12.8): Regular structures, SDC B-D with height limits
- MRSA (§12.9): Required for irregular/tall buildings
- Nonlinear time-history (Ch. 16): Complex/irregular

## Status: DRAFT
