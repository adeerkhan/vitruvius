<p align="center">
  <img src="assets/hero.png" width="820" alt="Vitruvius — the engineering research agent">
</p>

<h1 align="center">Vitruvius</h1>

<p align="center">
  The engineering research agent. Named for Marcus Vitruvius Pollio, the Roman architect-engineer who wrote <em>De Architectura</em> — the first surviving treatise to treat architecture, civil engineering, machines, and materials as one discipline.
</p>

## Why Vitruvius?

Vitruvius is an **engineering research agent** that runs a **discover → read → synthesize → verify → review** loop over engineering questions and artifacts — with auditable provenance throughout.

**5 disciplines. 24 skills. Zero fabricated sources.**

Unlike generic web search, Vitruvius:
- **Reads sources directly** — never infers from titles or memory
- **Never fabricates** — every claim traces to a checkable source
- **Records provenance** — every output has a `.provenance.md` sidecar
- **Flags uncertainty** — distinguishes `verified`, `inferred`, `blocked`, `unverified`

## Quick Start

```bash
# Install (Command Code)
cmd skills add adeerkhan/vitruvius --global
cmd mods add adeerkhan/vitruvius

# Run your first research query
/vitruvius:civil "What are the research gaps in steel-concrete composite connections?"
```

You'll get a structured research brief with evidence table, verification verdict, and provenance sidecar.

## Research Loop

Every Vitruvius skill runs the same shared method:

```
Plan → Scale → Gather → Draft → Cite → Review → Deliver
  ↓
.provenance.md sidecar (source accounting + verification status)
```

- **Plan** — define key questions, evidence needed, scale decision
- **Scale** — direct search (simple) or subagent decomposition (complex)
- **Gather** — read sources directly, record exact provisions
- **Draft** — synthesize findings with inline citations
- **Cite** — sweep every claim against sources
- **Review** — blind verifier checks claim vs evidence (8 adversarial checks)
- **Deliver** — final output + provenance sidecar

## What's Included

### Discipline Skills

Run the shared research loop with domain-specific evidence landscapes:

| Command | Discipline |
|---------|------------|
| `/vitruvius:mechanical` | Mechanical: design, thermal, fluids, materials, manufacturing |
| `/vitruvius:software` | Software: architecture, frameworks, protocols, security, benchmarks |
| `/vitruvius:civil` | Civil / structural: buildings, bridges, steel, concrete, geotech, loads |
| `/vitruvius:electrical` | Electrical / electronics: power, electronics, controls, EMC |
| `/vitruvius:architectural` | Architectural: building science, facades, codes, performance |

### Research Workflow Skills

Named engineering jobs over the shared loop:

| Command | What it does |
|---------|--------------|
| `/gap-analysis` | Systematic literature gap identification via triangulation (OpenAlex, arXiv, web) |
| `/design-alternatives` | Generate and compare 3+ engineering approaches with scored trade-off matrices |
| `/fmea-brainstorm` | FMEA-style failure mode brainstorming with S/O/D ratings and RPN ranking |
| `/verifier` | Blind subagent verdict on a claim with evidence trail (8 adversarial checks) |
| `/compare` | Standards/designs/products into a source-grounded comparison matrix |
| `/review` | Severity-graded adversarial review of an artifact |
| `/audit` | Claim-vs-implementation (paper-vs-code, spec-vs-design) |
| `/summarize` | Faithful structured digest of a standard, spec, or paper |
| `/eli5` | Plain-language engineering explanation |
| `/artifact-reading` | Anchored extraction from PDFs, drawings, specs |
| `/scholarly-research` | Academic literature discovery (OpenAlex, arXiv, Semantic Scholar) |
| `/standards-lookup` | Engineering standards: AISC, ACI, ASCE, IEEE, Eurocode |

### Application Skills

End-to-end workflows for specific tasks:

| Command | What it does |
|---------|--------------|
| `/proposal` | Generate targeted Ph.D./Masters research proposals. Parses position postings, researches professor/lab, identifies gaps, produces humanized proposal with deep fit analysis |

## Choose Your Starting Point

| I want to... | Start here |
| --- | --- |
| Research a mechanical engineering question | `/vitruvius:mechanical` |
| Find research gaps in my field | `/gap-analysis` |
| Compare design alternatives | `/design-alternatives` |
| Generate a PhD proposal | `/proposal` |
| Verify a claim or calculation | `/verifier` |
| Look up an engineering standard | `/standards-lookup` |
| Brainstorm failure modes | `/fmea-brainstorm` |

## Installation

### Command Code

```bash
cmd skills add adeerkhan/vitruvius --global     # install all 24 skills
cmd mods add adeerkhan/vitruvius                # add /vitruvius slash commands
```

### OpenCode

```bash
# Run inside the repo (zero config — auto-loads plugin and skills)
git clone https://github.com/adeerkhan/vitruvius && cd vitruvius && opencode

# Or point opencode.json at the plugin file:
# { "plugin": ["./path/to/vitruvius/.opencode/plugins/vitruvius.mjs"] }
```

### Pi

```bash
pi install git:github.com/adeerkhan/vitruvius
```

### Any Agent Skills Host

Copy the `skills/` and `references/` directories into your agent's skills folder:
- `.claude/skills/` (Claude Code)
- `.commandcode/skills/` (Command Code)
- `.agents/skills/` (Agents)
- `.opencode/skills/` (OpenCode)

> **Restart your harness after installing new skills.** The skill catalogue is built at startup; new skills won't be routable until the next session.

## Proposal Skill

Generate targeted Ph.D./Masters research proposals. The proposal skill parses position postings, researches the professor/lab, identifies lab-specific gaps, and produces a humanized proposal with deep fit analysis.

### Inputs

```
/proposal --posting <path-or-url> --cv <path> [--statement <path>] [--sample <path>]
```

- `--posting` — Position posting as PDF, image (screenshot), or URL
- `--cv` — Your CV (PDF)
- `--statement` — Personal statement (optional, used for voice matching)
- `--sample` — Separate writing sample (optional, used for voice matching)

### CLI vs Desktop

The skill works in both CLI and desktop harnesses:

- **CLI**: Provide file paths as arguments
- **Desktop apps** (Claude Desktop, Cursor, Windsurf): Attach files via the harness UI. The harness makes attached files available as readable paths.

### Workflow

```
Position Posting + CV + Statement
      ↓
Parse → Research Professor/Lab → Gap Analysis → Verify → Write → Humanize
      ↓
binder.md (final output with all appendices)
```

### Output

All artifacts saved to `projects/<your-slug>/`:
- Structured profile, posting data, professor research
- Gap analysis dossier (general + lab-specific gaps)
- Evidence ranking table
- Verifier verdict
- Humanized proposal
- Layered binder with all appendices

## Research Sources

Vitruvius points research at the best free, verifiable layers for the job:

- **Standards and code** (primary): ASME, ASTM, AISC, ACI, ASCE, IEEE, IEC, UL, IBC — cite standard + section + edition
- **Academic literature**: OpenAlex (primary, keyless), Semantic Scholar, arXiv, alphaXiv fast search
- **Web search**: Used for non-academic sources and recency (when host exposes the tool)

**Rejected sources:** Undated blog posts, content aggregators, forum posts without primary links, sources that appear AI-generated.

**Paywalled sources:** Cited from metadata and marked `blocked` — never guessed at.

## The Non-Negotiables

1. **Never fabricate a source.** Every named standard, code, provision, product, material, project, or dataset must have a verifiable reference.
2. **Never claim something exists without checking.** Before citing a standard or code section, verify it exists and read the actual provision.
3. **Never extrapolate details you haven't read.** If you have not fetched and inspected a source, you may note its existence but must not describe its contents, numbers, or claims.
4. **A reference or it didn't happen.** Every claim in an output must trace to a checkable source: standard + section, URL, artifact path, or calculation.
5. **Read before you summarize.** Do not infer a code provision, a spec value, or a material property from a title, a snippet, or memory when a direct read is possible.
6. **Mark status honestly.** Distinguish `verified`, `inferred`, `blocked`, and `unverified`. Never smooth over missing checks.

## FAQ

**How is this different from generic web search?**
Vitruvius reads sources directly, never fabricates, and records auditable provenance. Generic search returns snippets; Vitruvius returns verified claims with source locations.

**What if a source is paywalled?**
Cited from search metadata and marked `blocked`. Never guessed at.

**Can I use this for non-engineering research?**
Designed for engineering, but `/gap-analysis` and `/proposal` work for any field with academic literature.

**How does the proposal skill work?**
Parses the position posting, researches the professor/lab website and recent papers, identifies lab-specific gaps, and generates a targeted proposal with deep fit analysis. Humanizes the output to match your writing style.

**What disciplines are supported?**
Mechanical, civil, electrical, software, and architectural engineering.

**How do I verify the agent's claims?**
Every output includes a `.provenance.md` sidecar recording what was checked and how. Check the verification status labels: `verified`, `partial`, `blocked`, `unverified`.

## Uninstall

| Harness | Command |
|---------|---------|
| Command Code | `cmd skills remove vitruvius` + `cmd mods remove vitruvius` |
| OpenCode | Remove from `opencode.json` or delete checkout |
| Pi | `pi uninstall vitruvius` |
| Manual | Delete copied `skills/` and `references/` from agent folder |

## License

[MIT](LICENSE)

Copyright (c) 2026 [Adeer Khan](https://github.com/adeerkhan)
