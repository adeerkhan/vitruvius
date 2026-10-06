# Agent Portability

Vitruvius is an agent-portable skill distribution. The `skills/` directory
holds the core behavior; `agents/` holds the canonical role definitions; the
harness distribution (host packages + installer) lives in `installer/`.
Everything derivable is rendered at install time by `installer/install.mjs`,
which writes the target project's native dot-directories; the repository commits
no generated adapter output. `AGENTS.md` at the repo root is the always-on
ruleset every host reads for free.

Regenerated from the adapters on disk, 2026-10.

## Supported Hosts

| Host | Committed source | Install |
|------|------------------|---------|
| Claude Code | `installer/hosts/claude/plugin.json` | `npx skills add adeerkhan/vitruvius`, or `vitruvius-install --host claude` |
| Codex | `AGENTS.md` (native) | `npx skills add adeerkhan/vitruvius --agent codex`, or `vitruvius-install --host codex` |
| Command Code | — (rendered) | `cmd skills add adeerkhan/vitruvius` + `cmd mods add adeerkhan/vitruvius` |
| Cursor | `installer/hosts/cursor/rules/vitruvius.mdc` | `vitruvius-install --host cursor` (skills copied to `~/.cursor/skills/vitruvius`) |
| OpenCode | `installer/hosts/opencode/plugins/vitruvius.mjs` | `vitruvius-install --host opencode` |
| Pi | skills as a package | `pi install git:github.com/adeerkhan/vitruvius` |

The slash commands (OpenCode, Claude, Codex, Cursor), the seven OpenCode role
adapters, the Command Code mod, and the Cline/Qoder/Windsurf rulesets are all
rendered by the installer and are not stored in the repository.

## Global installs

`vitruvius-install --global` copies the Agent Skills bundle and shared ruleset
into each harness's global config root (`<root>/vitruvius/`). Roots and env
overrides mirror the reference distribution:

| Host | Root | Env override |
|------|------|--------------|
| Claude Code | `~/.claude/skills` | `CLAUDE_CONFIG_DIR` |
| Codex | `~/.codex/skills` | `CODEX_HOME` |
| OpenCode | `~/.config/opencode/skills` | `XDG_CONFIG_HOME` |
| Kilo | `~/.kilo/skills` | — |
| VS Code / Copilot | `~/.copilot/skills` | — |
| Prime Agent | `~/.prime/agent/skills` | `PRIME_AGENT_CODING_AGENT_DIR` |
| Oh My Pi | `~/.omp/agent/skills` | `PI_CODING_AGENT_DIR` |
| DeepSeek Harness | `~/.dsh/skills` | `DSH_HOME` |
| Hermes Agent | `~/.hermes/skills` | `HERMES_HOME` |
| Grok Build | `~/.grok/skills` | `GROK_HOME` |
| Reasonix | `~/.reasonix/skills` | `REASONIX_HOME` |

## Adapter Discipline

- **Canonical definitions live once.** `agents/*.md` are the source of truth
  for role behavior (tool bounds, dispatch contracts, report shapes). Host
  adapters are thin pointers: "read `agents/<role>.md` and follow it exactly",
  with a refuse-if-missing fallback — never a copy of the content.
- **Tool bounds are declared per role** in `agents/*.md` frontmatter and
  mirrored in each adapter's tool map (e.g. verifier: read-only —
  `write: false, edit: false`).
- Adding a host = one `hosts[]` entry (project) or one `homeHosts[]` entry
  (global) in `installer/contract.mjs` + (optionally) an authored file under
  `installer/hosts/<host>/` + one README install row. The commands, rulesets,
  and manifests for it all follow.
