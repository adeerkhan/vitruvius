---
name: summarize
description: >
  Read and condense a technical engineering document — standard, code section,
  specification, datasheet, handbook chapter, research paper, or report — into
  a faithful, structured summary. Use when the user asks "summarize this
  standard/spec/datasheet/paper", wants the key requirements extracted, or
  needs a digestible brief of a dense document. Preserves numbers, units, and
  caveats; never launders uncertainty.
argument-hint: "<document to summarize>"
allowed-tools: Write Edit Bash Read
license: MIT
---

# Engineering Document Summary

Read a technical document and condense it faithfully. Reading is a research
act: do not summarize what you have not actually read.

## Workflow

Follow the artifact contract: save summary to `outputs/<slug>-summary.md`.

1. **Read the whole document** — not just the abstract or first pages. For a
   standard, map its scope, normative references, and the sections that govern
   the question. For a datasheet, read the tables and notes, not just the
   headline specs.
2. **Extract, don't invent** — every number, unit, and provision in the
   summary must come from the document. Preserve:
   - scope and applicability (what it does and does not cover)
   - governing requirements with section numbers
   - key values: limits, factors, properties, tolerances — with units
   - notes, caveats, and exceptions
3. **Keep the structure** — section references map to the original so a reader
   can jump to the source.
4. **Mark what is missing** — if the document is paywalled, partial, or a
   figure/table could not be read, say so (`blocked`), and never fill the gap
   from memory or another source.

## Output

A structured summary. For a standards/spec document, prefer this shape:

- What it is and when it applies
- Governing requirements (by section)
- Key values (table with units)
- Exceptions and caveats
- What was not readable (`blocked`)

Save to `outputs/<slug>-summary.md` when the user wants an artifact; otherwise
answer inline. Always cite the document (standard + edition, URL, or path).
