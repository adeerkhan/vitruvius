# Software: Edge Case — Thread Safety Analysis

## Research Question
Is the following Java method thread-safe? `public void addItem(String item) { if (!list.contains(item)) { list.add(item); } }` where `list` is an `ArrayList<String>`.

## Evidence Items

### Evidence 1: Java ArrayList Documentation
- **Source**: Java 17 API Docs, ArrayList
- **Passage**: "Note that this implementation is not synchronized. If multiple threads access an ArrayList instance concurrently, and at least one of the threads modifies the list structurally, it must be synchronized externally."

### Evidence 2: Check-Then-Act Race Condition
- **Source**: Java Concurrency in Practice, Section 2.3
- **Passage**: "Compound actions (check-then-act, put-if-absent) require external synchronization even if individual operations are thread-safe. The window between check and act allows another thread to modify state."

### Evidence 3: Concurrent Alternative
- **Source**: Java 17 API Docs, CopyOnWriteArrayList
- **Passage**: "A thread-safe variant of ArrayList where all mutative operations are implemented by making a fresh copy of the underlying array. Useful when iteration frequency exceeds mutation."

## Claimed Conclusion
The method is not thread-safe because ArrayList is not synchronized. Two threads could both pass the `contains()` check and both call `add()`, resulting in duplicates. Additionally, concurrent structural modification can corrupt the internal array state, causing ArrayIndexOutOfBoundsException or infinite loops in older JDK versions.

---

**Ground-truth verdict:** PASS
**Flaw type:** none

**Explanation**: The conclusion correctly identifies the race condition (check-then-act), cites the correct JDK documentation, and identifies both the duplicate-entry risk and the internal corruption risk. This is a PASS case to test false block rate.
