# Engineering-Research: Context Management

To minimize API turns and context pressure:

1. **Write research notes to disk AFTER each search batch**
   - Don't accumulate search results in working memory
   - Extract what you need, write to `outputs/.drafts/<slug>-research-<scope>.md`, move on

2. **Read plans before continuing**
   - After interruption, re-read `outputs/.plans/<slug>.md` to restore context
   - Re-read your own research notes before drafting

3. **Bounded web searches**
   - Maximum 3-5 search queries per research phase
   - Extract findings to disk, then search again if needed
   - Don't loop on search — if 3 queries don't find it, mark `blocked`

4. **Progressive refinement**
   - First pass: plan + key sources (5-8 turns)
   - Second pass: draft from notes (5-8 turns)
   - Third pass: verify + provenance (5-8 turns)
   - Total target: 15-20 turns (not 25+)

5. **Token budget awareness**
   - See `references/token-budgets.md` for per-skill budgets
   - Default to quick/direct mode unless user asks for comprehensive
   - If approaching 80% of budget, deliver partial output with explanation
