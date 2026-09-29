# Commit rule

Every commit in this repo — from a human, a lead agent, or a subagent — is
written to this rule. Read it before `git commit`, not after.

The short version lives in `AGENTS.md`; this file is the detail and the
reasoning. A rule a model can talk itself out of is not a rule, so the
mechanical half of this is checked by `scripts/commit-message-check.mjs`.

## The format

Conventional Commits, which is what the history already uses:

```
type(scope): subject

Body. Why the change was needed and what it does, wrapped at 72 columns.
Anything a future reader could not reconstruct from the diff.
```

**Type** is one of: `feat`, `fix`, `docs`, `test`, `refactor`, `build`, `chore`.

**Scope** is optional but preferred, and names the area: a skill name
(`verifier`, `proposal`, `scholarly-research`), a script family
(`benchmark`, `security`, `steal-selfcheck`, `manifest`), or a repo area
(`repo`, `commands`, `references`).

**Subject** is imperative mood ("bound the download", not "bounds" or "bound
the download was"), lowercase after the colon, no trailing period. Keep it
under 72 characters; the history averages 59 and the longest recent subject is
87, which is the exception, not the target.

**Body** is where the honesty requirements below are met. Measured over the
last 40 commits, 38 have one. A subject-only commit is allowed for a
one-line typo fix and nothing else.

## What a subject may not claim

This is the part that matters, and it is the same rule the rest of the repo
runs on. See the integrity commandments in `AGENTS.md`.

- **Do not claim a fix landed without an on-disk proof.** If you did not read
  the file, run the script, or watch the test go red and then green, the
  subject cannot say the thing is fixed. It may say what you changed.
- **Do not publish a number you did not measure.** A benchmark figure, a count,
  or a coverage percentage must come from a command you ran in this session.
  Not from memory, not from a doc that quotes an older run.
- **Do not say "verified", "confirmed", or "checked"** unless the body names
  what was checked and how a reader could repeat it.
- **Do not mark a claim BLOCKED, PARTIAL, or NOT-DONE as done.** Those are
  valid outcomes. Say so in the subject.

Good subjects state the *finding*, not the activity:

```
fix(steal-selfcheck): count only the file types CodeGraph actually indexes
fix(scholarly): bound the PDF download that had no deadline
fix(scripts): repair two scripts that were 'covered' but never ran
```

These are the ones worth copying. Each names a specific defect a reader could
have found, and each says what the code now does about it.

Weak, and rejected here:

```
lint fixes & updated hero
CI pipeline failure
cleanup
removed the hard check(hasResults) that recorded a failure
```

## Before you commit

1. Run the gate that covers what you touched. `npm test` for anything that
   changes a script, a skill, a contract, or a doc. The focused suites named in
   `package.json` are enough when you know the blast radius.
2. Read `git diff --staged`. Confirm every file in it is one you meant to
   change, and that no `outputs/`, `ref/`, or benchmark snapshot is staged.
3. Confirm the working tree state you are describing. A commit that fixes a
   broken file is fine; a commit made from a tree whose test run was never
   observed is not.

`tests/routing/e1-misses.txt` and `tests/routing/last-misses.txt` are rewritten
by the routing eval on every `npm test` — a date stamp with unchanged numbers.
Do not stage them as if they were part of your change.

## What the checker cannot do

Run `node scripts/commit-message-check.mjs --explain` for the current list. Two
limits are worth knowing before you trust a green run:

- **The vagueness list is a known-offender list, not a completeness
  guarantee.** Every pattern in it corresponds to a subject this repo has
  actually produced. Deciding that "rename the label on the thing" asserts no
  finding is a judgement, and a regex cannot make judgements. A vague subject
  the list has not seen passes. The suite pins this boundary deliberately, so
  nobody later reads a green run as proof that every subject names a finding.
- **It cannot tell whether a claim is true.** A well-formed body claiming a fix
  that did not land is still well-formed. That is a reviewer's job.

## Never commit

- Secrets, tokens, or API keys. `scripts/security-scan.mjs` gates this, and a
  waiver for a finding is a machine-checked entry in that script, not a comment
  in the diff.
- `tasks/benchmark/run-api.mjs`. It carries a hardcoded API key as a fallback
  and is not functional here. It stays untracked on purpose; see `docs/STEAL.md`.
- Generated research output: `outputs/`, `papers/`, benchmark `results-*`
  snapshots. These are gitignored and are not evidence for a commit.
- A rejected change as if it were accepted. Append it to
  `docs/rejected-changes.md` with `node scripts/rejected-change-ledger.mjs
  append ...` — the ledger is append-only, and a rejection is a real result
  worth preserving.

## One commit, one adjudicated change

The unit is a change that could have been reverted on its own. This matters
most in this repo, where a single change often carries a behavior change, a
gate, a test, and a doc update: those belong together, because the gate is
what makes the behavior change trustworthy. What does not belong together is a
behavior change and an unrelated cleanup, or two rejected experiments.

A commit that touches a skill's `SKILL.md` must bump that skill's
`metadata.version` in the same commit. `scripts/commit-message-check.mjs`
enforces this by comparing the file before and after the commit.

## Fixups and reverts

Use `git commit --fixup=<sha>` and `git rebase --autosquash` for corrections
to a commit that has not shipped. Never amend a pushed commit; add a new one
that says what changed and why, referencing the commit it corrects.

## Enforcement

```bash
node scripts/commit-message-check.mjs                  # HEAD
node scripts/commit-message-check.mjs --commit <sha>   # any commit
node scripts/commit-message-check.mjs --file <path>    # a message file
npm run test:commit-message                            # the checks, with teeth
```

To gate your own commits, point git at the repo's hook and run it once per
clone:

```bash
git config core.hooksPath .githooks
```

This checks the mechanical half — type, subject shape, length, and the version
bump. It cannot check whether a claim in the body is true. That part is the
committer's responsibility, and the only check for it is a reviewer.
