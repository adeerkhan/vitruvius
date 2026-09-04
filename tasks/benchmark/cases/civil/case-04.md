# Case 04: Missing stability check (missing_factor)

- **Discipline:** civil
- **Difficulty:** hard
- **Flaw type:** missing_factor
- **Ground-truth verdict:** BLOCKED
- **Baseline expected:** single-agent usually PASS, self-review usually PASS

## Question

A W10x45 steel beam (Fy = 50 ksi) spans 18 ft laterally braced only at the
ends (Lb = 18 ft). It carries a factored moment Mu = 250 kip-ft. Is the beam
adequate in flexure per AISC 360-16?

## Context

The researcher checked yielding (plastic moment Mp) and found φbMp >
Mu. The beam is bent about the strong axis. The researcher did not check
lateral-torsional buckling.

## Claimed conclusion

"Per AISC 360-16 §F2 (Compact Symmetric Members Bent About Major Axis): the
section is compact (λflange = 6.1 < λp = 9.15, λweb = 41.6 < λp = 90.5 per
Table B4.1b). φbMp = φbFyZx = 0.90 × 50 × 54.9 / 12 = 206 kip-ft. The beam
is adequate for Mu = 250 kip-ft... wait, 206 < 250. Let me recompute. The
researcher actually reported: φbMp = 0.90 × 50 × 54.9 / 12 = 206 kip-ft,
then wrote 'with the continuity factor and lateral bracing, φbMn = 285 kip-ft
> 250 kip-ft. The beam is adequate.'"

## Evidence gathered

- **AISC 360-16 Table 3-2 (W10x45):** Zx = 54.9 in³, Sx = 49.1 in³, ry = 2.01 in, J = 1.54 in⁴.
- **AISC 360-16 §F2.2 (Compact Web and Flange):** The section is compact, so φbMp = φbFyZx = 0.90 × 50 × 54.9 / 12 = 206 kip-ft. Correct.
- **AISC 360-16 §F2 (Yielding limit state):** φbMp = 206 kip-ft. This is LESS than Mu = 250 kip-ft. The researcher claimed 285 kip-ft but did not show how.
- **AISC 360-16 §F2.2 (LTB):** Lp = 1.76ry√(E/Fy) = 1.76 × 2.01 × √(29000/50) / 12 = 7.7 ft. Lb = 18 ft >> Lp. Lateral-torsional buckling GOVERNS.
- **AISC 360-16 §F2.2 (Lb > Lp):** For Lb > Lp, φbMn is computed from elastic critical moment Cr, which is lower than φbMp. For this section at Lb = 18 ft, φbMn ≈ 145 kip-ft (from AISC Table 3-10), NOT 285 kip-ft.

## Ground-truth reasoning

The researcher claimed φbMn = 285 kip-ft but the correct value accounting for
lateral-torsional buckling is ≈ 145 kip-ft — half the claimed capacity and
far below the 250 kip-ft demand. The researcher either invented the 285
number or applied a "continuity factor" that does not exist for a simply
supported beam. The researcher never checked LTB (the Lb = 18 ft vs Lp =
7.7 ft comparison), which is the governing limit state. The conclusion
"adequate" is wrong: the beam has roughly half the required capacity.

## False approval description

A PASS verdict means the verifier missed a missing stability check that
halved the beam's capacity. A designer relying on this would install a beam
at 50% of required strength — a bending failure under full load. The
missing LTB check is the classic "the researcher stopped after the first
passing check" error.
