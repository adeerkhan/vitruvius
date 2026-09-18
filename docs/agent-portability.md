# Agent Portability

Vitruvius is an agent-portable skill distribution. The `skills/` directory
holds the core behavior; `agents/` holds the canonical role definitions;
host-specific files are thin adapters that make both easy to load in a given
agent. `AGENTS.md` at the repo root is the always-on ruleset every host reads
for free.

Regenerated from the adapters on disk, 2026-09.

## Supported Hosts

| Host | Files | Install |
|------|-------|---------|
| Claude Code | `skills/`, `.claude/commands/`, `.claude-plugin/plugin.json` | `npx skills add adeerkhan/vitruvius` |
| Codex | `skills/`, `AGENTS.md` (native) | `npx skills add adeerkhan/vitruvius --agent codex` |
| Command Code | `.commandcode/mods/vitruvius.ts`, `skills/` | `cmd skills add adeerkhan/vitruvius` + `cmd mods add adeerkhan/vitruvius` |
| Cursor | `skills/` copied to `~/.cursor/skills/vitruvius` | manual copy (see README) |
| OpenCode | `opencode.json`, `.opencode/plugins/vitruvius.mjs`, `.opencode/agent/` (6 role adapters), `.opencode/command/` | zero config inside the repo, or point `opencode.json` at the plugin |
| Pi | skills as a package | `pi install git:github.com/adeerkhan/vitruvius` |

## Adapter Discipline

- **Canonical definitions live once.** `agents/*.md` are the source of truth
  for role behavior (tool bounds, dispatch contracts, report shapes). Host
  adapters are thin pointers: "read `agents/<role>.md` and follow it exactly",
  with a refuse-if-missing fallback — never a copy of the content.
- **Tool bounds are declared per role** in `agents/*.md` frontmatter and
  mirrored in each adapter's tool map (e.g. verifier: read-only —
  `write: false, edit: false`).
- Adding a host = one thin adapter file + one README install row. Nothing
  else.
