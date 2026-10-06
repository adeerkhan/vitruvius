# Agent Portability

Vitruvius is an agent-portable skill distribution. The `skills/` directory
holds the core behavior; `agents/` holds the canonical role definitions and the
few hand-authored host files under `agents/<host>/`. Everything derivable is
rendered at install time by `scripts/install-adapters.mjs`, which writes the
target project's native dot-directories; the repository commits no generated
adapter output. `AGENTS.md` at the repo root is the always-on ruleset every host
reads for free.

Regenerated from the adapters on disk, 2026-10.

## Supported Hosts

| Host | Committed source | Install |
|------|------------------|---------|
| Claude Code | `agents/claude/plugin.json` | `npx skills add adeerkhan/vitruvius`, or `vitruvius-install --host claude` |
| Codex | `AGENTS.md` (native) | `npx skills add adeerkhan/vitruvius --agent codex`, or `vitruvius-install --host codex` |
| Command Code | — (rendered) | `cmd skills add adeerkhan/vitruvius` + `cmd mods add adeerkhan/vitruvius` |
| Cursor | `agents/cursor/rules/vitruvius.mdc` | `vitruvius-install --host cursor` (skills copied to `~/.cursor/skills/vitruvius`) |
| OpenCode | `agents/opencode/plugins/vitruvius.mjs` | `vitruvius-install --host opencode` |
| Pi | skills as a package | `pi install git:github.com/adeerkhan/vitruvius` |

The slash commands (OpenCode, Claude, Codex, Cursor), the seven OpenCode role
adapters, the Command Code mod, and the Cline/Qoder/Windsurf rulesets are all
rendered by the installer and are not stored in the repository.

## Adapter Discipline

- **Canonical definitions live once.** `agents/*.md` are the source of truth
  for role behavior (tool bounds, dispatch contracts, report shapes). Host
  adapters are thin pointers: "read `agents/<role>.md` and follow it exactly",
  with a refuse-if-missing fallback — never a copy of the content.
- **Tool bounds are declared per role** in `agents/*.md` frontmatter and
  mirrored in each adapter's tool map (e.g. verifier: read-only —
  `write: false, edit: false`).
- Adding a host = one `hosts[]` entry in `scripts/command-contract.mjs` +
  (optionally) an authored file under `agents/<host>/` + one README install row.
  The commands, rulesets, and manifests for it all follow; nothing else.
