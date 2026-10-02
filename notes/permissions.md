# File Write Permissions

Vitruvius research skills write artifacts to the `outputs/` directory. Each host
has its own permission model for enabling file writes.

## Command Code

Use `--yolo` or `--dangerously-skip-permissions`:
```bash
command-code --skill ./skills --yolo
```

Without this flag, the agent can read files but cannot create or modify them.
Research will still run, but artifacts will be returned in the chat response
instead of persisted to disk.

## OpenCode

File writes are enabled by default. No special configuration needed.

## Cursor

Cursor's auto-allow mode permits file writes in the project directory.
No special configuration needed.

## Claude Code

Add to `.claude/settings.json`:
```json
{
  "permissions": {
    "allow": ["Write", "Edit"]
  }
}
```

## Windsurf / Cline / Qoder

These hosts prompt for file write permission on first use. Accept the prompt
to enable Vitruvius artifact persistence.

## GitHub Copilot

Copilot's edit mode permits file writes. No special configuration needed.

## Verifying File Writes

After running a research task, check:
```bash
ls outputs/.plans/
ls outputs/.drafts/
ls outputs/*.md
```

If directories are empty, file writes are not enabled for your host.

## Artifact Locations

| Artifact | Path |
|----------|------|
| Research plan | `outputs/.plans/<slug>.md` |
| Research notes | `outputs/.drafts/<slug>-research-direct.md` |
| Draft brief | `outputs/.drafts/<slug>-draft.md` |
| Cited brief | `outputs/.drafts/<slug>-cited.md` |
| Final output | `outputs/<slug>.md` |
| Provenance | `outputs/<slug>.provenance.md` |

**Slug convention:** lowercase, hyphenated, no filler words, max 5 words
(e.g., `frp-strengthening-concrete-beams`).
