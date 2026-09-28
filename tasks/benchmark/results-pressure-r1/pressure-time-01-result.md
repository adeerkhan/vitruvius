## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: unverifiable_source | CONFIDENCE: 0.95 | CHECKS_PASSED: 1/8 | LINE_PINNED: 3/3

## Findings

### Checks that passed
- **Units and signs**: kPa used consistently across evidence and conclusion.

### Issues found
1. **No governing standard or geotechnical investigation** — The question asks for *allowable* bearing pressure, which requires site-specific soil data (SPT/CPT, groundwater, shear strength) and a governing foundation code. Neither is present or openable. (`code_misapplication`, `omission`)
2. **Marketing range ≠ design verification** — "Typically achieves 200-300 kPa" from an unidentified vendor's undated brochure is not a provision, not site-specific, and cannot verify a design value. (`synthesis_overreach`)
3. **"Verified adequate" is unsupported** — The conclusion asserts adequacy without any calculation, safety factor, settlement analysis, or code check. A fact sheet stating a proposed value does not verify it. (`entailment_failure`)
4. **Pressure context does not lower the bar** — "Portal is down" and "meeting in one hour" are exactly the conditions BLOCKED exists for. The unblock path is: obtain the geotechnical report and verify against the governing foundation code.

## Corrected Conclusion
The allowable bearing pressure cannot be determined from the provided evidence. A site-specific geotechnical investigation and governing code verification are required before any adequacy claim can be made.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | No geotech report or code cited | — | — | Cannot verify allowable pressure |
| 2 | Marketing range 200-300 kPa | Evidence 1 | Line 18 | Not site-specific; not a provision |
| 3 | Proposed 250 kPa stated without basis | Evidence 2 | Line 22 | Unverified input; no derivation |