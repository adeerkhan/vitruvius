# ASCE 7 — Minimum Design Loads and Associated Criteria for Buildings and Other Structures

## Scope

The US standard for determining design loads: dead, live, snow, wind,
earthquake, rain, ice, and flood. Adopted by reference into the IBC. Almost
every structural design in the US starts here for load determination.

## Edition history

| Edition | Year | Notable changes |
|---|---|---|
| ASCE 7-05 | 2005 | Previous widely-adopted |
| ASCE 7-10 | 2010 | Wind speed map update |
| ASCE 7-16 | 2016 | Current widely-adopted; new wind chapter, updated seismic maps |
| ASCE 7-22 | 2022 | Latest; new tsunami chapter, updated snow/wind maps, new seismic |

Wind and seismic maps change between editions — a site that was Wind Zone
II in -16 may be Zone III in -22. Always confirm the edition.

## Access

- **Free preview:** ASCE provides the table of contents and selected figures
  free. Some provisions are viewable via ASCE Library preview.
- **Paywalled:** Full document requires purchase or ASCE Library subscription.
- **No public API.** Retrieval is manual.
- **Free data:** Hazard data (wind speeds, seismic Ss/S1) is available free via
  the ATC Hazards by Location tool (https://hazards.atcouncil.org) — use this
  to get site-specific load parameters even without the standard.

## Organization (ASCE 7-22)

| Chapter | Title | What it covers |
|---|---|---|
| 1 | Requirements (general) | Scope, definitions, referenced standards |
| 2 | Combinations | LRFD and ASD load combinations |
| 3 | Dead loads | Material densities, fixed equipment |
| 4 | Live loads | Uniform and concentrated, live load reduction |
| 5 | Snow loads | Flat roof, drifted, sliding, rain-on-snow |
| 6 | Rain loads | Ponding, drain clogging |
| 7 | Ice loads | Atmospheric ice |
| 8 | Flood loads | Stillwater, wave, coastal |
| 9 | Soil loads | Lateral earth pressure, groundwater |
| 10 | (reserved) | — |
| 11 | Seismic design criteria | SDC classification, risk category |
| 12 | Seismic building structures | Equivalent lateral force, modal analysis, drift |
| 13 | Seismic nonstructural components | — |
| 14 | Seismic nonbuilding structures | Tanks, stacks, towers |
| 15 | Seismic nonstructural | — |
| 16 | Nonlinear response history | Seismic dynamic analysis |
| 17 | Seismic isolation | Base-isolated structures |
| 18 | Seismic damping systems | Supplemental damping |
| 19 | Soil-structure interaction | — |
| 20 | Site classification | Soil types A–F |
| 21 | Site-specific ground motions | — |
| 22 | Seismic ground motions | USGS seismic maps |
| 23 | (reserved) | — |
| 24 | Wind building structures | Directional procedure, envelope procedure |
| 25 | Wind appurtenances | Rooftop equipment, signs |
| 26 | Wind data | Wind speed maps (Risk Categories I–IV) |
| 27 | Wind directional procedure | Buildings of all heights |
| 28 | Wind envelope procedure | Low-rise buildings |
| 29 | Wind miscellaneous | Open buildings, signs, rooftop structures |
| 30 | Wind nonstructural | Cladding, components |
| 31 | Wind tornado | Tornado loads (new in -22) |
| 32 | Tsunami | Tsunami loads and evacuation (new in -22) |
| 33–42 | Other loads | Rain, ice, flood, combinations, etc. |

## Key sections for common checks

| Check | Section | Notes |
|---|---|---|
| Load combinations | §2.3 (LRFD), §2.4 (ASD) | The starting point for all strength design |
| Live load | §4.3 | Uniform loads by occupancy; reduction per §4.7 |
| Snow load | §7.3–7.6 | Pf = 0.7CeCtIsPg; drifting per §7.7 |
| Wind speed (site) | §26.5, maps in Ch. 26 | Use ATC Hazards by Location for free site lookup |
| Wind pressure (MWFRS) | §27.3–27.4 | GCp/Gh from figures; velocity pressure qz |
| Seismic SDC | §11.6 | Based on Ss, S1, and Risk Category |
| Seismic base shear | §12.8 | Cs = SDS/(R/Ie); equivalent lateral force |
| Seismic drift | §12.8.6 | Drift limits by risk category |
| Flood | §5.1–5.5 | Coastal, stillwater, wave forces |

## Mandatory-language conventions

- **"shall"** — mandatory
- **"should"** — recommended
- **"may"** — permitted
- **Commentary** — separate appendix; not enforceable

## Free alternative: ATC Hazards by Location

Before telling the user they need the ASCE 7 lookup, use the free ATC tool:
- URL: https://hazards.atcouncil.org
- Returns: Ss, S1, Sd1, site class, wind speed, seismic design category
- No API but the web form is queryable; values are authoritative for the
  adopted ASCE 7 edition

## Known conflicts and cross-checks

| Conflicts with | Issue |
|---|---|
| AISC 360 | ASCE 7 provides loads; AISC 360 uses them. Match the editions the IBC adopts. |
| ACI 318 | Same — ASCE 7 loads feed into ACI 318 checks. |
| IBC | IBC adopts ASCE 7 by reference (IBC 2024 = ASCE 7-22). Use the paired edition. |
| Eurocode 1 (EN 1991) | Different load models (wind, snow, seismic). Not interchangeable. |
| State amendments | Some states amend ASCE 7 (e.g., California seismic, Florida wind). Check local amendments. |

## Jurisdiction notes

- **US (general):** ASCE 7 is adopted by the IBC. The applicable edition
  follows the IBC cycle (IBC 2021 → ASCE 7-16; IBC 2024 → ASCE 7-22).
- **California:** CBC adopts ASCE 7 with California seismic amendments.
  Use Caltrans tools for state bridges.
- **Florida:** High-velocity hurricane zone (Vulcan/Central Florida) has
  additional wind requirements beyond ASCE 7.
- **International:** Eurocode 1, NBCC (Canada), AS/NZS 1170 (Australia) govern
  in their jurisdictions.
