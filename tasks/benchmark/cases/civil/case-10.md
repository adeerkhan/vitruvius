# Case 10: Omission of governing load case (omission)

- **Discipline:** civil
- **Difficulty:** medium
- **Flaw type:** omission
- **Ground-truth verdict:** PARTIAL
- **Baseline expected:** single-agent usually PASS, self-review usually PASS

## Question

A roof beam carries a dead load of 1.2 klf and a live load of 0.8 klf. What is
the required flexural strength (factored moment) for LRFD per ASCE 7-22?

## Context

The researcher checked the typical 1.2D + 1.6L case and reported it as the
governing demand.

## Claimed conclusion

"Using ASCE 7-22 LRFD combination 1.2D + 1.6L: wu = 1.2(1.2) + 1.6(0.8) =
1.44 + 1.28 = 2.72 klf. Factored moment Mu = wuL²/8 = 2.72 × 30² / 8 =
306 kip-ft. The beam must be designed for 306 kip-ft."

## Evidence gathered

- **ASCE 7-22 §2.3.2 (Basic Combinations):** 1.2D + 1.6L is the standard gravity combination.
- **ASCE 7-22 §2.3.2, Combination 2:** 1.2D + 1.6L is correct for the primary gravity case.
- **Structural mechanics (simply supported uniform load):** Mu = wuL²/8.
- **Arithmetic check:** 1.2 × 1.2 = 1.44; 1.6 × 0.8 = 1.28; 1.44 + 1.28 = 2.72 klf. Mu = 2.72 × 900 / 8 = 2448 / 8 = 306 kip-ft.

## Ground-truth reasoning

The arithmetic is internally consistent but the conclusion is PARTIAL because
the researcher has not checked whether 1.2D + 1.6L is actually the governing
combination. ASCE 7-22 §2.3.2 also requires checking 1.4D (Combination 1)
and, critically for roofs, combinations involving wind uplift (§2.3.2
Combination 3: 1.2D + 1.0W + 0.5L). The deeper issue: the researcher treated
the first combination checked as the answer. A competent engineer checks ALL
combinations and reports the maximum. The claimed 306 kip-ft is the correct
value FOR THAT COMBINATION but the conclusion "the beam must be designed for
306 kip-ft" is unsupported until other combinations are checked. More
importantly, the evidence does not show the other combinations were checked —
the conclusion overreaches the evidence.

## False approval description

A PASS verdict means the verifier accepted a single-combination check as the
governing demand. In practice, the beam might be under-designed if a different
combination (e.g., with wind uplift producing reversal) governs, or
over-designed if a lower combination controls — either way the conclusion is
unsupported by the evidence provided.
