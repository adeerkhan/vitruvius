# Table extraction — blocked on the document

## Status: BLOCKED — no PDF was provided

I cannot extract anything yet. Your message references "this 80-page specification PDF", but no file was attached to the conversation and none is present in the working directory (`/home/adeerkhan/github/vitruvius`) or the session temp folder. I will not guess what the tables contain, and I will not describe a document I have not opened.

**Please provide either:**
- the file path (e.g. `spec.pdf`, or an absolute path), or
- a URL I can fetch, or
- if the file is already staged, its exact location.

Optional but useful: the page range you care about, and whether you want Markdown tables, CSV, or both.

## What the extraction will preserve

Once I have the file I will run a page-anchored read (`scripts/extract-pdf.mjs`, `[[page N]]` markers, `sha256` of the source) and return, for every table:

| Field | Content |
|---|---|
| Table identifier | Table number + full caption, as printed |
| Location | Page number and governing section/clause |
| Structure | Column headers, units, merged/spanning cells, footnotes and table notes |
| Data | Cell values verbatim, no rounding, blanks marked `—` (not empty) |
| Verification | Normative vs informative status where the spec distinguishes it (`shall` vs `should`/`may`) |

Also reported:
- Document identity: title, revision/edition, date, page count.
- Extraction method (text layer vs OCR/vision) and a `warnings` list — scanned pages, rotated text, split tables, missing glyphs.
- A table index (page → table number → caption) so you can see any table I could not read, marked `blocked` with the reason.

Every cell stays tied to its page so it can be re-checked. Unreadable content is reported as unreadable, never reconstructed.

Research-support output only — not for final engineering sign-off.
