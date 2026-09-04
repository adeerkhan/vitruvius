# Eurocode — European Standards for Structural Design

## Scope

The European family of structural design standards (EN 1990–EN 1999), used
across the EU and adopted by many non-EU countries. Governs structural
steel, concrete, timber, masonry, aluminum, geotechnics, and seismic design
in Europe. Unlike US standards, Eurocodes use partial-factor safety formats
(that differ from US LRFD/ASD) and require National Annexes for
country-specific parameters.

## The Eurocode suite

| Reference | Title | US equivalent |
|---|---|---|
| EN 1990 (Eurocode 0) | Basis of structural design | ASCE 7 (loads) + design philosophy |
| EN 1991 (Eurocode 1) | Actions on structures | ASCE 7 |
| EN 1992 (Eurocode 2) | Design of concrete structures | ACI 318 |
| EN 1993 (Eurocode 3) | Design of steel structures | AISC 360 |
| EN 1994 (Eurocode 4) | Design of composite steel-concrete structures | AISC 360 Ch. I |
| EN 1995 (Eurocode 5) | Design of timber structures | NDS |
| EN 1996 (Eurocode 6) | Design of masonry structures | TMS 402 |
| EN 1997 (Eurocode 7) | Geotechnical design | State DOT / FHWA |
| EN 1998 (Eurocode 8) | Design of structures for earthquake resistance | ASCE 7 seismic + AISC 341/ACI 318 Ch. 18 |
| EN 1999 (Eurocode 9) | Design of aluminum structures | ADM |

## National Annexes

Each EU country publishes a National Annex that sets Nationally Determined
Parameters (NDPs): partial factors (γ), combination factors (ψ), seismic
zones, wind maps, snow maps, etc. EN 1993 alone is incomplete without the
National Annex for the project country.

When a Eurocode question arises, always ask: **which country's National
Annex?** The same Eurocode clause produces different designs in Germany vs
Italy vs UK due to different NDPs.

## Access

- **Free (varies):** Some countries publish Eurocodes free (e.g., via
  national standards bodies). CEN (European Committee for Standardization)
  sells them. Many universities provide access.
- **National Annexes:** Often free from the national standards body (e.g.,
  BSI in UK, DIN in Germany, AFNOR in France).
- **No API.**
- **Citation fallback:** Cite by EN number + part + National Annex + section.

## Partial-factor format (vs US LRFD/ASD)

Eurocodes use a different safety philosophy than US standards:

| Format | US | Eurocode |
|---|---|---|
| Loads | 1.2D + 1.6L (LRFD) | γG × Gk + γQ × Qk (partial factors on actions) |
| Resistance | φRn (resistance factor) | Rd = Rk / γM (partial factor on material) |
| Combined | LRFD or ASD | Equation 6.10 (or 6.10a/6.10b) |

The Eurocode partial factors (γG = 1.35, γQ = 1.5, γM0 = 1.0, γM1 = 1.0,
γM2 = 1.25 for steel) are NOT interchangeable with US φ-factors. Do not
mix Eurocode load factors with AISC 360 resistance factors.

## Key sections for common checks (EN 1993 steel)

| Check | Section | Notes |
|---|---|---|
| Cross-section classification | §5.5 | Class 1–4 (plastic to slender), analogous to AISC compact/noncompact |
| Tension | §6.2.3 | Nt,Rd = Afy / γM0 |
| Compression (flexural buckling) | §6.3.1 | χ reduction factor, buckling curves a0–d (analogous to AISC column curve) |
| Flexure | §6.2.5 | Mc,Rd = Wpl,y × fy / γM0 (plastic) |
| Shear | §6.2.6 | Vpl,Rd = Av × (fy/√3) / γM0 |
| Lateral-torsional buckling | §6.3.2 | χLT reduction factor |
| Connections | EN 1993-1-8 | Bolts, welds |

## Known conflicts and cross-checks

| Conflicts with | Issue |
|---|---|
| US standards (AISC, ACI) | Different safety philosophies. Do not mix Eurocode load factors with US φ-factors. |
| National standards | Some countries retain national standards alongside Eurocodes during transition. |
| BS (legacy) | UK legacy standards (BS 5950, BS 8110) are withdrawn but still referenced in existing structures. |

## Jurisdiction notes

- **EU member states:** Eurocodes are mandatory for public works and widely
  adopted for private construction. Each country has a National Annex.
- **UK post-Brexit:** UK still uses Eurocodes (BS EN) but publishes its own
  National Annexes via BSI. UK National Annexes diverge from EU over time.
- **Non-EU countries:** Many adopt Eurocodes (Norway, Switzerland, Turkey,
  Middle East, parts of Africa/Asia). Check the local adoption status.
- **US projects:** Eurocodes are NOT used for US building design unless the
  project specification explicitly calls for them (e.g., EU-funded project
  built in the US, or international client).

## When to use

Use this reference when the research question involves:
- European structural design (steel, concrete, timber, masonry, aluminum)
- International projects requiring Eurocode compliance
- Comparing US and European design approaches
- National Annex parameters (partial factors, maps)

Do NOT use for: US building design (use AISC/ACI/ASCE 7), US bridge design
(use AASTO), or when the project specification designates US standards.
