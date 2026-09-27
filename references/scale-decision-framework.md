# Scale Decision Framework

Make the scale decision before assigning owners. The decision is based on
topic complexity, not on the agent's mood or the user's tone.

## Direct Search (lead-owned, no subagents)

Use direct search for:

- Single fact or narrow question, including "what is X" explainers
- Work you can answer with 3-10 tool calls
- Single-discipline questions with a clear answer

For "what is X" explainer topics, do NOT spawn researcher subagents unless
the user explicitly asks for comprehensive coverage, current landscape,
benchmarks, or production deployment. Do not inflate a simple explainer
into a multi-agent survey.

## Subagents (decomposed, parallel)

Use subagents only when decomposition clearly helps:

| Topic shape | Researchers | Why |
|-------------|-------------|-----|
| Direct comparison of 2-3 items | 2 | Each item gets a dedicated evidence gatherer |
| Broad survey or multi-faceted question | 3-4 | Each facet gets a dedicated researcher |
| Complex multi-domain research | 4-6 | Each domain gets a dedicated researcher |

## Decision Flow

1. **Is the question answerable with 3-10 tool calls?** → Direct search
2. **Is it a "what is X" explainer?** → Direct search (unless user asks for comprehensive coverage)
3. **Does it compare 2-3 items?** → 2 researchers
4. **Is it a broad survey or multi-faceted?** → 3-4 researchers
5. **Is it complex multi-domain?** → 4-6 researchers

## Anti-patterns

- **Inflating a simple explainer into a multi-agent survey.** If the user asks "what is X", answer it. Do not spawn 4 researchers to produce a literature survey.
- **Spawning subagents for a single-source answer.** If the answer is in one standard or one doc, read it directly.
- **Using subagents when the lead can synthesize faster.** Subagents add coordination overhead. If the lead can read 3 sources and synthesize in one pass, do that.

## Record the Decision

Record the scale decision in the plan:

```
Scale: direct search (single fact, 3-10 tool calls)
```

or

```
Scale: 3 researchers (broad survey — facets: materials, manufacturing, cost)
```

This makes the decision auditable and prevents mid-run scope drift.
