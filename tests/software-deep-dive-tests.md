# Software Deep-Dive Tests — Round 2

## Test 4: TLS 1.3 Handshake Protocol

### Research Question
How does the TLS 1.3 handshake work, what are the key differences from TLS 1.2, what cipher suites are supported, what is the 1-RTT vs 0-RTT handshake, and what security properties are improved?

### Primary Source
RFC 8446 — *The Transport Layer Security (TLS) Protocol Version 1.3*, August 2018 ([datatracker.ietf.org/doc/html/rfc8446](https://datatracker.ietf.org/doc/html/rfc8446))

---

### How TLS 1.3 Handshake Works (RFC 8446, Section 4)

The TLS 1.3 handshake is defined in **Section 4: Handshake Protocol** of RFC 8446.

#### 1-RTT Full Handshake Flow

1. **ClientHello** (Section 4.1.2): Client sends supported cipher suites, key share(s) (e.g., X25519, P-256), and optional PSK identity.
2. **ServerHello** (Section 4.1.3): Server selects cipher suite and key exchange group, responds with its key share.
3. **Encrypted Extensions** (Section 4.3.1): Server sends any additional parameters needed (ALPN, SNI, etc.).
4. **Certificate** (Section 4.4.2): Server's certificate chain (sent encrypted).
5. **CertificateVerify** (Section 4.4.3): Server's signature over handshake transcript.
6. **Finished** (Section 4.4.4): Server's MAC over all handshake messages.
7. **Client Finished**: Client sends its own Finished, and application data can flow immediately.

Key design: The client **guesses** the server's preferred key exchange group and sends its key share in the first ClientHello. If the guess is wrong, a Hello Retry Request (Section 4.1.4) triggers a retry — but this is rare.

#### 0-RTT (Early Data) Mode (Section 2.3, Section 4.2.10)

- Client resumes a previous session using a **Pre-Shared Key (PSK)** from a prior NewSessionTicket.
- Client sends early application data **immediately** in the ClientHello, before the server responds.
- 0-RTT data uses keys derived from the previous session — it does **not** depend on the ServerHello.
- **Replay vulnerability**: RFC 8446 Section 8 notes that 0-RTT data is subject to replay attacks. An attacker can capture and re-send the early data. The server cannot distinguish legitimate from replayed 0-RTT data.
- **Mitigations** (Section 8): Server may limit what 0-RTT data is accepted, or reject 0-RTT entirely. 0-RTT should only be used for idempotent operations (e.g., HTTP GET).

---

### Key Differences from TLS 1.2

| Aspect | TLS 1.2 (RFC 5246) | TLS 1.3 (RFC 8446) |
|---|---|---|
| **Handshake round trips** | 2-RTT (full), 1-RTT (resumed) | **1-RTT** (full), **0-RTT** (resumed) |
| **Key exchange** | RSA, DHE, ECDHE (admin choice) | ECDHE/DHE only — **mandatory forward secrecy** |
| **Cipher suite count** | ~37+ possible combinations | **5 AEAD suites total** |
| **RC4, DES, MD5, SHA-1, CBC-only** | Permitted if server allows | **Removed from the spec entirely** |
| **Compression** | Supported (enables CRIME attacks) | **Removed** |
| **Renegotiation** | Supported, history of CVEs | **Removed** |
| **Server certificate** | Sent in **plaintext** | Sent **encrypted** (after handshake keys derived) |

RFC 8446 Section 1.2 summarizes: "The list of supported symmetric encryption algorithms has been pruned of all algorithms considered legacy. Those that remain are all AEAD algorithms."

---

### Cipher Suites (RFC 8446, Section 2)

TLS 1.3 defines exactly **5 cipher suites**, all AEAD-only:

| Cipher Suite | RFC |
|---|---|
| `TLS_AES_128_GCM_SHA256` | RFC 5116 |
| `TLS_AES_256_GCM_SHA384` | RFC 5116 |
| `TLS_CHACHA20_POLY1305_SHA256` | RFC 8439 |
| `TLS_AES_128_CCM_SHA256` | RFC 6655 |
| `TLS_AES_128_CCM_8_SHA256` | RFC 6655 |

TLS 1.3 cipher suites only specify the **symmetric cipher and hash** — they separate authentication/key exchange from the record protection algorithm. This is a structural change from TLS 1.2, where cipher suites bundled key exchange, encryption, and MAC together.

The suites **cannot be used** with TLS 1.2 and vice versa (RFC 8446, Section 2).

---

### 1-RTT vs 0-RTT — Practical Performance

| Network scenario | TLS 1.2 (2-RTT) | TLS 1.3 (1-RTT) | TLS 1.3 (0-RTT resumed) |
|---|---|---|---|
| Same-region DC (~5ms RTT) | ~10ms | ~5ms | ~0ms |
| Cross-country (~35ms RTT) | ~70ms | ~35ms | ~0ms |
| Transatlantic (~75ms RTT) | ~150ms | ~75ms | ~0ms |

Source: Real-world latency scenarios from RFC 8446 structural design applied to typical network distances.

---

### Security Improvements in TLS 1.3

1. **Mandatory Forward Secrecy**: Every cipher suite uses ECDHE or DHE. A stolen server key cannot decrypt captured traffic.
2. **Encrypted Certificate**: Server's certificate is sent after handshake keys are derived, preventing passive observers from seeing which site is being connected to.
3. **Removal of Legacy Crypto**: No RC4, 3DES, MD5, SHA-1, static RSA, CBC-mode ciphers, or compression. Eliminates padding oracle attacks, CRIME/BREACH, and related exploits.
4. **Downgrade Protection**: Cryptographic signaling prevents version downgrade attacks.
5. **Simplified Surface**: 5 cipher suites vs ~40 in TLS 1.2 — fewer misconfiguration opportunities.
6. **Removed Renegotiation**: Eliminates a history of CVEs associated with TLS renegotiation.

---

### Verification

- [x] RFC 8446 sections cited (Section 4.1-4.4, Section 2, Section 8)
- [x] TLS 1.2 vs 1.3 differences documented with specific references
- [x] All 5 cipher suites listed with RFC sources
- [x] 1-RTT and 0-RTT mechanisms explained with security trade-offs
- [x] Forward secrecy, encrypted certificates, and removed features cited

---

## Test 5: SQL Injection Prevention — OWASP

### Research Question
What are the OWASP-recommended defenses against SQL injection? What is parameterized queries vs stored procedures? What are the in-context verification requirements? What are the limitations of input validation alone?

### Primary Source
OWASP SQL Injection Prevention Cheat Sheet ([cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html))

---

### OWASP's Four Primary Defenses

The OWASP Cheat Sheet defines **four defense options** against SQL injection:

#### Defense Option 1: Prepared Statements (with Parameterized Queries) — RECOMMENDED

- The SQL code is defined **first** as a template with `?` placeholders.
- Parameters are bound **separately** after the query is prepared.
- The database driver guarantees the engine treats parameters as **data only**, never as executable SQL code.
- Even if an attacker supplies `tom' or '1'='1`, the parameterized query looks for the literal string — not a logical expression.
- OWASP states: "Prepared statements ensure that an attacker is not able to change the intent of a query, even if SQL commands are inserted by an attacker."

Example (Java):
```java
String query = "SELECT account_balance FROM user_data WHERE user_name = ?";
PreparedStatement pstmt = connection.prepareStatement(query);
pstmt.setString(1, custname);
ResultSet results = pstmt.executeQuery();
```

#### Defense Option 2: Stored Procedures — EQUIVALENT WHEN IMPLEMENTED SAFELY

- SQL code is defined and stored **in the database**, then called from the application.
- When stored procedures use parameterized inputs (no dynamic SQL concatenation), they are **equally effective** as prepared statements.
- **Risk**: Stored procedures that dynamically construct SQL via `EXEC` or `sp_executesql` with string concatenation reintroduce injection.
- **Permission risk**: Stored procedures often require `EXECUTE` rights, which in some setups forces the app to run as `db_owner` instead of `db_datareader`/`db_datawriter`, giving attackers broader access if breached.

Safe stored procedure pattern:
```sql
CREATE PROCEDURE GetUser(p_userid IN NUMBER) AS
BEGIN
  SELECT * FROM users WHERE userid = p_userid;
END;
```

#### Defense Option 3: Allow-List Input Validation — SUPPLEMENTARY

- Validates that user input matches an expected pattern or set of values **before** it reaches the query.
- Required for SQL elements that **cannot** use bind variables: table names, column names, `ASC`/`DESC` sort order.
- **Limitation**: Cannot be the sole defense because most applications require special characters in input. Allow-lists work for structured values (enum, boolean, integer), not free-text fields.
- OWASP: "Parameterized SQL statements require less maintenance and can offer more guarantees with respect to security."

#### Defense Option 4: Escaping User Input — STRONGLY DISCOURAGED

- Developer manually escapes special characters before inserting input into queries.
- **OWASP explicitly discourages this**: "This methodology is fragile compared to other defenses, and we CANNOT guarantee that this option will prevent all SQL injections in all situations."
- Database-specific, maintenance-heavy, and vulnerable to bypass techniques.

---

### Parameterized Queries vs Stored Procedures

| Aspect | Parameterized Queries | Stored Procedures |
|---|---|---|
| **SQL location** | In application code | Stored in the database |
| **Parameterization** | Automatic via driver | Automatic when implemented without dynamic SQL |
| **DB independence** | High (SQL stays in app) | Low (SQL tied to DB) |
| **Injection safety** | Inherently safe | Safe only when no dynamic SQL concatenation |
| **Privilege model** | App connects with minimal DB rights | Requires `EXECUTE` rights, may force higher privileges |
| **OWASP guidance** | Preferred primary defense | Equally effective alternative when safe |

OWASP: "Since prepared statements and safe stored procedures are equally effective in preventing SQL injection, your organization should choose the approach that makes the most sense for you."

---

### Limitations of Input Validation Alone

From OWASP SQL Injection Prevention Cheat Sheet and the Injection Prevention Cheat Sheet:

1. **Bind-variable-ineligible positions**: Table names, column names, sort order (`ASC`/`DESC`) cannot use parameterized queries — input validation is the **only** option for these.
2. **False positives**: Allow-lists reject legitimate input containing special characters (e.g., O'Brien, French accents).
3. **Deny-lists are ineffective**: OWASP states deny-listing is "riddled with loopholes." Attackers can:
   - Target unquoted fields
   - Bypass escaped meta-characters
   - Use stored procedures to hide injected characters
4. **Does not replace parameterization**: "Validated data is not necessarily safe to insert into SQL queries via string building."
5. **Maintenance burden**: Validation rules must be updated for every new input format.

---

### Additional Defenses (Defense in Depth)

- **Least Privilege**: Grant database accounts only the minimum permissions needed. Never use `db_owner` for application accounts.
- **Least Admin Privileges for Multiple DBs**: Different web applications should use different database user accounts.
- **SQL Views**: Limit read access to specific fields, even masking sensitive columns (e.g., password hashes instead of plaintext).

---

### Verification

- [x] OWASP SQL Injection Prevention Cheat Sheet cited directly
- [x] All four defense options documented
- [x] Parameterized queries vs stored procedures compared
- [x] Limitations of input validation explicitly listed
- [x] Additional defenses (least privilege, views) included

---

## Test 6: CAP Theorem — Practical Implications

### Research Question
What is the CAP theorem and what are its practical implications for distributed database selection? How do CP vs AP systems differ? Give specific database examples. What are the PACELC extensions?

### Primary Sources

1. **Brewer, Eric (2000)**. "Towards Robust Distributed Systems." PODC Keynote. ([sites.cs.ucsb.edu/~rich/class/cs293b-cloud/papers/Brewer_podc_keynote_2000.pdf](https://sites.cs.ucsb.edu/~rich/class/cs293b-cloud/papers/Brewer_podc_keynote_2000.pdf))
2. **Gilbert, Seth; Lynch, Nancy (2002)**. "Brewer's conjecture and the feasibility of consistent, available, partition-tolerant web services." *ACM SIGACT News*, 33(2), 51-59. ([doi:10.1145/564585.564601](https://doi.org/10.1145/564585.564601))
3. **Abadi, Daniel (2012)**. "Consistency Tradeoffs in Modern Distributed Database System Design." *IEEE Computer*, 37-42. (PACELC theorem origin)

---

### What the CAP Theorem States

The CAP theorem, formulated by **Eric Brewer in 2000** and formally proven by **Seth Gilbert and Nancy Lynch in 2002**, states that a distributed data store can provide **at most two** of the following three guarantees simultaneously:

| Property | Definition |
|---|---|
| **Consistency (C)** | Every read receives the most recent write or an error. All nodes see the same data at the same time (linearizability). |
| **Availability (A)** | Every request to a non-failing node returns a response, without guaranteeing it is the most recent data. |
| **Partition Tolerance (P)** | The system continues to operate despite arbitrary message loss or delay between nodes. |

**Critical clarification** (Brewer 2012): The "two of three" framing is misleading. The trade-off only applies **during a network partition**. In normal operations, all three can be satisfied. Since network partitions are inevitable in real distributed systems, P is non-negotiable — the real choice is between **C and A during partitions**.

---

### CP vs AP Systems in Practice

#### CP Systems (Consistency + Partition Tolerance)

During a partition, CP systems **reject requests** that cannot be guaranteed consistent.

| Database | PACELC Class | Behavior During Partition |
|---|---|---|
| **MongoDB** (default replica set) | PC/EC | Elects new primary on majority side; rejects writes on minority side. Unreplicated writes on old primary may be lost. |
| **HBase** | PC/EC | Blocks reads/writes until consistency can be guaranteed |
| **Google Spanner** | PC/EC | Uses TrueTime (GPS + atomic clocks) for global consistency; rejects rather than serve stale |
| **Redis Cluster** | PC/EC | Rejects operations on minority partition |
| **ZooKeeper** | PC/EC | Uses majority quorum; minority partition becomes unavailable |

**MongoDB nuance**: Configuration knobs (`writeConcern: "majority"`, `readConcern: "majority"`) can shift MongoDB toward PC/EC. Default behavior is CP but tunable.

#### AP Systems (Availability + Partition Tolerance)

During a partition, AP systems **serve all requests** even if data is stale.

| Database | PACELC Class | Behavior During Partition |
|---|---|---|
| **Apache Cassandra** | PA/EL | Accepts writes on both sides of partition; reconciles conflicts via last-write-wins or tunable |
| **Amazon DynamoDB** | PA/EL | Highly available across AZs; eventual consistency by default |
| **Apache CouchDB** | PA/EL | Multi-master replication; conflict resolution at read time |
| **Riak** | PA/EL | Vector clocks for conflict detection; always-writable |
| **ScyllaDB** | PA/EL | Cassandra-compatible; same AP behavior |

#### CA Systems (Consistency + Availability — No Partition Tolerance)

There are effectively **no true CA distributed databases**. Single-node RDBMS (PostgreSQL, MySQL) achieve CA but only because they avoid distribution — they don't tolerate partitions by design. As soon as you replicate, you face the CAP trade-off.

---

### CP vs AP — Operational Differences

| Scenario | CP System | AP System |
|---|---|---|
| **Network split** | Rejects requests on minority side | Serves all requests with potentially stale data |
| **Conflict resolution** | Not needed (one source of truth) | Required: LWW, vector clocks, CRDTs, application-level merge |
| **Read consistency** | Strong (linearizable by default) | Eventual (unless tuned: quorum reads) |
| **Write throughput** | Lower (must propagate to quorum) | Higher (write to nearest node) |
| **Use case fit** | Financial systems, inventory, leader election | Social feeds, IoT telemetry, shopping carts |

---

### PACELC Extension (Abadi 2010/2012)

PACELC extends CAP by asking: **what happens when there is no partition?**

> **If Partition (P):** choose between Availability (A) and Consistency (C)
> **Else (E):** choose between Latency (L) and Consistency (C)

| Classification | During Partition | Normal Operation | Examples |
|---|---|---|---|
| **PA/EL** | Availability | Low Latency | Cassandra, DynamoDB, Riak |
| **PA/EC** | Availability | Consistency (higher latency) | MongoDB (default config) |
| **PC/EC** | Consistency | Consistency (higher latency) | Spanner, VoltDB, ZooKeeper |
| **PC/EL** | Consistency | Low Latency | Theoretical; rarely achieved |

**Why PACELC matters**: CAP only describes behavior during failures. PACELC captures the **normal-operation trade-off** — most distributed databases sacrifice either latency or consistency even when the network is healthy.

Modern databases offer **tunable consistency**:
- Cassandra: per-query consistency level (`ONE`, `QUORUM`, `ALL`)
- DynamoDB: strongly consistent reads (2x cost) vs eventual
- MongoDB: `readConcern` and `writeConcern` per operation

---

### Practical Implications for Database Selection

1. **Financial transactions → CP/PC**: Requires linearizability. Use Spanner, CockroachDB, or PostgreSQL with synchronous replication.
2. **Social media feeds → AP/PA**: Stale data is acceptable. Use Cassandra, DynamoDB, or CouchDB.
3. **Shopping cart (Amazon classic) → AP/PA**: Write availability > strict consistency. Reconcile at read time.
4. **Leader election → CP/PC**: Split-brain is worse than unavailability. Use ZooKeeper or etcd.
5. **Global IoT ingestion → AP/EL**: Write throughput from edge devices matters most. Use Cassandra with multi-region replication.

---

### Verification

- [x] Brewer (2000) and Gilbert & Lynch (2002) cited
- [x] CAP theorem formally defined with C, A, P properties
- [x] CP vs AP differences explained with operational behavior
- [x] Specific database examples given (Cassandra=AP, MongoDB=CP, Spanner=CP, DynamoDB=AP, etc.)
- [x] PACELC theorem by Abadi (2010/2012) cited and explained
- [x] PA/EL, PA/EC, PC/EC classifications mapped to real databases

---

*Research completed: 2026-09-05*
*Sources: RFC 8446, OWASP Cheat Sheet Series, Brewer 2000, Gilbert & Lynch 2002, Abadi 2012, Wikipedia CAP Theorem*
