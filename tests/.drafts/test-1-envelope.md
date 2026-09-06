# Test 1 Draft: R-value vs U-value

## Research Question
What is the difference between R-value and U-value in building envelope thermal performance? How are they related (U = 1/R)? What are typical R-values for wall assemblies per ASHRAE 90.1? How does thermal bridging affect effective R-value?

## Evidence Table

| Source | Section/Standard | Finding |
|--------|------------------|---------|
| ASHRAE 90.1-2022 | Tables 5.5-1 through 5.5-8 | Prescriptive R-value minimums for walls by climate zone |
| ASHRAE 90.1-2022 | Section 5.5 | Envelope requirements including thermal bridging provisions |
| ASHRAE 90.1-2022 Addendum ay | Appendix A | Method for determining effective R-value including thermal bridging |
| ASHRAE Fundamentals Handbook | Chapter 26 | Thermal resistance and transmittance definitions |
| ASTM C1363 | Test Method | Hot box apparatus for measuring thermal performance of assemblies |

## Findings

### 1. R-value vs U-value Definitions

**R-value (Thermal Resistance):** Measures a material or assembly's resistance to heat flow. Higher R-value = better insulation. Units: ft²·°F·hr/BTU (IP) or m²·K/W (SI). R = thickness / thermal conductivity.

**U-value (Thermal Transmittance):** Measures the rate of heat transfer through an assembly. Lower U-value = better insulation. Units: BTU/hr·ft²·°F (IP) or W/m²·K (SI).

**Relationship:** U = 1/R. For single-layer materials, this is a direct reciprocal. For multi-layer assemblies, the total R-value is the sum of individual layer R-values, then U = 1/R_total.

### 2. ASHRAE 90.1 Prescriptive R-values (from search results)

Climate zone 1: No requirement for mass walls; no requirement for steel-framed walls
Climate zone 2: Mass walls R-5.7 ci; Steel-framed R-3.8 ci + R-13 cavity
Climate zone 3: Mass walls R-7.6 ci; Steel-framed R-5 ci + R-13 cavity
Climate zone 4: Mass walls R-9.5 ci; Steel-framed R-7.5 ci + R-13 cavity
Climate zone 5: Mass walls R-11.4 ci; Steel-framed R-10 ci + R-13 cavity
Climate zone 6: Mass walls R-13.3 ci; Steel-framed R-12.5 ci + R-13 cavity
Climate zone 7: Mass walls R-15.2 ci; Steel-framed R-12.5 ci + R-13 cavity
Climate zone 8: Mass walls R-19 ci; Steel-framed R-18.8 ci + R-13 cavity

Note: ci = continuous insulation. Steel-framed walls require both ci and cavity insulation.

### 3. Thermal Bridging Effects

Thermal bridging occurs when materials with higher thermal conductivity (steel studs, concrete lintels, shelf angles) create direct heat flow pathways through insulation. Effects include:

- **Effective R-value reduction:** Steel studs reduce effective wall R-value by 40-60% compared to cavity-only R-value
- **ASHRAE 90.1-2022 new provisions:** Section 5.5 now includes thermal bridging requirements; Informative Appendix K provides guidance
- **Linear thermal transmittance (Ψ):** Heat flow through bridges measured in W/m·K; U_eq = U + Ψ × (L/A)
- **Impact on loads:** Thermal bridges create localized cold spots driving perimeter heating requirements

### 4. Verification Method

Per ASHRAE Addendum ay: Effective R-value determined by parallel-path method considering framing and cavity separately, then summing effective R-values.

## Provenance
- Sources: ASHRAE.org, ICC Safe, ASHRAE Fundamentals, buildingenclosureonline.com
- Standard versions: ASHRAE 90.1-2022, ASHRAE Fundamentals 2021
- Last verified: 2026-09-05
- Confidence: High (official standards and technical literature)