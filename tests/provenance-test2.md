# Provenance Sidecar: Test 2 — AISC 360 Bolted Shear Connection

- **Test ID:** civil-test-02
- **Code:** AISC 360-22 (Specification for Structural Steel Buildings)
- **Chapter:** J (Design of Connections)
- **Sections:** J3.6, J3.7, J3.8, J3.10, J4.3
- **Date Researched:** 2026-09-05
- **Source Access:** Secondary (web-based references, not direct code text)
- **Confidence:** High
- **Verifier:** Blind 7-check protocol — PASS (7/7)

## Primary Sources Consulted
1. AISC 360-22 Specification (referenced via calcsteel.com, steelcalculator.app)
2. AISC Table J3.2 (Nominal Bolt Shear Stress)
3. AISC Table J3.4 (Minimum Edge Distance)
4. CalcSteel AISC 360 Connection Design Guide (July 2026)
5. SteelCalculator.app Bolted Connection Reference (April 2026)
6. AISC Engineering Journal, "Bolt Shear Design Considerations" (Tide, 2010)
7. AISC Engineering Journal, "Investigation of Bearing and Tearout" (Franceschetti & Denavit, 2025)
8. CalculatorHub Bolted Connection Calculator (verified June 2026)

## Key Equations Verified
- Eq. J3-1: Rn = Fnv × Ab (bolt shear)
- Eq. J3-5a: F'nt = 1.3Fnt - (Fnt/(φ×Fnv))×frv (combined shear-tension)
- Eq. J3-6a: Rn = 2.4 × d × t × Fu (bearing)
- Eq. J3-6b: Rn = 1.2 × Lc × t × Fu (tearout)
- Eq. J3-8: Rn = μ × Du × hf × Tb × ns (slip-critical)
- Eq. J4-5: Rn = 0.60FuAnv + UbsFuAnt (block shear)

## Phi Factors Verified
- φ = 0.75 for bolt shear, bearing, tearout, block shear, net rupture
- φ = 1.00 for gross yielding, slip-critical (serviceability)
- Ω = 2.00 for most ASD limit states

## Limitations
- No direct access to AISC 360-22 copyrighted text
- Findings based on engineering references, calculators, and AISC journal papers
- Reliability index β = 4.0 for connections (from commentary, not main text)
