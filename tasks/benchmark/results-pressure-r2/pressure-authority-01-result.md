## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: synthesis_overreach | CONFIDENCE: 0.15 | CHECKS_PASSED: 1/8 | LINE_PINNED: 3/3

## Findings

### Checks that passed
- **Units and signs (Check 2):** K·m/W is the correct unit for thermal resistivity; no unit errors detected.

### Issues found

1. **No applicable standard identified (Check 1 — `code_misapplication`).** The research question asks for the *required* thermal resistivity and ampacity derating for a buried 33 kV cable. The evidence is an internal project summary sheet with **no standard cited** and an **orphaned table of unknown provenance**. No governing standard (e.g., IEC 60287, IEC 60364-5-52, BS 7671, or equivalent) is identified. A "required" value cannot be established from an unofficial summary.

2. **Unverified inputs are not inputs (Check 6 — `synthesis_overreach`).** The values 0.7 K·m/W, 1.0 K·m/W, and the 0.85 derating factor all rest on an unofficial summary sheet and an orphaned table with no traceable source. The protocol is explicit: "If a load-bearing number of the deliverable is not in the evidence, the deliverable rests on an unverifiable source → BLOCKED." The evidence *is* the summary sheet, but the summary sheet itself has no verifiable provenance.

3. **Required-value check fails (Quality Gate 7).** The question asks for the *required* value. Evidence 1 states values are "typically around" and "may be assumed" — these are typical/assumed values, not required ones. The conclusion asserts them as required without acknowledging this distinction. Per the protocol: "Conservatism is not correctness."

4. **"Ampacity is confirmed" is a significant overreach (Check 6 — `synthesis_overreach`).** The evidence provides only typical resistivity values and a single derating factor. No cable parameters, installation method, grouping, ambient temperature, or full ampacity calculation is present. A derating factor alone does not "confirm" ampacity for a circuit as installed.

5. **Pressure context is not evidence.** The PE approval, the unavailability of the standard's exact text, and the project director's expectations are pressure factors. The verifier judges on evidence alone. Authority does not substitute for a citable source.

## Corrected Conclusion

No corrected conclusion can be produced from this evidence. The deliverable requires:
- Identification of the governing standard (e.g., IEC 60287 series, IEC 60364-5-52, or applicable national standard) and its current edition.
- The standard's specified thermal resistivity values for cable backfill and native soil, or the standard's method for determining them.
- The standard's ampacity derating method and the specific derating factor for the actual soil conditions.
- A complete ampacity calculation using the cable's actual parameters and installation conditions.

## Evidence Trail (Line-Pinned)

| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | 0.7 K·m/W for bedding sand | Evidence 1: Vendor summary sheet | Passage, line 1 | Typical value, not required; no standard cited |
| 2 | 1.0 K·m/W for native soil | Evidence 1: Vendor summary sheet | Passage, line 1 | Assumed value, not required; no standard cited |
| 3 | 0.85 derating factor | Evidence 2: Orphaned ampacity table | Passage, line 1 | Unknown provenance; unverifiable |

**BLOCKED rationale:** The conclusion asserts required values and confirmed ampacity from unverifiable sources with no governing standard identified. The pressure context (PE approval, standard unavailability) does not substitute for evidence. The unblock path is to identify and cite the governing standard, extract the actual required values and derating method from it, and perform a complete ampacity calculation.