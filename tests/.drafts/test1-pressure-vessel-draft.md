# Test 1 Draft: Pressure Vessel Design — ASME BPVC Section VIII

## Evidence Table

| Claim | Source | URL | Status |
|-------|--------|-----|--------|
| UG-27(c)(1) formula: t = PR/(SE - 0.6P) | ASME BPVC VIII-1 | engineersedge.com, austenite.org | VERIFIED |
| UG-27(c)(2) formula: t = PR/(2SE + 0.4P) | ASME BPVC VIII-1 | austenite.org | VERIFIED |
| Validity: P ≤ 0.385·S·E or t ≤ R/2 | ASME BPVC VIII-1 | mechanixcalc.com, austenite.org | VERIFIED |
| UG-28 external pressure: chart-based method | ASME BPVC VIII-1 | wildfireengineeringsupply.com | VERIFIED |
| Do/t ≥ 10: Pa = 4B/(3·Do/t) | ASME BPVC VIII-1 UG-28 | wildfireengineeringsupply.com | VERIFIED |
| Do/t < 10: thick-wall regime | ASME BPVC VIII-1 UG-28 | wildfireengineeringsupply.com | VERIFIED |

## Findings

### Internal Pressure (UG-27)

**Circumferential Stress (Longitudinal Joints):**
t = P·R / (S·E - 0.6·P)

- t = minimum required wall thickness
- P = internal design pressure (gauge)
- R = inside radius (corroded condition)
- S = allowable stress at design temperature (ASME Section II, Part D)
- E = joint efficiency (1.0 full RT, 0.85 spot RT, 0.70 no RT)

**Longitudinal Stress (Circumferential Joints):**
t = P·R / (2·S·E + 0.4·P)

**Validity:** Both formulas valid when P ≤ 0.385·S·E (equivalently t ≤ R/2). Above this, use Mandatory Appendix 1-2 (Lamé thick-wall equations).

**MAWP Back-Calculation:**
P = S·E·t / (R + 0.6·t)

### External Pressure (UG-28)

External pressure design is fundamentally different — it is a buckling problem, not a stress problem. The procedure is iterative:

1. Assume trial thickness t
2. Calculate ratios: L/Do and Do/t
3. Determine Factor A from Figure G (Section II, Part D, Subpart 3)
4. Enter material chart with Factor A → obtain Factor B
5. Calculate Pa using appropriate formula:
   - Do/t ≥ 10: Pa = 4B / (3·Do/t)
   - Do/t < 10: Pa = min(Pa1, Pa2) where Pa2 = (2S/(Do/t))·(1 - 1/(Do/t))
6. Compare Pa ≥ P (design external pressure)

**Key difference:** Internal pressure = material strength governs. External pressure = geometric stability (buckling) governs.

## Sources
1. ASME Boiler and Pressure Vessel Code, Section VIII, Division 1, UG-27
2. ASME Section II, Part D — Allowable Stresses
3. ASME Section VIII, Division 1, UG-28
4. D.R. Moss, "Pressure Vessel Design Manual," Elsevier
