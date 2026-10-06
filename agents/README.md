# Vitruvius agent tree

`skills/` is the harness-agnostic core. `agents/` holds the canonical role
definitions and the few host files that are genuinely hand-authored. Everything
that can be derived from those sources is rendered at install time by
`scripts/install-adapters.mjs`, so the repository commits **no** duplicated or
generated adapter output.

## Committed sources

| Path | What it is |
| --- | --- |
| `agents/*.md` | Canonical role definitions (researcher, writer, verifier, reviewer, arbiter, goal-checker, habit). Source of truth for role behavior; host role adapters point at these files. |
| `agents/opencode/plugins/vitruvius.mjs` | OpenCode plugin entry |
| `agents/claude/plugin.json` | Claude Code plugin manifest |
| `agents/qoder/plugin.json` | Qoder plugin manifest |
| `agents/cursor/rules/vitruvius.mdc` | Cursor always-on rule |

## Rendered at install time (never committed)

- Slash-command stubs for OpenCode, Claude, Codex, and Cursor, from `scripts/command-contract.mjs`
- OpenCode role adapters, from `agents/*.md`
- The Command Code mod, from `scripts/command-contract.mjs`
- The Cline / Qoder / Windsurf rulesets, from `references/host-rules.md`

## Hosts

| Host | Committed source | Installs to |
| --- | --- | --- |
| OpenCode | `agents/opencode/plugins/` | `.opencode/` (plus rendered commands + role adapters) |
| Claude Code | `agents/claude/plugin.json` | `.claude-plugin/plugin.json` (plus rendered commands) |
| Codex | — | `.codex/commands/` (rendered) |
| Cursor | `agents/cursor/rules/vitruvius.mdc` | `.cursor/rules/` (plus rendered commands) |
| Command Code | — | `.commandcode/mods/vitruvius.ts` (rendered) |
| Cline | — | `.clinerules/vitruvius.md` (rendered) |
| Qoder | `agents/qoder/plugin.json` | `.qoder-plugin/plugin.json` (plus rendered ruleset) |
| Windsurf | — | `.windsurf/rules/vitruvius.md` (rendered) |

## Install

```bash
node scripts/install-adapters.mjs --target . --all
node scripts/install-adapters.mjs --target ../my-project --host opencode --host cursor
```

Installed dot-directories are derived output. At the repository root they are
ignored, so `git status` stays clean; in any other project, add the host
directories to `.gitignore` if you do not want them tracked.
