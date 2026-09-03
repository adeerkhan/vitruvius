# Vitruvius

The engineering research agent. Named for Marcus Vitruvius Pollio, the Roman architect-engineer who wrote *De Architectura* — the first surviving treatise to treat architecture, civil engineering, machines, and materials as one discipline.

It does for engineering artifacts and questions what Feynman does for scientific papers: **discover → read → synthesize → verify → review**, with auditable provenance throughout. Five disciplines, each behind its own command:

| Command | Discipline |
|---------|------------|
| `/vitruvius` | Entry point / discipline dispatcher |
| `/vitruvius-help` | Quick-reference card |
| `/mechanical` | Mechanical engineering |
| `/software` | Software engineering |
| `/civil` | Civil / structural engineering |
| `/electrical` | Electrical / electronics engineering |
| `/architectural` | Architecture |

## Install

### Command Code

```bash
cmd skills add <owner>/vitruvius --global     # install all eight skills (or pick with -s)
cmd mods add <owner>/vitruvius                # adds the /vitruvius slash commands
```

The skills alone give you `/mechanical`, `/software`, etc. as first-class
slash commands (and `/skills` lists them). The mod adds the same command
surface in case a skill name ever collides with a built-in — skills run via
`/skill:<name>` regardless.

### OpenCode

Two routes, both from the same repo:

**Run inside the repo** (zero config — OpenCode auto-loads the plugin and skills):
```bash
git clone <owner>/vitruvius && cd vitruvius && opencode
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
pi install git:github.com/<owner>/vitruvius
```

Pi reads the `pi` block in `package.json` (`skills: ["./skills"]`) and loads
the skills directory.

### Any Agent Skills host

Copy the `skills/` directory into your agent's skills folder (`.claude/skills/`,
`.commandcode/skills/`, `.agents/skills/`, ...). Every skill is a standard
`SKILL.md` and needs no manifest.

## What each skill does

All discipline skills run the same shared research loop
(`/skill:engineering-research`): **Plan → Scale → Gather → Draft → Cite →
Review → Deliver**, ending with a `.provenance.md` sidecar.

- `engineering-research` — the shared method: slug + plan artifact, evidence
  table with stable numeric IDs, verifier/reviewer passes, provenance sidecar.
- `vitruvius` — the dispatcher: routes to the matching discipline.
- `mechanical`, `software`, `civil`, `electrical`, `architectural` — thin
  discipline lenses carrying only the evidence landscape, verification
  criteria, and deliverable shape for that field.

## The non-negotiables

- Never fabricate a source. A reference or it didn't happen.
- Every research output has a `.provenance.md` sidecar.
- Mark status honestly: `verified`, `inferred`, `blocked`, `unverified`.
- Read before you summarize. Never infer a code provision or spec value from a
  title or memory when a direct read is possible.

## License

MIT
