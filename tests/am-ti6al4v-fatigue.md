# Long-term fatigue life of AM Ti-6Al-4V under variable-amplitude loading

*Research brief — synthesized from primary peer-reviewed sources, with explicit gap markers.*

> Research-only, not for final engineering sign-off.

## Executive summary

Long-term fatigue life of additively manufactured (AM) Ti-6Al-4V is governed primarily by
process-induced defects — porosity, lack-of-fusion (LoF) features, surface roughness, and
tensile residual stress — rather than by the intrinsic wrought-Ti-6Al-4V microstructure.
Across L-PBF (SLM), EBM, and WAAM processes the central finding is that AM Ti-6Al-4V
exhibits fatigue strength **20–40 % lower than wrought** in the as-built condition, with
significantly larger life scatter [2, 6, 14].

Key numerical anchors from the primary literature (S-N / HCF regime):

- L-PBF (machined, R = 0.1): fatigue strength at 2×10^6 cycles ≈ 500–700 MPa depending on
  specimen volume [2].
- WAAM (defect-free, R = 0.1): intrinsic fatigue limit Δσ_e ≈ 540 MPa; with porosity:
  ≈ 400 MPa; critical pore diameter ≈ 100 µm; El Haddad a_0 = 52 µm (surface),
  88 µm (internal) [1].
- As-built SLM: fatigue strength ≈ 290 MPa (~30 % lower than machined) [2].
- EBM + DMLS as-built + HIP: fatigue limit only ~30 % of the Vickers-predicted upper
  bound; HIP + polishing brings the limit close to the ideal upper bound [3].
- HIP closes internal porosity to < 0.01 %, recovering fatigue strength to ~700 MPa at
  2×10^6 cycles [2].

Long-term (> 10^7 cycles) and variable-amplitude / spectrum-loading data on AM Ti-6Al-4V is
**genuinely sparse**. Only Uematsu et al. (2021) [8] and Fu et al. (2023) [11] provide
systematic VHCF datasets (both L-PBF); no published EBM VHCF dataset at 10^8–10^9 cycles
was identified in this pass. Standards landscape: ASTM F3301-18 [16] governs thermal
post-processing of PBF Ti-6Al-4V; ASTM F3122 (L-PBF Ti-6Al-4V material property standard),
MMPDS / MIL-HDBK-5 AM allowables, and FAA / EASA AM guidance PDFs are referenced but
paywalled or behind 404-returning pages in this pass [17, 19, 20].

**Defect threshold and Kitagawa–Takahashi.** Multiple primary sources confirm that the
defect-population framework is governed by an El Haddad / Kitagawa–Takahashi (K-T) diagram,
not by a wrought-style classical endurance limit. Biswal et al. [1] identify a_0 = 52 µm
(surface) / 88 µm (internal); Pessard et al. [3] identify √area ≈ 30 µm below which
defects are not detrimental; Le et al. [2] confirm LoF pore threshold 50–350 µm; Akgun
et al. [7] report a ~85 µm threshold with wrought-level performance below it and ~2 orders
of magnitude life drop above it; Akgun explicitly states the K-T diagram **should be
presented with a horizontal asymptote** for this alloy. **Correction from Blind Verifier
review:** earlier drafts of this brief inverted Akgun's direction (claiming no K-T
asymptote exists); the correct reading is that an effective defect-controlled fatigue
floor exists below threshold, but no classical wrought-style continuous endurance limit
applies because the threshold itself is defect-driven.

**Implication for Miner's rule.** Classical Palmgren-Miner rule Σ(n_i/N_i) = 1 can be
applied in principle (an infinite-life regime exists below defect threshold), but its
application requires an AM-specific defect-threshold calibration that is **not** present
in the open literature, and load-interaction effects (high-low / low-high) for AM Ti-6Al-4V
are not characterized. AM-specific calibrations of nonlinear damage rules (Corten-Dolan,
Manson two-slope) are not in the indexed literature surveyed.

**Gap-driven follow-up:** `Suggested: /gap-analysis mechanical AM-Ti6Al4V-variable-amplitude-fatigue`.

## 1. Background and scope

AM Ti-6Al-4V (L-PBF / SLM, EBM / E-PBF, DED, WAAM) is widely used for aerospace structural
components where fatigue life drives the design. Two questions this brief addresses:

1. What S-N / HCF data exist for AM Ti-6Al-4V, and how do build orientation, HIP, and
   surface finish affect fatigue life?
2. Can Miner's rule (or any commonly used cumulative-damage model) be applied to AM
   Ti-6Al-4V under variable-amplitude spectrum loading, and is there long-term (>10^7
   cycle) data?

## 2. S-N / HCF / VHCF findings

### 2.1 As-built vs HIP vs machined
- Machined L-PBF Ti-6Al-4V at R = 0.1: fatigue strength at 2×10^6 cycles ≈ 500–700 MPa
  (volume-dependent) [2].
- WAAM (defect-free, R = 0.1): intrinsic fatigue limit ≈ 540 MPa; with porosity:
  ≈ 400 MPa [1].
- As-built SLM: fatigue strength ~30 % lower than machined (~290 MPa) [2].
- EBM / DMLS as-built + HIP: fatigue limit ~30 % of Vickers-predicted upper bound; HIP +
  polishing brings the limit close to ideal upper bound [3].
- Powder-reuse effect on L-PBF Ti-6Al-4V (Carrion et al. [15]): in axial/strain-life tests,
  powder recycling had **no significant effect** on fatigue performance in the as-built
  surface condition, and machined specimens fabricated from used powder showed **longer**
  fatigue lives in the HCF regime — i.e., used powder did not degrade, and in the
  machined state improved, fatigue life. (Correction from Blind Verifier review: an
  earlier draft misstated both the test mode and the direction of the effect.)

### 2.2 Surface treatments
- Shot peening and centrifugal finishing bring L-PBF fatigue strength to machined levels
  [5]; laser peening outperforms shot peening [6].
- Surface roughness alone is a poor predictor — subsurface defects beneath smooth
  surfaces can still cause premature failure [5].

### 2.3 Build orientation and FCG
- Build orientation (0°/45°/90°) effects are measurable but secondary to porosity and
  surface condition [13].
- HIP at 820 °C / 950 °C and annealing 1020 °C produce coarser α′/α laths → slower
  fatigue-crack-growth rates and higher fatigue thresholds [13].

### 2.4 Kitagawa–Takahashi diagram with horizontal asymptote
- Biswal et al. [1] propose a modified 3-region K-T diagram for AM Ti-6Al-4V with El
  Haddad a_0 = 52 µm (surface pores) and 88 µm (internal pores).
- Pessard et al. [3] identify critical defect size √area ≈ 30 µm below which defects
  are not detrimental.
- Le et al. [2] confirm LoF pore threshold at 50–350 µm.
- Akgun et al. [7] report an ~85 µm threshold, wrought-level performance below it, ~2
  orders of magnitude life drop above it, and explicitly conclude that the K-T diagram
  for this alloy **should be presented with a horizontal asymptote**.
- Li & Affolter [9] critical-review √area ≈ 0.2 mm; Y = 0.5 (internal) to 0.65
  (surface) for SIF.

### 2.5 VHCF (> 10^7 cycles)
- VHCF data for AM Ti-6Al-4V is genuinely sparse; the literature is dominated by S-N
  testing in the 10^4–10^7 range.
- Uematsu et al. [8] provide the most systematic VHCF dataset (rotating-bending with
  artificial defects 10–500 µm) and propose modified Murakami-type design curves for
  10^8 cycles; the conventional fatigue-limit equation is non-conservative at 10^8.
- Fu et al. [11] report 20 kHz ultrasonic VHCF at R = −1 and R = 0.7; subsurface
  defect-initiated failures with large scatter in defect size and depth.
- Hejazi et al. [10] extend to EBM material in the VHCF regime using XCT + deep
  learning.
- **No published VHCF dataset for EBM Ti-6Al-4V at 10^8–10^9 cycles was identified** in
  this pass.
- No study reports a classical endurance limit (runout at 10^7–10^9 cycles) for AM
  Ti-6Al-4V with high confidence; the defect-driven nature means fatigue life continues
  to degrade beyond 10^7 cycles [8, 12].

## 3. Variable-amplitude loading and cumulative damage

### 3.1 Miner's rule — applicability
- Palmgren-Miner rule Σ(n_i/N_i) = 1 assumes a definable fatigue limit and load-
  sequence independence. For AM Ti-6Al-4V, the K-T horizontal asymptote **is preserved**
  below a defect-size threshold (a_0 ≈ 30–85 µm depending on source), so an infinite-
  life regime exists at the defect level [1, 3, 7]. What the AM material does **not**
  offer is a single open-literature end-to-end calibration of the damage threshold
  against a known spectrum — defect-population variability, surface roughness, and
  residual stress all shift the threshold.
- AM-specific calibrations of nonlinear damage rules (Corten-Dolan, Manson two-slope,
  elementary block-loading) are **not** present in the indexed literature surveyed.
- The hazard to a Miner's-rule calculation is therefore not that the asymptote is
  missing, but that the defect-threshold input is process-dependent and currently has to
  be measured per AM build / part state.

### 3.2 Spectrum-loading tests
- Standard spectra (FALSTAFF, TWIST, Mini-TWIST, GAG) and in-service aerospace spectra
  have been applied extensively to wrought Ti-6Al-4V, but **peer-reviewed spectrum-
  loading tests on AM Ti-6Al-4V are very rare** in the public indexed literature
  surveyed. NASA LaRC has an active AM Ti fatigue program (NTRS 13 records 2020–2024
  on "Ti-6Al-4V fatigue additive" [18]) and may hold proprietary spectrum data; this
  brief did not enumerate those reports.

### 3.3 Mean-stress corrections
- Walker, Smith–Watson–Topper, Morrow, and Goodman corrections are routinely applied to
  constant-amplitude AM S-N data. Spectrum-loading calibrations for AM are not widely
  published; treat as inferred.

## 4. Standards / regulatory landscape

- **ASTM F3301-18** [16]: standardizes thermal post-processing (stress relief, HIP) of
  PBF Ti-6Al-4V (and CoCrMo, IN718, IN625, 316L, AlSi10Mg); SI units; BOS Vol. 10.04;
  Subcommittee F42.05. Scope verified directly; full text paywalled.
- **ASTM F3122** (L-PBF Ti-6Al-4V material part-property standard): existence asserted
  in industry sources; public landing page returned 404 in this pass; marked **blocked**
  [17].
- **ISO/ASTM 52900-series**: AM process taxonomy only; no AM-Ti fatigue allowables.
- **MMPDS / MIL-HDBK-5**: the authoritative handbook for fatigue allowables; AM-specific
  insertion path documented in industry articles but actual allowables are paywalled
  [19].
- **FAA / EASA AM guidance**: secondary sources reference these documents, but specific
  PDF URLs attempted in this pass (NASA-FAA Elam talk PDF, EASA AM concept paper)
  returned 404. Existence inferred but **not directly verified** [17, 20].

## 5. Gap analysis (per mechanical skill Gap Detection section)

The literature on **long-term (VHCF, > 10^7 cycles) variable-amplitude fatigue of AM
Ti-6Al-4V under realistic spectrum loading** is genuinely sparse. What was found:

- Many constant-amplitude S-N studies (L-PBF, EBM, DMLS, WAAM) [1–7, 9, 13].
- Two VHCF datasets on L-PBF (Uematsu [8], Fu [11]); one EBM VHCF dataset (Hejazi [10]).
- Defect-threshold / K-T-diagram framework across multiple papers [1, 3, 7, 9].
- Standards governing post-processing [16] and the L-PBF material property spec [17].
- Regulatory / handbooks (FAA, EASA, MMPDS, MIL-HDBK-5) [17, 19, 20].

What was **not** found in this pass:

- VHCF (> 10^8 cycles) S-N curves for EBM Ti-6Al-4V.
- FALSTAFF / TWIST / Mini-TWIST / GAG spectrum tests on AM Ti-6Al-4V.
- AM-specific calibration of nonlinear cumulative-damage rules (Corten-Dolan, Manson).
- Open numerical allowables in MMPDS / MIL-HDBK-5 for AM Ti-6Al-4V (paywalled).
- Verified direct retrieval of FAA / EASA AM fatigue guidance PDFs (404).

> **Suggested: /gap-analysis mechanical AM-Ti6Al4V-variable-amplitude-fatigue**

## 6. Open questions

1. Does VHCF (> 10^8 cycles) behavior of AM Ti-6Al-4V follow a defect-driven smooth
   decrease with no clear asymptote (per Uematsu [8] / Fu [11] for L-PBF), or does
   HIP + surface removal restore a more conventional S-N tail?
2. Are there AM-specific load-interaction (high-low / low-high) data sets that can be
   used to calibrate a Corten-Dolan or Manson damage rule for AM Ti-6Al-4V?
3. What representative spectrum-loading design values have been published for AM
   Ti-6Al-4V in the period 2020–2025 that are openly accessible?
4. What is the current MMPDS / MIL-HDBK-5 acceptance path for AM Ti-6Al-4V allowables,
   and how does it reconcile the AM defect-driven failure mode with the historical
   Miner's-rule framework?

## 7. Limitations and boundary

- This brief synthesizes peer-reviewed and standards evidence available in the publicly
  indexed literature. Several authoritative sources (ASTM F3122 full text, MMPDS /
  MIL-HDBK-5 tables, FAA / EASA AM guidance PDFs) are paywalled or behind landing
  pages that returned 404 in this pass; these are flagged as `blocked` in the
  provenance sidecar.
- All numeric claims carry units and a citation; no extrapolation was performed.
- The literature is sparse on VHCF and variable-amplitude AM Ti-6Al-4V — this is
  itself a finding, not a failure to search.
- **Two Blind Verifier subagents independently identified** (a) source-1 author-name
  attribution error (cited "Bagepalli et al." but DOI resolves to Vayssette et al.),
  (b) Akgun K-T-direction inversion in the original draft, and (c) Carrion direction
  inversion in the original draft. All three errors were corrected before final
  delivery; see provenance sidecar.

> Research-only, not for final engineering sign-off.

## Sources

1. Biswal, R., Zhang, X. et al. (2019). Int. J. Fatigue 122, 208–217.
   doi:10.1016/j.ijfatigue.2019.01.017
2. Le, V.-D., Pessard, E., Morel, F., Prigent, S. (2020). Int. J. Fatigue 140, 105811.
   doi:10.1016/j.ijfatigue.2020.105811
3. Pessard, E., Lavialle, M., Laheurte, P. et al. (2021). Int. J. Fatigue 149, 106206.
   doi:10.1016/j.ijfatigue.2021.106206
4. Hu, Y., Wu, S.C., Withers, P.J. et al. (2020). Mater. & Design 192, 108708.
   doi:10.1016/j.matdes.2020.108708
5. Kahlin, M., Ansell, H., Basu, D.N. et al. (2020). Int. J. Fatigue 142, 105497.
   doi:10.1016/j.ijfatigue.2020.105497
6. Aguado-Montero, S., Navarro, C., Vázquez, J. et al. (2021). Int. J. Fatigue 154,
   106536. doi:10.1016/j.ijfatigue.2021.106536
7. Akgun, E., Zhang, X., Lowe, T. et al. (2021). Int. J. Fatigue 150, 106315.
   doi:10.1016/j.ijfatigue.2021.106315
8. Uematsu, Y., Kakiuchi, T., Han, Y. (2021). Metals 11(6), 964.
   doi:10.3390/met11060964
9. Li, Z., Affolter, C. (2024). Metals 14(9), 972. doi:10.3390/met14090972
10. Hejazi, B., Compart, A., Fritsch, T. (2024). Fatigue Fract. Eng. Mater. Struct.
    doi:10.1111/ffe.14489
11. Fu, R., Zheng, L., Zhong, Z. (2023). Fatigue Fract. Eng. Mater. Struct.
    doi:10.1111/ffe.13985
12. Zerbst, U., Bruno, G., Buffière, J.-Y. et al. (2021). Prog. Mater. Sci. 121, 100786.
    doi:10.1016/j.pmatsci.2021.100786
13. Hasib, M.T., Ostergaard, H.E., Li, X. et al. (2020). Int. J. Fatigue 141, 105955.
    doi:10.1016/j.ijfatigue.2020.105955
14. Nguyen, H.D., Pramanik, A., Basak, A.K. (2022). J. Mater. Res. Technol. 19,
    2094–2125. doi:10.1016/j.jmrt.2022.04.055
15. Carrion, P.E., Soltani-Tehrani, A., Phan, N., Shamsaei, N. (2018). JOM 71(3),
    963–973. doi:10.1007/s11837-018-3248-7
16. ASTM F3301-18. doi:10.1520/F3301-18 (existence + scope verified; full text
    blocked)
17. ASTM F3122, FAA / EASA AM guidance PDFs — existence inferred from secondary refs;
    landing pages blocked in this pass
18. NASA NTRS LaRC AM Ti fatigue program (13 records 2020–2024 on "Ti-6Al-4V fatigue
    additive")
19. MMPDS / MIL-HDBK-5 Ti-6Al-4V — existence verified; design values blocked (paywall)
20. Vayssette, Saintier, Brugger, El May, Pessard, Int. J. Fatigue 123 (2019) 180–195.
    doi:10.1016/j.ijfatigue.2019.02.014 (numerical modelling on tension-compression,
    roughness-induced fatigue-strength drop > 60 %)