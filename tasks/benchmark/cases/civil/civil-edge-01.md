# Civil: Edge Case — Unit Conversion Error

## Research Question
What is the required weld length for a fillet weld connection carrying a factored load of 150 kips using E70XX electrodes?

## Evidence Items

### Evidence 1: AISC 360-16
- **Source**: AISC 360-16, Section J2.4
- **Passage**: "The nominal strength of a fillet weld is Fw = 0.60FEXX(1.0 + 0.50sin^1.5θ), where FEXX is the electrode classification strength in ksi. For transverse welds (θ = 90°), the factor is 1.50."

### Evidence 2: AISC 360-16
- **Source**: AISC 360-16, Table J2.5
- **Passage**: "Minimum fillet weld size: 1/4 inch for material thickness over 1/2 inch. Maximum: 5/16 inch for material 1/4 inch or thicker."

### Evidence 3: Load Combination
- **Source**: ASCE 7-16, Section 2.3
- **Passage**: "Strength design shall use load combinations including 1.2D + 1.6L. The factored load of 150 kips already includes load factors."

## Claimed Conclusion
Using a 1/4" fillet weld with E70XX electrode, the design strength per inch is φRn = 0.75 × 0.60 × 70 ksi × 1.5 × 0.25 in = 11.81 kips/inch. For 150 kips, the required weld length is 150 / 11.81 = 12.7 inches. Provide 13 inches of 1/4" fillet weld each side.

---

**Ground-truth verdict:** BLOCKED
**Flaw type:** unit_sign_error

**Explanation**: The weld size is in inches but the calculation treats 1/4" as 0.25 without converting the throat properly. The effective throat of a fillet weld is 0.707 × weld size = 0.707 × 0.25 = 0.177 in, not 0.25 in. The correct strength is φRn = 0.75 × 0.60 × 70 × 1.5 × 0.177 = 8.36 kips/in, requiring 18 inches, not 13.
