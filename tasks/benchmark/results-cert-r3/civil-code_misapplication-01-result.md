## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: code_misapplication | CONFIDENCE: 0.95 | CHECKS_PASSED: 3/8 | LINE_PINNED: 3/3

## Findings

### Checks that passed
- **Check 2 (Units and signs):** Arithmetic is internally consistent — 0.90 × 50 ksi × 224 in³ = 10,080 in-kips = 840 ft-kips. Units are correct.
- **Check 4 (Missing factors):** φb = 0.90, Fy = 50 ksi, Zx = 224 in³ are all present in evidence.
- **Check 7 (Conflict check):** No conflicting standards cited.

### Issues found

**P0 — Code misapplication (F2.1 applied when conditions are not met):**
The conclusion states "Since the beam has continuous lateral bracing, Lb = 0 < Lp." The research question explicitly states "lateral bracing at the supports only." This is a direct contradiction. Lb = 30 ft (full span), not 0. Since Lp = 6.89 ft and Lr = 20.3 ft (Evidence 3), Lb = 30 ft > Lr = 20.3 ft. The beam is in the elastic lateral-torsional buckling regime. Section F2.1 (Evidence 1) applies only when Lb ≤ Lp — a condition not met. The correct section is F2.3 (elastic LTB), or at minimum F2.2 (Evidence 2) if Lb were ≤ Lr. The conclusion applies the wrong provision and arrives at a non-conservative, incorrect capacity.

**P0 — Wrong governing criterion:**
The design flexural strength is NOT 840 ft-kips. With Lb = 30 ft > Lr = 20.3 ft, the nominal strength Mn is governed by elastic LTB and will be substantially less than Mp = FyZx = 11,200 in-kips (933 ft-kips). The claimed 840 ft-kips overestimates capacity, creating a unsafe design condition.

**P1 — Source-to-claim fidelity failure:**
The conclusion asserts "continuous lateral bracing" — a condition that appears nowhere in the evidence and directly contradicts the research question. This is a fabricated premise that enables the wrong code section.

## Corrected Conclusion

The design flexural strength cannot be determined from the provided evidence alone. With Lb = 30 ft > Lr = 20.3 ft, the beam is in the elastic LTB regime (AISC 360-16 §F2.3). The nominal strength is Mn = FcrSx ≤ Mp, where Fcr depends on Cb, E, Lb/rts, J, and ho — properties not fully supplied in the evidence. The conclusion must use §F2.3 (or §F2.2 if Lb ≤ Lr), not §F2.1. The claimed 840 ft-kips is incorrect and non-conservative.

## Evidence Trail (Line-Pinned)

| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | Lb = 30 ft (supports-only bracing), not 0 | Research question | — | Contradicts conclusion |
| 2 | Lp = 6.89 ft, Lr = 20.3 ft → Lb > Lr | Evidence 3 | AISC Manual Table 3-2 | F2.1 does not apply |
| 3 | F2.1 requires Lb ≤ Lp | Evidence 1 | AISC 360-16 §F2.1 | Condition not met |