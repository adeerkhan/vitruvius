# Test 3 Draft: Bearing Selection — L10 Life Calculation

## Evidence Table

| Claim | Source | URL | Status |
|-------|--------|-----|--------|
| L10 = (C/P)^p × 10^6 rev | ISO 281:2007 | iso.org/standard/38102 | VERIFIED |
| p=3 for ball, p=10/3 for roller | ISO 281:2007 §5 | mechcodex.com, cdcalculators.com | VERIFIED |
| L10h = L10 × 10^6 / (60 × n) | ISO 281:2007 | firgelliauto.com | VERIFIED |
| a1 reliability: 1.0 (90%), 0.62 (95%), 0.25 (99%) | ISO 281:2007 Table 2 | mechcodex.com | VERIFIED |
| Lnm = a1·aISO·L10 | ISO 281:2007 §9.3.3 | mechanixcalc.com, mesys.ag | VERIFIED |
| κ = ν/ν1 (viscosity ratio) | ISO 281:2007 Annex B | mechanixcalc.com | VERIFIED |

## Findings

### Basic Rating Life (L10)

**Formula:**
L10 = (C/P)^p × 10^6 revolutions

Where:
- L10 = basic rating life (millions of revolutions)
- C = basic dynamic load rating (N or kN) — from manufacturer catalog
- P = equivalent dynamic bearing load (N or kN)
- p = life exponent:
  - p = 3 for ball bearings (point contact)
  - p = 10/3 ≈ 3.333 for roller bearings (line contact)

**Life in Hours:**
L10h = L10 × 10^6 / (60 × n)

Where:
- L10h = basic rating life (hours)
- n = rotational speed (RPM)

### Statistical Meaning

L10 is the life at which 10% of a large population of identical bearings will have failed (90% reliability). It is a statistical rating based on the Weibull distribution, not a guaranteed lifespan for any individual bearing.

### Modified Rating Life (Lnm)

ISO 281:2007 introduced the modified rating life:

Lnm = a1 · aISO · L10

Where:
- a1 = reliability factor (ISO 281:2007 Table 2)
- aISO = life modification factor (lubrication, contamination, fatigue limit)

### Reliability Factors (a1)

| Reliability | Designation | a1 |
|-------------|-------------|-----|
| 90% | L10 | 1.0 |
| 95% | L5 | 0.62 |
| 96% | L4 | 0.53 |
| 97% | L3 | 0.44 |
| 98% | L2 | 0.33 |
| 99% | L1 | 0.25 |

### Viscosity Ratio (κ)

κ = ν / ν1

Where:
- ν = actual kinematic viscosity at operating temperature (mm²/s)
- ν1 = reference kinematic viscosity (from ISO 281:2007 Annex B)
  - For n ≥ 1000 rpm: ν1 = 4500 · n^(-0.5) · dm^(-0.5)
  - For n < 1000 rpm: ν1 = 45000 · n^(-0.83) · dm^(-0.5)
  - dm = bearing pitch diameter (mm)

When κ ≥ 1: full elastohydrodynamic film → maximum aISO
When κ < 1: mixed lubrication → reduced aISO → shorter life

### Worked Example

Ball bearing: C = 35 kN, P = 5 kN, n = 1800 RPM

1. Load ratio: C/P = 35/5 = 7.0
2. L10 = 7.0³ = 343 million revolutions
3. L10h = 343 × 10^6 / (60 × 1800) = 3,175 hours

## Sources
1. ISO 281:2007, "Rolling bearings — Dynamic load ratings and rating life"
2. ABMA Standard 9 (ball bearings)
3. ABMA Standard 11 (roller bearings)
4. ISO/TR 1281-2:2008, "Explanatory notes on ISO 281"
