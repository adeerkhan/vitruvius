# AWS D1.1 — Structural Welding Code — Steel

## Scope

The US standard for structural welding of carbon and low-alloy steel. Covers
welded connections for buildings, bridges, and other structures. Specifies
welding processes, filler metals, preheat, weld quality, inspection, and
welder qualification. Referenced by AISC 360, AASTO LRFD, and most US
structural designs.

## Access

- **Paywalled:** Full document requires AWS purchase.
- **No API.**
- **Citation fallback:** Cite by clause + edition.

## Key provisions

| Topic | Clause | Notes |
|---|---|---|
| Base metal | §2 | Acceptable steels (A36, A572, A992, etc.) |
| Welding processes | §4 | SMAW, GMAW, FCAW, SAW — process selection |
| Welded joint types | §3 | Complete joint penetration (CJP), partial joint penetration (PJP), fillet |
| Preheat and interpass | §3.5, §5 | Preheat based on material thickness and carbon equivalent |
| Weld quality and defects | §6 | Acceptable vs unacceptable weld discontinuities |
| Inspection | §6 | Visual, MT, PT, UT, RT acceptance criteria |
| Welder qualification | §4.12 | WPS and welder performance qualification |
| Tack welds | §3.12 | Requirements for tack welds |

## Critical distinction: CJP vs PJP vs fillet

| Joint type | Strength | When to use |
|---|---|---|
| CJP groove weld | Full base metal strength | Moment connections, tension splices, full-strength connections |
| PJP groove weld | Partial strength | Compression members, shear connections where full strength not needed |
| Fillet weld | Per inch of length | Shear connections, bracing, most simple connections |

Misidentifying the required joint type is a common structural welding error.

## Known conflicts and cross-checks

| Conflicts with | Issue |
|---|---|
| AISC 360 Ch. J | Connection design. AISC 360 references AWS D1.1 for weld procedures. |
| AASTO LRFD | Bridge welding. AASTO may have additional requirements beyond AWS D1.1. |
| AWS D1.5 | Bridge welding code. Do not mix D1.1 (buildings) and D1.5 (bridges). |
| AISC 341 | Seismic welding. Additional toughness and prequalification requirements for seismic. |

## When to use

Use this reference when:
- Designing welded structural connections.
- Specifying weld type (CJP, PJP, fillet) and size.
- Determining preheat requirements.
- Specifying weld inspection or acceptance criteria.
- Qualifying welders or welding procedures.
