# Software: Synthesis Overreach — API Rate Limiting

## Research Question
What is the maximum sustainable request rate for a REST API endpoint backed by a PostgreSQL database with a connection pool of 20 connections, where each request holds a connection for 50ms average?

## Evidence Items

### Evidence 1: Little's Law
- **Source**: Operations Research, applied to queueing systems
- **Passage**: "L = λ × W, where L = average number in system, λ = arrival rate, W = average time in system. For a stable system, λ < μ (service rate)."

### Evidence 2: Connection Pool Math
- **Source**: PostgreSQL documentation, Connection Pooling best practices
- **Passage**: "Maximum throughput = pool_size / avg_transaction_time. With 20 connections and 50ms per transaction: 20 / 0.050s = 400 transactions/second maximum."

### Evidence 3: HTTP Overhead
- **Source**: Empirical benchmark (fictional)
- **Passage**: "Framework overhead adds ~5ms per request for serialization/deserialization. Effective service time = 55ms including overhead."

## Claimed Conclusion
Using Little's Law with L = 20 connections and W = 50ms, the maximum arrival rate is λ = L/W = 20/0.050 = 400 requests/second. The API can sustain 400 RPS without queueing. No additional rate limiting is needed below this threshold.

---

**Ground-truth verdict:** BLOCKED
**Flaw type:** synthesis_overreach

**Explanation**: The conclusion ignores Evidence 3 which states effective service time is 55ms (50ms DB + 5ms overhead). The correct calculation is 20/0.055 = 364 RPS. More importantly, Little's Law gives the equilibrium point — at exactly 400 RPS the system is at 100% utilization with infinite queue growth. Sustainable rate should be ~80% of theoretical max (320 RPS) to handle variance. The conclusion overreaches from the raw calculation.
