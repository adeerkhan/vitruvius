# Retraction-aware paper ranking: prior academic work

**Question:** published work ranking papers by retraction status. **Scope:** literature review; **budget:** thorough.

No paper uses the phrase "retraction-aware ranking"; five adjacent strands exist, none proposing a ranking function.

| # | Work | Strand | What it establishes |
|---|---|---|---|
| 1 | Ha, Favre & Labbé, *Web Search Is Not Enough: LLMs Fail to Account for Paper Retraction Status*, EMNLP Findings 2026 | retrieval / LLM | Web search lifts retraction-status accuracy 11%→94%, yet models still surface retracted papers as evidence. Closest prior work. |
| 2 | Fu & Schneider, *Keystone Framework*, JCDL 2020 | digital libraries | Argumentation-based test for whether a citing paper's findings depend on an unreliable source. |
| 3 | Zheng et al., *Addressing Unreliability Propagation in Scientific Digital Libraries*, JCDL 2024 | digital libraries | Requirements and comparison of methods for detecting propagated unreliability. |
| 4 | Hsiao & Schneider, QSS 2021 | citation behaviour | 7,813 retracted papers: citations persist; contexts seldom acknowledge retraction. |
| 5 | García-Romero et al., *The enduring influence of retracted research*, Scientometrics 2026 | determinants | 531 Retraction Watch articles; what drives post-retraction citation. |
| 6 | Nicholson et al., *scite*, QSS 2021 | signals | Classification of supporting vs contrasting citations — the machinery a retraction weight would need. |
| 7 | Ortega & Delgado-Quirós 2024; Hauschke & Nazarovets 2025 | metadata | Retraction coverage diverges across seven databases; OpenAlex's single `is_retracted` boolean misclassifies. |

**What the literature does not settle.** No ranking function, objective, benchmark, or metric; nothing on expressions of concern or on weighting transitive citation contamination at rank time.

**Handback.** Decide which layer is in scope — search ranking, bibliometric indicator, or evidence synthesis. The strands are not interchangeable, and each implies a different evaluation set.

**Search coverage.** OpenAlex title/abstract, 17 queries; Semantic Scholar returned HTTP 429 on all queries (partial, not negative).

**Sources (DOI):** 10.18653/2026.findings-emnlp.2070 · 10.1145/3383583.3398514 · 10.1145/3677389.3702526 · 10.1162/qss_a_00155 · 10.1007/s11192-026-05699-7 · 10.1162/qss_a_00146 · 10.1007/s11192-024-05034-y · 10.1177/01655515251322478
