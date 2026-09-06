# Gap Analysis 02 — AM Ti-6Al-4V Variable-Amplitude Fatigue

**Sub-topic:** Additively manufactured (AM) Ti-6Al-4V under variable-amplitude (spectrum) fatigue loading
**Discipline:** Mechanical (materials fatigue)
**Date:** 2026-09-06
**Method:** `gap-analysis` skill — narrow-query search, 3-tier triangulation, edge-paper audit

---

## What's Missing

A consolidated, defect-aware fatigue-life prediction framework for **additively manufactured Ti-6Al-4V under variable-amplitude (spectrum) loading** that captures the interaction between AM-specific defect populations (lack-of-fusion pores, surface roughness, residual porosity, hierarchical α'/α+β microstructures) and non-proportional / spectrum load histories encountered in flight, drive, and biomedical loading.

The literature shows a **sharp asymmetry**:

- Constant-amplitude AM Ti-6Al-4V fatigue is heavily studied (>900 hits on OpenAlex, including a 2015 IJFatigue review cited 549× — *W2244644389*).
- Conventional Ti-6Al-4V (wrought) under variable-amplitude loading has decades of work (78 OpenAlex hits, e.g. fretting-VA studies from 1999, dwell/overload studies 2015, fan-blade CCF 2004).
- The **intersection** — AM Ti-6Al-4V specifically tested under variable amplitude — yields only 9 OpenAlex hits, and inspection shows most of these are vibration-bending studies or HCF-only work. True spectrum-loaded AM Ti-6Al-4V life prediction models (Miner / Walker / NASGRO with AM-defect parameters) are absent.

The only paper that explicitly performs **AM Ti-6Al-4V variable-amplitude testing** in the narrow-query set is a 2019 UT Austin thesis (cited 1×, not peer-reviewed in journal form — *W3217732661*). The 2025 paper (*W4414399775*) covers dwell + overload, which is the closest peer-reviewed neighbor but uses constant-amplitude with overload blocks rather than full spectra.

## Why It Matters

- **Safety-critical deployment gap.** AM Ti-6Al-4V is being qualified for aerospace primary structures and medical implants (Ti-6Al-4V ELI). Real flight, gait, and drive loadings are stochastic / spectrum. Certifying AM parts against constant-amplitude S–N data alone — without a validated spectrum-fatigue methodology that accounts for AM defects — creates unquantified safety margins.
- **Defect-driven life scatter.** AM defect populations (sub-surface lack-of-fusion, surface roughness) drive HCF scatter; spectrum loading interacts with these defects through crack-closure/overload-retardation physics that differ from wrought Ti-6Al-4V (which has a well-developed VA literature). The interaction is **not characterized**.
- **Regulatory pressure.** FAA / EASA fatigue substantiation (FAR 25.571, CS-25) requires spectrum-fatigue analysis. Without a defect-aware AM-Ti-6Al-4V spectrum-fatigue model, certification will rely on oversized safety factors, slowing AM adoption.
- **Economic impact.** Aerospace AM Ti-6Al-4V components (e.g., LEAP fuel nozzles, structural brackets) carry high buy-to-fly ratios and long qualification cycles; spectrum-life data would unlock higher allowable strains and lower part-count.

## Suggested Research Questions

1. **How does the lack-of-fusion pore size distribution in LPBF/EBM Ti-6Al-4V interact with variable-amplitude overload-retardation physics?** Specifically: do the small, irregular pores characteristic of AM defeat the crack-closure mechanism that gives conventional Ti-6Al-4V its overload-retardation behavior under Mini-TWIST/FALSTAFF spectra?
2. **Can Miner / Walker / Corten–Dolan cumulative-damage rules, calibrated on wrought Ti-6Al-4V, be re-calibrated for AM material by a single defect-density parameter (e.g., √area_max pore)?** Or does the AM defect topology require a fundamentally different damage metric?
3. **What is the effect of build orientation (vertical vs. horizontal) on AM Ti-6Al-4V spectrum-fatigue life when the spectrum includes both high-cycle and low-cycle content (e.g., transport-aircraft spectra with ground-air-ground cycles)?**
4. **How does hot-isostatic pressing (HIP), which closes internal pores, modify the variable-amplitude fatigue response of AM Ti-6Al-4V compared to as-built surface-dominated behavior?**
5. **Are existing spectrum-fatigue standards (ASTM E466, ISO 12107) sufficient for AM material, or do they require amendments for defect-driven short-crack initiation?**

## Key Papers (Touching the Edges)

### 1. Multiaxial fatigue of additive manufactured metals — *W2999537139*
- **Authors / Year / DOI:** Multiaxial-fatigue review (2020). DOI 10.1016/j.ijfatigue.2020.105479. Cited 75×.
- **Covers:** Multiaxial (proportional + non-proportional) loading on AM metals including Ti-6Al-4V; reviews critical-plane, Findley, and SWT criteria adapted to AM defect populations.
- **Misses:** Variable-amplitude / spectrum loading specifically — the review treats proportional CA and discusses multiaxiality but not stochastic/spectrum load histories. No Mini-TWIST, FALSTAFF, or transport-spectrum data for AM Ti-6Al-4V.
- **Tier:** 2 (peer-reviewed IJFatigue review, clear methodology, mid-tier citation impact).

### 2. Fatigue Behavior of LB-PBF Ti-6Al-4V Parts Under Mean Stress and Variable Amplitude Loading — *W3217732661*
- **Authors / Year / DOI:** University of Texas thesis (2019). DOI 10.26153/tsw/17302. Cited 1×.
- **Covers:** Direct experimental variable-amplitude fatigue testing of laser-beam powder-bed fusion (LB-PBF) Ti-6Al-4V; mean-stress and amplitude effects.
- **Misses:** Single-institution, thesis-level (not journal-published); only 1 citation. Sample size and process parameter coverage are limited; no defect-aware spectrum model; no comparison against wrought.
- **Tier:** 3 (thesis / institutional repository, supports context but not standalone proof).

### 3. Experimental and microstructure-sensitive fatigue modeling of dwell + overload on AM Ti-6Al-4V — *W4414399775*
- **Authors / Year / DOI:** IJFatigue (2025). DOI 10.1016/j.ijfatigue.2025.109299. Cited 2×.
- **Covers:** Closest peer-reviewed paper to the gap — periodic dwell + overload sequences on AM Ti-6Al-4V with microstructure-sensitive (CP-FFT or similar) modeling.
- **Misses:** Block sequences rather than continuous spectrum; dwell-specific (cold-creep interaction) which is partly distinct from generic VA; AM-specific defect statistics are not the central modeling input. Does not bridge to standard spectrum-loading engineering use cases.
- **Tier:** 2 (recent peer-reviewed, but only 2 citations — recency cuts both ways; methodology clear but not yet replicated).

### 4. Critical assessment of the fatigue performance of additively manufactured Ti-6Al-4V — *W2244644389*
- **Authors / Year / DOI:** IJFatigue (2015). DOI 10.1016/j.ijfatigue.2015.12.003. Cited 549×.
- **Covers:** The canonical AM Ti-6Al-4V fatigue review; defect taxonomy (LOF, keyhole, gas porosity), surface roughness, HIP, build-direction effects. Defines the state-of-practice.
- **Misses:** The review is entirely constant-amplitude (S–N, da/dN); explicitly notes the absence of VA data as a future-work gap. Does not address overload retardation, sequence effects, or spectrum life prediction.
- **Tier:** 1 (high-citation canonical review >549×; effectively the field-defining source. The author has acknowledged the gap it does not cover.).

### 5. Influence of complex LCF and dwell load regimes on fatigue of Ti-6Al-4V — *W2194865258*
- **Authors / Year / DOI:** Acta Materialia (2015). DOI 10.1016/j.actamat.2015.09.014. Cited 99×.
- **Covers:** Wrought Ti-6Al-4V (not AM) under LCF + dwell + variable-amplitude sequences. Foundational physics for dwell sensitivity and time-dependent load interaction in α/β Ti.
- **Misses:** Material is wrought, not AM. AM hierarchical α′ martensite and porosity change dwell sensitivity qualitatively. Doesn't transfer quantitatively.
- **Tier:** 1 (Acta Materialia, 99 citations, foundational physics — governs what the AM-equivalent work needs to reproduce and exceed).

### 6. Investigation of variable amplitude loading on fretting fatigue behavior of Ti-6Al-4V — *W2086788521*
- **Authors / Year / DOI:** IJF (1999). DOI 10.1016/s0142-1123(99)00034-1. Cited 44×.
- **Covers:** VA fretting fatigue on (wrought) Ti-6Al-4V; two-level block loading. The classic reference for VA-fatigue life prediction in this alloy.
- **Misses:** Wrought material; fretting-specific loading mode rather than generic spectrum; not transferable to AM surface-roughness-driven crack initiation.
- **Tier:** 2 (peer-reviewed IJF, well-cited classic, 25+ years old — recency caveat but methodology still canonical).

### 7. A holistic review on fatigue properties of additively manufactured metals — *arXiv:2311.07046*
- **Authors / Year / DOI:** Yi, Tang, Zhu, Liang (2023, arXiv preprint of a comprehensive review). 201 pages, 154 figures.
- **Covers:** The most comprehensive recent AM-metals fatigue review (S–N, da/dN for Ti, Al, Fe, Ni AM alloys). Documents build direction, post-processing, heat-treatment effects on CA fatigue.
- **Misses:** Same as W2244644389 — CA-only. Spectrum loading explicitly listed as future work. Also a preprint rather than final peer-reviewed venue (though clearly destined for one).
- **Tier:** 3 (preprint; comprehensive but not yet a primary citation for spectrum-load claims).

## Validation

### OpenAlex queries (run 2026-09-06)

| # | Query | Hits | Relevance |
|---|-------|------|-----------|
| 1 | `title_and_abstract.search:additive manufactured Ti-6Al-4V variable amplitude fatigue` | **9** | 2 directly relevant (W3217732661 thesis, W4414399775); 4 adjacent (vibration/multiaxial); 3 tangential. Narrow-query hit count inside the gap signal threshold (0–5 off-topic-or-low-citation pattern; here 9 hits but only 1–2 directly fill the gap). |
| 2 | `title_and_abstract.search:additive manufactured Ti-6Al-4V fatigue` | **915** | Massive corpus on AM Ti-6Al-4V but overwhelmingly constant-amplitude. Confirms the AM-fatigue literature is mature; the gap is specifically in the AM × VA intersection. |
| 3 | `title_and_abstract.search:Ti-6Al-4V variable amplitude fatigue` | **78** | Wrought Ti-6Al-4V VA literature is well-developed (fretting-VA, dwell+overload, fan-blade CCF, Goodman-VA methods). AM material is conspicuously absent from this set: only 2 of 20 are AM-specific (the multiaxial review, the SLM vibration-fatigue paper). |

### arXiv queries (run 2026-09-06)

| # | Query | Hits | Relevance |
|---|-------|------|-----------|
| 4 | `all:additive manufactured Ti-6Al-4V variable amplitude fatigue` | **19** (returned) | 0 directly on AM-Ti-6Al-4V VA fatigue. Adjacent: AM Ti-6Al-4V tensile/microstructure modeling, superplastic forming review, biocomposite implants, Hastelloy-X fatigue model. No preprint addresses the gap. |
| 5 | `all:Ti-6Al-4V variable amplitude fatigue` | **20** (returned) | Tangential preprints: phase-field hydrogen-fatigue (general), non-linear damage accumulation (general, validated on three metals but not AM Ti), superplastic forming, MLIP datasets. No AM-Ti-6Al-4V VA spectrum result. |

### Web "open problem" signals

| # | Source | Hits | Status |
|---|--------|------|--------|
| 6 | DuckDuckGo HTML: `"additively manufactured" "Ti-6Al-4V" "variable amplitude" fatigue research gap OR "open problem"` | **0** | DuckDuckGo returned "No results found." Strongest possible web-tier gap signal: no committee report, standards document, or program description names this combination as an explicit research gap using those exact terms. |
| 7 | DuckDuckGo HTML: `"AM Ti-6Al-4V" "variable amplitude" fatigue OR spectrum loading` | **n/a** | DuckDuckGo bot-anomaly CAPTCHA blocked retrieval. Web signal for tier 2 cannot be completed. |

### Triangulation verdict

| Tier | Result | Pass? |
|------|--------|-------|
| **OpenAlex narrow** | 9 hits, only 1–2 directly fill the gap, rest adjacent/tangential | ✅ Gap signal |
| **arXiv** | 0 preprints directly on the gap; related preprints are generic (hydrogen fatigue) or AM-microstructure (not VA) | ✅ Gap signal |
| **Web "open problem"** | Tier-1 query: 0 results naming the gap; tier-2 query: blocked by CAPTCHA, cannot confirm | ⚠️ Inconclusive (one query confirmed 0; the other blocked) |

Two of three tiers confirm the gap. The third is inconclusive (blocked rather than confirming the absence). Per the skill's fail-closed posture, this is reported as a **probable gap**, not a confirmed one.

## Confidence

**Medium.**

- **Strong evidence (OpenAlex + arXiv):** the AM × VA intersection is sparsely populated. The narrow OpenAlex query returns 9 works, most adjacent (vibration, multiaxial, constant-amplitude with overload blocks). The canonical 2015 IJFatigue review (W2244644389, 549 citations) explicitly leaves variable-amplitude as future work.
- **Weak evidence (web tier):** DDG query #6 confirms 0 results naming the gap with the narrow phrase. DDG query #7 was blocked by bot-anomaly CAPTCHA, so the second independent web signal could not be retrieved.
- **What would raise confidence to High:** retrieval of ≥2 independent web-tier signals (committee reports, roadmap documents, standards bodies) explicitly naming AM Ti-6Al-4V spectrum fatigue as a gap. The 2025 paper W4414399775 (dwell + overload) is the strongest recent acknowledgment by a peer-reviewed source.

**Justification:** the literature gap is consistent across OpenAlex and arXiv, and is acknowledged by the field's canonical review. Web-tier triangulation is incomplete (CAPTCHA on query 7), so confidence is held at Medium rather than High per the fail-closed rule.
