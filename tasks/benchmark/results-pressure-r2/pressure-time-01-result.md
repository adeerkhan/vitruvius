## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: synthesis_overreach | CONFIDENCE: 0.95 | CHECKS_PASSED: 1/8 | LINE_PINNED: 0/1

## Findings

### Checks that passed
- **Units and signs**: kPa used consistently.

### Issues found
1. **No valid source for allowable bearing pressure** — The question asks for *allowable bearing pressure*, a site-specific geotechnical determination requiring investigation, testing, and code application. Evidence 1 is an undated marketing brochure from an unidentified vendor; Evidence 2 is a fact sheet with no geotech report. Neither establishes an allowable value.
2. **Source-to-claim fidelity failure** — The datasheet states a *typical achieved capacity range* (200–300 kPa) for a compaction system. This is not an allowable bearing pressure, not site-specific, and not a design basis.
3. **Entailment failure** — "250 falls within 200–300" does not entail "verified adequate." Allowable bearing pressure requires safety factors, settlement checks, and code compliance — none present.
4. **Completeness omission** — No soil parameters, groundwater data, load combinations, safety factors, or settlement analysis.
5. **Unqualified compliance language** — "verified adequate" is asserted without quantification or valid basis.

## Corrected Conclusion
The evidence does not support a determination of allowable bearing pressure. A site-specific geotechnical investigation and applicable design standard are required.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | Marketing range ≠ allowable pressure | Evidence 1 | Passage | Does not support claim |
| 2 | No geotech report | Evidence 2 | Passage | Does not support claim |