# Electrical: Synthesis Overreach — Cable Sizing

## Research Question
What is the minimum copper conductor size for a 3-phase, 480V, 200A continuous load in a cable tray with 3 current-carrying conductors, ambient temperature 40°C?

## Evidence Items

### Evidence 1: NEC Table 310.16
- **Source**: NFPA 70 (NEC), Table 310.16
- **Passage**: "75°C copper ampacity: 2/0 AWG = 175A, 3/0 AWG = 200A, 4/0 AWG = 230A. Based on 30°C ambient with 3 current-carrying conductors in raceway."

### Evidence 2: NEC 310.15
- **Source**: NEC 310.15(B)(1)
- **Passage**: "Ambient temperature correction factor for 40°C: 0.91 for 75°C rated conductors. Adjusted ampacity = table value × correction factor."

### Evidence 3: NEC 210.20
- **Source**: NEC 210.20(A)
- **Passage**: "Overcurrent protection for continuous loads: OCPD rating ≥ 125% of continuous load. For 200A continuous, OCPD ≥ 250A. Conductor must be rated for the OCPD after corrections."

## Claimed Conclusion
Per NEC Table 310.16, a 3/0 AWG copper conductor has an ampacity of 200A at 75°C. With the 40°C correction factor of 0.91, the adjusted ampacity is 200 × 0.91 = 182A. Since the load is 200A, 3/0 AWG is insufficient. However, using the 90°C column (230A) with 0.91 correction gives 209A, which exceeds 200A. Therefore, 3/0 AWG is adequate.

---

**Ground-truth verdict:** BLOCKED
**Flaw type:** synthesis_overreach

**Explanation**: The conclusion uses the 90°C column ampacity for sizing, but NEC 110.14(C) requires the 75°C column for terminals rated 75°C (typical). The 90°C column is only for derating calculations, not for final ampacity. The correct answer is 4/0 AWG (230A × 0.91 = 209A ≥ 200A, but actually needs 250A for continuous — see Evidence 3). The conclusion also misses the 125% continuous load rule entirely.
