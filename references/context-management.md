# Engineering-Research: Context Management

Context management keeps the working set small. It is not a reason to stop
early. Depth is the user's decision.

## Effort budget comes from the user

- If the user gives a turn or token budget ("run ~200 turns", `--turns 200`,
  `--budget 150000`), record it in the plan, track progress against it, and say
  when you approach it. Ask before exceeding a user-set ceiling.
- With no budget, default to thorough: keep researching while each round still
  adds grounded evidence that answers a named question. Do not impose an
  internal turn count.
- A narrow "what is X" explainer may saturate in a few calls; a multi-domain
  survey may run much longer. Saturation is evidence-driven, not count-driven.
- The user can change the budget mid-run. "Keep going" raises it; "stop here"
  lowers it. Honor both.
- If you stop early, never deliver partial work silently: name what is missing
  and why you stopped.

## Keep the working set small without capping depth

1. **Write research notes to disk after each search batch**
   - Don't accumulate search results in working memory
   - Extract what you need to `outputs/.drafts/<slug>-research-<scope>.md`, move on

2. **Re-read plans and notes after an interruption**
   - Re-read `outputs/.plans/<slug>.md` to restore context
   - Re-read your own research notes before drafting

3. **Change tactics before declaring a dead end**
   - If a few queries return nothing new, try different terms, indexes, or
     related questions. Mark a question `blocked` only when you can name the
     indexes and terms you exhausted.

4. **Track budget, don't obey a phantom one**
   - See `references/token-budgets.md` for per-skill estimates. Those are
     planning numbers; a user-set budget overrides them, and no user-set budget
     means no forced stop.
