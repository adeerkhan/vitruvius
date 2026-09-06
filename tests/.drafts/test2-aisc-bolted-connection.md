# Draft: AISC 360 Bolted Shear Connection

## Research Question
What are the AISC 360 provisions for bolted shear connections per Chapter J?

## Evidence Table

| # | Claim | Source | Section | Confidence |
|---|-------|--------|---------|------------|
| 1 | Bolt shear: Rn = Fnv × Ab per shear plane | AISC 360 | §J3.6, Eq. J3-1 | High |
| 2 | φ = 0.75 for bolt shear | AISC 360 | §J3.6 | High |
| 3 | A325-N: Fnv = 54 ksi; A325-X: Fnv = 68 ksi | AISC 360 | Table J3.2 | High |
| 4 | A490-N: Fnv = 68 ksi; A490-X: Fnv = 84 ksi | AISC 360 | Table J3.2 | High |
| 5 | Bearing: Rn = 2.4 × d × t × Fu (deformation considered) | AISC 360 | §J3.10, Eq. J3-6a | High |
| 6 | Tearout: Rn = 1.2 × Lc × t × Fu | AISC 360 | §J3.10, Eq. J3-6b | High |
| 7 | φ = 0.75 for bearing/tearout | AISC 360 | §J3.10 | High |
| 8 | Combined shear-tension: F'nt = 1.3Fnt - (Fnt/(φ×Fnv))×frv ≤ Fnt | AISC 360 | §J3.7, Eq. J3-5a | High |
| 9 | Slip-critical: Rn = μ × Du × hf × Tb × ns | AISC 360 | §J3.8, Eq. J3-8 | High |
| 10 | φ = 1.0 for slip-critical (serviceability), 0.75 (strength) | AISC 360 | §J3.8 | High |
| 11 | Block shear: Rn = 0.60FuAnv + UbsFuAnt ≤ 0.60FyAgv + UbsFuAnt | AISC 360 | §J4.3, Eq. J4-5 | High |
| 12 | φ = 0.75 for block shear | AISC 360 | §J4.3 | High |
| 13 | Min bolt spacing: 2.67d (prefer 3d) | AISC 360 | §J3.3 | High |
| 14 | Min edge distance: Table J3.4 (diameter-dependent) | AISC 360 | Table J3.4 | High |

## Findings

### Limit States Inventory
1. **Bolt Shear** (J3.6): Rn = Fnv × Ab × ns — φ = 0.75
2. **Bolt Bearing** (J3.10): Rn = 2.4 × d × t × Fu — φ = 0.75
3. **Tearout** (J3.10): Rn = 1.2 × Lc × t × Fu — φ = 0.75
4. **Combined Shear-Tension** (J3.7): Modified F'nt interaction — φ = 0.75
5. **Slip-Critical** (J3.8): Rn = μ × Du × hf × Tb × ns — φ = 0.75/1.0
6. **Block Shear Rupture** (J4.3): Rn = 0.60FuAnv + UbsFuAnt — φ = 0.75
7. **Gross Section Yielding** (J4.1): Rn = Fy × Ag — φ = 1.00
8. **Net Section Rupture** (J4.2): Rn = Fu × Ae — φ = 0.75

### Phi Factors Summary
| Limit State | φ (LRFD) | Ω (ASD) |
|-------------|----------|---------|
| Bolt shear | 0.75 | 2.00 |
| Bearing/tearout | 0.75 | 2.00 |
| Slip-critical (serviceability) | 1.00 | — |
| Slip-critical (strength) | 0.75 | 2.00 |
| Block shear | 0.75 | 2.00 |
| Gross yielding | 1.00 | 1.67 |
| Net rupture | 0.75 | 2.00 |

### Key Design Procedure (§J3)
1. Determine factored loads from LRFD combinations
2. Select bolt grade (A325 or A490) and condition (N or X)
3. Calculate bolt shear capacity per Table J3.2
4. Determine number of bolts required
5. Check bearing and tearout per J3.10
6. Check block shear per J4.3
7. Check slip-critical capacity if required per J3.8
8. Check combined shear-tension per J3.7 if applicable

## Status: DRAFT
