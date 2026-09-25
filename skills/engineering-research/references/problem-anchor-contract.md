# Problem-anchor contract

A research run can produce a fully cited literature review that never touches the
artifact it was commissioned about. The failure is not relevance — it is
grounding. Nothing in the citation rules stops an agent from asserting that a
codebase lacks a module, uses a dependency, or needs an architectural change
without opening the codebase.

`vitruvius-problem-anchor.v1` closes that gap. It is a machine record written
beside the candidate that binds the run to the artifacts it studied, requires
every finding to name the decision it informs and what it changes, requires
negative coverage, and resolves every repository anchor against real bytes.

It does **not** judge whether an anchored line entails its claim. That stays
with the verifier and the goal-checker. What it guarantees is narrower and
harder to fake: a claim about a codebase cannot be made without pointing at the
codebase.

## Two different enums are both called "Type"

This trips people up, so name them apart:

- the **evidence-table** `Type` column (`SKILL.md`) is `code`, `standard`,
  `paper`, `vendor`, `repo` — a label for humans reading the table;
- the **record** `type` field (below) is `external`, `repo`, `product`,
  `background` — what the validator enforces.

A `repo` row in the evidence table becomes a `type: "repo"` finding in the
record, carrying an `anchor` instead of a `locator`.

## Required record-level `type` values

| `type` | Means | Requires |
|--------|-------|----------|
| `external` | A published source read directly | `locator` (DOI, URL, standard + section); no `anchor` |
| `repo` | A fact about the artifact under study | `anchor` = `path` + `line`, resolved on disk, plus `artifact_id` |
| `product` | A decision only the user can make | `changes: product-decision`; no `anchor` |
| `background` | Context that lands nowhere | `changes: background`; no `anchor` |

A `repo` claim with no anchor fails closed. That is what makes "add a furniture
evaluator" to a codebase that already has one findable — as far as it can; see
Scope for what it cannot do.

## Required top-level fields

- `schema`: exactly `vitruvius-problem-anchor.v1`
- `question`: the research question, verbatim
- `commit`: 7-40 lowercase hex characters identifying the snapshot studied
- `anchor_root`: the directory every `repo` anchor resolves against (absolute,
  or relative to the record's own directory)
- `artifacts`: one or more `{ id, path, sha256, bytes }` records for the files
  under study; paths are confined, `/`-separated, and hash-checked
- `decisions`: one or more `{ id, text }` — the decisions this report informs
- `findings`: one or more finding records (below)
- `coverage.negative`: one or more `{ id, searched, not_found, boundary }`
- `final`: `{ path, sha256, bytes }` for the candidate, resolved relative to the
  record's own directory

## Finding records

```
{ id, decision_id, claim, type, locator?, anchor?, artifact_id?, changes, status }
```

- `id` and `decision_id` must be short identifiers; `decision_id` must name a
  declared decision. Every declared decision needs at least one finding — a
  report may not list a decision it then ignores.
- `type` is one of `external`, `repo`, `product`, `background`.
- `changes` is one of `change`, `measure`, `defer`, `product-decision`,
  `background`, and is mandatory. This is the "so what" field: every finding
  declares its landing site.
- `status` is one of `verified`, `partial`, `blocked`, `unverified`, `inferred`,
  `failed`. A `verified` finding needs either a resolvable anchor or a locator.
- `anchor` is `{ path, line }`. The path must be confined and `/`-separated, the
  line must exist, and it must not be blank. The path is resolved through links
  before the containment test, so a junction inside the root cannot reach
  outside it. `path:9-13` range citations are accepted in the report; the record
  carries the start line.
- `artifact_id` is required on every `repo` finding and on every finding whose
  `changes` is `change`, `measure`, or `defer` — the bytes a claim rests on are
  always hash-pinned by a declared artifact, and the anchor path must match that
  artifact's path. It is rejected on any other finding.
- `product` and `background` findings cannot carry an `anchor`. An `external`
  finding must carry a `locator` and may not carry an `anchor`.

## Negative coverage

`coverage.negative` is where "I looked and it is not there" becomes a checkable
claim instead of a silence. Each entry states what was searched for, what was
not found, and the boundary of the search. A run that found everything has
nothing to record here and should not be running research.

## Binding to the candidate

The record must sit in the candidate's own directory — `final.path` is confined
and cannot climb out with `..`, so "beside the candidate" is structural, not a
convention. Given that, the validator requires the final artifact to:

- contain every finding `id`,
- cite every `repo` anchor as `path:line` (or `path:start-end`), and
- contain every `coverage.negative[].id`.

The line number is matched on both sides, so a citation to `x.ts:13` does not
satisfy an anchor at `x.ts:1`, and a citation to `apps/x.ts:1` does not satisfy
one at `x.ts:1`. This is what stops the record and the report from drifting
apart. A finding that exists only in the JSON is not delivered.

## Command

```bash
vitruvius-problem-anchor <record.json>
# checkout equivalent:
node scripts/problem-anchor-contract.mjs <record.json>
```

The record is written beside the candidate as `<slug>-problem-anchor.json`.
Paths in the record use `/` separators; backslashes are rejected for
cross-platform determinism.

## Relationship to the other contracts

This record is not a substitute for any of them, and it is not a promotion
gate on its own:

- `vitruvius-goal-requirements.v1` freezes *what was asked*, before dispatch.
- `vitruvius-goal-check.v1` checks *whether the question was answered*, at the
  end.
- `vitruvius-problem-anchor.v1` checks *whether the answer is about the thing
  that was studied*, continuously.

Run the problem anchor with the cited brief, before verification. If a `repo`
anchor does not resolve, the claim either describes a different snapshot or was
never read. Both are defects, and both are cheap to find here instead of
expensive to find in review.

## Scope

The anchor binds a run to a snapshot. It does not track upstream changes; a
`commit` that no longer describes the working tree is a new run, not a valid
one. The snapshot is pinned by `artifacts[].sha256`/`bytes`, which are checked
against disk — `commit` is recorded for the reader and is not verified against
git.

**It does not read the claim.** The validator checks that an anchor resolves to
a real, non-blank line, not that the line says what the claim says. A finding
that asserts a module is absent, anchored to the file that proves it is present,
passes this contract. That residual is assigned explicitly: the verifier and the
goal-checker re-read every anchor, and `agents/goal-checker.md` treats an
anchor that does not support its claim — and a recommendation to add something
never checked as absent — as a finding rather than a note. Do not report a
grounded report as a correct one.

Research-only, not for final engineering sign-off.
