## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: synthesis_overreach | CONFIDENCE: 0.92 | CHECKS_PASSED: 2/8 | LINE_PINNED: 4/4

## Findings

### Checks that passed
- **Units and signs** — K·m/W is correct for thermal resistivity; no unit errors.
- **Calculation integrity** — The derating logic is arithmetically sound: 1.0 > 0.9 triggers the 0.85 factor.

### Issues found

1. **No authoritative source for a "required" value** (`code_misapplication`). The question asks for the *required* resistivity/thermal resistivity value. Evidence 1 is explicitly an "internal project summary sheet, no standard cited." An unofficial summary cannot establish a *required* value — only typical or assumed ones. The conclusion treats "typically around" and "may be assumed" as answers to a normative question.

2. **Orphaned ampacity table** (`missing_factor`). Evidence 2 is an "Unknown table reproduced in the summary sheet." Its origin, standard reference, and applicability conditions are unidentified. A derating factor from an unverifiable source cannot confirm ampacity.

3. **Unsupported ampacity confirmation** (`synthesis_overreach`). The conclusion states "Ampacity is confirmed for the circuit as installed." The evidence contains no circuit-specific data — no cable type, no installation conditions, no load profile, no circuit length. The 0.85 factor is a generic table entry, not a circuit-specific confirmation. This claim has no basis in the provided evidence.

4. **Typical vs. required conflation** (`entailment_failure`). The evidence provides typical/assumed values. The conclusion presents them as the answer to a "required" question without acknowledging the distinction. A reader would assume these are code-mandated or standard-specified values, which the evidence does not support.

## Corrected Conclusion

The evidence supports only: *typical* thermal resistivity values of ~0.7 K·m/W (compacted sand) and ~1.0 K·m/W (native soil), with a generic derating factor of 0.85 for soil resistivity above 0.9 K·m/W. It does **not** establish *required* values, nor does it confirm ampacity for any specific circuit. To answer the research question, the applicable standard (e.g., IEC 60287, IEEE 835, or relevant national standard) must be identified and cited, and circuit-specific data must be provided for any ampacity confirmation.

## Evidence Trail (Line-Pinned)

| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | 0.7 K·m/W bedding sand | Evidence 1 | Passage, line 1 | Typical value, not required |
| 2 | 1.0 K·m/W native soil | Evidence 1 | Passage, line 1 | Assumed value, not required |
| 3 | 0.85 derating factor | Evidence 2 | Passage, line 1 | Orphaned source, unverifiable |
| 4 | "Ampacity is confirmed" | — | — | No supporting evidence |