---
description: Severity-graded adversarial review of an engineering artifact, with a revision plan. Usage: /review <artifact>
---

Run the engineering artifact review workflow on the $ARGUMENTS artifact:
activate `/skill:review`. Identify the artifact and its governing standard,
verify load-bearing items (loads, factors, material properties, code
sections, numbers, citations), and produce FATAL / MAJOR / MINOR findings each
anchored to a section or claim, plus a prioritized revision plan. Save to
`outputs/<slug>-review.md`. Do not praise vaguely or predict approval.
