# NDS — National Design Specification for Wood Construction

## Scope

The US standard for wood structural design: sawn lumber, glued-laminated
timber (GLT), cross-laminated timber (CLT), timber poles, timber piles, and
wood connections. Published by the American Wood Council (AWC). Referenced
by the IBC for wood structures.

## Edition history

| Edition | Year | Notable changes |
|---|---|---|
| NDS 2015 | 2015 | Previous widely-adopted |
| NDS 2018 | 2018 | CLT provisions added |
| NDS 2021 | 2021 | Current widely-adopted |
| NDS 2024 | 2024 | Latest |

Always confirm the edition — design values and adjustment factors change.

## Access

- **Free preview:** AWC provides the table of contents and selected sections
  free. The full NDS requires purchase.
- **Free companion:** AWC publishes free design aids (Span Tables, Connection
  Design Aids) at https://awc.org.
- **Paywalled:** Full NDS document requires purchase.
- **No API.**
- **Citation fallback:** Cite by chapter + table + edition.

## Organization (NDS 2021)

| Chapter | Title | What it covers |
|---|---|---|
| 1 | General | Scope, design methodology (LRFD/ASD), reference design values |
| 2 | Sawn Lumber | Visually graded, machine-graded, design values |
| 3 | Structural Glued Laminated Timber | GLT design values and adjustment factors |
| 4 | Round Timber Poles and Piles | Pole and pile design |
| 5 | Prefabricated Wood I-Joists | I-joist design (manufacturer-specific) |
| 6 | Structural Composite Lumber | LVL, PSL, LSL design values |
| 7 | Cross-Laminated Timber | CLT design (newer addition) |
| 8 | Connections | Bolts, nails, screws, lag screws, timber rivets, shear plates |
| 9 | Shear Walls and Diaphragms | Wood-frame shear wall and diaphragm design |
| 10 | Special Loading Conditions | Fire design, ponding, cross-grain bending |

## Key design values and adjustment factors

Wood design uses reference design values adjusted by factors. The core
equation (simplified):

```
Design value = Reference value × (product of applicable CM, Ct, CL, CF, Cfu, Ci, Cr, CP, ...)
```

Key adjustment factors:

| Factor | Symbol | What it adjusts for |
|---|---|---|
| Wet service | CM | Moisture content > 19% |
| Temperature | Ct | Sustained high temperature |
| Beam stability | CL | Lateral-torsional buckling (beams) |
| Size | CF | Member size effect (larger = lower strength) |
| Flat use | CFu | Load applied to flat face vs edge |
| Incising | Ci | Pressure-treated wood (incised) |
| Repetitive member | Cr | Closely spaced members (2–4" o.c., 3+ members) |
| Column stability | CP | Column buckling |
| Load duration | CD | Short-term loads (wind, seismic, impact) |

The CP (column stability) factor is the most commonly missed — it reduces
the compressive strength for slender columns, analogous to AISC 360's column
buckling curve.

## Mandatory-language conventions

- **"shall"** — mandatory
- **"should"** — recommended
- **"may"** — permitted
- **Commentary** — explanatory, not enforceable

## Companion standards (AWC)

| Standard | Title | Access |
|---|---|---|
| SDPWS | Special Design Provisions for Wind and Seismic | Free (awc.org) |
| WFCM | Wood Frame Construction Manual | Free (awc.org) |
| NDS Supplement | Design Values for Wood Construction | Paywalled (in NDS purchase) |

The SDPWS (wind/seismic) and WFCM (prescriptive residential) are FREE and
useful for research questions about wood-frame lateral design.

## Known conflicts and cross-checks

| Conflicts with | Issue |
|---|---|
| AISC 360 | Steel vs wood. Different materials, different codes. Do not mix design values. |
| ACI 318 | Concrete vs wood. Same — different materials. |
| TMS 402 | Masonry vs wood. Different materials. |
| ASCE 7 | Loads on wood structures. NDS uses ASCE 7 loads. |

## Jurisdiction notes

- **US (general):** NDS is referenced by the IBC for wood structures.
- **Canada:** CSA O86 governs, not NDS.
- **CLT:** NDS 2018+ includes CLT; earlier editions do not. Verify edition
  when CLT is involved.
- **Fire design:** NDS Chapter 10 covers fire design (char rate calculations).
  IBC Chapter 7 also applies.

## When to use

Use this reference when the research question involves:
- Sawn lumber, GLT, CLT, LVL, PSL, or LSL design
- Wood connections (bolts, nails, screws)
- Wood-frame shear walls or diaphragms
- Timber pole or pile design
- Wood adjustment factors (especially CP for column stability)

Do NOT use for: steel design (AISC 360), concrete design (ACI 318), or
structural loads (ASCE 7).
