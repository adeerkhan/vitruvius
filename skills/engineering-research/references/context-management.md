# Context Management

Write notes to disk after each batch and re-read plans after an interruption.
**Effort is the user's call:** honor `--turns`/`--budget` or plain language;
keep researching while rounds add grounded evidence, and never stop at a fixed
turn count.

## Principles

- **Disk is the source of truth.** If it is not on disk, it did not happen.
- **Small batches.** Write after each meaningful chunk of work, not at the end.
- **Re-read after interruption.** Before resuming, read the plan and any research notes to restore context.
- **Budget is a ceiling, not a target.** If evidence saturates before the budget is spent, stop. If the budget is hit mid-investigation, note what is incomplete.
- **Record the choices.** Context management is an experimental variable, not
  plumbing: the study's W3 — a reviewer claiming the paper is missing what it
  states — traces to context summarization dropping information the reviewer
  needed (arXiv:2605.20668). The provenance `Agent configuration` field records
  the trim strategy, which turns/state were preserved across compactions, any
  condenser that rewrote context, and the model settings, so a later comparison
  can attribute a difference to the method rather than to the plumbing.
