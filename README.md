<p align="center">
  <img src="assets/hero.png" width="820" alt="Vitruvius — the engineering research agent">
</p>

<h1 align="center">Vitruvius</h1>

<p align="center">
  The engineering research agent. Named for Marcus Vitruvius Pollio, the Roman architect-engineer who wrote <em>De Architectura</em> — the first surviving treatise to treat architecture, civil engineering, machines, and materials as one discipline.
</p>

Vitruvius is an engineering research agent: it runs a **discover → read → synthesize → verify → review** loop over engineering questions and artifacts, with auditable provenance throughout. Five disciplines, each behind its own command:

| Command | Discipline |
|---------|------------|
| `/vitruvius` | Entry point / discipline dispatcher |
| `/vitruvius:help` | Quick-reference card |
| `/vitruvius:mechanical` | Mechanical engineering |
| `/vitruvius:software` | Software engineering |
| `/vitruvius:civil` | Civil / structural engineering |
| `/vitruvius:electrical` | Electrical / electronics engineering |
| `/vitruvius:architectural` | Architecture |

## Install

### Command Code

```bash
cmd skills add adeerkhan/vitruvius --global     # install all sixteen skills (or pick with -s)
cmd mods add adeerkhan/vitruvius                # adds the /vitruvius slash commands
```

The skills alone give you `/mechanical`, `/software`, etc. as first-class
slash commands (and `/skills` lists them). The mod adds the same command
surface in case a skill name ever collides with a built-in — skills run via
`/skill:<name>` regardless.

### OpenCode

Two routes, both from the same repo:

**Run inside the repo** (zero config — OpenCode auto-loads the plugin and skills):
```bash
git clone https://github.com/adeerkhan/vitruvius && cd vitruvius && opencode
```

**From a checkout, any project** — point `opencode.json` at the plugin file:
```json
{ "plugin": ["./path/to/vitruvius/.opencode/plugins/vitruvius.mjs"] }
```

**Via npm** (once published):
```json
{ "plugin": ["vitruvius"] }
```

> Note: a bare `owner/repo` in OpenCode's `plugin` array is treated as an npm
> package spec, not a GitHub repo — that install path requires publishing to
> npm. The local-path and clone routes need no publishing.

### Pi

```bash
pi install git:github.com/adeerkhan/vitruvius
```

Pi reads the `pi` block in `package.json` (`skills: ["./skills"]`) and loads
the skills directory.

### Any Agent Skills host

Copy the `skills/` and `references/` directories into your agent's skills folder
(`.claude/skills/`, `.commandcode/skills/`, `.agents/skills/`, ...). Every skill
is a standard `SKILL.md` and needs no manifest. The `references/` directory
contains shared evidence-quality tiers used by research skills.

> **Restart your harness after installing new skills.** The skill catalogue is
> built at startup; new skills won't be routable until the next session.

## File Permissions

Vitruvius research skills write artifacts to `outputs/`. Enable file writes in
your host:

- **Command Code:** Use `--yolo` flag
- **OpenCode:** Enabled by default
- **Cursor:** Auto-allow mode
- **Other hosts:** See [docs/permissions.md](docs/permissions.md)

Without file write permission, research still runs but artifacts are returned
in the chat instead of saved to disk.

## What each skill does

All discipline skills run the same shared research loop
(`/skill:engineering-research`): **Plan → Scale → Gather → Draft → Cite →
Review → Deliver**, ending with a `.provenance.md` sidecar.

- `engineering-research` — the shared method: slug + plan artifact, evidence
  table with stable numeric IDs, verifier/reviewer passes, provenance sidecar.
- `scholarly-research` — free academic-source discovery: OpenAlex, Semantic
  Scholar, arXiv, and alphaXiv fast search via keyless REST; guidance for
  host web/browser tools. Used when a question needs papers, prior art, or
  citation data.
- `standards-lookup` — engineering standards and codes: AISC, ACI, ASCE 7,
  IEEE, NFPA, IBC, Eurocode, and more. Selects the authoritative standard
  for the domain and jurisdiction, locates the governing section,
  distinguishes mandatory ("shall") from advisory ("should"), and returns
  the provision with provenance. Flags paywalled access and resolves
  conflicts between overlapping standards.
- `vitruvius` — the dispatcher: routes to the matching discipline or workflow.
- `mechanical`, `software`, `civil`, `electrical`, `architectural` — thin
  discipline lenses carrying only the evidence landscape, verification
  criteria, and deliverable shape for that field.
- `gap-analysis` — systematic engineering literature gap identification via
  triangulation (OpenAlex, arXiv, web). Produces structured dossiers with edge
  papers, evidence tiers, and research questions. Auto-suggested when
  discipline skills hit evidence dead-ends.
- `design-alternatives` — generate and compare 3+ engineering approaches with
  scored trade-off matrices. Presents options, not a single answer.
- `fmea-brainstorm` — FMEA-style failure mode brainstorming with S/O/D ratings
  and RPN ranking. Qualitative risk screening, not regulatory submission.
- Workflow skills — named engineering jobs over the shared loop:
  - `compare` — standards/designs/products into a source-grounded matrix
  - `verify` — verdict on a claim or calculation with evidence trail
  - `review` — severity-graded artifact review + revision plan
  - `audit` — claim-vs-implementation (paper-vs-code, spec-vs-design)
  - `summarize` — faithful structured digest of a standard/spec/paper
  - `eli5` — plain-language engineering explanation
  - `artifact-reading` — anchored reading + extraction from documents

All discipline skills accept `--deep` (force multi-agent + parallel
verification) and `--quick` (direct search only) flags. The `--deep` flag
runs 2 independent verifiers for safety-critical claims — if they disagree, a
third verifier breaks the tie. If a researcher subagent stalls, the lead
agent supplements with direct search and continues transparently.

## Research sources

Vitruvius points research at the best free, verifiable layers for the job:

- **Standards and code** (primary): ASME, ASTM, AISC, ACI, ASCE, IEEE, IEC,
  UL, IBC — cite standard + section + edition.
- **Academic literature**: the `scholarly-research` skill uses OpenAlex
  (primary, keyless), Semantic Scholar, the arXiv API, and alphaXiv fast
  search — all free REST. Where an agent host exposes web search or a browser
  tool, Vitruvius uses them for non-academic sources and recency.
- **Google Scholar** has no official API and blocks automated browsers, so
  Vitruvius does not scrape it; it uses OpenAlex/Semantic Scholar citation
  counts instead.
- **alphaXiv Q&A** (full-text paper chat) needs an alphaXiv account — connect
  `https://api.alphaxiv.org/mcp/v1` as an MCP server with a bearer key, or use
  the `alpha` CLI.

A claim is only `verified` when the underlying source was read directly;
paywalled full texts are cited from metadata and marked `blocked`.

## The non-negotiables

- Never fabricate a source. A reference or it didn't happen.
- Every research output has a `.provenance.md` sidecar.
- Mark status honestly: `verified`, `inferred`, `blocked`, `unverified`.
- Read before you summarize. Never infer a code provision or spec value from a
  title or memory when a direct read is possible.

## License

[MIT](LICENSE)

Copyright (c) 2026 [Adeer Khan](https://github.com/adeerkhan)
