## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: code_misapplication | CONFIDENCE: 0.97 | CHECKS_PASSED: 5/8 | LINE_PINNED: 4/4

## Findings

### Checks that passed
- **Units/signs:** 18 in rise / 180 in run = 1:10 (10%) — arithmetic is internally correct.
- **Calculation integrity:** 18:180 reduces to 1:10 as derived.
- **Citation entailment (internal):** each evidence passage was quoted accurately.
- **Bidirectional citations:** no orphan sources; all three evidence items are addressed.
- **Artifact sweep:** no untraceable numbers in the conclusion.

### Issues found
- **Code misapplication (P0 blocker):** The conclusion cites IBC 1012.2's 1:8 maximum but omits its own qualifier — quoted verbatim in Evidence 2 — that 1:8 applies only "for rises up to 3 inches." The actual rise is 18 inches, so the governing provision is the ADA 1:12 (8.33%) maximum per Evidence 2's cross-reference and Evidence 1, Section 405.2. The conclusion asserts a maximum slope (1:8) contradicted by its own cited evidence.
- **Wrong compliance verdict (P0):** At 1:10, the ramp is steeper than the governing 1:12. The ramp does **not** comply. To meet 1:12, an 18-inch rise requires 216 in (18 ft) of run; only 180 in (15 ft) is available — the site cannot accommodate a compliant straight run without redesign (switchback, altered entrance, or lift/elevator evaluation).
- **Omission (P1):** ADA 405.2 also caps rise at 30 in per run (satisfied here) and limits cross slope to 1:48; neither is addressed. IBC/ADA landing requirements are not checked against the 15-ft dimension, which is measured to the landing.

## Corrected Conclusion
The maximum allowable ramp slope is **1:12 (8.33%)** per ADA 2010 Standards §405.2, which IBC 1012.2 incorporates for rises exceeding 3 inches. The proposed 18-inch rise over 180 inches yields a 1:10 slope — **non-compliant** — and the available 15 ft of run is insufficient for a compliant 1:12 ramp (18 ft needed, excluding landing depth), so the ramp as configured fails code.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | 1:8 applies only to rises ≤ 3 in; larger rises → ADA 1:12 | IBC 1012.2 (Evidence 2) | quoted passage | Contradicts claim's stated maximum |
| 2 | Ramp run max slope 1:12 (8.33%) | ADA 2010 §405.2 (Evidence 1) | quoted passage | Governing limit; claim violates it |
| 3 | 18 in rise / 180 in run = 1:10 | Topographic Survey (Evidence 3) | quoted passage | Arithmetic correct, but non-compliant |
| 4 | 1:12 requires 216 in run for 18 in rise; only 180 in available | Derived from Evidence 1 + 3 | §405.2 | Site insufficient — not acknowledged |
