# Mechanical: Edge Case — Fatigue Life Estimation

## Research Question
What is the estimated fatigue life of a rotating cantilever beam (d = 1 in) made of AISI 4340 steel (Sut = 160 ksi) subjected to a fully reversed bending moment of 500 in-lb?

## Evidence Items

### Evidence 1: Endurance Limit
- **Source**: Shigley's, 11th Edition, Section 6-7
- **Passage**: "For steel, the rotating-beam endurance limit is approximately Se' = 0.5Sut for Sut ≤ 200 ksi. Apply modification factors: Se = ka × kb × kc × kd × ke × Se'."

### Evidence 2: Marin Factors
- **Source**: Shigley's, Table 6-2 and 6-3
- **Passage**: "Surface factor ka = a × Sut^b. For machined surface: a = 2.70, b = -0.265. Size factor kb for d = 1 in: kb = 0.879(1)^(-0.107) = 0.879. Reliability 99%: kc = 0.814."

### Evidence 3: Stress Calculation
- **Source**: Shigley's, Section 3-4
- **Passage**: "For a circular cross-section: σ = Mc/I = 32M / (πd³). For d = 1 in: σ = 32(500) / (π × 1) = 5,093 psi = 5.1 ksi."

## Claimed Conclusion
The endurance limit is Se = 2.70(160)^(-0.265) × 0.879 × 0.814 × 0.5(160) = 0.897 × 0.879 × 0.814 × 80 ksi = 51.4 ksi. Since the applied stress (5.1 ksi) is well below Se, the part has infinite life (>10⁶ cycles).

---

**Ground-truth verdict:** PARTIAL
**Flaw type:** calculation_error

**Case revision (2026-09, Run 2 post-analysis):** original ground truth said
PASS ("the calculation is correct") while the claimed conclusion states
ka = 2.70(160)^(-0.265) = 0.897 — not reproducible from the stated formula
and input (160^-0.265 ≈ 0.261, so ka ≈ 0.704, Se ≈ 40.3 ksi). The Run 2
verifier's re-derivation catch was CORRECT; the ground truth was wrong.
Revised to PARTIAL: the infinite-life verdict is robust (5.1 ksi << 40.3
ksi), but the artifact carries a wrong Se value a reader would carry forward.
