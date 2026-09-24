## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: code_misapplication | CONFIDENCE: 0.97 | CHECKS_PASSED: 1/8 | LINE_PINNED: 3/3

## Findings
### Checks that passed
- Source identification: NIST SP 800-131A and OWASP cheat sheet are the correct authorities for this question.

### Issues found
- **Direct contradiction (code_misapplication):** The conclusion asserts "SHA-1 is approved for password hashing when combined with a salt." Evidence 1 says no such thing — it directs use of a dedicated password hashing function (PBKDF2, bcrypt, scrypt, Argon2). Salt does not make a fast hash suitable for passwords.
- **Fabricated approval:** The NIST passage contains no SHA-1-for-passwords approval, salted or otherwise. This is synthesis overreach / entailment failure.
- **Criterion mismatch:** SHA-256 + 100,000 iterations is not one of the recommended functions and is below the OWASP PBKDF2 floor (≥600,000 iterations, Evidence 2). Argon2id also satisfies the 100ms/500ms targets, so the performance requirement does not justify a non-recommended primitive.
- **Missing factor:** Work-factor/memory-hardness consideration omitted entirely.

## Corrected Conclusion
Use Argon2id (min 19 MiB, 2 iterations, 1 parallelism) per OWASP; bcrypt (cost ≥10) or PBKDF2 (≥600,000 iterations) as fallbacks. SHA-1 is not approved for password hashing; SHA-256 + salt + 100k iterations is non-compliant.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | SHA-1 approved with salt | NIST SP 800-131A Rev. 2, §5 | "use a dedicated password hashing function" | REFUTED |
| 2 | SHA-256 + 100k iterations acceptable | OWASP Password Storage Cheat Sheet, 2021 | PBKDF2 ≥600,000 iterations | REFUTED |
| 3 | Meets 500ms/100ms requirement | Application Requirements | 500ms / 100ms targets | TRUE but does not rescue claim |
