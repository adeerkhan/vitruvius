# Audit: retry policy vs implementation

**Verdict: MISMATCH — non-compliant.** The code permits 5 attempts; the spec allows 3 retries.

Both sides read directly (spec text and code snippet as supplied). No repo path, commit, or version pins either side; scope is the two quoted lines only.

| # | Claim (spec) | Actual (code) | Status |
|---|---|---|---|
| 1 | Retry limit is **3** | `MAX_RETRIES = 5` | **Mismatch** — 2 extra retries |
| 2 | "up to 3 times" bounds retries | `for (i = 0; i < 5; i++) attempt()` runs `attempt()` 5 times | **Mismatch** — bound is 5 calls, not 3 retries |
| 3 | A retry follows a failure | No result check, `break`, or return | **Missing** — cannot distinguish retry from repeat |
| 4 | Limit is a fixed requirement | Constant with no test or assertion tying it to the spec | **Gap** — silent drift, already occurred |

## Off-by-one

Setting the constant to `3` still leaves semantics undefined. "Retry up to 3 times" usually means **one initial attempt plus up to 3 retries = 4 calls**. `i < MAX_RETRIES` yields `MAX_RETRIES` total calls, so `3` gives 3 attempts (2 retries) — one short under the usual reading. The spec does not say which convention it uses; resolve this before writing a test.

## Findings

- **Count exceeds spec by 2** (`5` vs `3`).
- **No failure condition.** The loop repeats even after success, wasting calls and duplicating side effects.
- **No exit or backoff.** No `break`, delay, or spec-derived cap.
- **No enforcement.** Nothing fails when the constant drifts.

## Required changes

1. Set the budget to 3 and state whether that includes the initial attempt.
2. Capture `attempt()`'s result and `break` on success; count failed attempts only.
3. Add tests asserting exact call counts for repeated failure and first-success.

## Sources

- Spec: supplied in request (no document, section, or version).
- Code: supplied snippet (`MAX_RETRIES`, `for` loop); no file, repo, or commit.

Research-only; not for final engineering sign-off.
