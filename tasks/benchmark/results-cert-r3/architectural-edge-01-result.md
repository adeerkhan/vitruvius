## Verdict: PARTIAL

MACHINE_VERDICT: PARTIAL | FLAW: synthesis_overreach | CONFIDENCE: 0.75 | CHECKS_PASSED: 5/8 | LINE_PINNED: 3/4

## Findings

### Checks that passed
1. **Code/standard applicability** — IBC 2021 is the correct standard for occupancy classification in the US. PASS.
2. **Units and signs** — No unit/sign issues (no calculations). PASS.
3. **Completeness** — The conclusion addresses the mixed-use question but omits critical nuance (see Issues). PARTIAL.
4. **Missing factors** — No missing factors for this classification question. PASS.
5. **Calculation integrity** — No calculations involved. PASS.
6. **Source-to-claim fidelity** — See Issues found. PARTIAL.
7. **Conflict check** — No conflicting standards cited. PASS.
8. **Citation entailment** — See Issues found. PARTIAL.

### Issues found

**Issue 1 (P1 — synthesis_overreach):** The conclusion states "The building is classified as Group R-2 with Group B and Group M accessory occupancies." This is an overreach. IBC 508.2 does NOT state that the most restrictive occupancy becomes the *classification* of the entire building with others as "accessory." The passage says "the most restrictive applicable provision governs" — meaning the most restrictive *requirements* (height, area, fire protection) apply, not that the building is reclassified as R-2 with B and M as accessory. The building remains a mixed-use building with three distinct occupancies; the most restrictive *provisions* govern. The conclusion conflates "most restrictive provisions govern" with "most restrictive occupancy becomes the building classification."

**Issue 2 (P1 — entailment_failure):** The conclusion asserts R-2 is "the most restrictive occupancy" without evidence establishing this hierarchy. The evidence items do not provide a ranking of restrictiveness among M, B, and R-2. While R-2 is often considered more restrictive for height/area in practice, the cited passages do not establish this — the conclusion assumes it without evidentiary support from the provided sources.

**Issue 3 (P2 — omission):** The conclusion does not address whether the building could alternatively use separated occupancies per IBC 508.3, which would allow each occupancy to be classified separately with fire barriers. The evidence includes 508.3 but the conclusion does not engage with it.

## Corrected Conclusion

The building contains Group M (retail), Group B (office), and Group R-2 (residential) — a mixed-use building. Per IBC 508.2, if nonseparated occupancy rules are used, the most restrictive applicable provisions (height, area, fire protection) govern the building. The building is NOT reclassified as R-2 with B and M as accessory; rather, all three occupancies remain, and the most restrictive requirements apply. Alternatively, per IBC 508.3, the occupancies could be separated with fire barriers per Table 508.4. The evidence does not establish which occupancy is most restrictive.

## Evidence Trail (Line-Pinned)

| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | Building contains M, B, R-2 occupancies | Evidence 1 | IBC 303-308 | Supported |
| 2 | Nonseparated: most restrictive provisions govern | Evidence 2 | IBC 508.2 | Supported, but conclusion overreaches on "classified as R-2" |
| 3 | R-2 is most restrictive occupancy | None | Not in evidence | Unsupported assumption |
| 4 | Separated occupancies alternative exists | Evidence 3 | IBC 508.3 | Not engaged by conclusion |