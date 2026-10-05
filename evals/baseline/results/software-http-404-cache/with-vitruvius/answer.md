# Under RFC 9110, is a 404 Not Found response cacheable by default?

**Answer: Yes.** Under RFC 9110, a `404 (Not Found)` response is *heuristically cacheable* — the term RFC 9110 uses for what earlier HTTP specifications called "cacheable by default". RFC 9110 states this in two places: the general rule in **Section 15.1 (Overview of Status Codes)**, and the status-code-specific statement in **Section 15.5.5 (404 Not Found)**.

## Evidence and per-claim status

| # | Claim | Status | Source (document + section) |
|---|-------|--------|------------------------------|
| 1 | RFC 9110 defines a set of status codes as "heuristically cacheable", and 404 is one of them. | **verified** | RFC 9110, Section 15.1 "Overview of Status Codes" |
| 2 | The 404 status code's own definition states "A 404 response is heuristically cacheable". | **verified** | RFC 9110, Section 15.5.5 "404 Not Found" |
| 3 | "Heuristically cacheable" means the response can be reused by a cache with heuristic expiration unless otherwise indicated by the method definition or explicit cache controls. | **verified** | RFC 9110, Section 15.1; RFC 9110, Section 15.5.5 |
| 4 | The meaning of the heuristic ("cacheable by default") is defined by the caching spec, RFC 9111, referenced by RFC 9110 as `[CACHING]`. | **verified** | RFC 9111, Section 4.2.2 "Calculating Heuristic Freshness" |
| 5 | RFC 9111 §4.2.2 explicitly notes that status codes it now calls "heuristically cacheable" were called "cacheable by default" in previous specifications. | **verified** | RFC 9111, Section 4.2.2 |
| 6 | RFC 9110 Section 15.1 is the section that states the general heuristic-cacheability rule (the section "which states the heuristic"). | **verified** | RFC 9110, Section 15.1 |

No claim in this answer is `inferred` or `blocked`; every quoted statement was retrieved and read directly from the RFC text files saved under `sources/`.

## Direct quotations

### RFC 9110, Section 15.1 — Overview of Status Codes

> Responses with status codes that are defined as heuristically
> cacheable (e.g., 200, 203, 204, 206, 300, 301, 308, 404, 405, 410,
> 414, and 501 in this specification) can be reused by a cache with
> heuristic expiration unless otherwise indicated by the method
> definition or explicit cache controls [CACHING]; all other status
> codes are not heuristically cacheable.

### RFC 9110, Section 15.5.5 — 404 Not Found

> A 404 response is heuristically cacheable; i.e., unless otherwise
> indicated by the method definition or explicit cache controls (see
> Section 4.2.2 of [CACHING]).

### RFC 9111, Section 4.2.2 — Calculating Heuristic Freshness

> Because of the requirements in Section 3, heuristics can only be used on
> responses without explicit freshness whose status codes are defined
> as "heuristically cacheable" (e.g., see Section 15.1 of [HTTP]) and
> on responses without explicit freshness that have been marked as
> explicitly cacheable (e.g., with a public response directive).
>
> Note that in previous specifications, heuristically cacheable
> response status codes were called "cacheable by default".

### RFC 9111, Section 3 — Storing Responses in Caches (requirement)

> -  a status code that is defined as heuristically cacheable (see
>    Section 4.2.2).

## Notes / boundaries

- RFC 9110 uses the term **"heuristically cacheable"**, not the literal phrase "cacheable by default". The phrase "cacheable by default" is the *older* terminology; RFC 9111 §4.2.2 records this equivalence explicitly (claim 5). So the answer to "cacheable by default" is yes, under the RFC 9110 term.
- "Heuristically cacheable" is a default *permission*, not an unconditional mandate: it can be overridden by the request method definition or explicit cache controls (e.g., `no-store`, `private`), as RFC 9110 Sections 15.1 and 15.5.5 state.
- `[CACHING]` in RFC 9110 resolves to RFC 9111, "HTTP Caching" (listed in RFC 9110's references).

## Sources actually retrieved in this task

- `sources/rfc9110.txt` — RFC 9110, "HTTP Semantics", IETF, June 2022. Retrieved from `https://www.rfc-editor.org/rfc/rfc9110.txt` (502,941 bytes).
- `sources/rfc9111.txt` — RFC 9111, "HTTP Caching", IETF, June 2022. Retrieved from `https://www.rfc-editor.org/rfc/rfc9111.txt` (84,477 bytes).

## Citation manifest

```json
{"citations":[{"locator":"RFC 9110 Section 15.1","status":"read","supported":true,"artifact_path":"evals/baseline/results/software-http-404-cache/with-vitruvius/sources/rfc9110.txt"},{"locator":"RFC 9110 Section 15.5.5","status":"read","supported":true,"artifact_path":"evals/baseline/results/software-http-404-cache/with-vitruvius/sources/rfc9110.txt"},{"locator":"RFC 9111 Section 4.2.2","status":"read","supported":true,"artifact_path":"evals/baseline/results/software-http-404-cache/with-vitruvius/sources/rfc9111.txt"},{"locator":"RFC 9111 Section 3","status":"read","supported":true,"artifact_path":"evals/baseline/results/software-http-404-cache/with-vitruvius/sources/rfc9111.txt"}]}
```
