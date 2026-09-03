---
description: Read and condense a standard, spec, datasheet, or paper faithfully, preserving numbers and caveats. Usage: /summarize <document>
---

Run the engineering document summary workflow on the $ARGUMENTS document:
activate `/skill:summarize`. Read the whole document (not just the abstract),
extract scope, governing requirements with section numbers, key values with
units, and caveats. Mark unreadable parts `blocked`. Save to
`outputs/<slug>-summary.md` when an artifact is wanted.
