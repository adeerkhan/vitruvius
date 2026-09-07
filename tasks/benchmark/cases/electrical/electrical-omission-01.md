# Electrical: Omission — Short Circuit Rating

## Research Question
What is the minimum interrupting rating for a circuit breaker protecting a 480V motor control center with an available fault current of 42 kA at the bus?

## Evidence Items

### Evidence 1: NEC 110.9
- **Source**: NFPA 70 (NEC), Article 110.9
- **Passage**: "Equipment intended to interrupt fault current shall have an interrupting rating sufficient for the available fault current at the line terminals."

### Evidence 2: UL 489
- **Source**: UL 489, Molded-Case Circuit Breakers
- **Passage**: "Standard interrupting ratings: 10kA, 14kA, 18kA, 22kA, 25kA, 35kA, 42kA, 50kA, 65kA, 100kA. Breakers must be applied at or below their rated interrupting capacity."

### Evidence 3: Coordination Study
- **Source**: Short Circuit Analysis Report (fictional)
- **Passage**: "Available fault current at MCC bus: 42,000 A symmetrical. X/R ratio = 6.8. No motor contribution considered."

## Claimed Conclusion
Per NEC 110.9, the circuit breaker must have an interrupting rating ≥ 42 kA. A standard 42 kA rated breaker is appropriate for this application. Select a 42A interrupting rated breaker.

---

**Ground-truth verdict:** BLOCKED
**Flaw type:** omission

**Explanation**: The conclusion says "42A interrupting rated breaker" — this is a typo/error that changes the unit from kA to A. A 42A breaker would be destroyed instantly. The conclusion also omits that the breaker must be selected based on the specific X/R ratio; for X/R = 6.8, some breakers may need to be derated per UL 489. The conclusion is careless and incorrect.
