# Civil: Omission — Foundation Bearing Capacity

## Research Question
What is the allowable bearing pressure for a 6 ft wide continuous footing at 3 ft depth in sandy soil (φ' = 32°, γ = 120 pcf)?

## Evidence Items

### Evidence 1: Terzaghi Bearing Capacity
- **Source**: Terzaghi, Peck, & Mesri (1996), Soil Mechanics in Engineering Practice, Section 4.3
- **Passage**: "For a continuous footing on cohesionless soil: qult = 0.5γBNγ + γDfNq, where Nγ and Nq are bearing capacity factors dependent on φ'."

### Evidence 2: Bearing Capacity Factors
- **Source**: Meyerhof (1963), as cited in NAVFAC DM 7.1
- **Passage**: "For φ' = 32°: Nq = 23.2, Nγ = 22.0 (Meyerhof factors). Shape and depth factors must be applied for non-strip footings."

### Evidence 3: Groundwater Note
- **Source**: Site Investigation Report (fictional)
- **Passage**: "Groundwater table is located 2 ft below ground surface. Seasonal fluctuation of ±1 ft expected."

## Claimed Conclusion
Using Terzaghi's equation with φ' = 32°, the ultimate bearing capacity is qult = 0.5(120 pcf)(6 ft)(22.0) + (120 pcf)(3 ft)(23.2) = 7,920 + 8,352 = 16,272 psf. With a factor of safety of 3.0, the allowable bearing pressure is qall = 5,424 psf.

---

**Ground-truth verdict:** BLOCKED
**Flaw type:** omission

**Explanation**: The calculation omits the groundwater effect. With the water table at 2 ft depth, the effective unit weight below the footing is reduced to γ' = 120 - 62.4 = 57.6 pcf for the Nγ term. The conclusion uses the total unit weight throughout, overestimating capacity by ~25%.
