# Token Budgets

Approximate token costs per skill run. Use these to plan cost, not to stop
research early. A budget is a ceiling the user sets (see
`context-management.md`), not an internal switch the agent imposes.

## By Skill

| Skill | Mode | Est. Tokens | Budget |
|-------|------|-------------|--------|
| engineering-research | direct | 5,000-20,000 | user-set, else saturation |
| engineering-research | deep (subagents) | 30,000-150,000+ | user-set, else saturation |
| gap-analysis | quick | 2,000-3,000 | 5,000 |
| gap-analysis | deep | 5,000-8,000 | 12,000 |
| evidence-ranking | — | 2,000-4,000 | 6,000 |
| verifier | direct | 1,500-2,500 | 4,000 |
| verifier | blind | 2,000-3,500 | 5,000 |
| design-alternatives | — | 3,000-5,000 | 8,000 |
| fmea-brainstorm | — | 2,000-3,500 | 5,000 |
| proposal | full pipeline | 15,000-25,000 | 35,000 |
| summarize | — | 1,500-3,000 | 4,000 |
| compare | — | 2,000-4,000 | 6,000 |
| review | — | 2,000-3,500 | 5,000 |
| audit | — | 2,500-4,000 | 6,000 |
| eli5 | — | 1,000-2,000 | 3,000 |
| standards-lookup | — | 1,500-2,500 | 4,000 |
| scholarly-research | — | 2,000-3,500 | 5,000 |
| artifact-reading | — | 1,000-2,000 | 3,000 |

Estimates, not limits. A user-set `--turns`/`--budget` overrides the table for
that run.

## Cost-Saving Rules

1. **Cheaper modes are a user choice, not a default.** `--quick` exists because
   the user may want it; substantive research runs thorough.
2. **Honor a user-set budget** (`--turns`, `--budget`, or plain language):
   record it in the plan, track it, and announce when you approach it.
3. **Cap duplicate work, not coverage.** Write notes to disk after each search
   batch to keep context small. That lowers cost without capping depth.
4. **Change tactics before declaring a dead end.** If a few queries return
   nothing new, switch terms/indexes; mark `blocked` only when you can name what
   you exhausted.
5. **Scale subagents to the decomposition**, not to a token panic (see the
   engineering-research scale step).

## Warning Thresholds

| Situation | Action |
|-----------|--------|
| > 50% of a **user-set** budget | Say so, and continue unless the user stops you |
| > 80% of a **user-set** budget | Ask before continuing; if the user says keep going, keep going |
| No user-set budget | No forced stop: continue while evidence is still arriving, and report saturation honestly |

If you must stop before the question is answered, deliver what exists with
`Verification: PARTIAL` or `BLOCKED` and list the missing checks. Never present
partial work as complete.
