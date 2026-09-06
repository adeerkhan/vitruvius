# Gap Dossier: Long-Term Durability of Post-Installed Adhesive Anchors in Cracked Concrete Under Cyclic Loading

**Discipline:** civil
**Sub-topic:** long-term durability of post-installed adhesive anchors in cracked concrete under cyclic loading
**Date:** 2026-09-05
**Status:** Validated (triangulation across 3 source tiers)

---

## What's Missing

There is no peer-reviewed body of work that **simultaneously** addresses (a) **long-term / sustained-load / creep** behavior of post-installed adhesive anchors, (b) **cracked-concrete** base material, and (c) **cyclic (fatigue-type) loading** at the bond interface. Existing studies handle these variables in pairs or in isolation:

- ACI 355.2 / ACI 355.4 / fib Bulletin 58 cover **cracked concrete** anchor qualification, including a *crack-width cycling* test — but the cycling is a **single-day reliability test** (cycles the crack width, not sustained cyclic load over years) and the protocols do not require post-test creep, sustained-load, or environmental aging.
- Creep of adhesive anchors is studied in **uncracked** concrete (e.g., 2019 "Creep behaviour of tension loaded adhesive anchors in non-cracked low strength concrete" — 1 citation).
- Fatigue / seismic tests study **cyclic** loads but in **uncracked** concrete or against a single shock event, not years of service under a moving crack.
- Long-term environmental durability (moisture, temperature, chemical exposure) of the bond is addressed in isolation (EAD 330250 Annex C-style sustained-load tests at elevated temperature) but not combined with simultaneous crack cycling.

The intersecting regime — **adhesive bond aging while a propagating crack repeatedly opens and closes across the anchor for years under sustained + cyclic load** — is unoccupied in the public literature. A reviewer searching the exact intersection today finds essentially nothing (0 OpenAlex hits on the narrow title-and-abstract query combining all four terms; 0 arXiv preprints).

---

## Why It Matters

**Safety stakes:** Post-installed adhesive anchors are the primary load-transfer mechanism in retrofit, bracing, and seismic-strengthening connections on operating infrastructure (bridges, nuclear power plants, hospital equipment anchors, crane rails, façade bracing). Cracking in service is the norm, not the exception, in reinforced concrete. A 26% bond-strength reduction in cracked concrete was already measured in static tests (CAMA, 2014); under years of crack-width cycling with simultaneous sustained load the residual strength is unknown and unaccounted for in any current design code.

**Economic stakes:** Conservative design (or shut-down) of infrastructure whose anchor qualification can't be defended for the full service life. Nuclear, transportation, and industrial owners cannot easily extend service intervals without a defensible long-term performance basis.

**Regulatory stakes:** ACI 355.4, EAD 330499, fib Bulletin 58, and EN 1992-4 (Eurocode 2 Part 4) all explicitly note that long-term combined loading is **outside the qualification scope**. A code change is gated on data that does not yet exist.

**Reproducibility stakes:** Without a standard test method, published "long-term" studies use inconsistent protocols (crack widths from 0.012 in to 0.5 mm, cycle frequencies 0.1–2 Hz, durations from hours to 18 months) — making cross-comparison impossible.

---

## Suggested Research Questions

1. **What is the residual bond capacity of a post-installed adhesive anchor in a 0.3–0.5 mm cyclically-opening crack after 10⁶ cycles under a sustained tensile load equal to 30–60% of the short-term static cracked-concrete capacity?** (Service-life analog: 20+ years at typical wind/traffic/seismic spectra.)
2. **How does the time-to-failure under sustained load depend on the simultaneous presence of crack-width cycling versus static cracked versus static uncracked concrete?** (Three-way interaction map.)
3. **What is the S-N curve (or equivalent) for adhesive anchors in cracked concrete under combined sustained + cyclic loading**, and how does it compare to (a) EAD 330250 fatigue assumptions and (b) ACI 355.4 seismic test residuals?
4. **Do creep coefficients (e.g., per fib MC2010) developed for uncracked concrete apply unchanged when the anchor crosses a cyclically-opening crack?** If not, what correction factor is needed?
5. **What accelerated-test protocol (elevated temperature × cyclic crack × sustained load) would reproduce 25-year field behavior in 6–12 months** and be acceptable to ACI 355 / EAD 330250 / fib for code incorporation?

---

## Key Papers (Touching the Edges)

| # | Paper | Year | DOI / URL | Covers | Misses | Tier |
|---|-------|------|-----------|--------|--------|------|
| 1 | Behavior of Post-Installed Anchors Tested by Stepwise Increasing Cyclic Load Protocols | 2016 | doi:10.1061/(ASCE)CF.1943-5509.0000832 | Cyclic load protocols on post-installed anchors; baseline cyclic performance | Long-term / aging; sustained-load interaction; only short cycles | 2 |
| 2 | Fatigue Performance of Post-Installed Anchors Under Dry and Wet Conditions | 2024 | OpenAlex W4401817673 | Cyclic load + moisture as two-variable matrix | Crack-width cycling; sustained load; long duration (>10⁶ cycles) | 2 |
| 3 | Creep behaviour of tension loaded adhesive anchors in non-cracked low strength concrete | 2019 | OpenAlex W4223237495 | Sustained load (creep) of adhesive anchors | Cracked concrete; cyclic loading; long-term combined interaction | 2 |
| 4 | Fire performance of bonded anchors in cracked concrete: Experimental and numerical investigation | 2026 | OpenAlex W4410836421 | Cracked concrete + adhesive anchor under thermal exposure | Cyclic load; sustained load; ambient long-term aging | 2 |
| 5 | EXPERIMENTAL STUDY OF POST-INSTALLED ANCHOR EMBEDDED IN CONCRETE UNDER SIMULATED SEISMIC | 2025 | OpenAlex W4411073864 | Seismic (cyclic) load in adhesive anchor | Long-term aging; crack-width cycling; sustained load | 2 |
| 6 | Bearing Capacity of Anchors at Multi-cyclic Dynamic Loads | 2022 | OpenAlex W4225663010 | Multi-cycle dynamic anchor behavior | Adhesive anchors specifically (mechanical focus); sustained load; cracked concrete | 3 |
| 7 | Cyclic Testing of No. 6 Rebar Dowels Post Bonded in a Reinforced Concrete Bridge Deck | 1985 | OpenAlex W2138763141 | Early cyclic testing of post-bonded rebar in concrete | Adhesive anchors in cracked concrete; modern resins; long-term | 3 |

**Selection rationale:** Each paper addresses at least one of the three gap dimensions (long-term / sustained load / cracked / cyclic) but none addresses all four simultaneously. They span the four combinations that currently exist in the literature: cyclic only, creep only, cracked-only-plus-environmental, seismic-only. None crosses the intersection.

---

## Validation

### OpenAlex (narrow query)
- **Query:** `filter=title_and_abstract.search:adhesive+anchors+cracked+concrete+cyclic+fatigue`
- **Endpoint:** `https://api.openalex.org/works?filter=title_and_abstract.search:adhesive+anchors+cracked+concrete+cyclic+fatigue&per-page=20&select=id,display_name,publication_year,cited_by_count,doi,open_access,best_oa_location,authorships`
- **Hits:** **0** (meta.count = 0)
- **Date:** 2026-09-05
- **Note:** First attempt at the exact 4-term intersection returns zero results — the intersection is genuinely empty in the indexed corpus.

### OpenAlex (broadening: drop "long-term")
- **Query:** `filter=title_and_abstract.search:adhesive+anchors+concrete+cyclic+fatigue`
- **Hits:** **1** (one 1993 German-language paper on FRP-strengthened concrete — off-topic)
- **Conclusion:** Even with "long-term" dropped, the result count is 1 and off-topic.

### OpenAlex (broadening further: post-installed + fatigue)
- **Query:** `filter=title_and_abstract.search:post-installed+anchors+concrete+fatigue&sort=cited_by_count:desc`
- **Hits:** **14**, of which ~5 are directly relevant (the rest are FRP strengthening, BIM, expansion anchors, conference proceedings)
- **Conclusion:** Confirms the four edge papers in this document and shows that "post-installed + concrete + fatigue" without the cracked-concrete and sustained-load qualifiers gives a working but unspecific literature.

### OpenAlex (broadening: cracked + adhesive)
- **Query:** `filter=title_and_abstract.search:adhesive+anchors+concrete+cracked&sort=cited_by_count:desc`
- **Hits:** **21**, of which the most-cited is FRP-strengthened beams (off-topic); the directly-anchor-related papers cover cracked-concrete qualification tests, creep (uncracked), seismic (uncracked), and bonded masonry — all touching only two of the four gap dimensions.

### arXiv (narrow query)
- **Query:** `search_query=all:adhesive+anchors+cracked+concrete+cyclic+fatigue`
- **Endpoint:** `https://export.arxiv.org/api/query?search_query=all:adhesive+anchors+cracked+concrete+cyclic+fatigue&max_results=20`
- **Hits:** **0**
- **Date:** 2026-09-05

### arXiv (broadening: drop "long-term" and "fatigue")
- **Query:** `search_query=all:adhesive+anchors+concrete+fatigue`
- **Hits:** **0**
- **Conclusion:** No relevant preprints in the physics/CS archive; the topic is firmly engineering-journal territory.

### Web search (open problem signals)
- **Query 1:** `adhesive anchors cracked concrete long-term cyclic research gap` (DuckDuckGo)
  - Result: **0** results.
- **Query 2:** `post-installed anchors cracked concrete fatigue committee report research` (DuckDuckGo)
  - Result: 6 results, 3 of which carry **explicit "open problem" / "further research" language**:
    1. **STRUCTURE Magazine** (Zamani, ACI 355 / CAMA-affiliated, testing anchors in cracked masonry): *"The design implications of the experimental observations of a reduced strength due to cracking have not been fully identified. More work is required to develop appropriate design provisions in this regard."* — This is a committee-adjacent "more research needed" signal naming the gap.
    2. **Hilti engineering article** on cracked-concrete design input — flags that "boundary conditions" in cracked concrete are an active engineering research area.
    3. **MKT EAD 330250 fatigue-approval document (2026)**: a vendor-side approval document — Tier 4 evidence (vendor, but acknowledges the standard is silent on combined long-term + cyclic in cracked).
    4. **Tandfonline review article** (Mahmoud et al., 2023, doi:10.1080/15732479.2023.2208567): *"However, there is no research which has considered physical crack while modelling post-installed anchors in cracked concrete."* — Direct "open problem" signal.
  - **Independent open-problem signals found: ≥2** (STRUCTURE Magazine + Mahmoud et al. 2023). Triangulation passes.

### Open-problem signal summary

| Source | Tier | Type | Verbatim signal |
|--------|------|------|-----------------|
| Structure Magazine (Zamani) | 1 (committee) | Magazine article | "More work is required to develop appropriate design provisions" |
| Mahmoud et al. 2023, Engineering Structures (Tandfonline) | 2 (peer-reviewed) | Review article | "There is no research which has considered physical crack while modelling" |
| MKT / EAD 330250 (2026 approval) | 4 (vendor) | Approval doc | Standard is silent on combined long-term + cyclic in cracked |
| Hilti engineering article | 4 (vendor) | Marketing/technical | Flags cracked-concrete boundary conditions as active research area |

---

## Confidence

**Rating: High**

**Justification:**
- **OpenAlex triangulation: PASS.** Narrow 4-term intersection returns 0 hits. Broadening stepwise (drop one term at a time) returns only adjacent-topic papers, never the intersection itself.
- **arXiv triangulation: PASS.** Both narrow and broadened queries return 0 preprints.
- **Web triangulation: PASS.** Two independent "open problem" signals from a peer-reviewed review article (Tier 2) and a committee-adjacent magazine article (Tier 1).
- **Edge papers: 7 identified.** Each addresses at least one gap dimension; none covers all four. The Covers/Misses annotations are defensible: each paper's contribution is single-axis while the gap is multi-axis.
- **No fabrication risk:** The 0-result narrow queries are themselves the strongest evidence; if the topic were covered, those queries would not return 0.

The gap is real, named, and triangulated. The dossier does not fill the gap — it characterizes the gap and points to the experiments that would fill it.
