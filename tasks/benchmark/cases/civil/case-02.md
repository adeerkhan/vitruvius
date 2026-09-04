# Case 02: Sign error in effective length factor (unit_sign_error)

- **Discipline:** civil
- **Difficulty:** medium
- **Flaw type:** unit_sign_error
- **Ground-truth verdict:** BLOCKED
- **Baseline expected:** single-agent usually PASS, self-review usually PASS

## Question

A 20 ft tall steel column (W12x65, Fy = 50 ksi) is fixed at the base and
free at the top (cantilever flagpole condition). What is the available
compressive strength φcPn per AISC 360-16?

## Context

The researcher is using the effective length approach. For a fixed-free
column, the effective length factor K = 2.0 (AISC 360-16 Table C-A-7.1,
Case (f)).

## Claimed conclusion

"Fixed-free condition: K = 0.5 (per AISC Table C-A-7.1 Case (f)). Effective
length KL = 0.5 × 20 ft = 10 ft. From AISC 360-16 Table 4-1 for W12x65 at
KL = 10 ft: φcPn = 495 kips. The column is adequate for the required 400 kips."

## Evidence gathered

- **AISC 360-16 Table C-A-7.1 (Side-sway uninhibited effective length factors):** Case (f) — Fixed base, free top: K = 2.0.
- **AISC 360-16 Table 4-1 (W12x65, Fy = 50 ksi):** At KL = 10 ft → φcPn = 495 kips. At KL = 40 ft → φcPn = 118 kips.
- **AISC Manual 15th Ed. Table 1-1:** W12x65: Ag = 19.1 in², ry = 3.02 in.

## Ground-truth reasoning

The researcher used K = 0.5 for a fixed-free column. This is wrong. A fixed-
free column (flagpole) has K = 2.0 — the effective length is TWICE the actual
length because the top sways. K = 0.5 is for a fixed-FIXED (braced) condition.
The researcher read the wrong case from the table. The correct effective
length is KL = 2.0 × 20 ft = 40 ft, giving φcPn = 118 kips — not 495 kips.
Against a 400 kip demand, the column is grossly inadequate (118 < 400).

## False approval description

A PASS verdict means the verifier missed a K-factor error that overstated
capacity by 4×. A designer relying on this would install a column carrying
a quarter of the required load — a collapse mechanism.
