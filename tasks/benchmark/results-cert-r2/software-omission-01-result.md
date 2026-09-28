## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: synthesis_overreach | CONFIDENCE: 0.95 | CHECKS_PASSED: 6/8 | LINE_PINNED: 1/1

## Findings

### Checks that passed
1. Code/standard applicability — PostgreSQL docs and database internals text are appropriate sources.
2. Units and signs — N/A (no units).
3. Completeness — conclusion addresses the stated query pattern.
4. Missing factors — N/A.
5. Calculation integrity — N/A.
7. Conflict check — Evidence 1 and Evidence 2 agree; no inter-source conflict.

### Issues found
6. **Source-to-claim fidelity — FAIL.** The conclusion asserts index order `(order_date, customer_id)`. Evidence 1 explicitly recommends `(customer_id, order_date)`. Evidence 2 states equality columns first, sort columns second — `customer_id` is equality, `order_date` is sort. The conclusion inverts the correct column order.
8. **Citation entailment — FAIL.** The conclusion does not follow from the evidence; it contradicts both Evidence 1 and Evidence 2.

## Corrected Conclusion
Create an index on **(customer_id, order_date)**. This supports the WHERE filter on customer_id and the ORDER BY order_date without a separate sort step.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | Index column order is inverted; evidence supports (customer_id, order_date) | Evidence 1 + Evidence 2 | Passage 1, Passage 2 | Contradicted |