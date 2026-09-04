# ASTM Standards (American Society for Testing and Materials)

## Scope

ASTM publishes test methods and material specifications. Unlike design codes
(AISC 360, ACI 318), ASTM standards tell you *how to test* a material and
*what properties a material must meet* — they are referenced by the design
codes rather than used directly for structural calculations. Essential for
materials research, quality control, and failure analysis.

## Key standards

### Structural materials (referenced by AISC/ACI)
| Standard | Title | What it covers |
|---|---|---|
| ASTM A6 | General Requirements for Rolled Structural Steel Bars, Plates, Shapes, Sheet Piling | Steel mill product specs |
| ASTM A36 | Structural Steel | Carbon structural steel (Fy = 36 ksi) |
| ASTM A572 | High-Strength Low-Alloy Columbadium-Vanadium Structural Steel | High-strength steel (Fy = 42–65 ksi) |
| ASTM A992 | Structural Steel Shapes | W-shapes for building design (Fy = 50 ksi, Fu = 65 ksi) — the default structural shape |
| ASTM A325 | Structural Bolts, Steel, Heat Treated, 120/105 ksi Minimum Tensile Strength | High-strength bolts (being replaced by F3125) |
| ASTM F3125 | High Strength Structural Bolts and Assemblies | Current high-strength bolt spec (replaces A325/A490) |
| ASTM A307 | Carbon Steel Bolts and Studs, 60,000 psi Tensile Strength | Low-strength bolts |
| ASTM C33 | Concrete Aggregates | Aggregate quality for concrete |
| ASTM C150 | Portland Cement | Cement types and compositions |
| ASTM C618 | Coal Fly Ash and Raw or Calcined Natural Pozzolan for Use in Concrete | Supplementary cementitious materials |
| ASTM A615 | Deformed and Plain Carbon-Steel Bars for Concrete Reinforcement | Rebar (Grades 40, 60, 75) |
| ASTM A706 | Low-Alloy Steel Deformed and Plain Bars for Concrete Reinforcement | Seismic rebar (Grade 60, ductile) |

### Test methods (commonly referenced in research)
| Standard | Title | What it covers |
|---|---|---|
| ASTM E8 / E8M | Tensile Testing of Metallic Materials | Stress-strain, yield, ultimate, elongation |
| ASTM E111 | Young's Modulus, Tangent Modulus, and Chord Modulus | Elastic modulus testing |
| ASTM E18 | Rockwell Hardness of Metallic Materials | Hardness testing |
| ASTM E23 | Notched Bar Impact Testing of Metallic Materials | Charpy V-notch impact energy |
| ASTM E466 | Force Controlled Constant Amplitude Axial Fatigue Testing | Fatigue testing |
| ASTM E1049 | Cycle Counting in Fatigue Analysis | Rainflow counting |
| ASTM C39 | Compressive Strength of Cylindrical Concrete Specimens | Concrete cylinder test |
| ASTM C78 | Flexural Strength of Concrete | Concrete beam flexure test |
| ASTM C469 | Static Modulus of Elasticity and Poisson's Ratio of Concrete | Concrete elastic properties |
| ASTM C1583 | Tensile Strength of Concrete Surfaces | Pull-off tensile test |
| ASTM D638 | Tensile Properties of Plastics | Plastic tensile testing |
| ASTM D790 | Flexural Properties of Unreinforced and Reinforced Plastics | Plastic flexure |
| ASTM D2240 | Rubber Property — Durometer Hardness | Hardness of rubber/plastics |
| ASTM G101 | Estimating the Atmospheric Corrosion Resistance of Low-Alloy Steels | Corrosion testing |

## Access

- **Paywalled:** Most ASTM standards require purchase or ASTM subscription.
- **Free preview:** Abstracts and scope are free.
- **Some free:** ASTM offers select standards free (e.g., some COVID-era
  standards). Check astm.org.
- **No API.**
- **Citation fallback:** Cite by standard number + edition.

## How ASTM relates to design codes

ASTM standards are *referenced by* design codes, not used in isolation:

- **AISC 360** references ASTM A992 (shapes), F3125 (bolts), A307 (low-strength bolts)
- **ACI 318** references ASTM C150 (cement), C33 (aggregates), A615/A706 (rebar)
- **ASME BPVC Section II** references ASTM material specs extensively

When a research question involves material properties, trace: design code →
ASTM material spec → ASTM test method. The test method is where the actual
numbers come from.

## Mandatory-language conventions

- **"shall"** — mandatory (in the test method or spec)
- **"should"** — recommended
- **"may"** — permitted
- **Precision and bias statements** — required in test methods; note them when
  comparing results across labs

## Known conflicts and cross-checks

| Conflicts with | Issue |
|---|---|
| AISI / SAE | Automotive steel specs. SAE J403/J404 for chemical composition; AISI for design. |
| EN / ISO | European/international material specs. EN 10025 (structural steel) is not interchangeable with ASTM A992. |
| JIS | Japanese industrial standards. JIS G3101, G3106 for steel. |
| MIL-SPEC | US military specs. Often more stringent than ASTM. |

## Jurisdiction notes

- **US:** ASTM standards are adopted by reference in AISC 360, ACI 318, ASME
  BPVC, and most US material specs.
- **International:** EN (European), ISO (international), JIS (Japanese),
  GB (Chinese) standards are not interchangeable with ASTM — material
  properties and test methods differ.
- **When a project specifies "or equal":** ASTM A992 "or equal" requires
  matching yield, tensile, elongation, and chemical limits — not just
  "similar steel."

## When to use

Use this reference when the research question involves:
- Material properties (yield strength, elastic modulus, hardness, impact)
- Test methods (how to measure a property)
- Material specifications (what grade/spec applies)
- Quality control or failure analysis
- Comparing materials across standards (ASTM vs EN vs ISO)

Do NOT use for: structural design calculations (use AISC 360/ACI 318), load
determination (use ASCE 7), or electrical properties (use IEEE/ASTM D-series
for electrical testing).
