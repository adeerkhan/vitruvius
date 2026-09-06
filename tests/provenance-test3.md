# Provenance Sidecar: Test 3 — ACI 318-19 Flexural Strength

- **Test ID:** civil-test-03
- **Code:** ACI 318-19 (Building Code Requirements for Structural Concrete)
- **Chapter:** 22 (Strength and Serviceability Requirements)
- **Sections:** 22.2 (Flexural Strength), 21.2.2 (Strength Reduction Factors)
- **Date Researched:** 2026-09-05
- **Source Access:** Secondary (web-based references, not direct code text)
- **Confidence:** High
- **Verifier:** Blind 7-check protocol — PASS (7/7)

## Primary Sources Consulted
1. ACI 318-19 (referenced via idecad.com, structuremag.org)
2. ACI 318-19 Table 22.2.2.4.3 (β1 values)
3. ACI 318-19 Table 21.2.2 (Strength reduction factors)
4. ACI 318-19 §22.2.2.4.1 (Whitney stress block definition)
5. STRUCTURE Magazine, "Flexural Design of Reinforced Concrete Beam Sections" (April 2023)
6. EngineersEdge.com Whitney Stress Block Calculator
7. EngineersUniverse Concrete Beam Flexure Reference
8. ConcreteMat.com Flexural Analysis Guide (July 2026)

## Key Equations Verified
- Whitney stress block: 0.85f'c uniform stress over depth a = β1 × c
- Mn = As × fy × (d - a/2) (nominal flexural strength)
- a = As × fy / (0.85 × f'c × b) (stress block depth)
- εt = 0.003 × (d - c)/c (net tensile strain)
- ρmin = max(3√f'c/fy, 200/fy) (minimum reinforcement)

## Phi Factors Verified
- φ = 0.90 for tension-controlled (εt ≥ 0.005)
- φ = 0.65 for compression-controlled (other reinforcement)
- φ = 0.75 for compression-controlled (spiral reinforcement)
- Transition: φ = 0.65 + 0.25(εt - εty)/(0.005 - εty)

## Limitations
- No direct access to ACI 318-19 copyrighted text
- Findings based on engineering references, calculators, and magazine articles
- Version: ACI 318-19 (current edition as of 2026)
- Note: ACI 318-19 changed εt boundary from 0.005 to εty+0.003 for tension-controlled, but for Grade 60 this equals 0.005
