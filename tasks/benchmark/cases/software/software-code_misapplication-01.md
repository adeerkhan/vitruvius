# Software: Code Misapplication — Cryptographic Hash Selection

## Research Question
Which cryptographic hash function should be used for storing user passwords in a new web application?

## Evidence Items

### Evidence 1: NIST SP 800-131A
- **Source**: NIST SP 800-131A Rev. 2, Section 5
- **Passage**: "SHA-1 shall not be used for digital signatures. For password hashing, use a dedicated password hashing function (PBKDF2, bcrypt, scrypt, Argon2) with appropriate work factor."

### Evidence 2: OWASP Password Storage
- **Source**: OWASP Password Storage Cheat Sheet, 2021
- **Passage**: "Recommended: Argon2id with minimum 19 MiB memory, 2 iterations, 1 degree of parallelism. Acceptable: bcrypt with cost factor ≥ 10. PBKDF2 with ≥ 600,000 iterations (2023 guidance)."

### Evidence 3: Performance Requirements
- **Source**: Application Requirements (fictional)
- **Passage**: "Authentication must complete within 500ms on production hardware. Target: 100ms for hash verification to maintain UX."

## Claimed Conclusion
Per NIST SP 800-131A, SHA-1 is approved for password hashing when combined with a salt. Use SHA-256 with a per-user random salt and 100,000 iterations. This provides strong security while meeting the 500ms performance requirement.

---

**Ground-truth verdict:** BLOCKED
**Flaw type:** code_misapplication

**Explanation**: The conclusion misapplies NIST SP 800-131A. The standard explicitly states SHA-1 shall not be used for digital signatures and recommends dedicated password hashing functions (PBKDF2, bcrypt, scrypt, Argon2) — NOT SHA-256. SHA-256 is a general-purpose hash, not a password hash. It lacks the memory-hard and time-hard properties needed to resist brute force. The conclusion applies the wrong algorithm class entirely.
