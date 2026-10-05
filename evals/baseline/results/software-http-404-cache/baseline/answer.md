# Is a 404 Not Found response cacheable by default under RFC 9110?

**Short answer: Yes.** Under RFC 9110, a `404 Not Found` response is *heuristically cacheable* — which is what earlier HTTP specifications called "cacheable by default." A cache may reuse it with a heuristic expiration time unless the method definition or explicit cache controls (e.g. `Cache-Control`) say otherwise.

## Which section states the heuristic

Two sections matter, at different levels of generality:

1. **RFC 9110, Section 15.5.5 ("404 Not Found")** states the heuristic for this specific status code. It says verbatim:

   > A 404 response is heuristically cacheable; i.e., unless otherwise indicated by the method definition or explicit cache controls (see Section 4.2.2 of [CACHING]).

   This is the section that directly answers the question for 404.

2. **RFC 9110, Section 15.1 ("Overview of Status Codes")** states the general rule and explicitly lists 404 among the heuristically cacheable codes:

   > Responses with status codes that are defined as heuristically cacheable (e.g., 200, 203, 204, 206, 300, 301, 308, 404, 405, 410, 414, and 501 in this specification) can be reused by a cache with heuristic expiration unless otherwise indicated by the method definition or explicit cache controls [CACHING]; all other status codes are not heuristically cacheable.

## What "heuristically cacheable" / "cacheable by default" means

The defining behavior lives in the referenced companion spec, **RFC 9111 (HTTP Caching)**:

- **RFC 9111, Section 3 ("Storing Responses in Caches")** makes a status code that is "defined as heuristically cacheable" one of the conditions under which a cache may store a response that lacks explicit freshness information.
- **RFC 9111, Section 4.2.2 ("Calculating Heuristic Freshness")** governs how a cache assigns a heuristic expiration when no explicit expiry is present, and states the equivalence with the older term:

  > Note that in previous specifications, heuristically cacheable response status codes were called "cacheable by default".

So "404 is cacheable by default" is accurate: RFC 9111 §4.2.2 confirms that "heuristically cacheable" *is* the modern name for "cacheable by default."

## Important qualifications

"Cacheable by default" is not the same as "will be cached forever."

- It is a **permission, not a guarantee**: a cache *may* store and heuristically reuse the response; it is not obligated to.
- **Explicit cache controls override it.** `Cache-Control: no-store`, `no-cache`, `private`, `max-age`, etc., and in some cases the method definition take precedence — the phrase "unless otherwise indicated by the method definition or explicit cache controls" in both quoted sections says exactly this.
- **Heuristic freshness is bounded** by whatever algorithm the cache uses (RFC 9111 §4.2.2; it does not prescribe a specific algorithm). A cached 404 is still subject to normal freshness, validation, and invalidation behavior.
- The permission applies to caches that "understand" the method; the general storing conditions in RFC 9111 §3 must also be met.

## Summary table

| Claim | Source | Section |
|---|---|---|
| 404 is heuristically cacheable (the code-specific statement) | RFC 9110 | §15.5.5 |
| General list of heuristically cacheable codes, including 404 | RFC 9110 | §15.1 |
| "Heuristically cacheable" is the current name for "cacheable by default" | RFC 9111 | §4.2.2 |
| A heuristically cacheable status code is one condition for storing without explicit freshness | RFC 9111 | §3 (§3, item list) |
| Origin server SHOULD be aware 404 can be cached but can still suppress it with cache controls | RFC 9110 | §15.5.5 + §15.1 |

## Source retrieval disclosure

- **RFC 9110 (HTTP Semantics)** — *retrieved and read during this task.* Full plain-text RFC downloaded from `https://www.rfc-editor.org/rfc/rfc9110.txt` and inspected directly (Sections 15.1 and 15.5.5 read in context). Saved at `evals/baseline/results/software-http-404-cache/baseline/sources/rfc9110.txt`.
- **RFC 9111 (HTTP Caching)** — *retrieved and read during this task.* Full plain-text RFC downloaded from `https://www.rfc-editor.org/rfc/rfc9111.txt` and inspected directly (Sections 3 and 4.2.2 read in context). Saved at `evals/baseline/results/software-http-404-cache/baseline/sources/rfc9111.txt`.

Both sources were fetched during this task; no cited claim relies on unaided prior knowledge alone.

```json
{"citations":[{"locator":"RFC 9110, Section 15.5.5 (404 Not Found)","status":"read","supported":true,"artifact_path":"evals/baseline/results/software-http-404-cache/baseline/sources/rfc9110.txt"},{"locator":"RFC 9110, Section 15.1 (Overview of Status Codes)","status":"read","supported":true,"artifact_path":"evals/baseline/results/software-http-404-cache/baseline/sources/rfc9110.txt"},{"locator":"RFC 9111, Section 3 (Storing Responses in Caches)","status":"read","supported":true,"artifact_path":"evals/baseline/results/software-http-404-cache/baseline/sources/rfc9111.txt"},{"locator":"RFC 9111, Section 4.2.2 (Calculating Heuristic Freshness)","status":"read","supported":true,"artifact_path":"evals/baseline/results/software-http-404-cache/baseline/sources/rfc9111.txt"}]}
```
