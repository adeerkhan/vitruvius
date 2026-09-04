# NEC (NFPA 70) — National Electrical Code

## Scope

The US standard for electrical wiring and equipment installation. Covers
conductors, raceways, overcurrent protection, grounding, motors, lighting,
and special occupancies (hazardous locations, healthcare, data centers,
renewable energy). Adopted by reference into most US state and local building
codes. Unlike structural standards, the NEC is freely available to *view* via
the NFPA website (registration required) but not to download or quote at
length.

## Edition history

| Edition | Year | Notable changes |
|---|---|---|
| NEC 2017 | 2017 | GFCI expansion, AFCI updates, energy storage provisions |
| NEC 2020 | 2020 | EV charging expansion, emergency disconnect (solar), GFCI expansion |
| NEC 2023 | 2023 | Latest widely-adopted; microgrid provisions, updated surge protection |
| NEC 2026 | 2026 | In development; will be adopted by future IBC editions |

Always confirm the edition — local jurisdictions adopt with a lag (some still
enforce NEC 2017 or 2020).

## Access

- **Free online view:** NFPA provides free read-only access at
  https://www.nfpa.org/70 (registration required). You CANNOT download or
  quote extensively — use it to verify section numbers and then cite.
- **Paywalled:** PDF/download requires purchase.
- **No API.**
- **Citation fallback:** Cite by Article + section + edition.

## Organization (NEC 2023)

| Chapter | Title | What it covers |
|---|---|---|
| 1 | General | Scope, definitions, enforcement |
| 2 | Wiring and Protection | Circuits, overcurrent protection, grounding, surge protection |
| 3 | Wiring Methods and Materials | Conduit, cable, raceway, box fill |
| 4 | Equipment for General Use | Switches, receptacles, luminaires, heaters, motors |
| 5 | Special Occupancies | Hazardous locations, healthcare, data centers, theaters, RV parks |
| 6 | Special Equipment | Elevators, IT equipment, fire pumps, solar PV, EV charging, energy storage |
| 7 | Special Conditions | Emergency systems, fire alarms, low-voltage, microgrids |
| 8 | Communications Systems | Telephone, CATV, network-powered broadband |
| 9 | Tables | Conduit fill, conductor properties, ampacity tables |

Annexes: Annex A (informative references), Annex B (engineering calculations),
Annex C (conduit fill), Annex D (example calculations), Annex E (types of
construction), Annex F (availability), Annex G (Tier B administration).

## Key articles for common checks

| Check | Article | Notes |
|---|---|---|
| Circuit ampacity / wire sizing | 310.16 (ampacity tables), 210.19 (branch circuits) | Conductor sizing for load |
| Overcurrent protection | 240 (fuses/breakers), 210.20 (branch circuit OCPD) | OCPD rating vs conductor ampacity |
| Grounding / bonding | 250 (grounding and bonding) | Central grounding article; extensive |
| GFCI protection | 210.8 (locations requiring GFCI) | Expanded in 2020/2023 |
| AFCI protection | 210.12 (arc-fault protection) | Dwelling unit requirements |
| Motor circuits | 430 (motors, motor circuits, controllers) | FLC tables, overload, short-circuit, GFPE |
| Solar PV (photovoltaic) | 690 (solar PV systems) | Rapid shutdown, disconnect, labeling |
| Energy storage | 706 (energy storage systems) | Batteries, ESS installation |
| EV charging | 625 (electric vehicle charging) | Load calculations, disconnect |
| Hazardous locations | 500–516 (classified locations) | Class I/II/III, Division or Zone |
| Data centers | 645 (IT equipment) | Underfloor, branch circuits, UPS |

## Mandatory-language conventions

- **"shall"** — mandatory (enforceable by the AHJ — Authority Having Jurisdiction)
- **"shall not"** — mandatory prohibition
- **"should"** — recommended (advisory)
- **"may"** — permitted (optional)
- **Fine Print Notes (FPN)** — informational, not enforceable
- **Ex Informative annexes** — not part of the enforceable code

## The three-step grounding check

For any electrical design question involving grounding, verify all three:

1. ** grounding electrode system** (Article 250, Part III) — what connects to
   earth (ground rods, ufer, metal water pipe)
2. **equipment grounding conductor** (Article 250, Part VI) — the green/bare
   wire that fault current returns on
3. **grounded (neutral) conductor** (Article 250, Part II) — the white/gray
   current-carrying neutral

Confusing these three is the most common electrical engineering error.

## Known conflicts and cross-checks

| Conflicts with | Issue |
|---|---|
| IEEE 1547 | Distributed energy resources (solar, storage) interconnection. NEC Art. 690/706 cover installation; IEEE 1547 covers utility interconnection. Both apply. |
| IEEE 519 | Harmonic control. NEC does not limit harmonics; IEEE 519 does. Complementary. |
| UL standards | Equipment listing. NEC requires listed equipment; UL provides the listing standards (UL 508A for control panels, UL 1741 for inverters, etc.). |
| Local amendments | Many jurisdictions amend the NEC (e.g., California, New York City). Check local amendments. |
| State electrical codes | Some states have their own electrical code that differs from NEC. Check the state. |

## Jurisdiction notes

- **US (general):** NEC is adopted by most states and localities, often with
  amendments and a lag (jurisdiction may enforce NEC 2020 while NEC 2023 is
  latest).
- **California:** CEC (California Electrical Code) is based on NEC with CA
  amendments (e.g., Title 24 energy requirements).
- **When the AHJ matters:** The Authority Having Jurisdiction (building
  inspector, electrical inspector) interprets and enforces the code. Their
  interpretation governs when the code text is ambiguous.

## When to use

Use this reference when the research question involves:
- Wire sizing, circuit ampacity, or overcurrent protection
- Grounding and bonding
- Solar PV, energy storage, or EV charging installation
- Motor circuits or motor protection
- Hazardous location classification
- GFCI / AFCI requirements

Do NOT use for: utility-scale interconnection standards (use IEEE 1547),
electromagnetic compatibility (use IEEE 519 / FCC Part 15), or product safety
testing (use UL standards).
