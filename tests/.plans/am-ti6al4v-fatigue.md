# Plan: am-ti6al4v-fatigue

## Question
Long-term fatigue life of additively manufactured (AM) Ti-6Al-4V under variable amplitude loading.

## Scope
- AM Ti-6Al-4V (mostly L-PBF / SLM, also EBM, DED where data exist).
- Variable-amplitude (spectrum) loading; Miner's rule and modern cumulative damage models.
- Long-term: >1e7 cycles relevance, HCF/VHCF regime, and cumulative damage accumulation.
- Post-processing effects: HIP, surface finish, residual stress, build orientation.
- Standards/regulatory: ASTM F3301 (AM process), ASTM F3122 (L-PBF Ti-6Al-4V), FAA/EASA guidance, MIL-HDBK-5 / MMPDS for AM allowables.

## Key questions
1. What S-N / fatigue data exist for AM Ti-6Al-4V across build orientations and post-processing states (as-built, machined, HIPed, HIP + machined)?
2. Is Miner's rule still valid for AM Ti-6Al-4V? Evidence on load-interaction effects, mean stress correction (Walker, SWT, Morrow), and the current state of cumulative damage modeling.
3. What regulatory/airframe-acceptance paths exist for AM fatigue-critical parts (ASTM F3301, ASTM F3122, FAA / EASA AM guidance, MMPDS)?
4. What is the *gap* in long-term (>10^7 cycles) variable-amplitude data for AM Ti-6Al-4V?

## Evidence needed
- Peer-reviewed S-N / da/dN data for L-PBF Ti-6Al-4V, multiple orientations and post-processing states.
- Variable-amplitude test reports (e.g., FALSTAFF, TWIST, MiniTWIST, GAG, in-service spectra).
- Standards: ASTM F3301, ASTM F3122, ISO/ASTM 52900-series, MIL-HDBK-5 / MMPDS AM insertion path.
- Regulatory: FAA AM guidance, EASA AM concept paper, NASA / AFRL / NIST studies on AM fatigue.
- Recent (2020+) review papers on AM Ti-6Al-4V fatigue.

## Scale decision (per --deep flag)
- --deep forces multi-agent mode: 2 researcher subagents dispatched in parallel.
- Safety-critical, numerical claim (S-N / fatigue life) -> 2 independent Blind Verifiers.
- 7-check adversarial verifier protocol applied per verifier.

## Task ledger
- T1 (researcher-A, parallel): AM Ti-6Al-4V S-N data, build orientation, HIP, surface finish, defect-driven fatigue.
- T2 (researcher-B, parallel): Variable amplitude fatigue, Miner's rule, spectrum loading, aerospace standards.
- T3 (lead): synthesize draft, run 2 verifiers in parallel, write provenance + final.

## Verification log
- V1 (verifier-1, parallel with V2): Blind verify S-N / fatigue-life claim.
- V2 (verifier-2, parallel with V1): Independent blind re-verify same claim.
- Post-edit citation audit on the final draft.

## Decision log
- If long-term variable-amplitude data is sparse: emit /gap-analysis follow-up suggestion per mechanical skill Gap Detection section.
- Always emit S7 boundary language: "Research-only, not for final engineering sign-off."

## Artifacts (paths)
- outputs/.plans/am-ti6al4v-fatigue.md (this file)
- outputs/.drafts/am-ti6al4v-fatigue-T1.md (researcher-A notes)
- outputs/.drafts/am-ti6al4v-fatigue-T2.md (researcher-B notes)
- outputs/.drafts/am-ti6al4v-fatigue-draft.md (lead synthesis)
- outputs/.drafts/am-ti6al4v-fatigue-cited.md (post-citation-audit draft)
- outputs/am-ti6al4v-fatigue.md (final)
- outputs/am-ti6al4v-fatigue.provenance.md
- outputs/test-1-mechanical-deep-report.md (consolidated test report)