# Plan State

The plan is a living document. It is written to disk at
`outputs/.plans/<slug>.md` and updated in place as the run progresses.
The filesystem is the working memory — an interrupted run resumes from the
plan on disk, not from a context window.

## Task Ledger Format

The plan's Task ledger uses a checkbox list. Each task is one line:

```markdown
## Task ledger

- [x] Derive slug and write plan
- [x] Gather evidence from standards
- [ ] Draft findings
- [ ] Run blind verifier
- [ ] Deliver final artifact
```

**Rules:**

- `[x]` = complete. `[ ]` = incomplete. No other states.
- One task per line. No nesting — sub-tasks belong in research notes.
- Check off a task only when its deliverable is on disk.
- Add new tasks when a phase reveals unplanned work. Append to the list;
  do not rewrite existing entries.
- Never remove a task; if it becomes irrelevant, mark it with a strikethrough
  and a reason: `- ~~Task~~ — reason for removal`.

## In-Place Updates

At each phase boundary (after Gather, after Draft, after Verify, after
Review), update the plan before moving to the next phase:

1. Check off completed tasks.
2. Add any new tasks the phase revealed.
3. Record verifier verdicts in the Verification log.
4. Record decisions (scale changes, dropped sources, revised claims) in
   the Decision log.

This keeps the plan synchronized with reality so that an interrupted run
can resume from disk without losing state.

## Overwrite Guard

Before writing a plan to `outputs/.plans/<slug>.md`, check whether a file
already exists at that path. If it does:

1. Read the existing file.
2. If it has **no incomplete tasks** (`[ ]`), overwrite it silently.
3. If it has **incomplete tasks for different work**, stop and ask the user
   before writing. Never silently overwrite an incomplete plan.
4. If it has **incomplete tasks for the same work**, this is a plan pickup
   (see below), not an overwrite.

## Cross-Session Plan Pickup

When a plan already exists for the same slug and has incomplete tasks for
the same work:

1. Read the existing plan.
2. Identify the first incomplete task.
3. Resume from that task. Do not start over.
4. Update the plan's Decision log with a note that this is a resumed run.

This is what makes long-running research sessions possible without
context overflow — the plan on disk carries the state, not the model's
context window.
