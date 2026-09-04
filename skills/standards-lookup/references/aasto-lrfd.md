# AASTO LRFD — Bridge Design Specifications

## Scope

The US standard for highway bridge design. Covers steel bridges, concrete
bridges, timber bridges, and bridge foundations. Uses LRFD (Load and
Resistance Factor Design) with load factors and resistance factors that
differ from building design (ASCE 7 / AISC 360). Mandatory for federally
funded bridges; adopted by all US state DOTs (often with state-specific
modifications).

## Access

- **Paywalled:** Full document requires AASTO purchase.
- **Free companions:** Many state DOTs publish free bridge design manuals
  that parallel AASTO (e.g., Caltrans BDM, TxDOT BDM, WSDOT BDM). FHWA
  publishes free bridge manuals.
- **No API.**
- **Citation fallback:** Cite by section + edition.

## Organization (AASTO LRFD 9th Ed.)

| Section | Title | What it covers |
|---|---|---|
| 1 | Introduction | Scope, definitions, design philosophy |
| 2 | General design and location features | Bridge width, clearance, geometrics |
| 3 | Loads and load factors | Vehicular live load (HL-93), wind, thermal, braking, centrifugal |
| 4 | Structural analysis and evaluation | Analysis methods, load distribution |
| 5 | Concrete structures | Reinforced and prestressed concrete bridges |
| 6 | Steel structures | Steel girder, truss, arch, and cable bridges |
| 7 | Aluminum structures | Aluminum bridges (rare) |
| 8 | Wood structures | Timber bridges |
| 9 | Decks and deck systems | Bridge deck design, overlays |
| 10 | Foundations and retaining walls | Spread footings, driven piles, drilled shafts, abutments |
| 11 | Bearings and expansion joints | Bearing design, joint systems |
| 12 | Railings, signing, and lighting | Bridge appurtenances |
| 13 | Seismic design | Seismic analysis and detailing for bridges |
| 14 | Buried structures | Culverts, buried bridges |
| 15 | Railing and signing | — |

## Key differences from building design (AISC 360 / ACI 318)

| Topic | Buildings (AISC/ACI) | Bridges (AASTO) | Why it matters |
|---|---|---|---|
| Live load | ASCE 7 occupancy loads | HL-93 (design truck + lane load) | Bridge live load is heavier and different pattern |
| Load factors | 1.2D + 1.6L | Different factors per limit state | Do not mix building and bridge load factors |
| Fatigue | AISC App. 3 (limited) | AASTO Section 6.6 (extensive) | Bridge girders see millions of load cycles |
| Resistance factors | AISC/ACI φ-factors | AASTO resistance factors (different values) | Do not mix φ-factors across codes |
| Bearings | AISC 360 (basic) | AASTO Section 11 (extensive) | Bridge bearings are critical and complex |

## HL-93 live load

The standard AASTO bridge live load consists of:
- **Design truck:** 8 kips–32 kips–32 kips axles (spacing varies)
- **Design tandem:** Two 25-kip axles at 4 ft spacing
- **Design lane load:** 0.64 klf uniform load

The controlling case (truck or tandem + lane) varies by span length and
component.

## Known conflicts and cross-checks

| Conflicts with | Issue |
|---|---|
| AISC 360 | Steel bridge design uses AASTO Section 6, not AISC 360. AISC 360 governs buildings; AASTO governs bridges. |
| ACI 318 | Concrete bridge design uses AASTO Section 5, not ACI 318. |
| State DOT specs | State DOTs modify AASTO (Caltrans, TxDOT, etc.). State specs govern for state projects. |
| FHWA manuals | FHWA bridge manuals (free) often parallel AASTO and are acceptable for research. |

## Jurisdiction notes

- **US (federal):** AASTO LRFD is mandatory for federally funded bridges.
- **State DOTs:** All 50 states adopt AASTO, often with state-specific
  modifications. Check the state DOT bridge design manual.
- **Canada:** CSA S6 (Canadian Highway Bridge Design Code) governs, not AASTO.
- **International:** Eurocode 3 (steel) and Eurocode 2 (concrete) for bridges
  in Europe.

## When to use

Use this reference when:
- Designing highway bridges (steel, concrete, timber).
- Determining bridge live load (HL-93).
- Designing bridge foundations or abutments.
- Checking bridge fatigue.
- Referencing bridge bearings or expansion joints.
