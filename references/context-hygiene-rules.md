# Context Hygiene Rules

Write findings to disk progressively. Do not accumulate returned page text in
working memory — extract what you need, write it to file, move on.

## Rules

1. **Write findings progressively.** After each batch of search results, write
   the relevant findings to the output file. Do not accumulate in working
   memory and write at the end.

2. **Extract and discard immediately.** When a fetch returns a large page,
   extract the relevant quotes and discard the rest immediately. Do not keep
   the full page in context.

3. **Triage by title/snippet first.** If a search produces 10+ results, triage
   by title and snippet first. Only fetch full page text for the top candidates.

4. **Return a one-line summary to the parent.** The parent reads the output
   file. Do not dump full content into the parent context.

5. **Track multiple questions explicitly.** If you were assigned multiple
   questions, track them in the file and mark each as `done`, `blocked`, or
   `needs follow-up`. Do not silently skip questions.

6. **Re-read plans after an interruption.** Before resuming, read the plan and
   any research notes to restore context.

7. **Small batches.** Write after each meaningful chunk of work, not at the end.

8. **Disk is the source of truth.** If it is not on disk, it did not happen.

## Why This Matters

Context is the most expensive resource in a research run. A researcher
subagent that accumulates 20 pages of fetched text in working memory will
degrade in quality as context fills. A researcher that extracts 3 relevant
quotes per page and writes them to disk will maintain quality throughout the
run.

## Integration with Plan-as-Working-Memory

Context hygiene and plan-as-working-memory are complementary:

- **Context hygiene** keeps the researcher's working memory clean by writing
  to disk immediately.
- **Plan-as-working-memory** keeps the run's state synchronized by updating
  the plan at phase boundaries.

Together, they ensure that an interrupted run can resume from disk without
losing state, and that a researcher subagent does not degrade over a long run.
