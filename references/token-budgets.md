# Token Budgets

Approximate token costs per skill run. Use these to estimate cost and avoid runaway runs.

## By Skill

| Skill | Mode | Est. Tokens | Budget |
|-------|------|-------------|--------|
| engineering-research | direct | 3,000-5,000 | 8,000 |
| engineering-research | deep (subagents) | 8,000-15,000 | 20,000 |
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

## Cost-Saving Rules

1. **Default to quick/direct mode** unless user asks for comprehensive coverage
2. **Cap web searches** at 3-5 queries per phase (engineering-research)
3. **Limit subagents** to 3-4 max (engineering-research deep mode)
4. **Write notes to disk** after each search batch (reduces context pressure)
5. **Stop searching** after 3 queries with no results (mark `blocked`)

## Warning Thresholds

| Tokens | Action |
|--------|--------|
| > 50% of budget | Warn user, offer to continue or stop |
| > 80% of budget | Stop and deliver partial output with explanation |
| > 100% of budget | Abort, return best output so far, list what was not completed |
