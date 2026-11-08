# Datasheet brief — blocked on the document

## Status: BLOCKED — no datasheet was provided

I can't summarize it yet. Your message points at "this datasheet," but no file was attached, no path was given, and nothing matching a datasheet is in the working directory (`/home/adeerkhan/github/vitruvius`). I won't reconstruct ratings, limits, or part numbers from memory or from the product's general reputation.

**Send any one of these and I'll proceed:**
- a file path (e.g. `datasheets/<part>.pdf`)
- a URL
- the manufacturer + exact part number + revision, so I can pull the current datasheet

Useful extras: the section or parameter range you care about, and the target audience (selection, integration, or compliance).

## What the brief will contain

Once I can read the source, every value stays tied to its page, table, and section. Nothing gets rounded or filled in.

| Field | What I'll report |
|---|---|
| Document identity | Manufacturer, part number, revision/date, page count |
| Ratings | Parameter, value **with its unit**, test condition, table/section reference |
| Absolute maximums | Limits verbatim, with notes and footnotes |
| Recommended operating conditions | Min / typ / max **as printed**, with units |
| Performance curves | Caption, axes and units, page reference; digitized values flagged as read-from-graph |
| Pinout / package | Pin functions and package drawing, with page |
| Compliance / markings | Standards named by the datasheet, with edition if stated |

Then, separately:
- **Missing or unreadable:** scanned pages, split tables, values present only in a graph, or parameters the datasheet does not specify — marked `—` and `not stated`, never guessed.
- **Cross-checks:** internal inconsistencies (e.g. a headline rating versus its test-condition table) called out rather than smoothed over.

## What I need from you

The datasheet itself. With it, turnaround is a single pass; without it, any "summary" would be invention.

Research-support output only — not for final engineering sign-off.
