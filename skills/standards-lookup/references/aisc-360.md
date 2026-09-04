# AISC 360 — Specification for Structural Steel Buildings

## Scope

The central US specification for structural steel building design. Covers
members, connections, and stability for steel structures. Mandatory language
("shall") is enforceable; commentary is explanatory only.

## Edition history

| Edition | Year | Notable changes |
|---|---|---|
| AISC 360-05 | 2005 | Major rewrite from LRFD 3rd ed. |
| AISC 360-10 | 2010 | Stability chapter rewrite (Appendix 7 → Ch. C) |
| AISC 360-16 | 2016 | Current widely-adopted edition; new HSS provisions, updated connection chapter |
| AISC 360-22 | 2022 | Latest; updated seismic, new composite provisions, revised slender-element limits |

Always confirm which edition the project uses — provisions differ (e.g.,
slender-element width-thickness ratios changed between -16 and -22).

## Access

- **Free preview:** AISC.org provides selected sections and the full table of
  contents free. Some design examples and guides are open.
- **Paywalled:** Full document requires purchase (AISC member discount available).
- **No public API.** Retrieval is manual or via institutional access.
- **Citation fallback:** Cite by section + edition; user locates in their copy.

## Organization (AISC 360-16 / -22)

Chapters by limit state:

| Chapter | Title | What it covers |
|---|---|---|
| A | General Provisions | Scope, definitions, referenced standards |
| B | Design Requirements | LRFD/ASD, load combinations (refers to ASCE 7), stability |
| C | Design for Stability | Direct Analysis Method, effective length, notional loads |
| D | Design of Members for Tension | Yielding, rupture, block shear |
| E | Design of Members for Compression | Column buckling (flexural, torsional, flexural-torsional) |
| F | Design of Members for Flexure | Beams, lateral-torsional buckling, compact/noncompact |
| G | Design of Members for Shear | Web shear, tension field action |
| H | Design of Members for Combined Forces | Interaction equations (H1, H2, H3) |
| I | Design of Composite Members | Composite beams, columns, shear connectors |
| J | Design of Connections | Welds, bolts, connection elements, shear connections, moment connections |
| K | Design of HSS and Box-Section Connections | HSS-specific connection provisions |
| L | Serviceability | Deflection, vibration, drift, ponding |
| M | Fabrication, Erection, and Quality | Shop/field requirements, QA/QC |

## Key sections for common checks

| Check | Section | Notes |
|---|---|---|
| Column axial compression | §E3 (flexural buckling), §E4 (torsional), §E7 (built-up) | KyLy governs; use the LOWER φcPn across all unbraced lengths |
| Beam flexure (major axis) | §F2 (compact), §F3 (noncompact), §F4 (slender) | Lb vs Lp/Lr determines LTB reduction |
| Beam shear | §G2 | Web shear; tension field in some cases |
| Combined loading | §H1 | Interaction equations for column-beam behavior |
| Bolted connections | §J3 | Bolt types, spacing, edge distance, bearing |
| Welded connections | §J2 | Fillet, groove, effective throat |
| Serviceability / deflection | §L3 | Live-load deflection limits (typically L/360) |
| Stability analysis | §C2 | Direct Analysis Method, K-factors |

## Mandatory-language conventions

- **"shall"** — mandatory (the enforceable requirement)
- **"shall not"** — mandatory prohibition
- **"should"** — recommended (advisory)
- **"may"** — permitted (optional)
- **Commentary** — explanatory text in a separate section after each chapter;
  NOT enforceable. Cite as "AISC 360-16, Commentary §F2-1" when referencing.

## Known conflicts and cross-checks

| Conflicts with | Issue |
|---|---|
| AASTO LRFD | Bridge steel design uses different load factors, fatigue categories, and resistance factors. AISC governs buildings; AASTO governs bridges. |
| AISC 341 | Seismic provisions supplement AISC 360 for high-seismic regions. When both apply, AISC 341 governs seismic detailing. |
| ASCE 7 | AISC 360 references ASCE 7 for load combinations. Do not use ASCE 7-16 loads with AISC 360-22 without checking the reference edition. |
| Eurocode 3 (EN 1993) | Different design philosophy (buckling curves vs. AISC equations). Not interchangeable. |

## Jurisdiction notes

- **US (general):** AISC 360 is referenced by the IBC for steel structures.
  The applicable edition is the one adopted by the local building code cycle
  (IBC 2021 references AISC 360-16; IBC 2024 references AISC 360-22).
- **California:** CBC adopts AISC 360 with California amendments. Caltrans
  uses AASTO for state bridges.
- **Canada:** CSA S16 governs, not AISC. Do not substitute.
- **Seismic regions:** AISC 341 (or AISC 370 for stainless) supplements AISC
  360. Both apply.
