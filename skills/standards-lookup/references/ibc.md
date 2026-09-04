# IBC — International Building Code

## Scope

The model building code adopted by most US jurisdictions. It does NOT contain
structural design equations — instead it adopts material standards (AISC 360,
ACI 318, NDS, TMS 402) by reference and adds building-planning requirements
(heights, areas, egress, fire resistance, accessibility). Structural engineers
use it to determine: which material standard applies, height/area limits,
fire-resistance ratings, and seismic design category triggers.

## Edition history

The IBC is on a 3-year cycle. Each edition adopts newer versions of the
referenced standards:

| IBC Edition | Referenced ASCE 7 | Referenced AISC 360 | Referenced ACI 318 |
|---|---|---|---|
| IBC 2021 | ASCE 7-16 | AISC 360-16 | ACI 318-19 |
| IBC 2024 | ASCE 7-22 | AISC 360-22 | ACI 318-25 |

Always pair the IBC edition with its referenced standards — do not mix IBC
2021 with AISC 360-22 without checking for conflicts.

## Access

- **Free (online):** The ICC (International Code Council) provides free online
  access to the full IBC text at https://codes.iccsafe.org. This is the
  single most accessible US engineering standard.
- **Paywalled:** PDF download requires purchase.
- **No API** but the free online viewer is searchable.

## Organization

| Chapter | Title | What it covers |
|---|---|---|
| 1–2 | Administration, Definitions | Scope, terms |
| 3 | Occupancy classification | A (assembly), B (business), E (educational), F (factory), H (high-hazard), I (institutional), M (mercantile), R (residential), S (storage), U (utility) |
| 4 | Special detailed requirements | Atriums, high-rise, underground, motor vehicle |
| 5 | General building heights/areas | Height and area limits by construction type and occupancy |
| 6–7 | Types of construction | Type I–V construction; fire-resistance ratings |
| 8–9 | Interior finishes, fire protection | Flame spread, sprinklers, alarms |
| 10 | Means of egress | Exit width, travel distance, number of exits |
| 11 | Accessibility | ADA compliance |
| 12–14 | Interior environment, exterior walls, roof | — |
| 15 | Roof construction | — |
| 16 | Structural design | Load combinations (adopts ASCE 7), live loads, snow, wind, seismic |
| 17 | Special inspections | Testing and inspection requirements |
| 18 | Soils and foundations | Geotechnical, retaining walls |
| 19–23 | Concrete, steel, wood, masonry, glass | Adopts ACI 318, AISC 360, NDS, TMS 402 by reference |
| 24–26 | Glass, gypsum, plastic | — |
| 27–29 | Electrical, plumbing, mechanical | Adopts NEC, IPC, IMC |
| 30 | Elevators | — |
| 31–33 | Special construction, existing buildings | — |
| 35+ | Referenced standards | Full list of adopted standards |

## Key sections for common checks

| Check | Section | Notes |
|---|---|---|
| Height and area limits | §504 (height), §506 (area) | By occupancy + construction type; sprinkler increases allowed |
| Construction types | §601–603 | Type I–V; fire-resistance ratings for structural frame |
| Fire-resistance ratings | Table 601 | Structural frame, bearing walls, floor/roof construction |
| Structural loads | §1604–1612 | Adopts ASCE 7; live load table §1607 |
| Seismic design category | §1613 | Adopts ASCE 7 seismic |
| Means of egress | §1004–1029 | Occupant load, exit width, common path, travel distance |
| Accessibility | Ch. 11 / ICC A117.1 | ADA reach ranges, door clearances, ramp slopes |

## When to use IBC vs the material standards

- **Use IBC** for: height/area limits, occupancy classification, fire ratings,
  egress, accessibility, and determining WHICH material standard applies.
- **Use AISC 360 / ACI 318 / NDS / TMS 402** for: actual structural design
  (member sizing, connection design, reinforcement detailing).
- **Use ASCE 7** for: load determination (wind, seismic, snow).

The IBC does not replace the material standards — it references them. A
structural engineer needs both.

## Known conflicts and cross-checks

| Conflicts with | Issue |
|---|---|
| State building codes | Many states amend the IBC (California CBC, Florida BC, New York City BC). State amendments govern over the base IBC. |
| NFPA 5000 | Alternative building code (NFPA). Some jurisdictions adopt NFPA instead of IBC. |
| Local amendments | Cities/counties may amend height limits, fire zones, or seismic requirements. Always check the adopting jurisdiction. |

## Jurisdiction notes

- **US (general):** IBC is adopted by most states and localities, often with
  state-specific amendments. Check the local building department for the
  adopted edition and amendments.
- **California:** CBC (California Building Code) is based on IBC with CA
  seismic and accessibility amendments.
- **Florida:** FBC (Florida Building Code) is based on IBC with Florida wind
  and hurricane amendments.
- **International:** Not used outside the US. Other countries use their own
  building codes (NBCC Canada, BCA Australia, etc.).
