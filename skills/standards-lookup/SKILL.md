---
name: standards-lookup
description: >
  Find, retrieve, and cite engineering standards provisions reproducibly.
  Use when a claim, design check, or research question requires a specific
  provision from AISC, ACI, ASCE, IEEE, NFPA, ASME, AASTO, Eurocode, IBC, or
  other engineering standard. Selects the authoritative standard, locates the
  section, resolves conflicts between overlapping standards, and returns the
  provision with enough provenance that another engineer can verify it. Use
  when locating and citing a provision is the job — judging whether a
  provision supports a conclusion belongs to the verifier. Do NOT use for
  general engineering knowledge that has no specific standard backing.
argument-hint: "<standard or topic to look up>"
license: MIT
metadata:
  version: "0.1.0"
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

1. **Select the authoritative standard** — Use the Standard Selection Guide
   below. Prefer the primary standard for the domain + jurisdiction. Do not
   fan out across many standards just because they are available.

2. **Locate the governing section** — Engineering standards organize by limit
   state (flexure, shear, compression, stability, connections). Use the
   section-lookup patterns in the reference file to navigate. Distinguish
   mandatory provisions ("shall") from advisory ("should", "may", commentary).

3. **Return the provision with provenance** — If free access or preview is
   available, retrieve the provision text directly. If paywalled, cite the
   exact provision (standard, section, edition, page) so the user can locate
   it in their copy. Never paraphrase a "shall" provision — quote it or flag
   the paraphrase. When two applicable standards conflict, report both and
   identify which the project specification designates as governing.

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
| United States (state-specific) | State amendments to IBC; California (CBC), Texas, New York City, etc. |
| Europe | Eurocodes (EN 1990–EN 1999) + National Annexes |

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

When two applicable standards give different answers, do not silently pick
one — report both and identify which the project specification designates as
governing. Never silently pick the more conservative value; conservatism is a
design decision, not a retrieval decision.

## Section-Lookup Patterns

Identify the limit state (flexure, shear, compression, stability,
connections), then find the chapter and provision in the reference file.
Check the scope clause and footnotes — "except" clauses are where governing
provisions hide.

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

Each standard is a self-contained reference file in `references/`. To add one:
create `references/<standard-abbrev>.md` (scope, edition history, access method,
chapters by limit state, key sections, mandatory-language conventions, known
conflicts, jurisdiction notes) and add an entry to the Standard Selection Guide.

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

## Citing Engineering Standards

Format: `[Standard Abbreviation] [Number]-[Edition], §[Section], [Title] ([Publisher], [Year]).`

Example: `AISC 360-22, §F2-1, Flexural Members (AISC, 2022).`

Always cite the edition — provisions change between editions (AISC 360-16 vs
-22 differ; ACI 318-14 vs -18 had major shear changes). When the user
references a standard without an edition, ask which one or note the assumption.

## Scope and Boundaries

- This skill retrieves and cites standards provisions — it does NOT produce final designs or construction documents.
- **Research-only, not for final engineering sign-off.** Retrieved provisions support engineering research but must be reviewed by a licensed engineer for any design application. Standards applicability (jurisdiction, edition, scope) is the user's responsibility.
- Evidence quality: see `references/evidence-quality-tiers.md`.
