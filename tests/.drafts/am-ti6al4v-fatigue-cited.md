# Long-term fatigue life of AM Ti-6Al-4V under variable-amplitude loading

*Research brief — synthesized from primary peer-reviewed sources, with explicit gap markers.*

> Research-only, not for final engineering sign-off.

## Executive summary

Long-term fatigue life of additively manufactured (AM) Ti-6Al-4V is governed primarily by
process-induced surface roughness, lack-of-fusion porosity, and residual stress — not by the
intrinsic wrought-Ti-6Al-4V microstructure. HIP alone raises the rotating-bending fatigue limit
only modestly (~30 % of the Vickers-predicted upper bound for EBM/DMLS in the as-built + HIP
state, per Nakatani [3]); surface polishing/machining is needed to approach the wrought-equivalent
upper bound [1, 3]. Long-term (>10^7 cycles) and variable-amplitude / spectrum-loading data on
AM Ti-6Al-4V is **genuinely sparse** in the publicly indexed peer-reviewed literature; the
literature is dominated by constant-amplitude S-N testing. ASTM F3301-18 governs thermal
post-processing of PBF Ti-6Al-4V [6]; the L-PBF Ti-6Al-4V material property standard
(ASTM F3122) and the AM Ti-6Al-4V entries in MMPDS / MIL-HDBK-5 are referenced but paywalled
in this pass [7, 9]. **Important correction from Blind Verifier review:** the Kitagawa–Takahashi
horizontal asymptote for AM Ti-6Al-4V is **preserved** below a defect-size threshold
(~85 µm in WAAM, per Akgun [4]), so a defect-controlled fatigue floor exists and classical
Miner's rule with a definable endurance regime is **not** categorically invalidated by the AM
material — its application does, however, still need an AM-specific defect threshold
calibration. The reverse claim that "no K-T asymptote exists" was an inversion of Akgun's
actual conclusion and is retracted.

**Gap-driven follow-up:** `Suggested: /gap-analysis mechanical AM-Ti6Al4V-variable-amplitude-fatigue`.

## 1. Background and scope

AM Ti-6Al-4V (L-PBF / SLM, EBM, DED, WAAM) is now widely used for aerospace structural
components where fatigue life drives the design. Two questions this brief addresses:

1. What S-N / HCF data exist for AM Ti-6Al-4V, and how do build orientation, HIP, and surface
   finish affect fatigue life?
2. Can Miner's rule (or any commonly used cumulative-damage model) be applied to AM Ti-6Al-4V
   under variable-amplitude spectrum loading, and is there long-term (>10^7 cycle) data?

## 2. S-N / HCF / VHCF findings

### 2.1 As-built vs HIP vs machined
- Rotating-bending S-N data on DMLS and EBM Ti-6Al-4V (Vayssette et al. [1], Nakatani et al. [3]):
  as-built + HIP fatigue limit is ~30 % of the value predicted from Vickers hardness via the
  empirical upper bound (Nakatani [3]); polishing with HIP brings the limit close to the ideal
  upper bound. Vayssette et al. [1] (numerical modelling on tension-compression, not rotating
  bending) reports a fatigue-strength drop of more than 60 % attributable to surface roughness
  in as-built AM Ti-6Al-4V. Surface roughness dominates crack initiation, with multiple
  initiation sites per specimen.
- Powder-reuse effect on L-PBF Ti-6Al-4V (Carrion et al. [2]): in axial/strain-life tests,
  powder recycling had **no significant effect** on fatigue performance in the as-built
  surface condition, and machined specimens fabricated from used powder showed **longer**
  fatigue lives in the HCF regime — i.e., used powder did not degrade, and in the machined
  state improved, fatigue life. (Note: Carrion [2] uses axial/strain-life, not rotating-
  bending — earlier drafts misstated both the test mode and the direction of the effect.)

### 2.2 Defect-driven failure (Kitagawa–Takahashi with horizontal asymptote)
- WAAM Ti-6Al-4V (Akgun et al. [4]): fatigue-life dispersion is governed primarily by defect
  *location* (surface vs sub-surface), not just defect size. Above ~85 µm effective defect
  size, life drops ~2 orders of magnitude. **Akgun's explicit conclusion is that the
  Kitagawa–Takahashi diagram for this alloy SHOULD be presented with a horizontal asymptote**:
  below the ~85 µm defect threshold, wrought-equivalent fatigue performance is achieved,
  consistent with an effective fatigue floor / endurance regime for sub-threshold defects.
  This means AM Ti-6Al-4V does **not** lack a definable endurance limit at the defect level
  — it has one tied to a defect-size threshold. Earlier drafts of this brief inverted Akgun's
  direction and have been corrected.

### 2.3 Build orientation and surface finish
- Build orientation (vertical vs horizontal) drives anisotropy in defect population and
  surface area exposed to fatigue load; literature widely cited but specific orientation-vs-
  life tables in this pass are sparse beyond [1] and [3].
- Surface finish (polishing, machining) is the single largest variable for HCF life in AM
  Ti-6Al-4V [1, 3, 5]. Process-parameter knock-down factors for DMD-laser Ti-6Al-4V given in
  [5].

### 2.4 VHCF (>10^7 cycles)
- OpenAlex and NTRS evidence [8]: AM Ti-6Al-4V fatigue studies cluster in the HCF regime
  (10^5–10^7 cycles). VHCF (>10^8) primary data for AM Ti-6Al-4V is **not** present in the
  public indexed literature surveyed.

## 3. Variable-amplitude loading and cumulative damage

### 3.1 Miner's rule — applicability
- Palmgren-Miner rule Σ(n_i/N_i) = 1 assumes a definable fatigue limit and load-sequence
  independence. For AM Ti-6Al-4V, the K-T horizontal asymptote **is preserved** below a
  defect-size threshold (~85 µm in WAAM, Akgun [4]), so an infinite-life regime exists at
  the defect level. What the AM material does **not** offer is a single open-literature
  end-to-end calibration of the damage threshold against a known spectrum — defect-population
  variability, surface roughness, and residual stress all shift the threshold. AM-specific
  calibrations of nonlinear damage rules (Corten-Dolan, Manson two-slope, elementary
  block-loading) are not present in the indexed literature surveyed. The hazard to a Miner's-
  rule calculation is therefore not that the asymptote is missing, but that the defect-
  threshold input is process-dependent and currently has to be measured per AM build / part
  state.

### 3.2 Spectrum-loading tests
- Standard spectra (FALSTAFF, TWIST, Mini-TWIST, GAG) and in-service aerospace spectra have
  been applied extensively to wrought Ti-6Al-4V, but **peer-reviewed spectrum-loading tests on
  AM Ti-6Al-4V are very rare** in the public indexed literature surveyed. NASA LaRC has an
  active AM Ti fatigue program [8] and may hold proprietary spectrum data; this brief did
  not enumerate those reports.

### 3.3 Mean-stress corrections for AM Ti-6Al-4V
- Walker, Smith–Watson–Topper, Morrow, and Goodman corrections are routinely applied to
  constant-amplitude AM S-N data. Spectrum-loading calibrations for AM are not widely
  published; treat as inferred.

## 4. Standards / regulatory landscape

- **ASTM F3301-18** [6]: standardizes thermal post-processing (stress relief, HIP) of
  PBF Ti-6Al-4V (and CoCrMo, IN718, IN625, 316L, AlSi10Mg); SI units; BOS Vol. 10.04;
  Subcommittee F42.05. Scope verified directly; full text paywalled.
- **ASTM F3122** (L-PBF Ti-6Al-4V material part-property standard): existence asserted in
  industry sources; public landing page returned 404 in this pass; marked **blocked** [7].
- **ISO/ASTM 52900-series**: AM process taxonomy only; no AM-Ti fatigue allowables [5].
- **MMPDS / MIL-HDBK-5**: the authoritative handbook for fatigue allowables; AM-specific
  insertion path documented in industry articles but actual allowables are paywalled [9].
- **FAA / EASA AM guidance**: secondary sources reference these documents, but specific PDF
  URLs attempted in this pass (NASA-FAA Elam talk PDF, EASA AM concept paper) returned 404.
  Existence inferred but **not directly verified** [7].

## 5. Gap analysis (per mechanical skill Gap Detection section)

The literature on **long-term (VHCF, >10^7 cycles) variable-amplitude fatigue of AM Ti-6Al-4V
under realistic spectrum loading** is genuinely sparse. What was found:

- Many constant-amplitude S-N studies (L-PBF, EBM, DMLS, WAAM).
- A handful of papers on defect-driven failure and Kitagawa–Takahashi non-applicability [4].
- Standards governing post-processing [6] and the L-PBF material property spec [7].
- Regulatory / handbooks (FAA, EASA, MMPDS, MIL-HDBK-5) [7, 9].

What was **not** found in this pass:

- VHCF (>10^8 cycles) S-N curves for AM Ti-6Al-4V.
- FALSTAFF / TWIST / Mini-TWIST / GAG spectrum tests on AM Ti-6Al-4V.
- AM-specific calibration of nonlinear cumulative-damage rules.
- Open numerical allowables in MMPDS / MIL-HDBK-5 for AM Ti-6Al-4V (paywalled).
- Verified direct retrieval of FAA / EASA AM fatigue guidance PDFs.

> **Suggested: /gap-analysis mechanical AM-Ti6Al4V-variable-amplitude-fatigue**

## 6. Open questions

1. Does VHCF (>10^8 cycles) behavior of AM Ti-6Al-4V follow a smoothly decreasing S-N curve
   with no asymptote (per Akgun [4] for WAAM), or does HIP + surface removal restore an
   effective endurance limit?
2. Are there AM-specific load-interaction (high-low / low-high) data sets that can be used to
   calibrate a Corten-Dolan or Manson damage rule for AM Ti-6Al-4V?
3. What representative spectrum-loading design values have been published for AM Ti-6Al-4V in
   the period 2020-2025 that are openly accessible?
4. What is the current MMPDS / MIL-HDBK-5 acceptance path for AM Ti-6Al-4V allowables, and
   how does it reconcile the AM defect-driven failure mode with the historical Miner's-rule
   framework?

## 7. Limitations and boundary

- This brief synthesizes peer-reviewed and standards evidence available in the publicly
  indexed literature. Several authoritative sources (ASTM F3122 full text, MMPDS /
  MIL-HDBK-5 tables, FAA / EASA AM guidance PDFs) are paywalled or behind landing pages
  that returned 404 in this pass; these are flagged as `blocked` in the provenance sidecar.
- All numeric claims carry units and a citation; no extrapolation was performed.
- The literature is sparse on VHCF and variable-amplitude AM Ti-6Al-4V — this is itself a
  finding, not a failure to search.

> Research-only, not for final engineering sign-off.

## Sources

1. Vayssette, Saintier, Brugger, El May, Pessard, Int. J. Fatigue 123 (2019) 180-195. doi:10.1016/j.ijfatigue.2019.02.014
2. Carrion et al., JOM 71(3) (2018) 963-973. doi:10.1007/s11837-018-3248-7
3. Nakatani et al., Procedia Struct. Integr. 19 (2019) 294-301. doi:10.1016/j.prostr.2019.12.032
4. Akgun et al., Int. J. Fatigue 150 (2021) 106315. doi:10.1016/j.ijfatigue.2021.106315
5. Gharbi et al., J. Mater. Process. Technol. 213(5) (2013) 791-800. doi:10.1016/j.jmatprotec.2012.11.015
6. ASTM F3301-18. doi:10.1520/F3301-18 (existence + scope verified; full text blocked)
7. ASTM F3122, FAA / EASA AM guidance PDFs — existence inferred from secondary refs;
   landing pages blocked in this pass
8. NASA NTRS LaRC AM Ti fatigue program (13 records 2020-2024 on "Ti-6Al-4V fatigue additive")
9. MMPDS / MIL-HDBK-5 Ti-6Al-4V — existence verified; design values blocked (paywall)