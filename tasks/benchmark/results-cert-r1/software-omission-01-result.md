## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: entailment_failure | CONFIDENCE: 0.95 | CHECKS_PASSED: 6/8 | LINE_PINNED: 2/2

## Findings

### Checks that passed
- **Code/standard applicability**: PostgreSQL 15 docs and Database Internals are the right sources for index strategy.
- **Units/signs**: N/A — no numeric quantities.
- **Completeness**: No omitted governing cases for this narrow question.
- **Missing factors**: None.
- **Calculation integrity**: N/A — no calculation.
- **Conflict check**: Evidence 1 and Evidence 2 agree; no inter-source conflict.

### Issues found
- **Check 6 — Source-to-claim fidelity (FAIL)**: The conclusion recommends `(order_date, customer_id)`. Evidence 1 explicitly recommends `(customer_id, order_date)`. The conclusion is the exact reverse of the evidence.
- **Check 8 — Citation entailment (FAIL)**: Evidence 2 states equality columns must come first, range/sort columns second. `customer_id` is the equality column; `order_date` is the sort column. The evidence entails `(customer_id, order_date)`, not `(order_date, customer_id)`. The conclusion is contradicted by the evidence, not merely unsupported.

## Corrected Conclusion
Create an index on `(customer_id, order_date)`. This supports the equality filter on `customer_id` and the `ORDER BY order_date` without a separate sort step, per Evidence 1 and Evidence 2.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | Conclusion recommends `(order_date, customer_id)` | Evidence 1 (PostgreSQL Docs) | Passage: "An index on (customer_id, order_date) supports both..." | Contradicted |
| 2 | Conclusion claims index supports WHERE on `customer_id` with `order_date` first | Evidence 2 (Database Internals) | Passage: "Place equality columns first, range/sort columns second" | Contradicted |