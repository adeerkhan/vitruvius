# Vitruvius Commands

Vitruvius is an engineering research agent: discover → read → synthesize → verify → review, with auditable provenance. It is research-only, not for final engineering sign-off.

**Dispatcher and disciplines**

| Command | What it does |
|---|---|
| `/vitruvius <question>` | Smart dispatcher — routes to the right discipline or workflow |
| `/vitruvius:civil` | Civil/structural: buildings, bridges, steel, concrete, geotech |
| `/vitruvius:mechanical` | Mechanical: design, thermal, fluids, materials, manufacturing |
| `/vitruvius:software` | Software: architecture, frameworks, protocols, security |
| `/vitruvius:electrical` | Electrical: power, electronics, controls, EMC |
| `/vitruvius:architectural` | Architectural: building science, facades, codes, performance |

**Research workflows**

| Command | What it does |
|---|---|
| `/vitruvius:engineering-research` | The shared seven-step research method |
| `/vitruvius:scholarly-research` | Literature discovery (OpenAlex, arXiv, Semantic Scholar) |
| `/vitruvius:standards-lookup` | Standards provisions: AISC, ACI, ASCE, IEEE, Eurocode |
| `/vitruvius:gap-analysis` | Literature gap identification by triangulation |
| `/vitruvius:evidence-ranking` | Score evidence by quality tier |
| `/vitruvius:design-alternatives` | Compare 3+ approaches with scored trade-offs |
| `/vitruvius:fmea-brainstorm` | Failure modes with severity/occurrence/detection and RPN |
| `/vitruvius:hypothesis-generation` | Freeze rival hypotheses with dated evidence boundaries |
| `/vitruvius:verifier` | Blind verdict on a claim, with evidence trail |
| `/vitruvius:compare` | Source-grounded comparison matrix |
| `/vitruvius:review` | Severity-graded artifact review |
| `/vitruvius:peer-review` | Adversarial peer review plus revision plan |
| `/vitruvius:audit` | Claim-vs-implementation mismatch audit |
| `/vitruvius:summarize` | Faithful structured digest |
| `/vitruvius:artifact-reading` | Anchored extraction from PDFs, drawings, specs |
| `/vitruvius:eli5` | Plain-language engineering explanation |
| `/vitruvius:simplified-technical-english` | ASD-STE100 rewrite and check |
| `/vitruvius:research-to-post` | Paper/repo to 2–3 hook posts plus card |
| `/vitruvius:proposal` | Targeted Ph.D./Masters proposal workflow |
| `/vitruvius:habit` | Extract and validate research preferences |
| `/vitruvius-help` | This card |

Pass `--deep` for multi-agent coverage, `--quick` for a fast lookup, or `--turns N` / `--budget N` to set an effort ceiling. Say "stop vitruvius" to end a run.
