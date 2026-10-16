# Peer Review: tests/gap-analysis/02-am-ti6al4v-variable-amplitude.md

## Summary Assessment
- **Artifact type:** Gap-analysis dossier (engineering literature gap identification) + provenance sidecar, produced under `skills/gap-analysis` (narrow-query search → 3-tier triangulation → edge-paper audit → evidence tiers).
- **Claims reviewed:** 21 checkable claims (12 verified, 5 contradicted, 3 blocked, 1 unverified — see Verification Status).
- **FATAL:** 1 | **MAJOR:** 4 | **MINOR:** 4
- **Review verdict:** ISSUES — 1 FATAL open. Per the reviewer contract, a draft with open FATAL findings is not delivered as-is.
- **Revision risk:** high — the core gap conclusion (AM Ti-6Al-4V × variable-amplitude fatigue is sparsely covered) survives this review and is partly corroborated by the reviewer's re-runs, but a false standards characterization (F1) and two overstated validation rows (M1, M2) must be fixed before the dossier is used to seed a research program.

## Strengths
- **Every key-paper identifier resolves.** All six OpenAlex IDs and the arXiv ID exist with titles, years, DOIs, and venues matching the dossier (re-checked 2026-10-16 against api.openalex.org and export.arxiv.org). Citation counts agree within expected index drift (549→546, 99→96, 75→76, 44→44, 1→1, 2→4). No fabrication smell.
- **The narrow-query result set is real and reproducible in kind.** Re-running OpenAlex query 1 today returns 8 works (was 9) and still contains both works the dossier calls directly relevant (W3217732661 thesis, W4414399775 dwell+overload). The query-3 top-20 still contains the two AM-specific items the dossier describes, plus both pinned wrought works (W2086788521, 1999; W2194865258, 2015).
- **The fail-closed handling of the third tier is honest.** The dossier reports the DuckDuckGo CAPTCHA block on query 7 rather than papering over it, holds confidence at Medium, and explicitly labels the gap "probable, not confirmed" (lines 111–113, 120–123) — consistent with the skill's fail-closed posture (SKILL.md lines 86–87, 154–155).
- **Structure matches the skill's output contract.** All six required sections present; 7 edge papers (4–7 required); 5 research questions (3–5 required); tier values consistent between dossier and sidecar; the sidecar records endpoints, dates, per-paper tier rationale, and a confidence rationale.
- **Unusually precise metadata that checks out:** the "201 pages, 154 figures" annotation for arXiv:2311.07046 matches the arXiv record's comment field exactly.

## Findings

### FATAL

#### F1: RQ5 labels two constant-amplitude/statistics standards as "spectrum-fatigue standards" — false premise
- **Location:** Suggested Research Questions, Q5 (dossier line 35).
- **Issue:** The question reads "Are existing spectrum-fatigue standards (ASTM E466, ISO 12107) sufficient for AM material...". Neither standard governs spectrum/variable-amplitude fatigue. ASTM E466 is the force-controlled **constant-amplitude** axial fatigue practice; ISO 12107 covers statistical planning and analysis of fatigue data. The question's premise is wrong as labeled, and no editions are pinned. A researcher acting on Q5 would audit the wrong documents and miss the actual spectrum-side framework.
- **Evidence:** ASTM E466-21, "Standard Practice for Conducting Force Controlled Constant Amplitude Axial Fatigue Tests of Metallic Materials" — scope: "limited to the fatigue testing of axial unnotched and notched specimens subjected to a constant amplitude, periodic forcing function in air at room temperature" (store.astm.org/standards/e466, retrieved 2026-10-16). ISO 12107:2012, "Metallic materials — Fatigue testing — Statistical planning and analysis of data" (iso.org/standard/50242.html, retrieved 2026-10-16). The repository's own severity rules list "A standard citation that does not say what is claimed" as FATAL-class (references/reviewer-severity-levels.md, line 21). **Strongest defense:** "spectrum-fatigue standards" is loose shorthand for the fatigue-practice standards an AM qualification program would invoke, and both documents do feed a spectrum-fatigue test program. Refuted by the standards' own scopes: E466 does not merely omit spectrum loading, it explicitly covers only constant-amplitude forcing; calling it a spectrum-fatigue standard misstates the document and voids the question's premise.
- **Fix:** Reword Q5 to name them correctly — "constant-amplitude fatigue test and data-analysis standards (ASTM E466-21; ISO 12107:2012)" — and, if the sufficiency question is meant to target spectrum practice, name the actual spectrum-side references to be probed (the dossier already cites FALSTAFF/Mini-TWIST at line 31). Pin editions.

### MAJOR

#### M1: Validation table claims the 9-hit narrow query is "inside the gap signal threshold (0–5)" — internally contradictory and against the skill's criterion
- **Location:** Validation table, OpenAlex query row 1 (line 87); echoed in Triangulation verdict (line 109) and provenance sidecar "Triangulation scoring".
- **Issue:** The row asserts the narrow-query hit count is "inside the gap signal threshold (0–5 off-topic-or-low-citation pattern; here 9 hits but only 1–2 directly fill the gap)". 9 is not inside 0–5, and the artifact never states it is switching criteria. The "✅ Gap signal" mark and the "Two of three tiers confirm the gap" verdict (line 113) inherit the misstated pass.
- **Evidence:** gap-analysis SKILL.md Phase 1: "If the narrow query returns 0–5 hits ... this is evidence of a gap" (line 72); Phase 2 table: "Narrow query returns 0–5 relevant hits" (line 82). The dossier's own count: 9 hits (line 87; re-run 2026-10-16: 8). **Strongest defense:** the Phase-2 "0–5 relevant" wording permits a relevance-count reading in which 1–2 directly-relevant ≤ 5 passes. The defense partially survives — this is why the finding is MAJOR, not FATAL — but the row as written misapplies the threshold, and the tier is marked a clean pass rather than flagged as the weakest of the three.
- **Fix:** Split row 1 into two stated tests: raw hits 9 (fails the raw 0–5 criterion) and directly relevant 1–2 (within a relevance reading). Mark the OpenAlex tier "partial", restate the triangulation verdict accordingly (OpenAlex partial + arXiv as recorded unsupported per M2 + web blocked), and let the Confidence section's "Strong evidence (OpenAlex + arXiv)" wording follow.

#### M2: The recorded arXiv queries are not narrow intersections — re-run totals (~494k / ~240k) dwarf the "19/20 returned" page
- **Location:** Validation, arXiv query rows 4–5 (lines 95–96) and Triangulation verdict row (line 110); provenance sidecar "Queries executed" rows 4–5 and "Triangulation scoring" (arXiv row).
- **Issue:** The arXiv tier is presented as confirming "0 preprints directly on the gap", based on queries whose recorded form does not implement the claimed intersection. Re-running the exact recorded URLs on 2026-10-16 returns `opensearch:totalResults` = 493,853 (Q4) and 240,494 (Q5), while `all:Ti-6Al-4V` alone returns 66 and boolean/quoted-phrase forms of the same searches return 0. Adding terms increases the result set, i.e., the query behaves as a loose/union match; "19 (returned)" / "20 (returned)" are the first relevance-ranked page of an effectively unbounded set, not a narrow-hit count.
- **Evidence:** arXiv API re-runs, 2026-10-16: sidecar Q4 URL → totalResults 493,853 (20 entries in the feed); Q5 URL → 240,494; control `all:zzzzzzzz` → 0; `all:Ti-6Al-4V` → 66; `all:additive AND manufactured AND Ti-6Al-4V AND variable AND amplitude AND fatigue` → 0; `"additive manufactured" AND "Ti-6Al-4V" AND "variable amplitude"` → 0. Caveat recorded: arXiv parser behavior could have differed on 2026-09-06, but the recorded URLs still do not implement a narrow search as written. **Strongest defense:** the corrected boolean query returns 0 today, so the tier's conclusion (no preprints on the gap) is likely true, and the "(returned)" annotation shows the author noticed the page cap. That defense supports the conclusion but not the recorded evidence — the tier cannot be reproduced from the sidecar as documented.
- **Fix:** Re-record Q4/Q5 with explicit boolean/quoted-phrase structure, report `opensearch:totalResults`, and update the tier row accordingly. The corrected intersection returning 0 would strengthen the arXiv tier rather than weaken it.

#### M3: "AM Ti-6Al-4V components (e.g., LEAP fuel nozzles, structural brackets)" — the named examples are documented cobalt-chrome parts
- **Location:** Why It Matters, "Economic impact" bullet (line 27).
- **Issue:** The bullet gives LEAP fuel nozzles and structural brackets as examples of aerospace AM **Ti-6Al-4V** components. The best-documented GE aerospace AM parts under those descriptions are cobalt-chrome (CoCr), not titanium: the LEAP fuel nozzle tips are PBF-LB CoCr, and the FAA-certified GEnx-2B PDOS "structural bracket" is CoCr. As written, the example misinforms and carries no citation.
- **Evidence:** TCT Magazine, "A flying start: GE Aerospace's additive manufacturing journey" (2023-07-04): the LEAP fuel tip "is manufactured on the Concept Laser M2 system in a cobalt-chrome alloy". Metal AM, "Metal Additive Manufacturing in the aerospace sector" (2023-12-18): the LEAP fuel nozzle is "made using PBF-LB and a cobalt-chrome alloy". GE Aerospace News (2018-07-16): "the team decided to print the bracket from a cobalt-chrome alloy"; TCT Magazine (2018-11-01): GEnx PDOS brackets produced "using metal 3D printing in cobalt chrome". **Strongest defense:** "structural brackets" is generic and Ti-6Al-4V AM brackets do exist (the GE/GrabCAD engine-bracket exercise part was Ti-6Al-4V). The defense survives only for the generic bracket word, not for the LEAP example, and the dossier cites no source for either.
- **Fix:** Replace the parenthetical with a documented Ti-6Al-4V aerospace AM part (with citation), or drop the examples and cite the buy-to-fly/qualification-cost claim directly. If the CoCr examples are kept for context, correct the alloy attribution.

#### M4: Key-paper entries omit authors (6 of 7) despite the field label, and entry 7 truncates 8 authors to 4
- **Location:** Key Papers entries 1–7, "Authors / Year / DOI" fields (lines 39–79); sidecar "Edge papers" table.
- **Issue:** Six of seven entries carry no author names although the field is labeled "Authors / Year / DOI" and the skill's Phase 3 requires each edge paper annotated with "Title, authors, year, DOI" (SKILL.md line 94; dossier-section requirement at line 130). Entry 7 lists "Yi, Tang, Zhu, Liang (2023...)" — four of the paper's eight authors, with no "et al." — i.e., a partial author list presented as the author list.
- **Evidence:** Direct read vs arXiv API (2026-10-16) for 2311.07046: authors are Min Yi, Wei Tang, Yiqi Zhu, Chenguang Liang, Ziming Tang, Yan Yin, Weiwei He, Shen Sun. The skill's narrow-query recipe already selects `authorships`, so the data was in hand for at least some entries.
- **Fix:** Add author metadata to each entry (first author + et al. where appropriate, or full lists) or relabel the field to what it actually contains; correct entry 7 to "Yi et al." or list all eight authors.

### MINOR

#### m1: Two works are cited by description only, with no identifier
- **Location:** line 17 ("fan-blade CCF 2004"); line 89 ("the SLM vibration-fatigue paper").
- **Issue:** Both are specific works underpinning claims ("78 OpenAlex hits, e.g. ... fan-blade CCF 2004"; "only 2 of 20 are AM-specific (the multiaxial review, the SLM vibration-fatigue paper)") but neither is pinned to an ID/DOI, so a reader cannot trace them.
- **Evidence:** The Q3 re-run (2026-10-16) resolves both referents: W1999523277, "The effect of combined cycle fatigue upon the fatigue performance of TI–6AL–4V fan blade material" (2004); W2586213418, "Characterization of bending vibration fatigue of SLM fabricated Ti-6Al-4V" (2017). The works exist — only the anchors are missing.
- **Fix:** Add the OpenAlex IDs/DOIs (as above) in both locations.

#### m2: Sidecar "Dossier" pointer and Files-written entries no longer match the tree
- **Location:** Provenance sidecar line 3 ("**Dossier:** `outputs/gap-analysis/02-am-ti6al4v-variable-amplitude.md`") and "Files written" (lines 51–53).
- **Issue:** The artifact under review lives at `tests/gap-analysis/02-...md`; the sidecar points at an `outputs/gap-analysis/` path that does not exist in the tree, and the listed `outputs/test-3-gap-analysis-report.md` likewise does not exist. The Files-written claims cannot be verified now; as archived, the pointer is dangling.
- **Evidence:** Filesystem check 2026-10-16 (no `outputs/gap-analysis/` directory; no test report); `git check-ignore` → `outputs/` is ignored (.gitignore line 17); no committed history exists for those paths, so the claim is unverifiable rather than provably false.
- **Fix:** Update the pointer to the archived location (`tests/gap-analysis/...`) or add an archival note, and mark the test-report claim unverifiable in the sidecar.

#### m3: Two content attributions to paywalled papers lack quotes or section pointers — one is not supported by the dossier's own annotation
- **Location:** line 121 ("The 2025 paper W4414399775 (dwell + overload) is the strongest recent acknowledgment by a peer-reviewed source"); line 60 and line 119 ("explicitly notes the absence of VA data as a future-work gap"; "explicitly leaves variable-amplitude as future work"); sidecar Confidence rationale (line 46).
- **Issue:** The dossier attributes an explicit gap acknowledgment to W4414399775 while its own Key-Papers annotation documents only adjacency ("Block sequences rather than continuous spectrum... Does not bridge to standard spectrum-loading engineering use cases", lines 53–55) — the acknowledgment claim has no support in the dossier. Both the W441 and W224 content attributions are to paywalled full texts with no verbatim quote or page/section, so a reader cannot check them.
- **Evidence:** Cross-read of lines 53–55 vs line 121; the OpenAlex records for W2244644389 and W4414399775 carry no abstract to check (retrieved 2026-10-16), so full-text verification was blocked in this review.
- **Fix:** Quote the acknowledgment sentence(s) with section/page for each paper, or soften line 121 to "closest peer-reviewed neighbor" (the dossier's own established phrasing).

#### m4: Editorial defects — broken sentence and ambiguous notation
- **Location:** line 61 ("...The author has acknowledged the gap it does not cover.)."); line 32 ("√area_max pore").
- **Issue:** The sentence ends with a stray period-parenthesis and reads ungrammatically; "√area_max pore" is ambiguous (largest-pore √area parameter vs. an indexing artifact).
- **Evidence:** Direct read.
- **Fix:** "The review acknowledges the VA-data gap it does not cover." and "the √area_max of the largest pore".

## Verification Status
- **Verified:** 12 claims traced to source — (1) all six key-paper OpenAlex IDs resolve with matching titles/years/DOIs/venues; (2) arXiv:2311.07046 title/year/"201 pages, 154 figures" match; (3) citation counts within index drift; (4) Q1 re-run (8 works) contains both directly-relevant IDs; (5) Q2 re-run 878 (vs 915, drift only); (6) Q3 re-run 75 with the documented composition (2 AM-specific items, 1999 fretting, 2015 dwell); (7) "fan-blade CCF 2004" referent exists (W1999523277); (8) internal arithmetic/consistency (9 = 2+4+3; 7 edge papers; 5 research questions; tiers aligned body↔sidecar); (9) required dossier sections present; (10) sidecar provenance fields present (endpoints, dates, tier rationale, confidence rationale); (11) header metadata consistent between dossier and sidecar; (12) the FAR 25.571 regulatory-pressure claim is supported — 14 CFR 25.571(a)(1)(i) requires "the typical loading spectra ... expected in service" to be included in the evaluation (eCFR + Cornell LII, retrieved 2026-10-16).
- **Contradicted by evidence:** 5 claims — the five defects above (F1, M1, M2, M3, M4). A traced-and-failed claim is not counted as verified.
- **Blocked:** 3 claims (reported separately; not folded into verified or unverified) — (i) W2244644389 "explicitly notes the absence of VA data as future work" (paywalled; no abstract in OpenAlex; full text unreachable in this review); (ii) W4414399775's loading characterization and "acknowledgment" (same; also undercut by the dossier's own annotation, see m3); (iii) sidecar Files-written paths (gitignored scratch area, no longer present; unverifiable).
- **Unverified:** 1 claim — the DuckDuckGo web-tier results (queries 6–7) were not re-run at review time; web results are transient and the artifact already reports query 7 as CAPTCHA-blocked.

### Cross-checks performed by this review (2026-10-16)
- Re-ran all five recorded queries. OpenAlex: Q1 8 (recorded 9), Q2 878 (915), Q3 75 (78) — within index drift; no contradiction. arXiv: recorded Q4/Q5 URLs behave as loose matches (totals above), see M2.
- Resolved and checked 6 OpenAlex records + 1 arXiv record by ID (titles, years, DOIs, venues, citation counts, author list).
- Fetched ASTM E466-21 and ISO 12107:2012 listings; fetched GE/TCT/Metal AM sources on LEAP fuel-nozzle and GEnx bracket materials; fetched 14 CFR 25.571 text.

## Revision Plan
1. **(F1)** Correct RQ5: rename the standards to what they are (constant-amplitude test practice; statistical planning/analysis), pin editions (E466-21; ISO 12107:2012), and name the actual spectrum-side references if that is the sufficiency target.
2. **(M1)** Recast the OpenAlex validation row as raw-count (9, fails) vs directly-relevant (1–2, within relevance reading); mark the tier partial and propagate through the triangulation verdict and Confidence wording.
3. **(M2)** Re-record arXiv queries as boolean/quoted-phrase intersections; report `opensearch:totalResults`; update the arXiv tier row with the corrected result (today: 0).
4. **(M3)** Fix or replace the LEAP/bracket examples; cite a documented Ti-6Al-4V part or drop the parenthetical.
5. **(M4)** Add author metadata to all key-paper entries; correct entry 7 to "Yi et al." or all eight authors.
6. **(m1)** Pin "fan-blade CCF 2004" and "the SLM vibration-fatigue paper" with IDs/DOIs.
7. **(m3)** Add verbatim quotes + section pointers for the W224/W441 content attributions, or soften the "acknowledgment" wording.
8. **(m2)** Update the sidecar Dossier pointer to the archived path; mark Files-written claims unverifiable.
9. **(m4)** Editorial pass on lines 61 and 32.

## Evidence Trail (Line-Pinned)

| # | Finding | Source | Location (§/line) | Verdict |
|---|---------|--------|-------------------|---------|
| 1 | F1: E466/ISO 12107 mislabeled "spectrum-fatigue standards" | ASTM E466-21 scope + ISO 12107:2012 title (fetched 2026-10-16); references/reviewer-severity-levels.md line 21 | Dossier, RQ5 (line 35) | contradicts |
| 2 | M1: 9 hits claimed "inside" a 0–5 threshold | gap-analysis SKILL.md Phase 1 (line 72), Phase 2 (line 82) | Dossier, Validation row 1 (line 87); verdict line 109; sidecar scoring table | contradicts |
| 3 | M2: recorded arXiv queries are not narrow intersections | arXiv API re-runs 2026-10-16 (totals 493,853 / 240,494 vs 66 for `all:Ti-6Al-4V`; 0 for boolean forms) | Dossier, arXiv rows 4–5 (lines 95–96); sidecar query rows 4–5 | contradicts |
| 4 | M3: named "Ti-6Al-4V" examples are cobalt-chrome parts | TCT 2023 ("cobalt-chrome alloy"), Metal AM 2023, GE Aerospace News 2018, TCT 2018 | Dossier, Economic impact (line 27) | contradicts |
| 5 | M4: author metadata missing (6/7) / truncated (4 of 8) | gap-analysis SKILL.md Phase 3 (line 94); arXiv API author list for 2311.07046 | Dossier, Key Papers entries 1–7 (lines 39–79); sidecar Edge papers table | missing |
| 6 | m1: two works cited by description only | Q3 re-run referents W1999523277 (2004), W2586213418 (2017) | Dossier, lines 17, 89 | missing |
| 7 | m2: sidecar pointers no longer match the tree | Filesystem + git check-ignore | Sidecar, lines 3, 51–53 | partially supports |
| 8 | m3: "acknowledgment" attribution unsupported; no quotes for paywalled attributions | Dossier lines 53–55 vs 121; OpenAlex records lack abstracts | Dossier, lines 121, 60, 119; sidecar line 46 | missing |
| 9 | m4: broken sentence and ambiguous notation | Direct read | Dossier, lines 61, 32 | missing |

## S7 Boundary
Research-only — not for final engineering sign-off. This peer review identifies issues in a literature-gap dossier; it does not approve the dossier, and neither the dossier nor this review constitutes design, certification, or regulatory guidance. Any downstream research-program decision requires independent review by qualified engineering personnel (here: fatigue/metallurgy expertise in AM Ti alloys and certification practice).

## Overall Assessment
The dossier is well-structured, honestly hedged at the top level, and its paper trail is largely real: every identifier resolves, the citation counts are within drift, and today's re-runs corroborate the shape of the search results (including both "directly relevant" narrow-query hits). Its gap conclusion — no consolidated defect-aware VA/spectrum framework for AM Ti-6Al-4V — is plausibly correct and is even strengthened by the stricter arXiv boolean query returning zero today. What does not survive is the evidence framing and several supporting claims: one research question is built on a false characterization of two standards (F1, must fix before use), the OpenAlex and arXiv validation tiers are overstated against the governing skill's own criteria (M1, M2), one economic-impact example contradicts well-documented materials (M3), and the citation metadata under-delivers against the skill's required annotations (M4). None of the findings require re-running the whole analysis; all are correctable in a single revision pass without changing the dossier's core conclusion. Revision risk as-is is high because of the open FATAL; after F1 and M1–M2 are corrected, this reads as a defensible medium-confidence gap dossier.
