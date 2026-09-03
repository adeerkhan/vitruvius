---
name: civil
description: >
  Civil and structural engineering research. Use when the user invokes
  /civil or asks about civil/structural engineering topics — buildings and
  bridges, steel/concrete/timber/masonry structures, foundations and
  geotech, seismic and wind design, transportation, water resources — or
  asks to verify a structural claim. Dispatches to the shared
  engineering-research method with the civil evidence landscape.
argument-hint: "<research question>"
license: MIT
---

# Civil / Structural Engineering Research

Activate the `/skill:engineering-research` method and run it with this
domain payload. Do not restate the research loop here.

## Evidence landscape

- **Codes/standards:** AISC 360 (steel), ACI 318 (concrete), NDS (timber),
  TMS 402 (masonry), ASCE 7 (loads), AASHTO (bridges), IBC, and the
  governing jurisdiction's adopted code. When a code governs, cite the exact
  section — and check which **edition** the question's jurisdiction has
  adopted.
- **Primary sources:** code commentary, official design guides from the
  issuing body, geotech reports, manufacturer/connector ICC-ES reports,
  peer-reviewed structural literature.
- **Prior art / practice:** documented failures and forensic studies, post-
  earthquake/storm reconnaissance reports, trade association guidance.

## Verification criteria

- **Code provisions:** verify the standard exists, read the actual provision,
  and cite section + edition. Do not summarize a provision from memory or a
  title.
- **Loads:** every load must state its basis (ASCE 7 chapter, code section)
  and combination; units and direction must be explicit.
- **Sign conventions:** compression vs tension, moment direction, global vs
  local axes.
- **Material properties:** trace to a named grade + governing spec (e.g. Gr.
  50 per ASTM A992, f'c per ACI 318).
- **Design values:** factors (phi, omega, LRFD/SFD) must be stated and traced
  to code, not assumed.
- **Geotech:** any soil parameter must be marked `verified` (from a real
  report/standard) or `inferred` (assumed) — never laundered into fact.
- **Calculations:** show formula, inputs, and units so the check can be
  re-run.

## Deliverable shape

Follow the method's artifact contract. In the final artifact, end with a
**Sources** section citing code + section + edition for every governing
provision, and mark loads, factors, and material properties `verified`,
`inferred`, or `blocked`.
