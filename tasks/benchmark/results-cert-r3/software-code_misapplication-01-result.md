## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: code_misapplication | CONFIDENCE: 0.95 | CHECKS_PASSED: 3/8 | LINE_PINNED: 4/4

## Findings

### Checks that passed
- **Units and signs**: No unit/sign errors in the conclusion's numeric claims.
- **Calculation integrity**: The performance claim (SHA-256 with 100k iterations meeting 500ms) is plausible; SHA-256 is fast enough that 100k iterations would likely complete well under 500ms on modern hardware.
- **Conflict check**: NIST SP 800-131A and OWASP agree — both direct toward dedicated password hashing functions. No inter-standard conflict.

### Issues found

1. **SHA-1 approval claim is directly contradicted by cited source (P0 — BLOCKED)**
   - The conclusion states: "Per NIST SP 800-131A, SHA-1 is approved for password hashing when combined with a salt."
   - Evidence 1 (NIST SP 800-131A Rev. 2, Section 5) states: "For password hashing, use a dedicated password hashing function (PBKDF2, bcrypt, scrypt, Argon2) with appropriate work factor."
   - SHA-1 is not a dedicated password hashing function. The source does not approve SHA-1 for password hashing. This is a direct contradiction, not a qualification gap.

2. **SHA-256 recommendation is unsupported by evidence (P0 — BLOCKED)**
   - The conclusion recommends SHA-256 with salt and 100k iterations.
   - Neither NIST SP 800-131A nor OWASP lists SHA-256 as a password hashing function. Both sources specify dedicated password hashing functions (PBKDF2, bcrypt, scrypt, Argon2). SHA-256 is a general-purpose cryptographic hash, not a password hashing function. The evidence does not support this recommendation.

3. **OWASP guidance entirely omitted (P1)**
   - Evidence 2 (OWASP) provides specific recommendations: Argon2id (19 MiB, 2 iterations, 1 parallelism), bcrypt (cost ≥ 10), PBKDF2 (≥ 600,000 iterations). The conclusion ignores all of these and proposes a non-recommended approach.

4. **Iteration count conflates raw hash with password hash (P1)**
   - The conclusion's 100,000 iterations of SHA-256 is not equivalent to PBKDF2's ≥ 600,000 iterations. PBKDF2 is a keyed PRF built on HMAC, not a raw hash. The comparison is invalid.

## Corrected Conclusion

Per NIST SP 800-131A Rev. 2 and OWASP guidance, use a dedicated password hashing function — Argon2id (recommended), bcrypt (cost ≥ 10), or PBKDF2 (≥ 600,000 iterations). SHA-1 and SHA-256 are not approved for password hashing. The performance requirement (500ms) is met by all recommended functions with appropriate work factors.

## Evidence Trail (Line-Pinned)

| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | SHA-1 not approved for password hashing | NIST SP 800-131A Rev. 2 | Section 5 | Contradicted — source requires dedicated password hashing function |
| 2 | SHA-256 not a dedicated password hash | NIST SP 800-131A Rev. 2; OWASP | Section 5; OWASP Cheat Sheet | Unsupported — not in recommended list |
| 3 | OWASP recommendations omitted | OWASP Password Storage Cheat Sheet | 2021 edition | Omission — Argon2id/bcrypt/PBKDF2 guidance ignored |
| 4 | 100k SHA-256 iterations ≠ PBKDF2 600k | OWASP Password Storage Cheat Sheet | 2023 guidance note | Invalid comparison — different constructions |