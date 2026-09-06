# FMEA — AM Ti-6Al-4V Aerospace Bracket under Cyclic Loading

> **Scope:** Qualitative brainstorming FMEA, not a regulatory submission.
> **Research-only, not for final engineering sign-off.**

---

## 1. System Definition

### 1.1 Component
A load-bearing aerospace bracket additively manufactured (AM) from Ti-6Al-4V by laser powder bed fusion (LPBF), per **ASTM F3301-18A** (Standard Specification for Thermal Post-Processing Metal Parts Made Via Powder Bed Fusion) and **AMS 4999** (LPBF Ti-6Al-4V titanium alloy). Geometry is bracket-shaped, with integral ribs, lugs, and bolted/riveted fastener holes. Build orientation is selected by designer; mechanical properties are anisotropic (columnar prior-β grain structure aligned with build direction).

### 1.2 Operating Conditions
- **Loading**: cyclic — combined flight-spectrum vibration (engine/gust spectrum, typically 10⁴–10⁶ cycles per flight-hour range) plus landing loads (low-cycle, high-magnitude). Spectrum: predominantly **HCF** (gust/vibration) plus occasional **LCF** events (touch-down).
- **Environment**: per RTCA DO-160 — operating temperature **−54 °C to +85 °C** (ground survival to +85 °C; some nacelle-adjacent locations hotter), pressure altitude to ~12,500 m, salt-laden/marine atmosphere, possible **direct lightning strike** (DO-160 Section 23, Zone 2A/3 exposure).
- **Service life**: ~30,000 flight hours / ~20,000 flight cycles typical transport-category target (FAA AC 25.571-1D damage-tolerance evaluation horizon).
- **Surface state**: as-built (Ra ~10–20 µm), or post-machined/chemically-milled/polished at functional interfaces.

### 1.3 Safety Criticality
**HIGH — catastrophic.** Bracket failure in flight → loss of primary structure category (per **FAA AC 25.571-1D**, "Damage Tolerance and Fatigue Evaluation of Structure," Transport Category). Likely **Principal Structural Element (PSE)** per 14 CFR 25.571 — failure would preclude continued safe flight and landing.

### 1.4 Regulatory / Standards Context
| Standard | Title (short) | Role |
|---|---|---|
| 14 CFR Part 25.571 | Damage tolerance / fatigue | Airworthiness basis |
| **FAA AC 25.571-1D** | Damage Tolerance & Fatigue Evaluation of Structure | Compliance guidance (PSE, WFD, LOV) |
| RTCA DO-160 | Environmental Conditions & Test Procedures | Operating envelope |
| AS9100 / AS9145 | FMEA for aerospace | FMEA methodology |
| **ASTM F3301-18A** | Thermal post-processing of PBF metal | Heat-treatment requirements |
| **AMS 4999** | LPBF Ti-6Al-4V (titanium alloy) | Material/process spec |
| ASTM F3049 | Guide for characterizing AM parts | Property reporting |
| ASTM E466 | HCF testing | Verification |
| ASTM E468 | Presentation of constant-amplitude fatigue results | Verification |
| ASTM E647 | FCGR (da/dN-ΔK) | Verification |
| ISO/ASTM 52901 | AM design principles | Geometry/orientation |

### 1.5 Boundaries
**In scope**: material/process defects, microstructural features, fatigue under spectrum loading, environmental attack, fastener-hole integrity, NDE detection capability.
**Out of scope**: engine/APU integration, system-level redundancy, crew-error scenarios, software/avionics, manufacturing non-conformance unrelated to bracket mechanical integrity.

---

## 2. Failure Modes — Ranked by RPN

Ratings: **S** = Severity (1–10), **O** = Occurrence (1–10), **D** = Detection (1–10; 10 = no detection capability). **RPN = S × O × D**.

| # | Component / Site | Failure Mode | Effect (on aircraft) | Mechanism | S | O | D | RPN |
|---|---|---|---|---|---|---|---|---|
| 1 | Bulk material (sub-surface) | **HCF crack initiation at lack-of-fusion (LoF) defect** | Undetected sub-surface LoF acts as a fatigue initiation site; under HCF (gust/vibration) cracks grow, may reach critical length between inspections → catastrophic fracture of PSE | LPBF energy density too low → unmelted powder between scan tracks → planar LoF defect (irregular, sharp); stress concentration factor ~2–3× equivalent round pore (Tammas-Williams, Withers; Liu et al. 2018 *Acta Mater.*). As-built LPBF Ti-6Al-4V HCF strength ≈ 50–70 % of wrought for surface, lower for sub-surface LoF. | 9 | 7 | 7 | **441** |
| 2 | Fastener holes (built-up lugs) | **Bearing / hole elongation fatigue** under spectrum loading | Hole elongates; load path eccentricity rises; secondary bending stresses propagate primary crack; eventual link-up of two hole-edge cracks → catastrophic lug failure | Spectrum (tension–tension with high R) HCF initiation at as-built hole wall roughness (Ra 10–20 µm) acting as notch; cold-work layer absent; fastener clamp-up fretting adds Mode II component. AM-built holes typically have ≥ 50 % lower bearing fatigue life vs. machined wrought Ti. | 9 | 7 | 6 | **378** |
| 3 | Bulk (microstructure) | **Dwell-sensitive HCF/LCF at room temperature** — cold-creep facet nucleation | Premature life debit (~5–10× life reduction under 1–10 min hold at peak stress); under landing-load dwell, life underestimated by classical LCF model | α/β Ti alloys exhibit room-temperature dwell debit: hold time > ~1 min at peak strain nucleates quasi-cleavage facets at hard-α / soft-β colonies oriented for slip, driven by time-dependent slip. AM basket-weave α is generally *less* dwell-sensitive than mill-annealed colony α, but coarse prior-β / banded α can restore sensitivity. (Bache, Dunne, Pilchak; HCP slip system — limited.) | 9 | 6 | 7 | **378** |
| 4 | Fastener holes | **Fretting fatigue at hole–fastener interface** | Crack initiation at Hertzian contact zone on hole wall; standard eddy-current/UT inspection may miss sub-surface nucleation | Microslip under cyclic clamp load + flight spectrum; Ti is a known fretting-sensitive alloy at Ti/Ti pairing. Standard hole-prep (drill → ream → deburr) eliminates rough AM wall; if hole is *left as-built*, fretting risk is acute. | 8 | 7 | 7 | **392** |
| 5 | Bulk (build defects) | **Keyhole porosity chain** linking into a planar crack-like defect | Linked chain of entrapped gas + keyhole voids acts as crack-nucleation site with effective ΔK_eff comparable to a 50–200 µm crack | Excessive laser power / insufficient scan speed → keyhole instability → chain of near-spherical + teardrop pores aligned with scan direction; HIP required to close (ASTM F3301 covers thermal post-processing only — HIP is a separate optional step per F3055 / AMS 4999). Without HIP: pores remain. | 8 | 6 | 6 | **288** |
| 6 | Bulk (residual stress) | **Distortion / warpage → fit-up failure at assembly** | Mating interface misaligns, induces secondary bending on adjacent structure, possible interference with adjacent systems | High thermal gradient during LPBF → residual stress; without proper substrate pre-heat + stress relief (per ASTM F3301 §6, ~700 °C for Ti-6Al-4V) distortion exceeds drawing tolerance. Effect is at assembly, not in-flight — *but* secondary bending in service amplifies fatigue loading on adjacent PSEs. | 8 | 5 | 5 | **200** |
| 7 | Bulk (NDE coverage) | **Missed sub-surface defect in CT scanning** | A LoF or porosity cluster ≥ critical size escapes detection → inflight crack growth | LPBF Ti attenuates X-rays at typical lab energies; detection threshold ~50–200 µm depending on voxel size + part geometry (NIST AM-Bench 2020). Small LoF in thick section (≥ 25 mm) or near dense features (lug boss, rib intersection) can fall below detection threshold. Aerospace Bracket Industry Working Group: CT detection limit for Ti ≈ 0.3 % of thickness for equivalent spherical feature. | 9 | 6 | 5 | **270** |
| 8 | Surface (as-built) | **Fatigue initiation at surface roughness / partially-bonded powder** | Surface notch + roughness-driven early crack; reduces HCF life 30–60 % vs. machined wrought (Greitemeier et al. 2017 *IJF*; Sanaei & Fatemi 2020 *IJF*). | As-built Ra 10–20 µm, occasional stuck powder particles (satellites) act as sharp notches. Polishing/chem-milling removes most; machined-to-print critical surfaces are mandatory for PSE-grade AM. | 8 | 6 | 4 | **192** |
| 9 | Sub-surface / surface | **Hot salt stress-corrosion cracking (SSC)** of Ti-6Al-4V in marine environment at elevated T | Slow Mode I crack growth under sustained tensile stress (residual + flight load) in chloride-bearing atmosphere above ~230 °C; can occur at *lower* T in occluded crevices | Ti alloys susceptible to SSC in NaCl-bearing atmospheres above ~230 °C threshold (ASME / Boeing D6-54070); landing-gear / nacelle-adjacent brackets may exceed. SSC threshold lowers in presence of H (cathodic) or salt deposits in crevices. | 8 | 4 | 8 | **256** |
| 10 | Bulk | **Hydrogen embrittlement** from moisture / contaminants in powder or electrolyte | Sub-critical slow crack growth; fluting / brittle fracture; rapid fracture under sustained load | Powder moisture pickup (Ti-6Al-4V powder absorbs H₂O → forms surface hydroxide → H ingress under HIP or service); electrolytic interaction if bracket mates with carbon-fiber composite (CFRP — galvanic + H). AMS 4999 sets powder H limit; baking/reuse discipline required. | 9 | 4 | 7 | **252** |
| 11 | Bulk (microstructure) | **α-case formation** at hot-exposed surface | Hard, brittle O-diffused α layer (~10–50 µm) → crack initiation under fatigue; life debit when material is exposed > ~400 °C in air | Atmospheric exposure above ~400 °C dissolves O → α-case; relevant for engine-adjacent brackets, near-laser-machined surfaces, or post-weld zones. AM Ti-6Al-4V is no exception; chemically milled / heat-treated surfaces in air furnace can form α-case. | 7 | 5 | 6 | **210** |
| 12 | Bulk (powder chemistry) | **Inclusions / foreign material / tungsten from spatter** | Stress concentrator; crack initiation; impurity-driven H embrittlement | Gas-atomized Ti powder spec (AMS 4999); reused powder risks inclusion accumulation; W spatter from laser interaction with Ti substrate plate. | 7 | 4 | 6 | **168** |
| 13 | Bulk (inspection/NDE) | **Surface-breaking crack missed by visual / dye-pen** | Fatigue crack grows from missed site → catastrophic fracture | Visual / dye-penetrant (PT) limited to ≥ 0.5 mm surface cracks, often restricted to accessible surfaces; internal lug faces and rib intersections not inspectable by PT. ET (eddy current) limited to ~2 mm depth. | 9 | 3 | 7 | **189** |
| 14 | Bulk | **Mechanical overload** under limit-load event (hard landing) | Plastic deformation, residual displacement, immediate loss of function or fracture at overload | Hard-landing case; LCF or single-cycle overload. Limit of validity (LOV) per AC 25.571-1D must cover such events. AM parts typically design with higher safety factor for this reason; build defects (item 1) lower the effective overload capacity. | 9 | 3 | 4 | **108** |
| 15 | Bulk (lightning) | **Lightning strike burn-through / pitting → fatigue initiation site** | Surface pitting + metallurgical damage → HCF crack initiation at burn site | DO-160 Sec. 23; AM Ti is not particularly more or less susceptible than wrought, but surface roughness concentrates current density → higher local pitting. | 7 | 3 | 4 | **84** |
| 16 | Bulk (process) | **Layer delamination / lift-up** due to excessive residual stress or insufficient inter-layer bonding | Effectively a built-in LoF over a large planar area → severe fatigue debit | Build-parameter deviation (laser power drop, oxygen ingress, recoater interference); per-build melt-pool monitoring (LPM) and powder-bed imaging detect. Severity depends on layer area affected. | 9 | 2 | 5 | **90** |

---

## 3. Critical Items (RPN ≥ 200 OR S ≥ 9)

### Item 1 — HCF crack initiation at lack-of-fusion (LoF) — RPN 441
- **Mitigation**:
  - Apply process window validated against ASTM F3301 thermal post-processing + **AMS 4999** parameter envelope; require **Hot Isostatic Pressing (HIP)** per ASTM F3055/A21 to close LoF and porosity (HIP cycle: ~900–950 °C, ~100 MPa argon, 2–4 h for Ti-6Al-4V).
  - Set **build envelope in fatigue-critical zone**: use ≤ 30 µm layer thickness, scanning strategy with overlap ≥ 15 %, melt-pool monitoring (LPM) per-build, 100 % powder reuse specification (per AMS 4999 limits on O, N, H pickup).
  - Designer constraint: orient LoF-prone planes perpendicular to principal tensile stress axis; machining/chem-milling critical load paths.
  - Powder: virgin + recycled blend ratio ≤ 50 % per AMS 4999.
- **Verification**:
  - **CT scanning** (high-resolution micro-CT, voxel ≤ 50 µm) on 100 % of PSE parts.
  - Witness-coupon fatigue testing per **ASTM E466 / E468** (R = 0.1, f = 20 Hz, run-out 10⁷) for each build batch.
  - **da/dN-ΔK** testing per **ASTM E647** to feed damage-tolerance analysis (AC 25.571-1D §6).
  - Process-control: melt-pool monitoring data archived for each part (digital thread per FAA / EASA AM guidance).

### Item 2 — Hole elongation fatigue — RPN 378
- **Mitigation**:
  - **Machine** all fastener-hole bearing surfaces post-build (post-HIP); specify hole-wall roughness Ra ≤ 0.8 µm; cold-work sleeve / bushings for high-loaded lugs; reaming with controlled residual stress (low-plasticity burnishing if feasible).
  - Apply fastener clamp-up torque control per installation drawing; specify interference-fit fasteners where spectrum permits.
  - "Build-then-machine" hole strategy: AM bracket geometry leaves an undersize hole that is finish-machined — never accept as-built hole for primary structure.
- **Verification**:
  - **Bearing fatigue** testing per ASTM E466 / NASM 1312-1 on coupon representative of build + HIP + machined hole; verify ≥ 4× life margin vs. mission spectrum.
  - Hole-profile metrology (Ra, roundness, residual stress via X-ray diffraction) at incoming inspection.
  - NDE: **Eddy-current array** post-machining; **ultrasonic phased-array UT** on lug boss.

### Item 3 — Dwell-sensitive fatigue — RPN 378
- **Mitigation**:
  - Specify **microstructure**: fine α-lamellar / bi-modal (not coarse colony α) — achieved by HIP + solution-treat + age cycle per ASTM F3301 §6.3 (e.g., 700 °C HIP + 940 °C β-solution + 575 °C age — or below-β HIP followed by α/β processing). Document microstructure in part certification report.
  - Apply **dwell-fatigue knockdown** to allowables: account for ~5–10× life debit at 1–10 min dwell (per MMPDS / Rolls-Royce / Boeing AM design guides for dwell-sensitive α/β Ti).
  - Mission-profile review: bracket duty cycle — quantify peak-hold time under landing loads; if > 1 min at ≥ 90 % limit strain, *dwell applies*.
- **Verification**:
  - **Dwell-fatigue testing** at R = 0.05, 1.5 min hold (ASTM E468 modified) on production-representative coupons; verify knockdown vs. conventional LCF.
  - **Microstructural examination**: SEM of etched cross-section; confirm absence of macrozones / banded α.
  - Document design rationale per AC 25.571-1D §5 (fatigue evaluation methodology).

### Item 4 — Fretting fatigue at fastener interface — RPN 392
- **Mitigation**:
  - **Mandatory machined holes** with controlled Ra (≤ 0.8 µm) and surface enhancement (shot-peen or low-plasticity burnishing).
  - Specify fastener/hole clearance per installation drawing; anti-fret coating (Alodine, Sermetal, or MoS₂).
  - Clamp-up torque verification at assembly.
- **Verification**:
  - Fretting-fatigue test per ASTM E2789 / NASM 1312-1; verify ≥ 3× life vs. plain HCF.
  - ET inspection at depot-level maintenance check.
  - In-service bolt torque audit.

### Item 5 — Linked keyhole porosity — RPN 288
- **Mitigation**:
  - Process control to **stable keyhole / conduction mode** (not over-melted): volumetric energy density tuned for conduction regime; melt-pool monitoring to detect drift.
  - **HIP** mandatory for PSE; ASTME F3055/A21 HIP parameters.
  - Build-orientation control: critical surfaces + critical cyclic stress paths perpendicular to build direction.
- **Verification**:
  - 100 % CT screening for parts > 10 mm thick.
  - Density per Archimedes ≥ 99.7 %; metallographic density on witness coupon per ASTM E3.
  - **AMS 4999** powder + process qualification.

### Item 6 — Distortion / fit-up failure — RPN 200
- **Mitigation**:
  - Stress relief per ASTM F3301 (700 °C, 1 h argon); controlled-cooling fixturing for first-stage build.
  - Add machining / chem-milling allowance on mating interfaces.
  - In-situ monitoring (LPM) for anomaly detection.
- **Verification**:
  - CMM metrology vs. CAD nominal on every part.
  - Trial assembly jig check.

### Item 7 — Missed sub-surface defect in CT — RPN 270
- **Mitigation**:
  - **Multi-modal NDE**: combine CT (volumetric) + phased-array UT (resolution on dense features) + surface ET / PT.
  - Build parts with **inspection-access features** (e.g., split into sections, drill-access holes with removable plugs).
  - Set acceptance threshold: defect ≤ critical size per damage-tolerance analysis (AC 25.571-1D §6), not ≤ detection capability.
- **Verification**:
  - CT validation per ASTM E2732 / E2597 using calibrated reference artifacts.
  - POD (probability of detection) study per ASTM E2862 for the chosen NDE on representative Ti-6Al-4V LPBF specimens.
  - Destructive tear-down of N=1 pilot parts per batch to validate NDE.

### Item 9 — Hot salt stress-corrosion cracking — RPN 256
- **Mitigation**:
  - Temperature/environment management: confirm bracket skin T stays below 230 °C (or use Ti-3Al-2.5V / Ti-β-21S alloy in SSC zones).
  - Sealing/isolation from salt deposits; anti-corrosion coating (Boeing D6-54070 qualified).
  - Periodic wash-down in marine operations.
- **Verification**:
  - Slow-strain-rate testing per ASTM G129 / G44 alternate immersion.
  - In-service corrosion survey at depot check; ET at lug interfaces.

### Item 10 — Hydrogen embrittlement — RPN 252
- **Mitigation**:
  - Powder H₂O ≤ 0.10 % by mass per **AMS 4999**; bake-out cycle on recycled powder.
  - Avoid galvanic coupling with CFRP (use G10 isolation bushings / wet-layup barrier).
  - Avoid acid pick-up; if chemical milling used, neutralize immediately.
- **Verification**:
  - Powder chemistry per AMS 4999 (H by LECO); verify at each reuse.
  - Cathodic-charging susceptibility test per ASTM F1113 on coupon; verify failure strain ≥ baseline.

### Item 11 — α-case formation — RPN 210
- **Mitigation**:
  - Heat-treatment in vacuum or high-purity argon per ASTM F3301; chemical-mill or abrasive-blast α-case from surfaces exposed > 400 °C.
  - Do not machine surfaces with EDM (recast layer); use low-heat-input methods.
- **Verification**:
  - Micro-hardness traverse (HV 0.1) at sectioned witness coupon; α-case threshold HV > 380.
  - Metallographic etch per ASTM E407 (Kroll's reagent) — visible α-case layer.

### Critical Item NOT RPN ≥ 200 (escalated by S = 9): None beyond the above; **all S = 9 items have RPN ≥ 189** (Items 13, 14). Items 13 and 14 are promoted to Critical by the **S ≥ 9 rule** even though RPN < 200; mitigation below.

### Item 13 — Surface-breaking crack missed by PT (S = 9, RPN 189)
- **Mitigation**:
  - Multi-method inspection: PT for accessible + **ET** for fastener-hole vicinity + UT for sub-surface.
  - Mandatory post-machined surface finish Ra ≤ 0.8 µm; peening (shot or laser) for compressive residual stress.
  - Build parts with inspectable geometry; inspect at depot intervals per AC 25.571-1D §7.
- **Verification**:
  - Inspection Interval (II) per MSG-3; verify II ≤ detectable crack growth interval per damage-tolerance analysis.

### Item 14 — Mechanical overload (S = 9, RPN 108)
- **Mitigation**:
  - Static strength per AC 25.571-1D §5; limit load ≥ 1.5× ultimate with HIP-validated density.
  - Load-redundant load path where certification permits.
- **Verification**:
  - Static ultimate test on production-representative coupon; verify ≥ 1.5× design limit.

---

## 4. Moderate Items (100 ≤ RPN < 200)

| # | Mode | RPN | Mitigation summary | Verification |
|---|---|---|---|---|
| 8 | Surface-roughness fatigue | 192 | Machine/polish critical surfaces; shot-peen per AMS 2430 | Surface Ra per ASTM B499; coupon fatigue |
| 12 | Inclusions / W spatter | 168 | Powder spec + sieving + reuse controls; substrate plate audit per AMS 4999 | Powder chemistry + OES on coupon |
| 15 | Lightning pitting | 84 | Per DO-160 §23 design (metal mesh, doubler); inspect post-strike | Post-strike visual + ET |
| 16 | Layer delamination | 90 | Melt-pool monitoring; LPM alarm thresholds; powder-bed imaging | Per-build LPM log; coupon UT |

(Items 15 and 16 fall to Low but are included for completeness; S < 9 + RPN < 100 ⇒ Low.)

---

## 5. Assumptions

1. **Bracket role**: assumed primary structure (PSE per AC 25.571-1D). If non-PSE, severity ratings drop, but regulatory burden is reduced proportionally.
2. **Loading spectrum**: assumed transport-category (FAA Part 25). Military/rotorcraft would invoke MIL-A-83444 / ASIP (different spectra).
3. **Process parameters**: assumed within AMS 4999 envelope. Out-of-envelope parts raise Occurrence ratings for items 1, 5, 6, 16 by 1–2 points.
4. **NDE method**: assumed high-resolution micro-CT + phased-array UT + ET for PSE; default detection ratings reflect industrial best-practice, not every lab's capability.
5. **Microstructure**: assumed HIP + heat-treated per ASTM F3301 / AMS 4999. As-built + annealed-only would increase Items 3, 11 Occurrence ratings.
6. **Operating environment**: temperature taken as −54 °C to +85 °C per DO-160 default; engine-adjacent brackets may run hotter — revisit SSC for those locations.
7. **Service life**: assumed ~30,000 FH / ~20,000 FC; LOV compliance per AC 25.571-1D required.
8. **Recycled powder ratio**: assumed ≤ 50 % per AMS 4999 best practice; higher ratios raise Items 10, 12.
9. **Mechanical allowables**: assumed MMPDS or equivalent; AM-specific allowables from AMS 7000 series where applicable.
10. **No prior load-spectrum-specific testing**: all ratings are engineering judgments based on published LPBF Ti-6Al-4V fatigue data, ASTM F3301 / AMS 4999 requirements, and AC 25.571-1D damage-tolerance methodology. **Ratings must be re-validated against part-specific coupon testing before design release.**

---

## 6. Boundary Statement

This FMEA identifies and ranks failure modes — it does **not** produce quantitative probability data. Output is qualitative brainstorming, not a formal FMEA for regulatory submission under **AS9145** or for certification evidence to FAA/EASA. Ratings are engineering judgments based on published LPBF Ti-6Al-4V literature and the cited standards. For safety-critical systems, follow up with detailed damage-tolerance analysis (per **FAA AC 25.571-1D**), full-scale fatigue testing (per **ASTM E466 / E468 / E647**), and program-specific NDE POD studies (per **ASTM E2862**).

**Research-only, not for final engineering sign-off.**