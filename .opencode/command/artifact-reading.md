---
description: Anchored reading and extraction from PDFs, datasheets, drawings, specs, standards, or code files. Usage: /artifact-reading <document>
---

Run the engineering artifact-reading workflow on the $ARGUMENTS document:
activate `/skill:artifact-reading`. Map the document structure first, anchor
every extract to a location (page/section/table/figure/sheet/zone), read all
pages the answer depends on (including datasheet table notes), cross-check
conclusions, and record provenance. Never fill a gap you could not read —
mark it `blocked`.
