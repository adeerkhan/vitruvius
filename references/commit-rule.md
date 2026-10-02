# Commit rule

Every commit in this repo — from a person or an agent — follows this rule.
Read it before `git commit`, not after.

The short version is in `AGENTS.md`. This file has the detail.
A rule an agent can argue its way out of is not a rule, so a script checks the
parts a script can check: `scripts/commit-message-check.mjs`.

## The format

```
type(scope): subject

Body. Why the change was needed and what it does, wrapped at 72 columns.
Anything a future reader could not work out from the diff.
```

**Type** is one of: `feat`, `fix`, `docs`, `test`, `refactor`, `build`, `chore`.

**Scope** is optional but preferred. Name the area: a skill
(`verifier`, `proposal`, `scholarly-research`), a script family
(`benchmark`, `security`, `manifest`), or a repo area
(`repo`, `commands`, `references`).

**Subject** is a command, not a description. Write "bound the download", not
"bounds" or "bound the download was". Start it lowercase after the colon. Do not
end it with a period. Keep it short: 72 characters is the target.

**Body** carries the honest claims, which are the rules further down. Most
commits in this repo have one. A subject-only commit is fine for a one-word
typo fix and nothing else.

## The subject must name what was wrong

This is the part that matters most.

- **Do not claim a fix landed unless you proved it.** If you did not read the
  file, run the script, or watch the test go red and then green, the subject
  cannot say the thing is fixed. It may say what you changed.
- **Do not publish a number you did not measure.** A score, a count, or a
  percentage must come from a command you ran. Not from memory. Not from a doc
  that quotes an older run.
- **Do not write "verified", "confirmed", or "checked"** unless the body says
  what was checked and how someone could repeat it.
- **Do not call something done when it is blocked.** A blocked or partial result
  is a real result. Say so in the subject.

Subjects worth copying. Each names a real defect, and each says what the code
does about it now:

```
fix(scholarly): bound the PDF download that had no deadline
fix(scripts): repair two scripts that were 'covered' but never ran
test(gates): no gate may be silently unwired
feat(security): give the scanner a machine-enforced allowlist
```

Subjects that are refused, because each one says nothing:

```
lint fixes & updated hero
CI pipeline failure
cleanup
removed the hard check(hasResults) that recorded a failure
```

## Before you commit

1. Run the check that covers what you touched. Use `npm test` for any change to
   a script, a skill, a contract, or a doc. The smaller suites in `package.json`
   are enough when you know what your change can reach.
2. Read `git diff --staged`. Check that every file in it is one you meant to
   change. Check that nothing generated is in it: not `outputs/`, not `papers/`,
   not a benchmark snapshot, and not any vendored copy of another project.
3. Check the tree state you are about to describe. Committing a fix to a broken
   file is fine. Committing from a tree whose test run you never saw is not.

Two files under `tests/routing/` are rewritten by the routing check on every
`npm test`. The change is a date and nothing else. Do not stage them as part of
your work.

## What the checker cannot do

Run `node scripts/commit-message-check.mjs --explain` for the current list. Two
limits are worth knowing before you trust a green run.

- **The vague-subject list only knows the cases it has seen.** Every entry came
  from a subject this repo has actually written. Deciding that "rename the label
  on the thing" says nothing is a judgement call, and a pattern cannot make
  judgements. A vague subject the list has not seen will pass. A test pins this
  limit on purpose, so nobody later reads a green run as proof that every
  subject names a defect.
- **It cannot tell whether a claim is true.** A well-written body claiming a fix
  that never landed is still well written. That takes a reader.

## Never commit

- Secrets, tokens, or API keys. `scripts/security-scan.mjs` checks for them. If
  one is a real false positive, the waiver is a checked entry in that script,
  not a comment in the diff.
- `tasks/benchmark/run-api.mjs`. It has a hardcoded API key in it and does not
  work here. It stays untracked on purpose.
- Generated research output: `outputs/`, `papers/`, and benchmark `results-*`
  folders. These are ignored by git. They are not evidence for a commit.
- A rejected change dressed up as accepted work. Rejections go into
  `notes/rejected-changes.md` with `node scripts/rejected-change-ledger.mjs
  append ...`. That file only ever grows, and a rejection is worth keeping.

## One commit, one change

A commit should be one change you could undo on its own. In this repo a change
often touches several files on purpose: the behaviour, the check that guards it,
the test, and the doc. Those belong together, because the check is what makes
the behaviour trustworthy. What does not belong together is a behaviour change
and an unrelated tidy-up, or two separate experiments.

A commit that changes a skill's `SKILL.md` must raise that skill's
`metadata.version` in the same commit. The script checks this by comparing the
file before and after.

## Fixes to earlier commits

Use `git commit --fixup=<sha>` and `git rebase --autosquash` for a correction to
a commit that has not shipped. Never rewrite a commit that has been pushed. Add
a new commit that says what changed and why, and name the commit it corrects.

## Running the check

```bash
node scripts/commit-message-check.mjs                  # the last commit
node scripts/commit-message-check.mjs --commit <sha>   # any commit
node scripts/commit-message-check.mjs --file <path>    # a message file
npm run test:commit-message                            # the tests for the check
```

To have git run it for you, point git at the hook once per clone:

```bash
git config core.hooksPath .githooks
```

The check covers the type, the shape of the subject, the length, and the
version bump. It cannot tell whether a sentence in the body is true. That is
the writer's job, and the only real check for it is a reader.
