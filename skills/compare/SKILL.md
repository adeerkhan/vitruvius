---
name: compare
description: >
  Compare multiple engineering sources on a question — standards, code
  provisions, design alternatives, products, methods, datasheets — and produce
  a source-grounded comparison matrix of agreements, disagreements, and
  confidence. Use when the user asks to compare standards, weigh design
  options, choose between products or methods, or see where sources disagree.
argument-hint: "<what to compare>"
license: MIT
---

# Engineering Source Comparison

Run the shared `/skill:engineering-research` method with this deliverable
shape. Do not restate the research loop here.

## Workflow

1. **Plan** — name the comparison set, the dimensions to evaluate, and the
   expected matrix columns. Write `outputs/.plans/<slug>.md`. Get user
   confirmation before gathering.
2. **Scale** — direct search for 2–3 items; a `researcher` subagent only for a
   broad set (4+ items or multi-source).
3. **Gather** — use the discipline lens's evidence landscape. Read each source
   directly before describing it; record standard + section + edition.
4. **Build the matrix** — one row per item, columns covering:
   - source (standard/URL/artifact, with section + edition)
   - key claims or provisions
   - evidence type (code / datasheet / test / field / secondary)
   - caveats
   - confidence (`verified`, `inferred`, `blocked`)
5. **Cite** — inline citations `[1]`, `[2]`; verify every source means what it
   claims. Distinguish agreement, disagreement, and uncertainty clearly.
6. **Review** — run the adversarial pass; fix FATAL issues.

## Output

Save exactly one comparison to `outputs/<slug>-comparison.md`, ending with a
**Sources** section of standard + section, URLs, and artifact paths for every
row. For each disagreement between sources, state which is newer, which is
jurisdiction/application-specific, and what a decision-maker should weigh.
