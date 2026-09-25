# GOAL-CHECK machine contract

The final completion gate is recorded as a `vitruvius-goal-check.v1` JSON file beside the candidate artifact. The lead creates the record from the independent goal-checker result; the record is not a substitute for the human-readable report.

Required top-level fields:

- `schema`: exactly `vitruvius-goal-check.v1`
- `question`: the original question, verbatim
- `requirements`: a frozen, non-empty list of `{ id, text }` asks re-derived from the original question before goal-check; `prompt` must cover every ID exactly
- `requirements_manifest`: `{ path, sha256, bytes }` for a separate `vitruvius-goal-requirements.v1` file containing the same question hash plus frozen `requirements` and `scope` IDs; this is the trusted pre-dispatch manifest
- `final`: `{ path, sha256, bytes }` for the candidate
- `provenance_path` and `plan_path`: confined repository-relative files using `/` separators; backslashes are rejected for cross-platform determinism
- `scope` and `prompt`: non-empty arrays of checks with unique IDs
- `findings`: an array; every finding carries literal final-artifact evidence, and `open`, `wontfix`, and `blocked` findings carry their required resolution field
- `ran`: a non-empty description of what was opened and checked
- `verdict`: `DONE` or `NOT-DONE`
- `report`: the goal-checker Markdown report, including exactly one `E2E:` line

A `pass` check must quote evidence that occurs in the final artifact. A `gap` check must name its required fix. The validator derives `scope`, `prompt`, open-finding count, and `ran`; callers cannot self-approve a contradictory report. It checks omission against the independently frozen manifest, but it cannot infer a natural-language ask that was omitted from that manifest; the host/model smoke remains necessary for that semantic boundary. `NOT-DONE` is a valid retained result but is not promotable.

Validate before delivery:

```bash
vitruvius-goal-check outputs/.drafts/<slug>-goal-check.json
# checkout equivalent: node scripts/goal-check-contract.mjs outputs/.drafts/<slug>-goal-check.json
```

A zero exit means the record is valid and promotable. A valid `NOT-DONE` is expected to return nonzero until the named gaps are repaired or the result is delivered honestly with the unmet asks recorded.
