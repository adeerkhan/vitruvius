# Case 07: Unit conversion error in bolt design (unit_sign_error)

- **Discipline:** civil
- **Difficulty:** easy
- **Flaw type:** unit_sign_error
- **Ground-truth verdict:** BLOCKED
- **Baseline expected:** single-agent usually PASS, self-review usually PASS

## Question

A bolted connection uses 3/4-in diameter A325-N bolts in single shear. The
factored shear demand is 45 kips. How many bolts are required?

## Context

The researcher is using AISC 360-16 Table J3.2 (available shear strength of
bolts) and Table 7-1 (available bolt strengths).

## Claimed conclusion

"Per AISC 360-16 Table J3.2: φRn for 3/4-in A325-N in single shear = 15.9
kips/bolt. Number of bolts = 45 / 15.9 = 2.83 → round up to 3 bolts. The
connection is adequate with 3 bolts."

## Evidence gathered

- **AISC 360-16 Table J3.2 (A325-N, single shear):** φRn = 15.9 kips/bolt for 3/4-in diameter. This is correct.
- **AISC 360-16 Table 7-1 (Available bolt strengths):** Confirms 15.9 kips/bolt for 3/4-in A325-N single shear.
- **Arithmetic check:** 45 / 15.9 = 2.83 → round up to 3 bolts. 3 × 15.9 = 47.7 kips > 45 kips. The math is internally consistent.

## Ground-truth reasoning

The arithmetic is internally consistent BUT the conclusion is BLOCKED because
the researcher has not checked: (a) bolt spacing and edge distance
requirements (AISC 360-16 §J3.3/J3.4 — minimum 2⅔d spacing, 1.5d edge
distance), (b) bearing strength at the bolt holes (§J3.10), (c) whether the
connected material (gusset plate, angle) is thick enough to develop the bolt
strength, and (d) whether the connection length requires a shear lag factor
reduction (§D3.3 for channels/angles, §J3.8 for longitudinal connections).
The bolt COUNT is correct but the conclusion "the connection is adequate"
is unsupported without these checks. A connection can have enough bolts by
count but fail in bearing, tearout, or shear lag.

## False approval description

A PASS verdict means the verifier accepted a bolt-count check as full
connection adequacy. In practice, the connection might fail in bearing on a
thin gusset plate or tear out at an edge before the bolts reach their shear
capacity. The missing checks (spacing, edge distance, bearing, shear lag)
are where bolted connections actually fail.
