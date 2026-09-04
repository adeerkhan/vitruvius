---
name: standards-lookup
description: >
  Find, retrieve, and cite engineering standards provisions reproducibly.
  Use when a claim, design check, or research question requires a specific
  provision from AISC, ACI, ASCE, IEEE, NFPA, ASME, AASTO, Eurocode, IBC, or
  other engineering standard. Selects the authoritative standard, locates the
  section, resolves conflicts between overlapping standards, and returns the
  provision with enough provenance that another engineer can verify it. Do NOT
  use for general engineering knowledge that has no specific standard backing.
argument-hint: "<standard or topic to look up>"
license: MIT
metadata:
  version: "1.0"
  skill-author: "Vitruvius"
---

# Standards Lookup

This skill catalogs the major engineering standards bodies with their
selection logic, section-lookup patterns, access methods, and citation
formats. Your job is to turn the user's engineering question into a
reproducible provision retrieval: select the authoritative standard, locate
the governing section, retrieve or reference the provision text, and return
it with enough provenance that another engineer can verify it.

Engineering standards differ from scientific databases: most are paywalled,
many have no public API, and the same question may be answered differently by
different jurisdictional standards. This skill handles those realities
explicitly.

## Core Workflow

1. **Define the retrieval contract** — Identify the engineering domain
   (structural, mechanical, electrical, civil/geotech, fire, materials), the
   governing jurisdiction (US state, country, or project specification), the
   limit state or check type (strength, serviceability, stability, fire
   resistance, seismic), and whether the user needs the exact provision text
   or a citation is sufficient.

2. **Select authoritative standard(s)** — Use the Standard Selection Guide
   below. Prefer the primary standard for the domain + jurisdiction, then add
   cross-check standards only for conflict resolution or when the project
   specification references multiple. Do not fan out across many standards
   just because they are available.

3. **Determine access method** — Each standard has different access
   constraints. Some have free preview (AISC, ASCE), some require subscription
   (IEEE Xplore, ACI), some are freely available (Eurocode via national
   annexes, some NFPA handbooks), and some have no digital access at all.
   Check the reference file for the selected standard before promising a
   retrieval.

4. **Locate the governing section** — Engineering standards are organized by
   limit state and member type. Use the section-lookup patterns in the
   reference file to navigate: identify the applicable chapter (flexure,
   shear, compression, stability, connections), then the specific provision.
   Distinguish mandatory provisions ("shall") from advisory ("should",
   "may", commentary).

5. **Retrieve or reference the provision** — If free access or preview is
   available, retrieve the provision text directly. If paywalled, cite the
   exact provision with section number, edition, and page (or equivalent)
   so the user can locate it in their copy. Never paraphrase a "shall"
   provision — quote it or flag the paraphrase.

6. **Resolve conflicts explicitly** — When two applicable standards give
   different answers (e.g., AISC vs AASTO for a bridge, or IBC vs ASCE 7 for
   loads), do not silently pick one. Report both, identify which the project
   specification designates as governing, and flag the difference.

7. **Return auditable results** — Always return:
   - The provision text (if retrievable) or exact citation (standard,
     section, edition, page/equivalent)
   - The standard's edition/date (standards are version-specific; AISC 360-16
     differs from 360-22)
   - Mandatory vs advisory status ("shall" / "should" / commentary)
   - Warnings about paywall access, jurisdiction limitations, or known
     differences between editions
   - If a query returned no applicable provision, say so explicitly

## Standard Selection Guide

### By engineering domain

| Domain | Primary US standards | Cross-check / alternate |
|---|---|---|
| Structural steel | AISC 360 (specification), AISC 341 (seismic), AISC 358 (connections) | AASTO LRFD (bridges), AWS D1.1 (welding) |
| Structural concrete | ACI 318 (buildings), ACI 350 (environmental) | ACI 349 (nuclear), Eurocode 2 (EU) |
| Cold-formed steel | AISI S100 | — |
| Masonry | TMS 402/602 | ACI 530 (equivalent) |
| Timber / wood | NDS (sawn, GLT, CLT) | AWC manuals, SDPWS (seismic, wood) |
| Aluminum | ADM (Aluminum Design Manual) | — |
| Loads (general) | ASCE 7 (minimum design loads) | IBC (adopts ASCE 7 by reference), state-specific amendments |
| Geotechnical | ASCE 7 Ch. 18 (soils/foundations), state DOT specs | ACI 336 (deep foundations), FHWA manuals |
| Bridges | AASTO LRFD Bridge Design Specs | AISC 360 (steel bridges), ACI 318 (concrete bridges), state DOT |
| Fire protection | NFPA 1 (Fire Code), NFPA 101 (Life Safety), IBC Ch. 7-9 | NFPA 5000 (building code), FM Global data sheets |
| Electrical | NEC (NFPA 70), IEEE 1547 (interconnection), IEEE 519 (harmonics) | UL standards, IEC (international), state amendments |
| Mechanical | ASME B31 (pressure piping), ASME BPVC (boilers/pressure vessels) | API (petroleum), AWS D15 (railroad welding) |
| Architectural | ADA (accessibility), IBC (planning), ASHRAE 90.1/62.1 (energy/ventilation), NFPA 101 (egress) | ICC A117.1 (accessibility), IECC (energy), LEED (sustainability) |
| Materials / testing | ASTM (testing methods), AISC/ACI material specs | ISO (international), EN (European) |
| Software | ISO/IEC 25010 (quality), OWASP ASVS (security), NIST SSDF (secure dev) | IEEE 830 (requirements), IEEE 1012 (V&V) |

### By jurisdiction

| Jurisdiction | Governing framework |
|---|---|
| United States (general) | IBC + referenced standards (ASCE 7, AISC 360, ACI 318, NDS, TMS 402) |
| United States (state-specific) | State amendments to IBC; California (CBC, Caltrans), Texas (TBD), New York (NYC BC), etc. |
| Canada | NBCC + CSA standards (CSA S16 steel, CSA A23.3 concrete, CSA O86 wood) |
| Europe | Eurocodes (EN 1990–EN 1999) + National Annexes |
| United Kingdom | BS EN standards + National Annexes; legacy BS 5950, BS 8110 withdrawn |
| Australia | AS 4100 (steel), AS 3600 (concrete), AS 1170 (loads) |
| International project | Project specification designates governing standard set |

When the user does not specify jurisdiction, ask before assuming — a steel
connection detail that is correct per AISC may not satisfy Eurocode 3.

## Access Methods

Most engineering standards are paywalled. This is a first-class constraint,
not an afterthought.

### Access tiers

| Tier | Standards | How to retrieve |
|---|---|---|
| **Free full text** | Some NFPA handbooks (preview), Eurocode national annexes (some countries), NIST standards, select FHWA/AASHTO manuals, IBC (free online via ICC) | Direct link or search the free portal |
| **Free preview / limited** | AISC (selected sections free), ASCE (abstracts + select open articles), ACI (select guides) | Retrieve what the preview allows; cite the rest by section |
| **Subscription API** | IEEE Xplore (IEEE standards), some ASTM via institutional access | Requires user's API key or institutional login; skill cannot bypass |
| **Paywalled, no API** | Most AISC/ACI/ASME/ASTM full documents | Cite provision with exact reference; tell the user they need their own copy |
| **Publicly purchasable** | All major standards bodies sell PDF/print | Provide purchase link as fallback |

### What to do when access is blocked

1. **Cite precisely** — standard, section, edition, and page number (or
   equivalent locator) so the user can find it in their licensed copy.
2. **Flag the access limitation** explicitly in the output.
3. **Never reconstruct a "shall" provision from memory or secondary sources**
   — this is how dangerous errors creep in. If you cannot retrieve the
   provision, say so and provide the citation.
4. **Offer a free alternative** if one answers the same question (e.g., a
   FHWA manual provision that parallels an AASTO clause).

## Provision Types and Mandatory Language

Engineering standards use precise obligation levels. Distinguish them in
your output:

| Language | Meaning | Verdict impact |
|---|---|---|
| **"shall"** | Mandatory. Non-negotiable requirement. | Violation = non-compliant |
| **"shall not"** | Mandatory prohibition. | Violation = non-compliant |
| **"should"** | Recommended. Advisory, not mandatory. | Departure requires justification |
| **"may"** | Permissive. Allowed but not required. | Optional |
| **"is permitted to"** | Permissive. | Optional |
| **Commentary** | Explanatory text, not part of the enforceable standard. | Informative only; cite as commentary |

When a claim invokes a provision, verify the obligation level. A researcher
who treats a "should" as a "shall" (or vice versa) has made a compliance
error.

## Conflict Resolution

When multiple standards apply and give different answers:

1. **Check the project specification first** — it designates the governing
   standard. Report that.
2. **If no specification exists** — identify the conflict explicitly: "AISC
   360-16 §F2.1 requires X, but AASTO LRFD §6.10.1 requires Y for this bridge
   type. The project specification must designate which governs."
3. **Never silently pick the more conservative value** — conservatism is a
   design decision, not a retrieval decision. Report both and let the
   engineer choose.
4. **Flag known inter-standard conflicts** — some are well-documented
   (e.g., ASCE 7 vs Eurocode wind load methods; AISC vs CSA steel design
   philosophy). Note them.

## Section-Lookup Patterns

Engineering standards share a common navigation anatomy. Use these patterns
to locate provisions:

1. **Identify the limit state** — flexure, shear, axial compression, torsion,
   stability (buckling), connection, fatigue, fire, serviceability
   (deflection, vibration, cracking), durability.
2. **Find the chapter** — standards organize by limit state (AISC 360: Ch.
   E = compression, F = flexure, G = shear, H = combined, J = connections).
3. **Find the member type** — rolled shape vs built-up, compact vs
   noncompact, braced vs unbraced, composite vs non-composite.
4. **Find the specific provision** — equation number, table, or design aid.
5. **Check the scope clause** — every chapter has a scope (e.g., "This
   chapter applies to members with..."). Verify the member falls within it.
6. **Check exclusions and exceptions** — footnotes and "except" clauses are
   where governing provisions hide.

## Output Format

Structure your response like this:

```
## Retrieval Summary
- Standard:
- Edition / date:
- Section(s):
- Access: retrieved | preview-only | paywalled (cited) | unavailable
- Jurisdiction assumed:

## Provision
[Exact text if retrieved, or exact citation if paywalled]

## Obligation level
[shall / should / may / commentary]

## Applicability check
[Does the provision actually apply to the case? Scope confirmed?]

## Conflicts / cross-checks
[Any overlapping standards with different requirements]

## Provenance
- Source: [standard + section + edition]
- Access method: [free / preview / paywalled / unavailable]
- Access date:
- Identifier conversions or assumptions:
- Warnings: [paywall, edition differences, jurisdiction limits, scope gaps]
```

If the provision is paywalled and cannot be retrieved, say so explicitly and
provide the most specific citation possible. Do not reconstruct mandatory
provisions from memory.

## Adding New Standards

This skill is designed to grow. Each standard is a self-contained reference
file in `references/`. To add a new standard:

1. Create `references/<standard-abbrev>.md` following the format of existing
   files.
2. Add an entry to the Standard Selection Guide above.
3. The reference file should include: scope, edition history, access
   method (free/preview/paywall/API), organization (chapters by limit state),
   key sections for common checks, mandatory-language conventions, known
   conflicts with other standards, and jurisdiction notes.

## Available Standards

Read the relevant reference file before attempting any lookup.

### Structural Steel
| Standard | Reference File | Access | What it covers |
|---|---|---|---|
| AISC 360 | `references/aisc-360.md` | Free preview / paywalled | Structural steel buildings — the central US steel specification |
| AISC 341 | `references/aisc-341.md` | Paywalled | Seismic provisions for steel structures |
| AISC 358 | `references/aisc-358.md` | Paywalled | Prequalified steel connections |
| AISI S100 | `references/aisi-s100.md` | Paywalled | Cold-formed steel |
| AWS D1.1 | `references/aws-d1-1.md` | Paywalled | Structural welding (steel) |

### Concrete
| Standard | Reference File | Access | What it covers |
|---|---|---|---|
| ACI 318 | `references/aci-318.md` | Free preview / paywalled | Concrete building code — the central US concrete specification |
| ACI 350 | `references/aci-350.md` | Paywalled | Environmental concrete structures |

### Masonry
| Standard | Reference File | Access | What it covers |
|---|---|---|---|
| TMS 402/602 | `references/tms-402.md` | Paywalled | Masonry structures |

### Bridges and Transportation
| Standard | Reference File | Access | What it covers |
|---|---|---|---|
| AASTO LRFD | `references/aasto-lrfd.md` | Paywalled (some manuals free) | Bridge design — steel, concrete, fatigue |

### Fire and Life Safety
| Standard | Reference File | Access | What it covers |
|---|---|---|---|
| NFPA 1 / 101 | `references/nfpa.md` | Free handbook preview / paywalled | Fire code, life safety code |
| IBC (fire chapters) | `references/ibc.md` | Free (online) | Fire resistance, means of egress (IBC Ch. 7-10, 10) |

### Electrical
| Standard | Reference File | Access | What it covers |
|---|---|---|---|
| NEC (NFPA 70) | `references/nec.md` | Free online view (NFPA) / paywalled download | National Electrical Code — the US electrical installation standard |
| IEEE Xplore | `references/ieee.md` | Subscription API | IEEE standards library (1547, 519, 802, etc.) |

### Mechanical
| Standard | Reference File | Access | What it covers |
|---|---|---|---|
| ASME | `references/asme.md` | Paywalled | Pressure vessels (BPVC), piping (B31.1/31.3), GD&T (Y14.5), elevators (A17.1) |

### Materials and Testing
| Standard | Reference File | Access | What it covers |
|---|---|---|---|
| ASTM | `references/astm.md` | Paywalled (some free) | Material testing methods and material specifications |

### Timber and Masonry
| Standard | Reference File | Access | What it covers |
|---|---|---|---|
| NDS | `references/nds.md` | Free preview / paywalled | Wood design (sawn, GLT, CLT, connections) |
| TMS 402/602 | `references/tms-402.md` | Paywalled | Masonry structures |

### Software Engineering
| Standard | Reference File | Access | What it covers |
|---|---|---|---|
| ISO/IEC 25010 | `references/software-engineering.md` | Free (OWASP/NIST) / paywalled (ISO, IEEE) | Software quality model, security (OWASP ASVS/Top 10), secure development (NIST SSDF) |

### Electrical
| Standard | Reference File | Access | What it covers |
|---|---|---|---|
| NEC (NFPA 70) | `references/nec.md` | FREE online view (NFPA) | Electrical installation — wiring, overcurrent, grounding, solar, EV, energy storage |
| IEEE | `references/ieee.md` | Subscription / some free | Power (1547, 519), software, networking (802.3/802.11 free), reliability |
| NFPA (fire) | `references/nfpa.md` | FREE online view (NFPA) | Life safety (101), fire code (1), sprinklers (13), alarms (72) |

### Mechanical
| Standard | Reference File | Access | What it covers |
|---|---|---|---|
| ASME | `references/asme.md` | Paywalled | Pressure vessels (BPVC), piping (B31.1/31.3), GD&T (Y14.5), elevators (A17.1) |

### Materials and Testing
| Standard | Reference File | Access | What it covers |
|---|---|---|---|
| ASTM | `references/astm.md` | Paywalled (some free) | Material specs (A992, A615, C150), test methods (E8 tensile, E23 impact, C39 concrete) |

### Timber
| Standard | Reference File | Access | What it covers |
|---|---|---|---|
| NDS | `references/nds.md` | Free preview / free companions (SDPWS, WFCM) | Wood design (sawn, GLT, CLT, connections), adjustment factors |

### International
| Standard | Reference File | Access | What it covers |
|---|---|---|---|
| Eurocode | `references/eurocode.md` | Free (varies by country) | European structural standards (EN 1990–1999) + National Annexes |

### Architectural
| Standard | Reference File | Access | What it covers |
|---|---|---|---|
| ADA / ICC A117.1 | `references/architectural.md` | FREE (ADA) / paywalled (ICC A117.1) | Accessibility standards |
| ASHRAE | `references/architectural.md` | Paywalled | Energy (90.1), ventilation (62.1), thermal comfort (55) |
| LEED / IgCC | `references/architectural.md` | Paywalled | Green building rating and code |

## Citing Engineering Standards

Engineering citations follow a specific format. Use this for every provision:

```
[Standard Abbreviation] [Number]-[Edition], §[Section], [Title]
([Publisher], [Year]).
```

Examples:
- `AISC 360-22, §F2-1, Flexural Members (AISC, 2022).`
- `ACI 318-19, §10.3.5, Maximum Flexural Reinforcement (ACI, 2019).`
- `ASCE 7-22, §26.10, Wind Loads on Main Wind Force Resisting Systems (ASCE, 2022).`

Always cite the edition — provisions change between editions (AISC 360-16 vs
-22 differ in several sections; ACI 318-14 vs -18 had major shear changes).
When the user references a standard without an edition, ask which one or note
the assumption.
