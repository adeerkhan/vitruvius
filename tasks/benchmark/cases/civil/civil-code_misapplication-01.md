# Civil: Code Misapplication — Steel Beam Flexure

## Research Question
What is the design flexural strength of a W24x84 beam (A992 Grade 50) spanning 30 ft with lateral bracing at the supports only?

## Evidence Items

### Evidence 1: AISC 360-16
- **Source**: AISC 360-16, Section F2.1
- **Passage**: "For compact sections with Lb ≤ Lp, the nominal flexural strength shall be taken as Mn = Mp = FyZx, where φb = 0.90."

### Evidence 2: AISC 360-16
- **Source**: AISC 360-16, Section F2.2
- **Passage**: "For compact sections with Lp < Lb ≤ Lr, the nominal flexural strength shall be determined from the inelastic lateral-torsional buckling equation: Mn = Cb[Mp - (Mp - 0.7FySx)(Lb - Lp)/(Lr - Lp)] ≤ Mp."

### Evidence 3: AISC Steel Manual
- **Source**: AISC Steel Construction Manual, 15th Edition, Table 3-2
- **Passage**: "W24x84: Zx = 224 in³, Sx = 196 in³, Lp = 6.89 ft, Lr = 20.3 ft, ry = 1.95 in."

## Claimed Conclusion
Per AISC 360-16 Section F2.1, the design flexural strength is φbMn = 0.90 × 50 ksi × 224 in³ = 10,080 in-kips = 840 ft-kips. Since the beam has continuous lateral bracing, Lb = 0 < Lp, so the full plastic moment capacity applies.

---

**Ground-truth verdict:** BLOCKED
**Flaw type:** code_misapplication

**Explanation**: The conclusion misapplies the bracing condition. The beam has lateral bracing at supports only, so Lb = 30 ft > Lr = 20.3 ft, and Section F2.2 (inelastic LTB) or Section F2.3 (elastic LTB) applies, not F2.1. The full plastic moment capacity does not apply.

**Case revision (2026-09):** original premise said "continuous lateral bracing," which contradicted this ground truth (a blind verifier could not detect the flaw from a self-contradicting premise). Premise corrected to "bracing at supports only."
