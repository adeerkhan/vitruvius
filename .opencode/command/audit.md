---
description: Audit a claim or spec against its implementation (paper-vs-code, spec-vs-design, standard-vs-as-built). Usage: /audit <target>
---

Run the engineering audit workflow on the $ARGUMENTS target: activate
`/skill:audit`. Outline what is being compared and which claims to check, read
both sides directly (the actual code/provision, not the README/title), and
produce a claim-by-claim match/mismatch/missing report flagging ambiguous
defaults and reproduction risks. Save to `outputs/<slug>-audit.md`.
