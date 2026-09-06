# Draft: ACI 318-19 Flexural Strength

## Research Question
How is nominal flexural strength Mn calculated per ACI 318-19?

## Evidence Table

| # | Claim | Source | Section | Confidence |
|---|-------|--------|---------|------------|
| 1 | εcu = 0.003 (max concrete strain) | ACI 318-19 | §22.2.2.1 | High |
| 2 | Whitney stress block: 0.85f'c uniform stress | ACI 318-19 | §22.2.2.4.1 | High |
| 3 | a = β1 × c | ACI 318-19 | §22.2.2.4 | High |
| 4 | β1 = 0.85 for f'c ≤ 4000 psi | ACI 318-19 | Table 22.2.2.4.3 | High |
| 5 | β1 reduces by 0.05/1000psi above 4000psi, min 0.65 | ACI 318-19 | Table 22.2.2.4.3 | High |
| 6 | Mn = As × fy × (d - a/2) | ACI 318-19 | §22.3 | High |
| 7 | a = As × fy / (0.85 × f'c × b) | ACI 318-19 | §22.2.2.4.1 | High |
| 8 | φ = 0.90 for tension-controlled (εt ≥ 0.005) | ACI 318-19 | Table 21.2.2 | High |
| 9 | φ = 0.65 for compression-controlled | ACI 318-19 | Table 21.2.2 | High |
| 10 | Transition: φ = 0.65 + 0.25(εt - εty)/(0.005 - εty) | ACI 318-19 | Table 21.2.2 | High |
| 11 | εt = 0.003 × (d - c)/c | ACI 318-19 | §21.2.2 | High |
| 12 | ρmin = max(3√f'c/fy, 200/fy) | ACI 318-19 | §9.6.1.2 | High |
| 13 | Tensile strength of concrete is neglected | ACI 318-19 | §22.2.2.2 | High |

## Findings

### Whitney Stress Block
The Whitney stress block (ACI 318-19 §22.2.2.4.1) replaces the actual parabolic concrete stress distribution with an equivalent rectangular distribution:
- **Stress intensity:** 0.85f'c (uniform)
- **Depth:** a = β1 × c
- **β1 factor:** 0.85 for f'c ≤ 4000 psi; reduces by 0.05 per 1000 psi above 4000 psi; minimum 0.65 (Table 22.2.2.4.3)

### Design Assumptions (§22.2.2)
1. Plane sections remain plane (linear strain distribution)
2. εcu = 0.003 at extreme compression fiber
3. Tensile strength of concrete is neglected
4. Steel is elastic-perfectly plastic (fy is yield stress)

### Nominal Flexural Strength
For singly reinforced rectangular beam:

**Step 1:** a = As × fy / (0.85 × f'c × b)
**Step 2:** Mn = As × fy × (d - a/2)
**Step 3:** φMn = φ × Mn

### Strength Reduction Factors (Table 21.2.2)

| Section Type | εt | φ |
|-------------|-----|---|
| Tension-controlled | εt ≥ 0.005 | 0.90 |
| Transition zone | εty < εt < 0.005 | 0.65 to 0.90 |
| Compression-controlled (spiral) | εt ≤ εty | 0.75 |
| Compression-controlled (other) | εt ≤ εty | 0.65 |

### Net Tensile Strain
εt = 0.003 × (d - c)/c where c = a/β1

- **Tension-controlled:** εt ≥ 0.005 (φ = 0.90)
- **Compression-controlled:** εt ≤ εty (φ = 0.65 for Grade 60)
- **Transition:** Linear interpolation between 0.65 and 0.90

### Reinforcement Limits
- **Minimum:** ρmin = max(3√f'c/fy, 200/fy) per §9.6.1.2
- **Maximum:** Corresponds to εt = 0.004 (compression-controlled boundary)

## Status: DRAFT
