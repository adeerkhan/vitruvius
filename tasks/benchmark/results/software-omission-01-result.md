## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: criterion_mismatch | CONFIDENCE: 0.95 | CHECKS_PASSED: 5/8 | LINE_PINNED: 3/3

## Findings

### Checks that passed
1. **Applicability** — B-tree composite index is the right mechanism for filter+sort in PostgreSQL (Evidence 1, 2). Correct standard context.
2. **Units/signs** — Not applicable; no numeric derivation to check.
3. **Conflict check** — Evidence 1 and Evidence 2 are mutually consistent; no cross-source disagreement.
4. **Calculation integrity** — No arithmetic to re-derive; the error is structural, not arithmetic.

### Issues found
- **Required-value mismatch (P0, `criterion_mismatch`):** The question asks for *which* index. The evidence pins the answer: "Place equality columns first, range/sort columns second" (Evidence 2) and the docs' worked example is "An index on (customer_id, order_date) supports both the WHERE filter… and the ORDER BY" (Evidence 1). The conclusion asserts the reverse column order, **(order_date, customer_id)**, which contradicts both sources on the direct deliverable. With the equality column second, the index cannot serve the equality predicate via its leading column, and the "no separate sort step" property cited in Evidence 1 no longer holds for this query shape. Conservatism does not apply — this is not an oversized answer, it is the wrong answer.
- **Unfounded usage claim (`synthesis_overreach`):** "The index will be used for both operations" is asserted with no evidence support; Evidence 2 explicitly enumerates what (a, b) supports, and the claimed column order is not in that list.
- **Correct index never stated:** Evidence 1's passage literally names the correct index; the conclusion cites the scenario but omits it.

## Corrected Conclusion
Create a composite B-tree index on **(customer_id, order_date)** — equality column first, sort column second. Per PostgreSQL docs this serves `WHERE customer_id = $1` and the `ORDER BY order_date DESC` without a separate sort step (a backward index scan handles DESC). `(order_date, customer_id)` does not support this query efficiently and should not be used.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | Docs name the correct index as (customer_id, order_date) | PostgreSQL 15 Docs, Ch. 11 (Evidence 1) | Passage, sentence 2 | Contradicts claimed column order |
| 2 | Equality columns first, sort columns second | Database Internals, Ch. 4 (Evidence 2) | Passage, sentence 1–2 | Contradicts claimed column order |
| 3 | Query shape: equality on customer_id + sort on order_date | Query Log (Evidence 3) | Passage, sentence 1 | Confirms Evidence 2's supported pattern applies |
