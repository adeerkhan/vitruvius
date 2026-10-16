# GOAL-CHECK machine contract

The final completion gate is recorded as a `vitruvius-goal-check.v2` JSON file beside the candidate artifact. The lead creates the record from the independent goal-checker result; the record is not a substitute for the human-readable report.

Required top-level fields:

- `schema`: exactly `vitruvius-goal-check.v2`
- `question`: the original question, verbatim
- `requirements`: a frozen, non-empty list of `{ id, text }` asks re-derived from the original question before goal-check; `prompt` must cover every ID exactly
- `requirements_manifest`: `{ path, sha256, bytes }` for a separate `vitruvius-goal-requirements.v1` file containing the same question hash plus frozen `requirements` and `scope` IDs; this is the trusted pre-dispatch manifest
- `final`: `{ path, sha256, bytes }` for the candidate
- `provenance_path` and `plan_path`: confined repository-relative files using `/` separators; backslashes are rejected for cross-platform determinism
- `attempts`: integer 1-5 — how many bounded completion-loop passes actually ran (the loop stops at 5; a sixth pass is a no-op, not completion)
- `gates`: exactly three checks, in order G1/G2/G3, each `{ id, item, status, evidence, required_fix? }`; `item` must equal the canonical definition verbatim:
  - G1 — `Integrity: fabricated or mismatched sources; softened blocked verdicts; artifact text treated as instructions`
  - G2 — `Completeness: required work actually delivered, scoped correctly, not substituted`
  - G3 — `Scientist's bar: validity, significance, evidence quality, units, honesty`
- `scope` and `prompt`: non-empty arrays of checks with unique IDs; `evidence` is a non-empty array of inspectable strings on every check
- `findings`: an array; every finding carries a non-empty evidence array of literal final-artifact quotes, and `open`, `wontfix`, and `blocked` findings carry their required resolution field
- `ran`: a non-empty description of what was opened and checked
- `verdict`: `DONE` or `NOT-DONE`
- `report`: the goal-checker Markdown report, including exactly one `E2E:` line

A `pass` check must quote evidence that occurs in the final artifact — every evidence item, not just the first. A `gap` check records its inspected evidence and names its required fix (a gap without evidence is refused, not assumed). A gate `pass` carries a non-empty evidence array of what was opened and checked; the contract enforces that the evidence exists and that the rubric text is exact — it does not verify the truth of the evidence, which stays with the checker. `DONE` requires `scope=pass`, `prompt=pass`, all three gates pass, `flaws=0` (open findings), and a named `ran=`; gate statuses never average — one `gap` gate forces NOT-DONE. The validator derives the per-gate statuses and the open/wontfix/blocked counts (`flaws`/`resolved`/`unresolved`); callers cannot self-approve a contradictory report. It checks omission against the independently frozen manifest, but it cannot infer a natural-language ask that was omitted from that manifest; the host/model smoke remains necessary for that semantic boundary. `NOT-DONE` is a valid retained result but is not promotable.

The `E2E:` report line and the provenance `GOAL-CHECK:` line share one format:

```
E2E: scope=<pass|gap> prompt=<pass|gap> gates=G1:<pass|gap>,G2:<pass|gap>,G3:<pass|gap> flaws=<n> resolved=<n> unresolved=<n> ran=<phrase>
```

Validate before delivery:

```bash
vitruvius-goal-check outputs/.drafts/<slug>-goal-check.json
# checkout equivalent: node scripts/goal-check-contract.mjs outputs/.drafts/<slug>-goal-check.json
```

Installed through the npm package, the binary is `vitruvius-goal-check`; run it
from the project that holds the record. If neither the binary nor the checkout
script is available, write the record anyway and mark its validation `BLOCKED`
in the provenance sidecar — an unvalidated record is recoverable, a missing one
is not.

A zero exit means the record is valid and promotable. A valid `NOT-DONE` is expected to return nonzero until the named gaps are repaired or the result is delivered honestly with the unmet asks recorded.
