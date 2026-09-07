# Electrical: Edge Case — Voltage Drop Calculation

## Research Question
What is the voltage drop for a 120V, 20A single-phase circuit using 10 AWG copper conductors, 150 ft one-way length?

## Evidence Items

### Evidence 1: Voltage Drop Formula
- **Source**: NEC Chapter 9, Table 8 (informative note)
- **Passage**: "VD = 2 × K × L × I / CM, where K = 12.9 Ω/cmil-ft for copper, L = one-way length in feet, I = current in amps, CM = circular mils of conductor."

### Evidence 2: Conductor Properties
- **Source**: NEC Chapter 9, Table 8
- **Passage**: "10 AWG copper: 10,380 CM, uncoated. Resistance: 1.24 Ω/1000ft at 75°C."

### Evidence 3: Voltage Drop Limit
- **Source**: NEC 210.19(A)
- **Passage**: "Branch circuits: recommended maximum 3% voltage drop. Feeders + branch circuits combined: recommended maximum 5%."

## Claimed Conclusion
VD = 2 × 12.9 × 150 ft × 20A / 10,380 CM = 77,400 / 10,380 = 7.46V. Percentage drop = 7.46V / 120V = 6.2%. This exceeds the recommended 3% limit. Upsize to 8 AWG (VD = 4.66V, 3.9%) or 6 AWG (VD = 2.90V, 2.4%).

---

**Ground-truth verdict:** BLOCKED
**Flaw type:** calculation_error

**Explanation**: The math is correct for the formula, but the final recommendation is wrong. The conclusion says "Upsize to 8 AWG (VD = 4.66V, 3.9%)" — 3.9% still exceeds 3%. The correct recommendation is 6 AWG (2.4%) to meet the 3% limit. The conclusion's first recommended fix doesn't actually solve the problem.
