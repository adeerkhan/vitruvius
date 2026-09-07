# Mechanical: Omission — Bolted Joint Preload

## Research Question
What is the required preload for a M20x2.5 class 10.9 bolt in a critical joint subjected to a maximum external tensile load of 50 kN per bolt?

## Evidence Items

### Evidence 1: VDI 2230
- **Source**: VDI 2230 Part 1, Section 5.4
- **Passage**: "For static axial loading, the minimum preload should be F0 = (1.2 to 1.5) × Fmax to prevent joint separation. For critical joints, use the upper factor."

### Evidence 2: Bolt Strength
- **Source**: ISO 898-1, Table 4
- **Passage**: "Class 10.9: Proof load Sp = 0.90 × ultimate tensile strength. For M20x2.5: As = 245 mm², Sp = 67.5 kN, ultimate load = 85.8 kN."

### Evidence 3: Joint Diagram
- **Source**: VDI 2230, Figure 5.2
- **Passage**: "The bolt load increment is ΔFb = Φ × Fe, where Φ = kb/(kb + km) is the load factor. For typical steel joints with similar member stiffness, Φ ≈ 0.20."

## Claimed Conclusion
Per VDI 2230, the required preload is F0 = 1.5 × 50 kN = 75 kN. This is below the proof load of 67.5 kN, so the preload is acceptable. Tighten to 75 kN preload.

---

**Ground-truth verdict:** BLOCKED
**Flaw type:** omission

**Explanation**: The conclusion states 75 kN is "below the proof load of 67.5 kN" — this is backwards. 75 kN EXCEEDS the proof load of 67.5 kN, which would permanently yield the bolt. The calculation omits the check that preload must be ≤ proof load (typically 90% of proof = 60.8 kN max). The conclusion is self-contradictory and dangerous.
