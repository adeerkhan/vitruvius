---
description: Verify an engineering claim, number, or calculation against authoritative sources, with a verdict. Usage: /verify <claim or calculation>
---

Run the engineering verification workflow on the $ARGUMENTS claim: activate
`/skill:verify`. Restate the claim precisely (units, sign convention, named
object), find and read the governing source directly, re-run any math with
units, and issue a verdict (`verified` / `contradicted` / `partial` /
`unverifiable`) with the evidence trail. Save to
`outputs/<slug>-verification.md`. Never soften a contradicted or blocked
verdict.
