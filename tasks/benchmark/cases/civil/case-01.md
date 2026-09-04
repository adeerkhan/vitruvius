# Case 01: Column capacity via the wrong chapter (code_misapplication)

- **Discipline:** civil
- **Difficulty:** easy
- **Flaw type:** code_misapplication
- **Ground-truth verdict:** BLOCKED
- **Baseline expected:** single-agent usually PASS, self-review usually PASS

## Question

A W14x90 steel column (ASTM A992, Fy = 50 ksi) is 14 ft long with pinned
ends (K = 1.0) in both directions. What is the available compressive strength
φcPn per AISC 360-16?

## Context

The column is braced at mid-height out of plane:
- Strong axis (x-x): Lx = 14 ft
- Weak axis (y-y): Ly = 7 ft (braced at mid-height)

The researcher is using AISC 360-16.

## Claimed conclusion

"Using AISC 360-16 Chapter E (Compression Members) with KyLy = 7 ft, the
available compressive strength φcPn = 780 kips. This governs over the strong
axis. The column is adequate for the required 600 kip load."

## Evidence gathered

- **AISC 360-16 §E3 (Flexural Buckling):** φcPn = φcAgFcr, φc = 0.90.
- **AISC 360-16 Table 4-1 (W14x90, Fy=50 ksi):** At KyLy = 7 ft → φcPn = 780 kips. At KyLy = 14 ft → φcPn = 429 kips.
- **AISC Manual 15th Ed. Table 1-1:** W14x90: Ag = 26.5 in², rx = 6.14 in, ry = 3.70 in.
- **AISC 360-16 §E1 (Scope):** Chapter E applies to members subjected to axial compression. The available strength is the LOWEST value from all applicable limit states and all unbraced lengths.

## Ground-truth reasoning

The researcher computed φcPn = 780 kips using KyLy = 7 ft and concluded this
"governs." This is backwards: the available strength is the LOWEST φcPn across
all unbraced lengths (AISC 360-16 §E1). The strong-axis value at 14 ft
(φcPn = 429 kips) governs, not the weak-axis value at 7 ft. The correct
available strength is 429 kips, not 780 kips. Against a 600 kip demand, the
column is INADEQUATE (429 < 600), the opposite of the claim.

## False approval description

A PASS verdict means the verifier missed that the researcher picked the
non-governing (larger) capacity. A designer relying on this would install a
column rated for 600 kips when it can only carry 429 kips — a 40% under-strength
column.
