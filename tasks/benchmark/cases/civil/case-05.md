# Case 05: Overreaching conclusion from partial evidence (synthesis_overreach)

- **Discipline:** civil
- **Difficulty:** hard
- **Flaw type:** synthesis_overreach
- **Ground-truth verdict:** PARTIAL
- **Baseline expected:** single-agent usually PASS, self-review usually PASS

## Question

Can a W8x31 beam (Fy = 50 ksi) with a 12 ft span and lateral bracing at
third points (Lb = 4 ft) safely carry a total service load of 3.0 klf
(dead + live)?

## Context

The researcher checked flexure and found the plastic moment adequate. The
researcher then concluded the beam is "safe for all limit states." The beam
supports a non-composite concrete slab.

## Claimed conclusion

"Per AISC 360-16 §F2: W8x31 is compact, φbMp = 0.90 × 50 × 27.4 / 12 =
103 kip-ft. Factored uniform load wu = 1.2(1.0) + 1.6(0.5) = 2.0 klf
(assuming D=1.0, L=0.5 klf). Mu = wuL²/8 = 2.0 × 12² / 8 = 36 kip-ft.
φbMp = 103 >> 36 kip-ft. The beam is safe for all limit states."

## Evidence gathered

- **AISC 360-16 Table 3-2 (W8x31):** Zx = 27.4 in³, Sx = 22.5 in³, ry = 2.02 in, d = 8.00 in, bf = 7.995 in, tf = 0.435 in, tw = 0.285 in.
- **AISC 360-16 §F2 (Compactness):** λflange = bf/2tf = 9.18, λp = 9.15. The flange is NON-COMPACT (9.18 > 9.15) — barely, but it exceeds the limit. The researcher called it compact.
- **AISC 360-16 §F3 (Noncompact Web Elements):** For a noncompact flange, φbMn is computed per §F3, not §F2. The capacity is slightly reduced.
- **AISC 360-16 §F2.2 (LTB):** Lp = 1.76ry√(E/Fy) = 1.76 × 2.02 × √(29000/50) / 12 = 7.8 ft. Lb = 4 ft < Lp, so LTB does not reduce capacity. ✓
- **AISC 360-16 §G (Shear):** Not checked. For W8x31, φvVn ≈ 0.6 × 0.6 × 50 × 8.00 × 0.285 = 41 kips. Factored shear Vu = wuL/2 = 2.0 × 12/2 = 12 kips. Shear is adequate but was not shown.
- **AISC 360-16 §B3.1 (Required strength):** The load breakdown D=1.0, L=0.5 was assumed, not given in the question. The researcher invented load fractions.

## Ground-truth reasoning

The researcher's conclusion "safe for all limit states" overreaches the
evidence in three ways:
1. **Compactness misclassified:** The flange is noncompact (9.18 > 9.15),
   so §F3 applies, not §F2. The capacity is slightly lower than claimed —
   though for this case it likely still passes, the researcher applied the
   wrong section.
2. **Unstated load assumption:** The researcher assumed D=1.0, L=0.5 klf
   (splitting the given 3.0 klf total) without stating it. If the actual
   live load is higher, Mu increases.
3. **"All limit states" unsupported:** Shear and deflection were not
   checked. They likely pass, but the conclusion claims coverage that the
   evidence does not show.

The beam is probably adequate in reality, but the conclusion "safe for all
limit states" is unsupported by the evidence presented. The correct verdict
is PARTIAL — the flexural check is roughly right (modulo the compactness
misclassification), but the sweeping conclusion overreaches.

## False approval description

A PASS verdict means the verifier accepted an overreaching "all limit states"
conclusion based on a single check with a misclassified compactness limit and
unstated load assumptions. This is the synthesis_overreach pattern: the
conclusion is probably directionally correct but claims more than the
evidence supports — and in a different case, the unexamined limit state
(shear, deflection, or stability) could be the one that fails.
