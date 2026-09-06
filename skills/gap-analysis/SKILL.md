---
name: gap-analysis
description: >
  Identify and validate engineering literature gaps using scholarly triangulation.
  Use when the user invokes /gap-analysis, asks to find research gaps in an
  engineering field, or when a discipline skill hits an evidence dead-end (no
  code provision, paper, or dataset addresses the question). Wraps the
  scholarly-research skill for source discovery and adds gap-specific
  methodology: narrow-query hit thresholds, cross-source triangulation, and
  structured dossier output. Do NOT use for non-engineering literature surveys
  or when the user already has a specific gap in mind and wants it filled.
argument-hint: "<discipline> <sub-topic> [--deep | --quick]"
allowed-tools: Write Edit Bash Read
license: MIT
---

# Gap Analysis

Run a systematic literature gap analysis for an engineering sub-topic. This
skill wraps `scholarly-research` for source discovery and adds the gap-validation
methodology on top.

## Invocation

```
/gap-analysis <discipline> <sub-topic> [--deep | --quick]
```

- **discipline**: one of `civil`, `mechanical`, `electrical`, `software`, `architectural`
- **sub-topic**: narrow focus within the discipline (e.g., `FRP-bonding`, `hydrogen-embrittlement`). Required — if the user doesn't provide one, ask.
- **`--deep`**: Force parallel verification lanes for all gap validation claims.
- **`--quick`**: Skip parallel verification, use single-source checks only.
- **No flag**: Auto-scale based on gap criticality (safety-related gaps get parallel verification).

## Methodology (Execute This)

### Phase 1 — Narrow-Query Search (wrap scholarly-research)

For the target sub-topic, construct a narrow search query and run it through
OpenAlex using `title_and_abstract.search`:

```
GET https://api.openalex.org/works?filter=title_and_abstract.search:<urlencoded terms>&per-page=20&select=id,display_name,publication_year,cited_by_count,doi,open_access,best_oa_location,authorships
```

Then run the same query on arXiv:

```
GET https://export.arxiv.org/api/query?search_query=all:<terms>&max_results=20
```

**Gap signal:** If the narrow query returns **0–5 hits**, and the top hits are
off-topic, low-citation (<5), or only tangentially related — this is evidence
of a gap.

### Phase 2 — Triangulation

A gap is validated only if **all three** source tiers agree:

| Source | What to check |
|--------|--------------|
| **OpenAlex** | Narrow query returns 0–5 relevant hits |
| **arXiv** | Related preprints are absent or tangential |
| **Web search** | ≥2 independent "open problem" signals (committee reports, program descriptions, standards documents naming the gap explicitly) |

If triangulation fails, the gap is `unverified` — report it as a suspected
gap with lower confidence.

### Phase 3 — Edge Paper Identification

Find 4–7 papers that **touch the edges** of the gap — they address adjacent
problems but do not fill the gap. For each, annotate:

- **Title, authors, year, DOI**
- **Covers:** what this paper addresses (the adjacent territory)
- **Misses:** what it does not address (the gap itself)
- **Evidence quality tier** (see below)

### Phase 4 — Evidence Quality Tiers

Score each source using the tier system defined in
`references/evidence-quality-tiers.md`. Summary:

- **Tier 1 (authoritative):** standard/code provision, or high-impact verified source
- **Tier 2 (reliable):** peer-reviewed with clear methodology
- **Tier 3 (supporting):** preprint, conference, or tangential paper
- **Tier 4 (weak):** vendor doc, low-citation, or methodologically thin

Weight: source tier > methodology > citation authority > reproducibility > recency.

## Output

### Inline Summary (chat response)

- Gap statement (1-2 sentences)
- Confidence: High | Medium | Low (based on triangulation completeness)
- Validation counts: OpenAlex hits, arXiv hits, web "open problem" signals
- Top 3 edge papers: [first author, year] — covers X, misses Y [Tier N]
- 3-5 concrete, answerable research questions
- Path to full dossier on disk

### Full Dossier (saved to disk)

Match the structure of existing `gap-analysis/<discipline>/<NN>-<slug>.md` files in
this repository. Required sections:

- **What's Missing** — specific knowledge gap description
- **Why It Matters** — safety, economic, societal stakes
- **Suggested Research Questions** — 3-5 concrete, answerable
- **Key Papers (Touching the Edges)** — 4-7 papers with Authors, Year, DOI/URL, Covers, Misses, Tier
- **Validation** — OpenAlex query + hits + date, arXiv query + hits + date, web sources, open problem signals
- **Confidence** — High | Medium | Low with justification

Write the dossier to `outputs/gap-analysis/<slug>.md` and a provenance sidecar
to `outputs/gap-analysis/<slug>.provenance.md`.

## Scope and Boundaries

- This skill identifies gaps — it does **not** fill them. For filling gaps,
  dispatch to `engineering-research`.
- Output is research-only, not design or implementation guidance.
- Fail-closed: if triangulation cannot be completed, mark the gap `unverified`
  rather than claiming it exists.
- Never fabricate a gap. If the literature adequately covers the topic, say so.
