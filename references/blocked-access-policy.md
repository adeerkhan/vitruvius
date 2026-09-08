# Blocked Access Policy

When a source is paywalled, unreachable, or returns no results, follow these rules.

## Rules

### 1. Cite from metadata, never guess

When full-text access is blocked, you may cite:
- Title
- Authors
- Publication year
- Abstract or snippet from search results
- DOI or URL

You may NOT cite:
- Specific numbers, tables, or provisions you have not read
- Claims about the source's contents
- Paraphrased passages you have not verified

### 2. Mark status as `blocked`

In the evidence table and provenance sidecar:

| # | Source | Reference | Key claim | Type | Status |
|---|--------|-----------|-----------|------|--------|
| 1 | Smith et al. 2024 | doi:10.xxxx (paywall) | General direction confirmed | paper | blocked |

### 3. Record the access attempt

In the provenance sidecar, document:

```markdown
## Blocked Sources

- **Smith et al. 2024** — doi:10.xxxx — paywall at publisher site, abstract only
  - Attempted: direct fetch, OpenAlex, Semantic Scholar
  - Available: title, authors, abstract snippet
  - Used for: general direction only, not specific claims
```

### 4. Distinguish blocked from not found

| Status | Meaning | Action |
|--------|---------|--------|
| `blocked` | Source exists but full-text unavailable | Cite from metadata, mark blocked |
| `unverified` | Source not yet checked | Search for it |
| `failed` | Source contradicts the claim | Fix claim or find better source |

### 5. When to stop searching

- After 3 distinct search queries with no results → mark `blocked`
- After 2 failed fetch attempts → mark `blocked`
- If only abstract available → cite abstract, mark `blocked` for full text

## Examples

**Correct:**
> Smith et al. (2024) identify hydrogen embrittlement as a key concern for high-strength steels [1, blocked].
>
> [1] Smith, J. et al. "Hydrogen Effects in Steels." *Journal of Materials Science*, 2024. doi:10.xxxx (paywall, abstract only)

**Incorrect:**
> Smith et al. (2024) report a 35% reduction in fatigue life at 2ppm hydrogen concentration [1].
>
> [1] Smith, J. et al. "Hydrogen Effects in Steels." *Journal of Materials Science*, 2024. doi:10.xxxx (paywall)

The second example cites a specific number (35%) from a paywalled source — this is fabrication.
