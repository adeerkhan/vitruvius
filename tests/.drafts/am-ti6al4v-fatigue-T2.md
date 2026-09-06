# Researcher B — Variable-amplitude fatigue, Miner's rule, standards (lead-synthesized)

> Note: This file was assembled by the lead from direct OpenAlex queries (the dispatched subagent
> `ses_f88d16a40ffe3BWEEKCuN9FmWR` was still in flight at the time of draft consolidation).

## Evidence table

| #  | Source                                                                                                                                | Reference (DOI/URL/standard+section)                                                                                                                          | Key claim                                                                                                                                                                                                                                                                                                  | Type          | Status   |
|----|---------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|----------|
| 1  | Akgun et al., "Fatigue of wire+arc AM Ti-6Al-4V in presence of process-induced porosity"                                              | doi:10.1016/j.ijfatigue.2021.106315                                                                                                                            | WAAM Ti-6Al-4V shows huge dispersion driven by defect location; classical Kitagawa–Takahashi horizontal asymptote does not apply — relevant for any cumulative-damage / Miner-based prediction.                                                                                                          | peer-reviewed | verified |
| 2  | Vayssette et al., Int. J. Fatigue 123 (2019)                                                                                          | doi:10.1016/j.ijfatigue.2019.02.014                                                                                                                            | HIP + surface finish needed to bring AM Ti-6Al-4V close to wrought behavior; without surface removal, defect population dominates.                                                                                                                                                                          | peer-reviewed | verified |
| 3  | ASTM F3301-18, Thermal post-processing for PBF metals (incl. Ti-6Al-4V)                                                                | DOI 10.1520/F3301-18 (ASTM F42.05; BOS Vol. 10.04)                                                                                                             | Standardizes thermal post-processing (stress relief, HIP) tied to required material properties. Section-level specifics paywalled; existence + scope verified.                                                                                                                                            | standard      | verified (existence + scope); full text blocked |
| 4  | ASTM F3122 (L-PBF Ti-6Al-4V material part-property standard)                                                                          | ASTM Compass                                                                                                                                                   | Existence asserted in literature; public landing page blocked during research.                                                                                                                                                                                                                              | standard      | blocked  |
| 5  | ISO/ASTM 52900-series (general AM terminology and process categorization)                                                             | iso.org / astm.org                                                                                                                                            | Family exists; provides process taxonomy (PBF, DED, etc.) but no AM-Ti specific fatigue allowables.                                                                                                                                                                                                          | standard      | verified (family); fatigue values blocked |
| 6  | MMPDS / MIL-HDBK-5 (metallic materials design allowables)                                                                              | mmpds.org / wbdg.org                                                                                                                                          | The authoritative handbook for fatigue allowables. AM-specific allowables insertion path is documented in industry articles but not in the publicly indexed excerpt in this pass; representative values paywalled.                                                                                              | standard/handbook | blocked  |
| 7  | FAA additive manufacturing guidance / EASA AM concept paper                                                                            | faa.gov / easa.europa.eu                                                                                                                                       | Specific PDF URLs (e.g. /Elam_NASA_FAA_AM_Ti_Fatigue_Apr2022.pdf) returned 404 in this pass; EASA concept-paper URL also returned 404. Documented existence in industry references but direct retrieval blocked.                                                                                          | regulatory    | blocked  |
| 8  | NASA LaRC AM Ti fatigue program (Glaessgen, Yeratapally, Widener)                                                                       | ntrs.nasa.gov (13 records 2020-2024 on "Ti-6Al-4V fatigue additive")                                                                                          | NASA NTRS hosts AM-Ti fatigue work, including presentations and conference papers. No VHCF or variable-amplitude report URL enumerated in this pass.                                                                                                                                                       | gov't reports | inferred |
| 9  | Miner's rule (Palmgren-Miner linear damage rule)                                                                                       | Classical textbook / MMPDS                                                                                                                                   | Linear damage rule Σ(n_i/N_i) = 1 at failure; known to be non-conservative for high-low and conservative for low-high loading sequences; modifications include Corten-Dolan, Manson, and the double-linear damage rule. Not AM-specific.                                                                        | textbook      | inferred (general); AM-specific verification blocked |
| 10 | Mean-stress corrections for AM Ti-6Al-4V (Walker, SWT, Morrow, Goodman)                                                                | S-N fatigue literature                                                                                                                                         | Standard mean-stress corrections are applied to constant-amplitude AM data. AM-specific calibrations for spectrum loading are not widely published; cite as inferred.                                                                                                                                     | peer-reviewed | inferred |

## Synthesis (~400 words)

Variable-amplitude / spectrum-loading fatigue data for AM Ti-6Al-4V is a documented gap: the
peer-reviewed corpus is dominated by constant-amplitude S-N testing and by single-overload
load-interaction studies, not by FALSTAFF / TWIST / Mini-TWIST / GAG or in-service spectrum
tests. Akgun et al. [1] explicitly highlight that for WAAM Ti-6Al-4V the classical
Kitagawa–Takahashi horizontal asymptote (an implicit basis for Miner's-rule use in the
infinite-life regime) does not hold; this directly complicates application of the
Palmgren-Miner rule Σ(n_i/N_i) = 1 with its standard assumption of a definable fatigue
limit.

For the regulatory / standards landscape, ASTM F3301-18 [3] standardizes thermal post-processing
of powder-bed-fusion Ti-6Al-4V (and other alloys), providing the post-processing envelope that
most variable-allowable programs rely on. ASTM F3122 (L-PBF Ti-6Al-4V material property
standard) and MMPDS / MIL-HDBK-5 AM-allowable insertion paths are widely cited in industry
sources [4, 6], but the actual numerical tables in those standards / handbooks are paywalled
and could not be directly verified in this pass.

FAA / NASA joint technical exchange materials (e.g. an "Elam NASA-FAA AM Ti Fatigue" talk PDF
referenced in industry articles) and the EASA concept paper on additive manufacturing both
returned 404 on direct URL fetch attempts [7]; their existence is consistent with multiple
secondary mentions but is not directly verified here.

Miner's-rule applicability to AM Ti-6Al-4V in the long-life regime is therefore an open
question: classical Miner's rule with a definable endurance limit is not conservative for the
defect-dominated failure mode typical of AM Ti-6Al-4V (no horizontal asymptote per Akgun [1]),
and AM-specific calibrations of nonlinear damage rules (Corten-Dolan, Manson two-slope,
elementary block-loading) are not present in the publicly indexed literature reviewed here.

## Gap

- Variable-amplitude / spectrum-loading fatigue tests on AM Ti-6Al-4V (FALSTAFF / TWIST /
  Mini-TWIST / GAG / in-service spectra): very few primary references in indexed literature.
- AM-specific calibration of nonlinear cumulative damage rules: not found in this pass.
- MMPDS / MIL-HDBK-5 AM Ti-6Al-4V allowables: paywalled; representative design values not
  directly readable.
- FAA / EASA AM guidance PDFs: 404 on the URLs attempted; existence inferred from secondary
  references.

## Sources

1. Akgun et al., Int. J. Fatigue 150 (2021) 106315. doi:10.1016/j.ijfatigue.2021.106315
2. Vayssette et al., Int. J. Fatigue 123 (2019) 180-195. doi:10.1016/j.ijfatigue.2019.02.014
3. ASTM F3301-18. doi:10.1520/F3301-18 (scope verified; full text blocked)
4. ASTM F3122 — existence asserted in literature, public page blocked in this pass
5. ISO/ASTM 52900-series — family verified, no fatigue allowables
6. MMPDS / MIL-HDBK-5 — handbook exists; AM Ti-6Al-4V allowables paywalled
7. FAA / EASA AM guidance PDFs — 404 on attempted URLs; existence inferred from secondary refs
8. NASA NTRS LaRC AM Ti fatigue program — 13 records 2020-2024 (Ti-6Al-4V fatigue additive)
9. Miner's rule — classical textbook knowledge; AM-specific verification blocked
10. Walker / SWT / Morrow mean-stress corrections — applied to AM CA data; spectrum-loading AM-specific calibration not found