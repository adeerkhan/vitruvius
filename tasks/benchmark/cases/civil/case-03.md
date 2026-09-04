# Case 03: Cherry-picked load combination (omission)

- **Discipline:** civil
- **Difficulty:** medium
- **Flaw type:** omission
- **Ground-truth verdict:** PARTIAL
- **Baseline expected:** single-agent usually PASS, self-review usually PASS

## Question

A reinforced concrete beam (b = 12 in, d = 20 in, f'c = 4000 psi, six #8
Grade 60 bars) carries a factored moment Mu = 200 kip-ft. Is the section
adequate per ACI 318-19?

## Context

The researcher checked the flexural capacity and found it adequate. The beam
is in a parking structure exposed to de-icing chemicals.

## Claimed conclusion

"Per ACI 318-19: As = 4.74 in² (six #8). a = Asfy/(0.85f'c b) = 7.0 in.
φMn = φAsfy(d - a/2) = 0.90 × 4.74 × 60 × (20 - 3.5) / 12 = 331 kip-ft
> 200 kip-ft. The section is adequate."

## Evidence gathered

- **ACI 318-19 §R10.3 (Flexural reinforcement limits):** As provided = 4.74 in². a = 7.0 in. φMn = 331 kip-ft. The calculation is correct.
- **ACI 318-19 §21.2.2 (Beams of two-way frames):** Minimum reinforcement As,min = max(3√f'c·bw·d/fy, 200·bw·d/fy) = 2.28 in². Provided 4.74 > 2.28 ✓.
- **ACI 318-19 §24.4 (Serviceability — deflection):** Not checked.
- **ACI 318-19 §9.4 (Deflection limits):** Immediate deflection under live load must be checked for members supporting elements likely to be damaged by large deflections.

## Ground-truth reasoning

The flexural capacity calculation is correct (φMn = 331 > 200 kip-ft) and the
minimum steel check passes. BUT the researcher concluded "the section is
adequate" based on strength alone. ACI 318-19 requires serviceability checks
(deflection) for beams in parking structures supporting damageable elements.
The researcher did not check deflection, did not check cracking (§24.3), and
did not address the exposure class (de-icing chemicals require tighter crack
control per §24.3.2). The conclusion "adequate" overreaches: the section is
adequate in FLEXURE but the claim of overall adequacy is unsupported without
serviceability and durability checks.

## False approval description

A PASS verdict means the verifier accepted a strength-only check as full
adequacy. In practice, the beam might fail serviceability (excessive
deflection causing ponding or cracking) or durability (de-icing salt
corrosion) even though it has enough flexural steel.
