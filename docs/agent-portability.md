# Agent Portability

Vitruvius is an agent-portable skill distribution. The skills in `skills/`
hold the core behavior; host-specific files are adapters that make that
behavior easy to load in a given agent. `AGENTS.md` at the repo root is the
always-on ruleset every host reads for free.

## Supported Adapters

| Host | Files | Notes |
|------|-------|-------|
| Command Code | `.commandcode/mods/vitruvius.ts`, `skills/` | `cmd skills add adeerkhan/vitruvius` installs the skills; `cmd mods add adeerkhan/vitruvius` adds the `/vitruvius` commands. |
| OpenCode | `.opencode/plugins/vitruvius.mjs`, `.opencode/command/`, `skills/`, `opencode.json` | Server plugin registers the skills dir + `/vitruvius` commands. Local-path or npm plugin install. |
| pi | `package.json` `pi` block, `skills/` | `pi install git:github.com/adeerkhan/vitruvius` reads `skills: ["./skills"]`. |
| Cursor | `.cursor/rules/vitruvius.mdc` | Always-on project rule. |
| Windsurf | `.windsurf/rules/vitruvius.md` | Project rule. |
| Cline | `.clinerules/vitruvius.md` | Project rule. |
| GitHub Copilot | `.github/copilot-instructions.md` | Repository instruction file. |
| Qoder | `.qoder/rules/vitruvius.md`, `.qoder-plugin/plugin.json`, `AGENTS.md` | Qoder auto-loads `AGENTS.md` as always-on context; `.qoder/rules/vitruvius.md` provides per-project rules; the plugin manifest points at `skills/`. |
| Claude Code / Codex / VS Code + Codex ext | `AGENTS.md` | Read `AGENTS.md` from the repo root as instructions. Instruction-tier. |
| Any Agent Skills host | `skills/` | Copy the `skills/` directory into `.claude/skills/`, `.agents/skills/`, etc. Every skill is a standard `SKILL.md`. |
| Generic agents | `AGENTS.md` | Copy the ruleset file or load the skill files directly. |

## Adapter Rule

Keep adapters thin. When a host supports skills or hooks, point it at the
existing `skills/` directory. When a host only supports project instructions,
keep its copied rule text aligned with `AGENTS.md` — the canonical source.

## Portable Behavior

- `skills/engineering-research/SKILL.md` — the shared research method (Plan → Gather → Draft → Cite → Review → Deliver)
- `skills/scholarly-research/SKILL.md` — free academic-source discovery (OpenAlex, Semantic Scholar, arXiv, alphaXiv)
- `skills/{mechanical,software,civil,electrical,architectural}/SKILL.md` — the five discipline lenses
- `skills/vitruvius/SKILL.md` — the dispatcher
- `skills/vitruvius-help/SKILL.md` — the reference card
- `AGENTS.md` — the always-on ruleset for agents without skill support
