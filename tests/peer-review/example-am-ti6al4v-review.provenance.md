# Provenance: peer review of tests/gap-analysis/02-am-ti6al4v-variable-amplitude.md

- **Artifact:** `tests/gap-analysis/02-am-ti6al4v-variable-amplitude.md` + `tests/gap-analysis/02-am-ti6al4v-variable-amplitude.provenance.md`
- **Review output:** `outputs/peer-review/am-ti6al4v-variable-amplitude.md` (this sidecar beside it)
- **Date:** 2026-10-16
- **Reviewer posture:** cold read — no author reasoning seen; default-FAIL (every claim starts unverified and must be traced).
- **Sources consulted:** the artifact and its sidecar (direct read); `skills/gap-analysis/SKILL.md`; `skills/peer-review/SKILL.md`; `agents/reviewer.md`; `references/reviewer-severity-levels.md`; `references/provenance-sidecar.md`; `tests/gap-analysis/test-gap-analysis.mjs`; `tests/gap-analysis/01-*.md` (structure comparison); OpenAlex API (`api.openalex.org` — six key-paper records, five query re-runs); arXiv API (`export.arxiv.org` — paper record + query-semantics probes); ASTM store (E466-21); ISO (12107:2012); GE Aerospace News, TCT Magazine, Metal AM, GE Additive white paper (LEAP fuel-nozzle / GEnx bracket materials); eCFR versioner API and Cornell LII (14 CFR 25.571); filesystem + git (outputs/ ignore status, path existence).
- **Sources accepted:** the artifact itself; the skill and repo rule files above; ASTM/ISO listings as evidence of standard scope; GE/TCT/Metal AM reporting as evidence of AM part materials (vendor-adjacent, used only for a material-attribution check, not for engineering claims); OpenAlex/arXiv records as bibliographic evidence.
- **Sources rejected / unreachable:** the eCFR HTML page (returned a JavaScript shell, no section text — replaced by the eCFR versioner XML API and Cornell LII, which carried the section); W2244644389 and W4414399775 full texts (paywalled; OpenAlex holds no abstract for either — content attributions left blocked, not guessed); DuckDuckGo web-tier results (transient; re-run not attempted; artifact's own CAPTCHA report accepted as reported).
- **Verification:** partial — the review itself is complete; three claims inside the reviewed artifact remain blocked (see below).
- **Claims verified:** 12 (artifact claims traced and consistent)
- **Claims contradicted:** 5 (the five findings F1, M1, M2, M3, M4)
- **Claims blocked:** 3 (reported separately; not folded into verified or unverified)
- **Claims unverified:** 1 (DDG web-tier results not re-run)
- **Plan:** none — direct run

## Reviewer Claims and Sources

| # | Reviewer claim | Source | Verdict |
|---|----------------|--------|---------|
| R1 | All six OpenAlex key-paper IDs resolve with matching title/year/DOI/venue | api.openalex.org works filter, re-fetched 2026-10-16 | verified |
| R2 | arXiv:2311.07046 title/year match; comment field "201 pages, 154 figures"; author list has 8 names | export.arxiv.org API, 2026-10-16 | verified |
| R3 | Citation counts within index drift (549→546, 99→96, 75→76, 44→44, 1→1, 2→4) | OpenAlex re-fetch vs dossier lines 40–76 | verified |
| R4 | Q1 re-run = 8 works (was 9) and contains W3217732661 and W4414399775 | OpenAlex `meta.count` + result list, 2026-10-16 | verified |
| R5 | Q2 re-run = 878 (was 915); Q3 re-run = 75 (was 78) | OpenAlex, 2026-10-16 | verified |
| R6 | Q3 top-20 matches the documented composition (multiaxial review + SLM vibration paper as the 2 AM-specific; 1999 fretting; 2015 dwell) | OpenAlex Q3 result list | verified |
| R7 | "Fan-blade CCF 2004" resolves to W1999523277; "SLM vibration-fatigue paper" resolves to W2586213418 | OpenAlex Q3 result list | verified |
| R8 | Recorded arXiv Q4/Q5 URLs are not intersections: totalResults 493,853 / 240,494; `all:Ti-6Al-4V` = 66; control `all:zzzzzzzz` = 0; boolean/quoted-phrase forms = 0 | arXiv API probes, 2026-10-16 (parser behavior on 2026-09-06 not knowable — caveat recorded in M2) | verified |
| R9 | ASTM E466-21 is a constant-amplitude practice; ISO 12107:2012 is statistical planning/analysis — neither is a spectrum-fatigue standard | store.astm.org/standards/e466; iso.org/standard/50242.html | verified |
| R10 | LEAP fuel nozzle tips are PBF-LB cobalt-chrome; the FAA-certified GEnx PDOS bracket is cobalt-chrome | TCT Magazine 2023-07-04; Metal AM 2023-12-18; geaerospace.com 2018-07-16; TCT 2018-11-01 | verified |
| R11 | Sidecar "Dossier" pointer (`outputs/gap-analysis/...`) and Files-written paths do not exist; `outputs/` is gitignored (.gitignore:17) | filesystem check; `git check-ignore`; `git log --all` for the paths (no history) | verified |
| R12 | 14 CFR 25.571(a)(1)(i) requires "the typical loading spectra ... expected in service" in the evaluation — supports the dossier's regulatory-pressure claim | ecfr.gov versioner API (HTTP 200); law.cornell.edu | verified |
| R13 | W2244644389 and W4414399775 have no OpenAlex abstract; full texts paywalled — their content attributions cannot be checked here | api.openalex.org record fetch, 2026-10-16 | verified (basis for blocked claims) |
| R14 | Review findings count: FATAL 1, MAJOR 4, MINOR 4; artifact-claim ledger 12 verified / 5 contradicted / 3 blocked / 1 unverified | Self-count from the review | verified |

## Notes
- This review is independent of the dossier author's reasoning. Only the final artifact and its sidecar were read.
- No FATAL-worthy fabrication: every named work exists and every identifier resolves. The single FATAL is a false standards characterization in a deliverable research question (F1); it is fixed by rewording, not by new analysis.
- The M2 caveat is stated in the review: arXiv parser behavior could have differed on the submission date, but the recorded URLs do not implement a narrow search as written and cannot be reproduced as documented.
- Blocked claims inside the artifact: (i) W2244644389 "explicitly notes the absence of VA data as future work"; (ii) W4414399775 loading characterization / "acknowledgment"; (iii) sidecar Files-written paths.
- The reviewer did not re-run the DuckDuckGo web-tier queries; the artifact already reports query 7 as CAPTCHA-blocked.

Research-only, not for final engineering sign-off.
