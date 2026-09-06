# Provenance Sidecar — Gap Analysis 02 (AM Ti-6Al-4V Variable-Amplitude Fatigue)

**Dossier:** `outputs/gap-analysis/02-am-ti6al4v-variable-amplitude.md`
**Date:** 2026-09-06
**Method:** `gap-analysis` skill, all 4 phases executed.

---

## Source Accounting

### Queries executed

| # | Endpoint | URL | Hits returned | Date |
|---|----------|-----|---------------|------|
| 1 | OpenAlex narrow | `https://api.openalex.org/works?filter=title_and_abstract.search:additive+manufactured+Ti-6Al-4V+variable+amplitude+fatigue&per-page=20&select=id,display_name,publication_year,cited_by_count,doi,open_access,best_oa_location&sort=cited_by_count:desc` | 9 | 2026-09-06 |
| 2 | OpenAlex broader (AM Ti-6Al-4V fatigue) | `https://api.openalex.org/works?filter=title_and_abstract.search:additive+manufactured+Ti-6Al-4V+fatigue&per-page=20&select=id,display_name,publication_year,cited_by_count,doi&sort=cited_by_count:desc` | 915 | 2026-09-06 |
| 3 | OpenAlex (Ti-6Al-4V variable amplitude fatigue) | `https://api.openalex.org/works?filter=title_and_abstract.search:Ti-6Al-4V+variable+amplitude+fatigue&per-page=20&select=id,display_name,publication_year,cited_by_count,doi&sort=cited_by_count:desc` | 78 | 2026-09-06 |
| 4 | arXiv narrow | `https://export.arxiv.org/api/query?search_query=all:additive+manufactured+Ti-6Al-4V+variable+amplitude+fatigue&max_results=20` | 19 (returned) | 2026-09-06 |
| 5 | arXiv broader | `https://export.arxiv.org/api/query?search_query=all:Ti-6Al-4V+variable+amplitude+fatigue&max_results=20` | 20 (returned) | 2026-09-06 |
| 6 | DuckDuckGo HTML #1 | `https://html.duckduckgo.com/html/?q=%22additively+manufactured%22+%22Ti-6Al-4V%22+%22variable+amplitude%22+fatigue+research+gap+OR+%22open+problem%22` | 0 (no-results page) | 2026-09-06 |
| 7 | DuckDuckGo HTML #2 | `https://html.duckduckgo.com/html/?q=%22AM+Ti-6Al-4V%22+%22variable+amplitude%22+fatigue+OR+spectrum+loading` | n/a (CAPTCHA blocked) | 2026-09-06 |

### Edge papers (with provenance)

| # | OpenAlex ID / arXiv ID | Citation count | Year | Tier assignment rationale |
|---|---|---|---|---|
| 1 | W2999537139 | 75 | 2020 | IJFatigue peer-reviewed review; mid-tier citation impact; methodology clear. **Tier 2.** |
| 2 | W3217732661 | 1 | 2019 | UT Austin institutional repository thesis; 1 citation; supports but not standalone. **Tier 3.** |
| 3 | W4414399775 | 2 | 2025 | IJFatigue peer-reviewed; recent, methodology clear but not yet replicated. **Tier 2 (with recency caveat).** |
| 4 | W2244644389 | 549 | 2015 | IJFatigue canonical AM Ti-6Al-4V fatigue review; high-impact, explicitly acknowledges the gap. **Tier 1.** |
| 5 | W2194865258 | 99 | 2015 | Acta Materialia foundational physics on wrought Ti-6Al-4V dwell + VA. **Tier 1.** |
| 6 | W2086788521 | 44 | 1999 | IJF classic on VA fretting fatigue in wrought Ti-6Al-4V. Methodology still canonical; recency caveat. **Tier 2.** |
| 7 | arXiv:2311.07046 | (preprint) | 2023 | Comprehensive AM-metals fatigue review; not yet peer-reviewed in target venue. **Tier 3.** |

### Triangulation scoring

| Tier | Verdict | Reasoning |
|------|---------|-----------|
| OpenAlex narrow (Q1) | Gap signal | 9 hits, only 1–2 directly fill the gap, rest adjacent (vibration/multiaxial) or tangential. |
| arXiv (Q4, Q5) | Gap signal | 0 preprints directly on the gap; related preprints cover generic spectrum-life models or AM-microstructure, not the AM × VA intersection. |
| Web (Q6, Q7) | Inconclusive | Q6 confirmed 0 results naming the gap; Q7 blocked by DuckDuckGo bot-anomaly CAPTCHA. Cannot satisfy the skill's "≥2 independent open-problem signals" requirement fully. |

### Confidence rationale

- **Medium** confidence: two of three tiers (OpenAlex, arXiv) clearly show the gap. The third tier (web) is incomplete (one query returned zero, one was CAPTCHA-blocked). Per the skill's fail-closed rule, the gap is reported as **probable**, not confirmed.
- The canonical 2015 IJFatigue review (W2244644389) explicitly leaves variable-amplitude as future work, which is the strongest internal acknowledgment that the gap exists.
- The 2025 dwell+overload paper (W4414399775) is the closest peer-reviewed acknowledgment of the gap but does not yet fill it.

### Files written

- `outputs/gap-analysis/02-am-ti6al4v-variable-amplitude.md` — full dossier (What's Missing, Why It Matters, Research Questions, Key Papers, Validation, Confidence)
- `outputs/gap-analysis/02-am-ti6al4v-variable-amplitude.provenance.md` — this file
- `outputs/test-3-gap-analysis-report.md` — test report

### Reproducibility

All 7 queries are REST GETs against public endpoints (OpenAlex, arXiv, DuckDuckGo HTML). Reproducible from any host with HTTPS access. Bot-anomaly CAPTCHAs on DuckDuckGo are expected for high-volume retrieval and represent a known limitation of that source tier.
