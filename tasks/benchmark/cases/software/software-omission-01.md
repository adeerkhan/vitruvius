# Software: Omission — Database Index Strategy

## Research Question
What index should be created to optimize a query filtering on `customer_id` and sorting by `order_date` in a 10-million-row orders table?

## Evidence Items

### Evidence 1: PostgreSQL Index Documentation
- **Source**: PostgreSQL 15 Docs, Chapter 11
- **Passage**: "A B-tree index can be used for queries that involve sorted data. An index on (customer_id, order_date) supports both the WHERE filter on customer_id and the ORDER BY order_date without a separate sort step."

### Evidence 2: Index Selectivity
- **Source**: Database Internals, Chapter 4
- **Passage**: "Composite index column order matters. Place equality columns first, range/sort columns second. (a, b) index supports: WHERE a = x, WHERE a = x AND b = y, WHERE a = x ORDER BY b."

### Evidence 3: Query Pattern
- **Source**: Application Query Log (fictional)
- **Passage**: "SELECT * FROM orders WHERE customer_id = $1 ORDER BY order_date DESC LIMIT 20. Executed 50,000 times/day. customer_id has 500,000 distinct values."

## Claimed Conclusion
Create an index on (order_date, customer_id). This supports the ORDER BY clause efficiently and the WHERE filter on customer_id. The index will be used for both operations.

---

**Ground-truth verdict:** BLOCKED
**Flaw type:** omission

**Explanation**: The conclusion reverses the column order. Per Evidence 2, equality columns (customer_id) must come before sort columns (order_date). The correct index is (customer_id, order_date). With (order_date, customer_id), the index cannot efficiently filter by customer_id first — it would need to scan all dates for each customer. The conclusion omits the fundamental rule of composite index column ordering.
