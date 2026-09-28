## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: code_misapplication | CONFIDENCE: 0.95 | CHECKS_PASSED: 2/8 | LINE_PINNED: 1/1

## Findings

### Checks that passed
- **Units and signs** — N/A (no physical units in this claim).
- **Calculation integrity** — N/A (no calculation to re-derive).

### Issues found

1. **P0 — Code/standard misapplication (`code_misapplication`):** The conclusion states "Per NIST SP 800-131A, SHA-1 is approved for password hashing when combined with a salt." Evidence 1 (NIST SP 800-131A Rev. 2, §5) explicitly states: "For password hashing, use a dedicated password hashing function (PBKDF2, bcrypt, scrypt, Argon2) with appropriate work factor." The standard directly contradicts the conclusion's central claim. SHA-1 is not approved for password hashing per this source.

2. **P0 — Source-to-claim fidelity (`synthesis_overreach`):** The conclusion claims NIST approval for SHA-1, but the cited passage recommends dedicated password hashing functions (PBKDF2, bcrypt, scrypt, Argon2), not SHA-1 or SHA-256. The source does not support the specific claim.

3. **P0 — Citation entailment (`entailment_failure`):** Given only the cited passage from Evidence 1, the conclusion does NOT follow. The passage explicitly recommends dedicated password hashing functions, not SHA-256 with salt.

4. **P1 — Conflict with Evidence 2:** OWASP Password Storage Cheat Sheet recommends Argon2id, bcrypt, or PBKDF2 — not SHA-256. The conclusion's proposal conflicts with both cited authorities.

5. **P1 — Completeness (`omission`):** The conclusion fails to address the dedicated password hashing functions (PBKDF2, bcrypt, scrypt, Argon2) that both NIST and OWASP recommend.

6. **P1 — Performance claim unsupported:** The conclusion claims the approach "meet[s] the 500ms performance requirement" but provides no calculation, benchmark, or evidence to support this claim. Evidence 3 states a requirement but the conclusion's performance assertion is untraceable.

## Corrected Conclusion

Per NIST SP 800-131A Rev. 2 §5, SHA-1 is **not** approved for password hashing. Use a dedicated password hashing function — Argon2id, bcrypt, scrypt, or PBKDF2 — with appropriate work factors as recommended by both NIST SP 800-131A and the OWASP Password Storage Cheat Sheet. The OWASP guidance specifies Argon2id (minimum 19 MiB memory, 2 iterations, 1 degree of parallelism) as the recommended option, with bcrypt (cost ≥ 10) and PBKDF2 (≥ 600,000 iterations) as acceptable alternatives.

## Evidence Trail (Line-Pinned)

| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | NIST SP 800-131A Rev. 2 recommends dedicated password hashing functions (PBKDF2, bcrypt, scrypt, Argon2), not SHA-1 or SHA-256 | Evidence 1 | §5 | Contradicts conclusion |
| 2 | OWASP recommends Argon2id, bcrypt, or PBKDF2 — not SHA-256 | Evidence 2 | 2021 Cheat Sheet | Contradicts conclusion |
| 3 | Performance requirement is 500ms auth / 100ms hash verification | Evidence 3 | Fictional requirements | Conclusion's performance claim unsupported |