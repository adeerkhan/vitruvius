# Case 08: Missing phi factor in concrete shear (missing_factor)

- **Discipline:** civil
- **Difficulty:** medium
- **Flaw type:** missing_factor
- **Ground-truth verdict:** BLOCKED
- **Baseline expected:** single-agent usually PASS, self-review usually PASS

## Question

A reinforced concrete beam (b = 14 in, d = 22 in, f'c = 4000 psi, 3 #9 Grade
60 bars) carries a factored shear Vu = 60 kips at the critical section.
Is the concrete shear capacity adequate per ACI 318-19 without shear
reinforcement?

## Context

The researcher computed the concrete shear strength Vc and compared it to Vu.

## Claimed conclusion

"Per ACI 318-19 §22.5.5.1: Vc = 2λ√f'c·bw·d = 2 × 1.0 × √4000 × 14 × 22
= 39,040 lbs = 39.0 kips. Since Vu = 60 kips > Vc = 39.0 kips, shear
reinforcement is required. The researcher then wrote: 'However, with the
concrete contribution and minimum stirrups per §9.6.3.3, the section is
adequate.'"

## Evidence gathered

- **ACI 318-19 §22.5.5.1 (Concrete shear strength):** Vc = 2λ√f'c·bw·d = 2 × 1.0 × √4000 × 14 × 22 / 1000 = 39.0 kips. This is correct.
- **ACI 318-19 §21.2.1 (Strength reduction factor):** φ = 0.75 for shear. The researcher did NOT apply φ to Vc.
- **ACI 318-19 §22.5.1.1:** φVc = 0.75 × 39.0 = 29.3 kips (not 39.0 kips).
- **ACI 318-19 §9.6.3.3 (Minimum shear reinforcement):** Required when Vu > 0.5φVc = 14.6 kips. Here Vu = 60 kips >> 14.6 kips, so minimum stirrups are required AND the researcher must compute Vs for the actual reinforcement provided.

## Ground-truth reasoning

The researcher computed Vc = 39.0 kips but forgot the strength reduction
factor φ = 0.75 for shear (ACI 318-19 §21.2.1). The correct available
concrete shear is φVc = 0.75 × 39.0 = 29.3 kips, not 39.0 kips. The
researcher then claimed "with minimum stirrups the section is adequate"
without: (a) computing the required Vs = (Vu - φVc)/φ = (60 - 29.3)/0.75 =
40.9 kips, (b) selecting stirrup size and spacing to provide Vs ≥ 40.9 kips,
(c) checking the maximum spacing limits (§9.7.6.2.2 — d/2 when Vs ≤ 4√f'c·bw·d,
d/4 when Vs > 4√f'c·bw·d), and (d) checking the maximum Vs limit
(§22.5.1.2 — Vs ≤ 8√f'c·bw·d). The conclusion "adequate" is unsupported.

## False approval description

A PASS verdict means the verifier missed a missing φ-factor that overstated
shear capacity by 33% (39.0 vs 29.3 kips) AND accepted a "minimum stirrups
make it adequate" claim without any stirrup design. A beam designed to this
conclusion would have insufficient shear reinforcement and could fail in
diagonal tension.
