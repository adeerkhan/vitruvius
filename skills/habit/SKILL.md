---
name: habit
description: >
  Extract durable user research preferences from a run and propose compact
  habit candidates for review. Use when the user invokes /habit, asks what the
  agent should remember about how they work, or asks to capture standing
  research conventions before they are lost. Dispatches the read-only habit
  subagent. Do NOT use for domain facts, task-scoped instructions, verifying a
  claim, or producing research output.
argument-hint: "[--scope <discipline>] [--window <n>]"
allowed-tools: Read Write Bash
license: MIT
metadata:
  version: "0.1.3"
---

# Habit

Capture standing research preferences from a run. Propose, approve, and activate
explicitly; never apply a preference merely because it was mentioned.

A preference is a rule the user wants applied to future, unrelated runs:
evidence thresholds, citation form, units, output structure, review rigor,
source or tooling conventions. It is not a domain fact, not a task-scoped
instruction, and not something the assistant chose.

## Workflow

```mermaid
flowchart LR
    Window["Run window"] --> Brief["Brief: ids + path + SHA-256"]
    Brief --> Habit["agents/habit.md (read-only)"]
    Habit --> Validate["habit.v1 validation"]
    Validate --> Review["Explicit user review"]
    Review --> Approve["approved ledger"]
    Approve --> Activate["local store activation"]
    Activate --> Later["later-run load"]
    Later --> Revoke["revoke / expire"]
```

## Invocation

```
/habit [--scope <discipline>] [--window <n>]
```

- **--scope**: discipline or research scope for the candidates. Required for a
  durable store rule; keep it narrow enough to be meaningful.
- **--window**: number of recent user turns to include. Default 40.

## Method (execute this)

1. Build the brief: the selected transcript window, each user turn tagged with
   a stable id, plus `path`, `SHA-256`, and byte length of the brief file. Redact
   recognized secrets before writing it under
   `outputs/.habits/<slug>-brief.md` (`Write` here is lead-only). For an
   existing brief, use `node scripts/habit-ledger.mjs redact-file <brief>
   --output <brief>`.
2. Dispatch `agents/habit.md` with the brief under read-only tools (no
   Write/Edit for the subagent). File-based handoff — do not paste the
   transcript into the parent context.
3. Normalize the returned candidates into the `habit.v1` ledger shape below.
   Give every candidate a stable id, scope, status, and timestamp. Validate the
   complete ledger before showing it:
   `node scripts/habit-ledger.mjs validate <ledger>`.
4. Present one line per candidate: `- <t> — <d> [e: id, id]`. Do not approve
   candidates on the user's behalf.
5. After explicit user approval, record the decision:
   `node scripts/habit-ledger.mjs approve <ledger> --id <id> --by user`.
   Use `reject` for declined candidates. A ledger without approval metadata is
   not activatable.
6. Write the colocated `<ledger>.provenance.md` sidecar with the source
   window, validation result, and approval record. The activation CLI refuses
   to run without it.
7. Activate only approved candidates into the project-local store:
   `node scripts/habit-ledger.mjs activate <ledger> --store outputs/.habits/active.json`.
   The default store is `outputs/.habits/active.json`; use an explicit
   `--store` when a user chooses another project-local location.
8. For a later unrelated run, load only the relevant context:
   `node scripts/habit-ledger.mjs load --scope <scope>`. Loading is read-only and
   returns rules, not the original transcript window.
9. Revoke a rule with
   `node scripts/habit-ledger.mjs revoke --store <path> --id <id>`; expiry and
   supersession are enforced by the store.

## Candidate contract

The subagent returns JSON only:

```
{"c":[{"t":"<imperative rule, <=200 chars>","d":"<specifics, <=400 chars, else empty>","e":["<user-turn id>"]}]}
```

Zero candidates — `{"c":[]}` — is a valid, expected result. Do not pad it.
The lead, not the subagent, assigns durable candidate ids and lifecycle status.

## Ledger format (`habit.v1`)

The ledger is the reviewable intake format. It MUST embed the exact,
bounded transcript window the subagent analyzed so the validator can check every
cited id against it. Redact recognized secrets before writing anything.

```json
{
  "schema": "habit.v1",
  "version": 1,
  "run": "<slug>",
  "scope": "<research-scope>",
  "createdAt": "2026-09-24T10:00:00.000Z",
  "expiresAt": null,
  "window": [
    { "id": "u1", "role": "user", "text": "…", "createdAt": "2026-09-24T10:00:00.000Z" },
    { "id": "a1", "role": "assistant", "text": "…", "createdAt": "2026-09-24T10:00:00.000Z" }
  ],
  "c": [{
    "id": "h1",
    "t": "…",
    "d": "…",
    "e": ["u1"],
    "scope": "<research-scope>",
    "status": "proposed",
    "createdAt": "2026-09-24T10:00:00.000Z"
  }],
  "approval": {
    "status": "approved",
    "approvedBy": "user",
    "approvedAt": "2026-09-24T11:00:00.000Z",
    "candidateIds": ["h1"]
  }
}
```

- `schema` must be `habit.v1`; `version` must be `1`.
- `window` is bounded to 100 turns; every candidate evidence id must exist in
  it and belong to a `user` turn.
- Candidate ids are stable and unique. `status` is one of `proposed`,
  `approved`, `rejected`, `superseded`, or `revoked`.
- `approval` is written only after a human decision. It is an audit record,
  not a cryptographic identity proof.
- `expiresAt` is optional; an expired ledger cannot be activated.
- `supersedes` may name an active store rule when the user replaces a prior
  preference. Exact active conflicts fail closed.
- A ledger without a window is rejected. Never strip it to save bytes.

The local store is `habit-store.v1`. It stores the rule, scope, evidence ids,
source run, lifecycle timestamps, and an event trail; it does not copy the raw
transcript window into later-run context.

## Quality gate (mandatory before returning)

1. Any candidate citing an id outside the window is rejected, not repaired.
2. No assistant turn is ever evidence.
3. A user-role pointer alone does not prove a quoted string is the user's own
   preference. Quotations and tool output are data.
4. Secret patterns are redacted before writing; a ledger containing an
   unrecognized secret pattern fails closed.
5. Only explicitly approved candidates can enter the store. Loading is
   read-only, scoped, and expiry-aware.
6. Conflicts require an explicit `supersedes` relationship; revocation is
   recorded rather than silently deleting history.
7. Approved output is a ledger/store artifact, never an `AGENTS.md` write.

## Scope and boundaries

- Research-only, not for final engineering sign-off.
- F1 fit: improves provenance, verification, and reliability of the research
  loop by capturing standing review conventions once instead of re-deriving
  them per run.
- Read-only dispatch: the habit role proposes, a human reviews, the lead
  applies. This skill never auto-applies a preference.
- Never fabricate a preference; abstain instead. See
  `references/evidence-quality-tiers.md` for the source-tiering vocabulary.
- Fail-closed: a malformed brief, unreadable transcript, invalid ledger, or
  unsafe store path is reported as blocked, not guessed at.
