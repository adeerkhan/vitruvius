---
name: architectural
description: >
  Architectural research. Use when the user invokes /architectural or asks
  about architectural topics — building design and building science, facade
  and enclosure systems, materials and assemblies, codes and accessibility,
  environmental performance, historic and contemporary precedents — or asks
  to verify an architectural claim. Dispatches to the shared
  engineering-research method with the architectural evidence landscape.
argument-hint: "<research question>"
allowed-tools: Write Edit Bash
license: MIT
---

# Architectural Research

Activate the `/skill:engineering-research` method and run it with this
domain payload. Do not restate the research loop here.

## Evidence landscape

- **Codes/standards:** IBC, local adopted building codes, ADA/ABA, NFPA
  (life safety), ASHRAE (comfort/envelope), ASTM (materials), AIA
  documents. Cite section + edition, and check which edition the
  jurisdiction has adopted.
- **Primary sources:** code text and commentary, manufacturer data sheets and
  ICC-ES/Product-specific evaluation reports for assemblies, material
  property data from the issuing body, peer-reviewed building-science
  literature.
- **Prior art / practice:** documented building failures and enclosure
  forensics, post-disaster reconnaissance, trade association guidance (e.g.
  NIBS, building-science organizations), well-documented built precedents.

## Verification criteria

- **Code provisions:** verify the standard exists and read the actual
  provision; cite section + edition. Do not summarize a provision from
  memory.
- **Assembly claims:** an assembly (wall, roof, glazing) must trace to a
  named system + evaluation report or manufacturer data, not a generic
  "a curtain wall".
- **Units and conventions:** every number carries a unit (R-value vs U-value
  — know which), and the unit system is explicit.
- **Performance values:** thermal, acoustic, fire, and structural values must
  trace to a named standard/test method (ASTM C518, ASTM E90, NFPA 285, ...)
  and the result that test produced.
- **Precedent claims:** a building's attributes must be checkable against a
  named source (architect's record, journal, official project data) — do not
  infer a building's systems from a photo.
- **Sign conventions / orientation:** north arrows, sun paths, and floor
  levels must be explicit when a claim depends on them.

## Deliverable shape

Follow the method's artifact contract. In the final artifact, end with a
**Sources** section citing code + section + edition and named assemblies +
evaluation reports, marking performance values `verified`, `inferred`, or
`blocked`.
