## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: entailment_failure | CONFIDENCE: 0.95 | CHECKS_PASSED: 3/8 | LINE_PINNED: 4/4

## Findings

### Checks that passed
- **Units and signs** — No unit errors; hours are consistent across evidence.
- **Calculation integrity** — No calculation to re-derive.
- **Conflict check** — No conflict between cited IBC sections; the issue is omission, not contradiction between standards.

### Issues found

1. **Code misapplication (`code_misapplication`)** — The conclusion cites IBC 602.1 ("Type V-B has no required fire-resistance rating for structural elements") to argue the separating wall needs no rating. But Evidence 1 itself states: "Party walls between buildings under separate ownership shall be rated per Section 706." The source points *away* from the conclusion, not toward it.

2. **Omission (`omission`)** — The conclusion entirely ignores IBC 706.2 (Evidence 2), which requires fire walls separating buildings to have a 2-hour rating (same lot) or 3-hour rating (party wall between separate lots). This is the governing provision for the exact wall type in question.

3. **Missing factor (`missing_factor`)** — The conclusion does not address whether the buildings are on the same lot or separate lots (which determines 2-hour vs 3-hour), nor does it address IBC 508.4 (Evidence 3), which requires a 1-hour occupancy separation between Group B and Group M when on the same lot.

4. **Entailment failure (`entailment_failure`)** — Given only the cited passages, the conclusion "the separating wall does not need a fire-resistance rating" does not follow. All three evidence items point to *some* rating requirement (2-hour, 3-hour, or 1-hour), never zero.

### Required-value check
The question asks "What fire-resistance rating is required" — a direct ask for the required value. The conclusion asserts "no rating is needed," which is contradicted by Evidence 2 (2-hour minimum). Per the quality gate, this forces BLOCKED.

## Corrected Conclusion
The separating wall is governed by IBC 706.2 as a fire wall/party wall between buildings: minimum 2-hour fire-resistance rating if on the same lot, 3-hour if a party wall between separate lots. Additionally, IBC 508.4 requires a 1-hour occupancy separation between Group B (office) and Group M (retail) if on the same lot. Type V-B construction having no structural rating requirement (IBC 602) does not exempt the separating wall from these ratings.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | IBC 602.1 says party walls rated per §706 | Evidence 1 | IBC 602.1 | Contradicts conclusion |
| 2 | Fire walls need 2-hr (same lot) or 3-hr (party wall) | Evidence 2 | IBC 706.2 | Contradicts conclusion |
| 3 | B/M occupancy separation needs 1-hr | Evidence 3 | IBC 508.4 | Omitted by conclusion |
| 4 | Conclusion asserts zero rating required | Claimed Conclusion | N/A | Not supported by any evidence |