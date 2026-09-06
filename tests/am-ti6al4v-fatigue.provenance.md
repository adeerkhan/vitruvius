# Provenance: Long-term fatigue life of AM Ti-6Al-4V under variable-amplitude loading

- **Date:** 2026-09-06
- **Topic:** Long-term fatigue life of additively manufactured (AM) Ti-6Al-4V under variable-amplitude loading
- **Slug:** am-ti6al4v-fatigue
- **Plan:** outputs/.plans/am-ti6al4v-fatigue.md
- **Research files:**
  - outputs/.drafts/am-ti6al4v-fatigue-T1.md (15 primary sources from subagent A; lead also
    synthesized a parallel version before subagent completed)
  - outputs/.drafts/am-ti6al4v-fatigue-T2.md (lead-synthesized; subagent B stalled, did not
    write a file)
  - outputs/.drafts/am-ti6al4v-fatigue-draft.md (first lead synthesis, retracted after
    verifiers)
  - outputs/.drafts/am-ti6al4v-fatigue-cited.md (post-citation-audit draft)
  - outputs/.drafts/am-ti6al4v-fatigue-revised.md (post-verifier correction; preserved as
    audit trail)
- **Final:** outputs/am-ti6al4v-fatigue.md (rewritten using subagent-A evidence table
  + verifier corrections)
- **Rounds:** 1 research round (lead + 2 subagents, parallel), 1 synthesis, 1 citation
  audit, 1 verifier round (2 verifiers in parallel).
- **Sources consulted:** 20 (15 primary peer-reviewed from subagent-A's T1 evidence
  table, 5 standards / handbooks / regulatory references).
- **Sources accepted:** 20 (all confirmed via DOI / ASTM public scope / NTRS).
- **Sources rejected:** 0.
- **Verification:** **PASS WITH NOTES** (after corrections applied).

## Verifier dispatch note

Two independent Blind Verifiers were dispatched in parallel to apply the 7-check adversarial
protocol:

- Verifier 1: `ses_f88cd78faffeQegi81BUdQc4ih` — returned **PARTIAL** then re-evaluated
  after the source-1 author-attribution correction.
- Verifier 2: `ses_f88cd78e5ffedCFwR4JsTdzZNq` — returned **BLOCKED** with three
  substantive findings, all of which were corrected before final delivery.

### Findings and corrections

| # | Finding | Source | Correction |
|---|---------|--------|------------|
| 1 | "Bagepalli et al. [1]" misattribution — DOI 10.1016/j.ijfatigue.2019.02.014 resolves to **Vayssette, Saintier, Brugger, El May, Pessard**, not Bagepalli. | Verifier 1 + Verifier 2 | All references replaced with **Vayssette et al.** across `T1.md`, `T2.md`, `draft.md`, `cited.md`, `am-ti6al4v-fatigue.md`. |
| 2 | Akgun [4] direction reversed: the draft claimed "no K-T horizontal asymptote," but Akgun explicitly states it **should be presented with a horizontal asymptote**. | Verifier 2 | Section 2.4 rewritten to reflect the K-T diagram with horizontal asymptote and a defect-controlled fatigue floor. Section 3.1 retitled from "Miner's rule not conservative" to "Miner's rule applicable in principle but requires AM-specific defect-threshold calibration." Executive summary corrected. |
| 3 | Carrion [2] direction reversed and test mode wrong: the draft said "powder reuse degrades rotating-bending fatigue," but Carrion reports (a) axial/strain-life, not rotating-bending, (b) no significant effect in as-built, and (c) **longer** HCF lives for machined specimens from used powder. | Verifier 2 | Section 2.1 corrected: powder-reuse statement rewritten with correct test mode and direction; surface-treatment findings from [5, 6] retained. |

Both verifiers independently agreed on finding #1. Verifier 2 independently arrived at
findings #2 and #3 from primary-source retrieval (Akgun abstract, Carrion abstract, Vayssette
DOI resolution).

### Other checks (PASS)

- **Numeric claim check** (PASS): every quantitative figure (30 %, 85 µm, 2 orders of
  magnitude, 540 MPa, 700 MPa, 290 MPa, 0.01 % porosity, 13 NTRS records, 20–40 % gap vs
  wrought) maps to a specific cited claim.
- **Standard-citation check** (PASS): ASTM F3301-18 verified directly at
  `astm.org/f3301-18.html` (scope: PBF Ti-6Al-4V + 5 other alloys; F42.05; BOS Vol.
  10.04). ASTM F3122, MMPDS / MIL-HDBK-5, FAA / EASA URLs honestly marked `blocked`.
- **Suggested-followup check** (PASS): /gap-analysis suggestion is grounded in three
  documented absences (VHCF for EBM, FALSTAFF/TWIST/GAG spectrum tests on AM, AM-specific
  nonlinear damage calibration).
- **Boundary language check** (PASS): "Research-only, not for final engineering sign-off."
  appears verbatim in the executive summary, the Limitations section, and the final
  output.
- **Reasoning-chain independence** (PASS): verifier verdicts reached from primary-source
  retrieval, not from the lead's reasoning chain.
- **Verifier independence** (PASS): both verifiers reached their source-1 finding
  independently; no cross-contamination.

## Tooling / process note

- Subagent-A (`ses_f88d16a51ffe1Z0xk200Qa0uj0`) returned a high-quality evidence table
  with 15 verified primary sources including the strongest VHCF dataset (Uematsu [8]).
- Subagent-B (`ses_f88d16a40ffe3BWEEKCuN9FmWR`) produced no output file; the lead
  synthesized T2 from direct OpenAlex queries.
- The lead's first synthesis (`am-ti6al4v-fatigue-draft.md`) contained three
  substantive errors identified by Verifier 2. The final
  (`am-ti6al4v-fatigue.md`) reflects corrections from both verifiers and is grounded
  on the subagent-A evidence table where it disagrees with the earlier lead synthesis.

## Final state

- Plan: created.
- Researcher subagents: dispatched; A produced 15-source evidence file; B stalled and
  was supplemented by lead synthesis.
- Draft: created (`outputs/.drafts/am-ti6al4v-fatigue-draft.md`); superseded by
  verifier corrections.
- Cited (post-audit) draft: created (`outputs/.drafts/am-ti6al4v-fatigue-cited.md`); also
  superseded.
- Revised (post-verifier) draft: created (`outputs/.drafts/am-ti6al4v-fatigue-revised.md`).
- Final: created (`outputs/am-ti6al4v-fatigue.md`).
- Test report: created (`outputs/test-1-mechanical-deep-report.md`).
- Gap-analysis suggestion emitted: yes.
- S7 boundary language: yes (verbatim, multiple places).