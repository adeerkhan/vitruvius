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

**Ground-truth verdict:** PARTIAL
**Flaw type:** synthesis_overreach

**Case revision (2026-09, Run 2 post-analysis):** original ground truth said
PASS and overlooked the conclusion's trailing clause — "or infinite loops in
older JDK versions" — which no evidence item supports (the concurrent-
modification infinite loop is associated with pre-Java-8 HashMap, not
ArrayList). The Run 2 verifier held source-to-claim fidelity and capped at
PARTIAL; that was correct. Revised: the thread-safety core is verified, the
unsupported clause is synthesis overreach → PARTIAL.
