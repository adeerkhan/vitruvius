---
name: artifact-reading
description: >
  Read and extract content from engineering documents and artifacts — PDFs,
  datasheets, drawings, specifications, standards, code files — accurately and
  completely. Use when a task needs methods, values, tables, figures, or
  claims from a document or across multiple documents, and the answer depends
  on more than one page or section. Teaches the agent HOW to read this stuff:
  parse, anchor to locations, cross-check, and record provenance.
argument-hint: "<document(s) to read>"
license: MIT
---

# Engineering Artifact Reading

Read and extract from engineering documents accurately. This is the reading
half of the research loop, made explicit: most research failures are reading
failures — answering from one page, from a title, or from memory.

## Workflow

1. **Map the document first.** Before answering, parse enough to know the
   structure: title, revision/edition, table of contents, sections, tables,
   figures, appendices, and where the normative (required) content lives vs
   the informative (guidance) content.

2. **Anchor every extract to a location.** Page/section/table/figure numbers
   for PDFs and standards; sheet + zone for drawings; clause + line for code.
   Keep table values, figure labels, part numbers, and quoted snippets tied to
   their location so they can be re-checked.

3. **Read the pages the answer depends on.** Do not answer from a single
   visible page when the question spans methods, tables, notes, or appendices.
   For a datasheet, read the notes under the tables — that is where the
   limits live.

4. **Cross-check** — when a conclusion depends on multiple parts of a document
   (a value in a table, a note, a referenced section), verify they agree.
   Check normative references when the source points at another document.

5. **Record provenance** — save extracted notes with their source locations as
   artifacts for the research run. Never strip the location when handing
   findings to synthesis.

## Reading by artifact type

- **Standard/code**: section + edition + table/figure number; distinguish
  normative (shall) from informative (should/may) and commentary.
- **Datasheet**: the part number and revision; table notes; absolute maximum
  ratings vs recommended operating conditions; test conditions behind specs.
- **Drawing**: title block (revision, scale), sheet layout, zone grid,
  dimension units and tolerances, general notes.
- **Paper/report**: abstract, methods, results, limitations — do not infer
  results from the abstract.
- **Specification**: scope, referenced documents, requirement clauses, and the
  verification method each requirement is measured against.

## Boundaries

- Never fill a gap you could not read. Mark it `blocked` and say what was
  unreadable and why (paywall, missing page, unreadable scan, binary format).
- Do not answer from a title, filename, or snippet when a direct read is
  possible — that is the integrity commandment, applied to reading.
