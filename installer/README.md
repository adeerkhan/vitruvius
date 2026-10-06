# Installer

Everything that exists only because a coding agent expects files at a fixed
path lives here. Nothing generated is committed: the installer renders the
derived adapters into a target project's native dot-directories.

## Layout

| Path | What it is |
| --- | --- |
| `installer/contract.mjs` | Single source of truth: every slash command and each host's install targets. |
| `installer/render.mjs` | `renderAdapters()` — renders commands, OpenCode role adapters, rulesets, and the Command Code mod from the contract + `references/host-rules.md` + `agents/*.md`. |
| `installer/install.mjs` | The CLI. Copies the authored host files and calls the renderer. |
| `installer/hosts/<host>/` | Hand-authored host files only (the OpenCode plugin entry, the Claude and Qoder plugin manifests, the Cursor rule). |

## Usage

```bash
# Install every host into this project (writes .opencode/, .claude/, ...):
node installer/install.mjs --target . --all

# One host into another project:
node installer/install.mjs --target ../my-project --host opencode --host cursor
```

Exposed as the `vitruvius-install` bin. Installed dot-directories are derived
output; they are ignored at this repo's root, and should be added to
`.gitignore` in any project that installs them.

## Hosts

| Host | Authored source (`installer/hosts/<host>/`) | Installs to |
| --- | --- | --- |
| OpenCode | `opencode/plugins/` | `.opencode/` (plus rendered commands + role adapters) |
| Claude Code | `claude/plugin.json` | `.claude-plugin/plugin.json` (plus rendered commands) |
| Codex | — | `.codex/commands/` (rendered) |
| Cursor | `cursor/rules/vitruvius.mdc` | `.cursor/rules/` (plus rendered commands) |
| Command Code | — | `.commandcode/mods/vitruvius.ts` (rendered) |
| Cline | — | `.clinerules/vitruvius.md` (rendered) |
| Qoder | `qoder/plugin.json` | `.qoder-plugin/plugin.json` (plus rendered ruleset) |
| Windsurf | — | `.windsurf/rules/vitruvius.md` (rendered) |

Adding a host = one `hosts[]` entry in `installer/contract.mjs`, optionally an
authored file under `installer/hosts/<host>/`, and one README install row.
