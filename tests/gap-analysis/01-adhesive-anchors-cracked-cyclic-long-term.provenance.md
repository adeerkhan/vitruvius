# Provenance: 01-adhesive-anchors-cracked-cyclic-long-term

## Source accounting

**Source tiers consulted:** 3 (OpenAlex, arXiv, web)

**Queries executed and hit counts:**

| # | Source | Query string | URL | Hits | Date |
|---|--------|--------------|-----|------|------|
| 1 | OpenAlex | adhesive+anchors+cracked+concrete+cyclic+fatigue | api.openalex.org/works?filter=title_and_abstract.search:adhesive+anchors+cracked+concrete+cyclic+fatigue&per-page=20&... | 0 | 2026-09-05 |
| 2 | OpenAlex | adhesive+anchors+concrete+cyclic+fatigue (broadened, drop "long-term") | api.openalex.org/works?filter=title_and_abstract.search:adhesive+anchors+concrete+cyclic+fatigue&per-page=20&sort=cited_by_count:desc | 1 | 2026-09-05 |
| 3 | OpenAlex | post-installed+anchors+concrete+fatigue (further broadened) | api.openalex.org/works?filter=title_and_abstract.search:post-installed+anchors+concrete+fatigue&per-page=20&sort=cited_by_count:desc | 14 | 2026-09-05 |
| 4 | OpenAlex | adhesive+anchors+concrete+cracked (cracked axis) | api.openalex.org/works?filter=title_and_abstract.search:adhesive+anchors+concrete+cracked&per-page=20&sort=cited_by_count:desc | 21 | 2026-09-05 |
| 5 | arXiv | adhesive+anchors+cracked+concrete+cyclic+fatigue | export.arxiv.org/api/query?search_query=all:adhesive+anchors+cracked+concrete+cyclic+fatigue&max_results=20 | 0 | 2026-09-05 |
| 6 | arXiv | adhesive+anchors+concrete+fatigue (broadened) | export.arxiv.org/api/query?search_query=all:adhesive+anchors+concrete+fatigue&max_results=20 | 0 | 2026-09-05 |
| 7 | Web (DuckDuckGo) | "adhesive anchors" "cracked concrete" "long-term" "cyclic" research gap | html.duckduckgo.com/html/?q="adhesive+anchors"+"cracked+concrete"+"long-term"+"cyclic"+research+gap | 0 | 2026-09-05 |
| 8 | Web (DuckDuckGo) | "post-installed anchors" "cracked concrete" fatigue committee report research | html.duckduckgo.com/html/?q="post-installed+anchors"+"cracked+concrete"+fatigue+committee+report+research | 6 (3 relevant with "open problem" language) | 2026-09-05 |

**Total queries:** 8
**Total hit count:** 42 (across all sources)
**Direct-gap hits:** 0

**Tier weighting of edge papers cited in dossier:**

| # | Edge paper | Source | Citations | Tier | Reasoning |
|---|-----------|--------|-----------|------|-----------|
| 1 | Behavior of Post-Installed Anchors Under Cyclic Load | OpenAlex | 40 | 2 | Peer-reviewed (ASCE J. Performance), clear methodology, recent |
| 2 | Fatigue Performance of Post-Installed Anchors (dry/wet) | OpenAlex | 0 | 2 | Peer-reviewed, 2-variable matrix, very recent (2024) |
| 3 | Creep of adhesive anchors in non-cracked concrete | OpenAlex | 1 | 2 | Peer-reviewed, 2019, clear method but under-cited |
| 4 | Fire performance of bonded anchors in cracked concrete | OpenAlex | 0 | 2 | Peer-reviewed, 2026, recent |
| 5 | Experimental study of anchor under simulated seismic | OpenAlex | 0 | 2 | Peer-reviewed, 2025, recent |
| 6 | Bearing capacity of anchors at multi-cyclic dynamic loads | OpenAlex | 0 | 3 | Likely conference/extended abstract; mechanical focus |
| 7 | Cyclic testing of post-bonded rebar (1985) | OpenAlex | 0 | 3 | Older (1985), predecessor work, conference-era |

**Open-problem signals found:**
- 1 peer-reviewed source (Mahmoud et al. 2023, Engineering Structures / Tandfonline — full text paywalled, cited from snippet)
- 1 committee-adjacent source (STRUCTURE Magazine, ACI 355 / CAMA-affiliated author)
- 2 vendor sources (MKT, Hilti) — Tier 4, used for confirmation only

**OpenAlex API version:** public, keyless
**arXiv API version:** public, keyless
**Web search:** DuckDuckGo HTML (Google Scholar blocked per scholarly-research skill rules)

**Triangulation verdict:** PASS — 0 direct hits on narrow query, 0 on arXiv, 2+ independent "open problem" web signals.
**Confidence rating:** High
**Dossier status:** Validated gap
