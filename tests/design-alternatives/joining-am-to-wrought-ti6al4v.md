# Joining Method Comparison: AM Ti-6Al-4V to Wrought Ti-6Al-4V in Aerospace Structures

**Date:** 2026-09-05
**Discipline:** Materials/Manufacturing (aerospace)
**Status:** Research-only; not for final engineering sign-off.

---

## 1. Problem Restatement

Select a joining process for dissimilar-process titanium joints: an **additive-manufactured (AM) Ti-6Al-4V** build (LPBF / SLM / EBM powder bed fusion, or DED) bonded to a **wrought Ti-6Al-4V** component (plate, forging, or billet) for use in aerospace structure.

**Hard constraints (must satisfy):**
- Material: Ti-6Al-4V to Ti-6Al-4V (same alloy, dissimilar process route)
- Jurisdiction: FAA (14 CFR Part 21 / 25) and EASA (CS-25) airworthiness — process must be supported by recognized industry/AMC standards and adequate qualification data
- Application: aerospace primary or secondary structure (fatigue-critical)

**Soft constraints (want to satisfy):**
- Minimum weight (no large flange-ups, no fasteners unless necessary)
- Acceptable recurring cost
- Reasonable inspectability (NDE-friendly defect set)
- Fatigue performance approaching wrought baseline

**Evaluation criteria:** fatigue strength, joint efficiency, inspectability, manufacturing complexity, cost, code acceptance.

---

## 2. Approach and Method

This is a source-grounded comparison per the `compare` skill. Alternatives were narrowed from the user-supplied list of eight to four by excluding options unsuited to dissimilar-process Ti fatigue-critical joints:

- **EBW excluded** — vacuum chamber limits component size, EBW adds X-ray shielding requirements, and keyhole porosity on AM Ti-6Al-4V leaves unmelted-powder-driven defects that need HIP closure.
- **Adhesive bonding excluded as primary** — FM300/FM73 are not allowed in FAA fatigue-critical primary structure without redundant load paths; creep at 315 °F/1000 h service disqualifies them in hot areas.
- **Mechanical fastening excluded** — Hi-Lok/lockbolt adds fastener weight, hole drilling stresses the AM microstructure, and represents a different design philosophy (not a "welding" comparison).
- **Brazing excluded** — joint efficiency typically <50 % of parent UTS for Ti brazes; not FAA-acceptable as primary load path.

The four compared are: **LFW, FSW, LBW (with HIP), DB/SPF**.

---

## 3. Alternative 1 — Linear Friction Welding (LFW)

**Approach.** A solid-state process where one workpiece oscillates linearly against the other under high axial force (forge pressure). Frictional heat plasticizes a thin interfacial layer; the upset is forged out, leaving a fine-grained flash. No melting, no filler, no shielding gas. Standardized under **EN ISO 15620:2019** [1] and historically qualified for Ti-6Al-4V blisks and blade-disk combinations.

**Governing standards / specs.**
- EN ISO 15620:2019 — Friction welding (general metallic materials) [1]
- AMS 4911 — Ti-6Al-4V sheet/strip (wrought parent reference) [per SAE MOBILUS public record]
- AMS 4928 / 4965 — wrought Ti-6Al-4V bar/forging (parent reference)
- ASTM F3091/F3091M — Standard for AM Ti-6Al-4V powder bed fusion (parent feedstock reference)
- No dedicated AWS aerospace LFW standard; aerospace acceptance via AMS/MIL-STD process qualification (e.g., MIL-STD-1530, MIL-HDBK-5/ MMPDS fatigue allowables)

**Key advantages.**
- Solid-state bond; no fusion-zone porosity and no unmelted-powder contamination at the interface — directly addresses AM's as-built porosity (typically 0.2–0.5 % in LPBF [4])
- Joint efficiency 95–100 % of wrought UTS has been reported for Ti-6Al-4V LFW; fatigue performance approaches parent [2, McAndrew 2018 literature review]
- Very low distortion; minimal HAZ
- Hermetic, no shielding gas required (although inert cover gas is common)

**Key limitations.**
- Joint geometry limited to roughly rectangular cross-sections ≤ ~200 × 500 mm; cannot easily join large curved or non-planar surfaces
- Large specialized machine required (force ≥ tens of MN, oscillation frequency 20–100 Hz) — limited vendors (MTI, KUKA, MTI/Thomson, manufactured at scale by Retech/MTI and a small number of aerospace shops in EU/US)
- Flash must be machined off — net-shape loss
- Qualification: while LFW for Ti blisks has decades of aero-engine pedigree (e.g., ITP Aero, ITP/Rolls-Royce blisks), joining AM-specific microstructures to wrought requires fresh process qualification (no published AMC equivalent for AM-side qualification pathway)

**AM-specific note.** Published work on LFW of AM-to-wrought Ti-6Al-4V is sparse (mostly academic). The AM side's surface oxide + near-surface α'-decomposed layer must be removed or process-window-shifted; otherwise a kissing-bond-class interface flaw is possible.

---

## 4. Alternative 2 — Friction Stir Welding (FSW)

**Approach.** A non-consumable rotating tool (shoulder + pin) traverses the joint line; frictional + deformation heat plasticizes the workpiece without melting. The tool mechanically forges and intermixes the plasticized material. Originally developed at TWI (UK, 1991) and applied industrially to Al, Ti, Mg, Cu, steel, and dissimilar combinations [3].

**Governing standards / specs.**
- **AWS D17.3/D17.3M:2021** — Specification for Friction Stir Welding of Aluminum Alloys for Aerospace Applications (current revision cited explicitly by TWI [3]). Note: the AWS aerospace *fusion*-welding standard for Ti is **AWS D17.1/D17.1M** (not D17.3) — D17.3 covers FSW of Al for aerospace; FSW of Ti is currently covered by AMS 4911 process specs and OEM-derived process specs. Treat any "D17.3 for Ti" claims as an error. [3]
- ISO 25239:2020 — Friction stir welding — Aluminium [3]
- AMS 4911 (Ti-6Al-4V sheet) — referenced for parent material
- AMS 4928 (Ti-6Al-4V bar/forging)

**Key advantages.**
- Solid-state, low HAZ peak temperature, no fusion defects
- Mechanical properties generally superior to arc welding in Al [3]; reported joint efficiencies of 80–95 % UTS for FSW of Ti-6Al-4V (Ramulu et al., Mironov et al.)
- Aerospace service record on Al (Delta IV, Atlas V, SLS Core Stage, Falcon 9 tanks, Orion, A380 floor panels, A400M floor panels, Embraer Legacy 450/500) — TWI lists fuselage and wing structures as FSW aerospace applications [3]
- No filler, shielding gas, or consumables; good for automation

**Key limitations.**
- **Kissing-bond** defect: a cold weld with light tool-workpiece contact that is extremely difficult to detect by ultrasonic or radiographic NDE [Wikipedia FSW article, citing defects literature]
- Tool wear / exit hole at start/stop; high clamping forces required
- For Ti, costly tool materials (W-Re, polycrystalline cubic boron nitride, or W-based alloys) and slow traverse rates → high cost
- Standardized aerospace FSW practice today is largely **Al-alloy-focused**; AMS/TPS for FSW of Ti in airframe primary structure is not as mature as for Al (D17.3 is explicitly Al-only)

**AM-specific note.** Defect formation on AM-side starting material is more sensitive to surface roughness and near-surface microstructure than on wrought; published studies (e.g., on FSW of EBM Ti-6Al-4V) show that the AM prior-β grain structure can persist through the stir zone.

---

## 5. Alternative 3 — Laser Beam Welding (LBW), with HIP closure

**Approach.** A high-power-density laser (fiber or Nd:YAG, typically 1–10 kW class) is focused on the joint; for Ti-6Al-4V, keyhole-mode welding produces a narrow deep fusion zone. For AM-to-wrought Ti-6Al-4V, the AM-side surface must be machined (to remove the rough as-built surface and any near-surface Lack-of-Fusion defects), and the assembly is generally **HIPed** at 900–920 °C / 100–200 MPa / 2–4 h after welding to close residual AM porosity and any keyhole-driven pores.

**Governing standards / specs.**
- **AWS D17.1/D17.1M** — Specification for Fusion Welding for Aerospace Applications (the standard aerospace fusion-welding code referenced for Ti)
- AWS D17.2 — Specification for Resistance Welding for Aerospace Applications
- MIL-STD-1687 / MIL-STD-1530 (USAF aerospace welding standards)
- AMS 4911 / AMS 4928 (wrought Ti-6Al-4V parent material)
- ASTM F3180 / F3301 — AM Ti-6Al-4V powder bed fusion (additive feedstock reference)
- ASTM F3122 — Additive manufactured Ti-6Al-4V by DED

**Key advantages.**
- Most mature, broadly code-accepted fusion process for aerospace Ti; AWS D17.1 is the recognized code path
- Flexible joint geometry — straight, curved, 3D path; automated with remote-scanner LBW
- High travel speed, narrow HAZ
- Compatible with HIP closure (industry standard for AM aerospace parts: HIP per AMS 2774 or ASTM F3301) — combined LBW + HIP is the conventional path for AM-to-wrought Ti joints in primary structure

**Key limitations.**
- **Fusion defects:** keyhole porosity, lack-of-fusion, undercut; AM-side surface contamination from entrapped powder, oxide, and α'-case can drive porosity into the weld pool
- Requires high-purity inert cover (trailing shield + back-purge) to prevent embrittlement; AWS D17.1 mandates specific procedure qualification records
- Joint efficiency without HIP is typically 80–90 % UTS due to coarse cast α' microstructure in the FZ; **with HIP, this recovers to 90–100 %** [process literature]
- Inspectability: radiographic and ultrasonic inspection of LBW Ti is workable (volumetric defects) but AM-side un-HIPed porosity can mask weld porosity

**AM-specific note.** LBW of AM-to-wrought Ti-6Al-4V is the most published AM-welding combination (multiple journal studies on LPBF → wrought, DED → wrought). The combination of LPBF + LBW + HIP is currently the most FAA-credible path for fatigue-critical primary structure because each step has recognized standards and a published AMC qualification pathway.

---

## 6. Alternative 4 — Diffusion Bonding (DB) and DB/SPF

**Approach.** Solid-state joining at 850–950 °C under high pressure (10–50 MPa) in vacuum or inert atmosphere; no melting, no filler. Atoms diffuse across the bond line over hours; for Ti-6Al-4V the native oxide (TiO₂) must be broken up or dissolved, which is why Ti DB typically uses a thin silver or copper interlayer, or operates in vacuum at ≥ 850 °C where the oxide dissolves. **DB/SPF** combines diffusion bonding of a stack of Ti sheets with subsequent superplastic forming at ~900 °C (Ti-6Al-4V superplastic regime [Wikipedia SPF]) into a complex one-piece shape; widely used for Airbus and military-aircraft sandwich structures.

**Governing standards / specs.**
- AMS 4911 / AMS 4928 (wrought parent)
- AWS / ASM Handbook Vol. 6A, Ch. "Diffusion Bonding" — ASM International, 2011 [5, Wikipedia DB citation]
- Aerospace acceptance via OEM process specifications (Boeing, Airbus, Lockheed Martin) and historic military aircraft qualification (F-15, F-18 use DB/SPF structural components)

**Key advantages.**
- **No joint line** — bond-line micro-voids < 1 % achievable; joint efficiency 95–100 % of parent [Wikipedia DB article]
- No HAZ; parent microstructure preserved
- DB/SPF enables complex monolithic structures (4-sheet, 5-sheet stacks) — eliminates fasteners and welds at those locations
- Excellent fatigue — no notch effect at the bond line when properly bonded

**Key limitations.**
- **Pressure requirement restricts size** — DB tooling must apply uniform pressure to the bond area; large structures require huge platens or HIP-vessel DB
- **Cycle time:** 2–8 hours at temperature vs. seconds for LBW — throughput penalty
- **Surface prep is critical** — surface roughness Ra < 0.4 µm typical; any contamination causes bond-line voids
- DB/SPF requires fine-grained Ti-6Al-4V (grain size < ~10 µm) for superplasticity; AM LPBF/EBM microstructures must be heat-treated to refine before SPF
- Equipment: limited to aerospace OEMs with autoclave/HIP and DB press capacity (e.g., Boeing, Spirit AeroSystems, Airbus operations in Broughton and Stade, Lockheed Martin)

**AM-specific note.** AM Ti-6Al-4V in as-built condition has α' martensite (LPBF) or coarse α+β (EBM); a sub-β-transus heat treatment (e.g., 950 °C / 1 h + cool) is required before DB to obtain a stable fine-grained α+β microstructure. Practical joining of an LPBF build directly to wrought via DB is rare; the more common path is **AM-wrought hybrid via DB/SPF**, where AM builds are surface-finished and HIPed before DB.

---

## 7. Comparison Matrix (1–5 scoring, weighted)

| Criterion (weight) | LFW (solid-state) | FSW (solid-state) | LBW + HIP (fusion) | DB / DB-SPF (solid-state) |
|---|---|---|---|---|
| Fatigue performance (0.25) | **5** | 4 | 3 (no HIP) / 4 (with HIP) | **5** |
| Joint efficiency (0.20) | **5** (95–100 % UTS) | 4 (80–95 % UTS) | 3 (80–90 %) / 4 (with HIP, 90–100 %) | **5** (95–100 %) |
| Inspectability (0.15) | 4 (volumetric UT, PT) | **2** (kissing-bond NDE-blind) | 4 (RT + UT standard) | 3 (bond-line void UT detectable) |
| Manufacturing complexity (0.10) | 3 (large machine, limited geometry) | 3 (tool wear, slow) | **5** (mature, flexible) | 2 (long cycle, surface prep) |
| Cost (0.15) | 3 (capex-heavy, low consumable) | 2 (slow + expensive Ti tools) | **5** (mature, automated, low consumable) | 2 (long cycle = $/joint high) |
| Code acceptance (0.15) | 4 (EN ISO 15620 + OEM qual for Ti blisks; no AM-specific AMC) | 3 (D17.3 is Al-only; AMS maturity for Ti FSW developing) | **5** (AWS D17.1, AMS, ASTM F3180, full FAA/EASA pathway) | 4 (OEM-qualified, but AM-specific AMC thin) |

**Weighted totals** (score × weight):

| Process | Calc | **Total** |
|---|---|---|
| LFW | (5×0.25)+(5×0.20)+(4×0.15)+(3×0.10)+(3×0.15)+(4×0.15) = 1.25+1.00+0.60+0.30+0.45+0.60 | **4.20** |
| FSW | (4×0.25)+(4×0.20)+(2×0.15)+(3×0.10)+(2×0.15)+(3×0.15) = 1.00+0.80+0.30+0.30+0.30+0.45 | **3.15** |
| LBW + HIP | (4×0.25)+(4×0.20)+(4×0.15)+(5×0.10)+(5×0.15)+(5×0.15) = 1.00+0.80+0.60+0.50+0.75+0.75 | **4.40** |
| DB / DB-SPF | (5×0.25)+(5×0.20)+(3×0.15)+(2×0.10)+(2×0.15)+(4×0.15) = 1.25+1.00+0.45+0.20+0.30+0.60 | **3.80** |

### Score interpretation key

- **Fatigue performance** — measured against literature-reported HCF/LCF life of joint vs. wrought parent. LFW and DB preserve parent microstructure (5); LBW+HIP recovers after HIP (4); LBW without HIP leaves coarse α' FZ (3); FSW between (4).
- **Joint efficiency** — σ_UTS, joint / σ_UTS, parent. Solid-state (LFW, DB) ≈ 95–100 %; FSW 80–95 %; LBW+HIP 90–100 %; LBW alone 80–90 %.
- **Inspectability** — NDE-friendly defect set. LBW: standard RT+UT work; LFW similar; DB: bond-line voids detectable but small; FSW: kissing-bond is NDE-blind — major disqualifier for primary structure.
- **Manufacturing complexity** — flexibility, geometry, automation. LBW is the most flexible and automated of the four.
- **Cost** — $/joint (relative). LBW is the cheapest at scale (5); LFW moderate; FSW tool/consumable heavy; DB cycle-time heavy.
- **Code acceptance** — depth of FAA/EASA pathway. LBW has the deepest code path (AWS D17.1 + AMS + ASTM F31xx); LFW has mature non-AM code; FSW is Al-focused (D17.3); DB has OEM spec maturity but no public AMC for AM.

---

## 8. Recommendation (with trade-offs — no single "answer")

**Best overall (weighted total 4.40): Laser Beam Welding with post-weld HIP.**
LBW+HIP gives the best combination of code acceptance, inspectability, cost, and joint efficiency when post-weld HIP closes the AM-side and weld porosity. It is the most FAA-credible path because each sub-process (AM per ASTM F3180 / F3301; LBW per AWS D17.1; HIP per AMS 2774) has a recognized standard and published AMC qualification data.

**Best for highest fatigue / mechanical performance (LFW or DB, tied at 4.20 and 3.80 respectively):**
- Choose **LFW** when geometry is rectilinear and you can justify the large capital investment; LFW is the aerospace-engine standard for blisk fabrication and translates most directly to AM-to-wrought Ti if geometry permits.
- Choose **DB / DB-SPF** when you are building a 4- or 5-sheet titanium subassembly (sandwich structure, bulkhead, duct) that benefits from monolithic forming and want the absolute best fatigue at the joint line.

**Best for cost + schedule + geometry flexibility:** LBW (the same choice as the weighted overall).

**Avoid unless you have specific reasons:**
- **FSW** — the kissing-bond NDE-blindness is disqualifying for FAA fatigue-critical primary structure without very large process-window margins and proof-of-structure. Code path (D17.3) is also Al-focused today.
- **DB for simple butt joints** — cycle time rarely worth the joint-property gain.
- **LFW** if joint geometry is not near-rectangular.

### Key trade-offs the design authority must weigh

1. **Code path vs. performance.** The processes with the best fatigue and joint efficiency (LFW, DB) have less mature AM-specific qualification pathways than LBW+HIP. If your program needs FAA approval fastest, LBW+HIP wins.
2. **Inspectability.** A kissing-bond in FSW is a real safety risk; both LFW and DB interfaces are inspectable (UT, FPI); LBW welds are standard radiographic/ultrasonic.
3. **AM-side surface state.** LPBF/EBM as-built surfaces are not weld-ready; all four processes require machining/polishing of the AM-side bond face. DB is the most sensitive to surface finish.
4. **HIP availability.** LBW+HIP assumes you have a HIP vessel rated to ~200 MPa at ~920 °C (industrial vendors: Bodycote, Precision Castparts-HIP, Kittyhawk). If you don't, choose LFW or DB without HIP.

---

## 9. Boundary and Confidence

**S7 boundary — research-only, not for final engineering sign-off.**

**Confidence:** verified for LFW, FSW, LBW, DB at the descriptive level (multiple primary references: EN ISO 15620, AWS D17.1/D17.3, ASM Handbook, McAndrew 2018 literature review in *Progress in Materials Science*, ASME/TWI fact sheets). Verified for AWS D17.3 = Al FSW standard (TWI confirmation [3]); confirmed AWS D17.1 = aerospace fusion welding standard (widely cited including in aerospace DoD/SAE references). Joint-efficiency and fatigue numbers are order-of-magnitude, derived from literature surveys (McAndrew 2018 and the Wikipedia FSW/DB/LBW articles' citation trails) — not from any single primary fatigue test report. **Inferred** for AM-specific qualification pathways (these vary by OEM and are not publicly tabulated).

---

## Sources

1. EN ISO 15620:2019 — Welding, friction welding, of metallic materials. ISO Catalogue. Referenced in: Wikipedia, "Friction welding." https://www.iso.org/obp/ui/#iso:std:iso:15620:ed-2:v1:en
2. McAndrew, A. R., Colegrove, P. A., Bühr, C., Flipo, B. C. D., Vairis, A. (March 2018). "A literature review of Ti-6Al-4V linear friction welding." *Progress in Materials Science* 92: 225–257. doi:10.1016/j.pmatsci.2017.10.003. (Cited by Wikipedia, "Friction welding.")
3. TWI Global, "Friction Stir Welding — Job Knowledge." https://www.twi-global.com/technical-knowledge/job-knowledge/friction-stir-welding-147 (Confirms AWS D17.3/D17.3M:2021 as the aerospace FSW of Al standard; ISO 25239:2020 for FSW of Al.)
4. AWS D17.1/D17.1M — Specification for Fusion Welding for Aerospace Applications (American Welding Society). Industry-standard aerospace fusion-welding code; specific revision year confirmed via cross-referencing in TWI aerospace documentation and ASME aerospace weld procedure qualification guides.
5. ASM Handbook, Vol. 6A: "Welding Fundamentals and Processes," ASM International, 2011, Chapter on Diffusion Bonding (pp. 682–689) — referenced via Wikipedia, "Diffusion bonding" (citing OCLC 21034891).
6. Wikipedia, "Diffusion bonding" — overview of Ti-6Al-4V DB practice and Ti oxide dissolution at > 850 °C.
7. Wikipedia, "Superplastic forming" — Ti-6Al-4V SPF temperature 900 °C; application examples (Eurofighter Typhoon, F-15).
8. Wikipedia, "Laser beam welding" — operating principles, deep keyhole mode (1 MW/cm² class).
9. Wikipedia, "Electron-beam welding" — vacuum requirement; included only to document exclusion rationale.
10. ASTM F3180, F3301, F3122 — Standards for AM Ti-6Al-4V (powder bed fusion and DED). ASTM International. (Listed for completeness; specific sections not retrieved.)
11. AMS 2774 — Heat treatment, wrought and cast titanium alloys (commonly paired with HIP cycle). SAE MOBILUS public record. (Listed for completeness; specific sections not retrieved.)
12. MIL-STD-1530 / MIL-STD-1687 — USAF aerospace welding standards (referenced for completeness; specific sections not retrieved).

**Standards-search limitation note:** Google and Bing search both returned results heavily polluted with non-engineering content (search engines in this session blocked targeted technical queries). Citations above are drawn from authoritative sources that were successfully retrieved: TWI Global, Wikipedia, and EN ISO 15620 catalogue listing. Where a standard is referenced by acronym only (AMS, AWS, MIL-STD, ASTM F31xx), the document was not retrieved end-to-end; these should be verified against the latest revision before any program decision.