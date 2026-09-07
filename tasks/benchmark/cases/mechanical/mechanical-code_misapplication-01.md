# Mechanical: Code Misapplication — Shaft Design

## Research Question
What is the maximum allowable torque for a 2-inch diameter solid steel shaft (AISI 1045 cold-drawn) under steady torsion with a factor of safety of 2.5?

## Evidence Items

### Evidence 1: Shigley's Mechanical Engineering Design
- **Source**: Shigley's, 11th Edition, Section 5-3
- **Passage**: "For ductile materials under static torsion: τmax = Sy / (2N), where Sy is yield strength and N is factor of safety. The maximum shear stress theory gives τallow = 0.5Sy / N."

### Evidence 2: AISI 1045 Properties
- **Source**: ASTM A29 / MMPDS-01
- **Passage**: "AISI 1045 cold-drawn: Sy = 71 ksi, Su = 91 ksi, Shear yield Ssy = 0.577Sy = 41.0 ksi (von Mises criterion)."

### Evidence 3: Torsion Formula
- **Source**: Shigley's, 11th Edition, Section 3-4
- **Passage**: "For a solid circular shaft: τ = Tr/J, where J = πd⁴/32. Maximum shear occurs at outer fiber: τmax = 16T / (πd³)."

## Claimed Conclusion
Using the maximum shear stress theory, τallow = 0.5(71 ksi) / 2.5 = 14.2 ksi. The allowable torque is T = τallow × πd³ / 16 = 14.2 × π(2)³ / 16 = 14.2 × 3.1416 × 8 / 16 = 22.3 in-kips = 22,300 in-lb.

---

**Ground-truth verdict:** BLOCKED
**Flaw type:** code_misapplication

**Explanation**: The conclusion uses τallow = 0.5Sy (Tresca/MSS theory) but cites von Mises shear yield Ssy = 0.577Sy in Evidence 2. For consistency with the cited material data, the allowable should be τallow = 0.577(71) / 2.5 = 16.4 ksi, giving T = 25,700 in-lb. The conclusion applies the wrong failure criterion.
