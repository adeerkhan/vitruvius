## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: synthesis_overreach | CONFIDENCE: 0.97 | CHECKS_PASSED: 1/8 | LINE_PINNED: 3/3

## Findings

### Checks that passed
- **Check 2 (Units and signs):** No unit/sign errors in the traditional sense. Iteration counts and time values are internally consistent.

### Issues found

1. **P0 — Direct contradiction of cited source (synthesis_overreach / entailment_failure):** The conclusion states "Per NIST SP 800-131A, SHA-1 is approved for password hashing when combined with a salt." Evidence 1 says the opposite: "For password hashing, use a dedicated password hashing function (PBKDF2, bcrypt, scrypt, Argon2) with appropriate work factor." SHA-1 is not a dedicated password hashing function, and the source does not approve it for this purpose. The conclusion fabricates approval that the source does not grant.

2. **P0 — Wrong algorithm recommendation (code_misapplication):** The conclusion recommends SHA-256 with 100,000 iterations. Neither NIST SP 800-131A nor OWASP recommends SHA-256 for password hashing. Both sources recommend dedicated password hashing functions (PBKDF2, bcrypt, scrypt, Argon2). SHA-256 is a general-purpose hash, not a password hashing function — it lacks the memory-hard and work-factor properties that make password hashes resistant to brute-force attacks.

3. **P1 — OWASP guidance entirely omitted (omission):** Evidence 2 (OWASP) provides specific parameter recommendations (Argon2id: 19 MiB memory, 2 iterations, 1 parallelism; bcrypt: cost ≥ 10; PBKDF2: ≥ 600,000 iterations). The conclusion ignores all of these and provides no justification for departing from them.

4. **P1 — Unsupported performance claim (calculation_error):** The conclusion asserts "meeting the 500ms performance requirement" but provides no calculation, benchmark, or evidence that SHA-256 with 100,000 iterations meets this target. The performance requirement (Evidence 3) is cited but not used in deriving the answer.

5. **P1 — "Strong security" claim unsupported (synthesis_overreach):** The conclusion claims "This provides strong security" without evidence. Given that the recommended algorithm contradicts both authoritative sources, this claim is not merely unsupported — it is contradicted.

## Corrected Conclusion

Per NIST SP 800-131A Rev. 2 §5 and OWASP Password Storage guidance, use a dedicated password hashing function for storing user passwords. Recommended: **Argon2id** with minimum 19 MiB memory, 2 iterations, and 1 degree of parallelism. Acceptable alternatives: **bcrypt** with cost factor ≥ 10, or **PBKDF2** with ≥ 600,000 iterations (2023 guidance). Do not use SHA-1 or SHA-256 for password hashing — they are general-purpose hashes without the memory-hard properties required for password storage. Verify that the selected configuration meets the 500ms authentication / 100ms hash verification performance target on production hardware through benchmarking.

## Evidence Trail (Line-Pinned)

| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | NIST SP 800-131A mandates dedicated password hashing functions (PBKDF2, bcrypt, scrypt, Argon2), not SHA-1/SHA-256 | Evidence 1 | NIST SP 800-131A Rev. 2, §5 | **Contradicts** conclusion's SHA-1 approval claim |
| 2 | OWASP recommends Argon2id (19 MiB, 2 iter, 1 parallelism), bcrypt (≥10), PBKDF2 (≥600k iter) | Evidence 2 | OWASP Password Storage Cheat Sheet, 2021 | **Contradicts** conclusion's SHA-256 recommendation |
| 3 | Performance requirement: 500ms auth, 100ms hash verification | Evidence 3 | Application Requirements (fictional) | **Unused** — conclusion asserts compliance without evidence |