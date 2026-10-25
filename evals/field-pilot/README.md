# V1 Field Pilot

V1 is the first real-question pilot layer. It is intentionally separate from C1: C1 proves local artifact contracts, while V1 records whether a real engineering question can move through source access, synthesis, verification, and delivery with useful evidence.

## Run record

Each pilot uses one `vitruvius-field-pilot.v1` JSON record based on `template.json`. A record is valid only when it retains:

- the original question verbatim;
- source identifiers, retrieval status, and either a byte-pinned local source artifact or a blocked reason plus unblock path;
- plan, final, provenance, verifier, and GOAL-CHECK artifacts with hashes and byte counts;
- wall time, cost availability, user corrections, and decision outcome;
- an honest `complete`, `partial`, or `blocked` completion state.

Validate a populated record from the repository root:

```bash
vitruvius-field-pilot <record.json>
# checkout equivalent: node scripts/field-pilot-contract.mjs <record.json>
```

The template is intentionally incomplete and must not be reported as a pilot result. Contract paths use `/` separators; backslashes are rejected for cross-platform determinism. No source, outcome, cost, or user-impact claim is implied by creating it.

## Selection rule

Choose questions that represent actual research work and use primary sources where available. Start with a small set; do not build a source connector or add a new skill until repeated source-access failures justify it. A blocked source is a valid observation when the unblock path is recorded.

## Closing decision_outcome (the judgment step)

`metrics.decision_outcome` is the only field in the record that no blind round
can fill. The verifier, GOAL-CHECK, and peer reviews judge the *process* —
citations resolve, gates pass, asks delivered. None of them answers the
question the pilot exists for: **did this output change, enable, or settle a
decision the asker actually faces?** The first pilot sat at `unknown` because
its two blind rounds (PARTIAL, then BLOCKED) judged process and the final text
was never judged at all. That gap is closed only by the human who asked.

Protocol:

1. **When** — after the final artifact stabilizes (repairs from verifier and
   GOAL-CHECK are in), before the pilot record is archived.
2. **Who** — the engineer who asked the question, or the user standing in for
   them. An agent may present the final + provenance side by side; it may not
   record the judgment.
3. **How** — read the final against the original question and answer one
   thing: would you act differently because of this output?
   - `useful` — it changed or enabled a decision; name the decision in
     `metrics.notes`.
   - `not_useful` — it did not; say why in `metrics.notes` (wrong question,
     no new information, unusable depth, missing jurisdiction, ...).
   - `unknown` — only while genuinely unjudged. An archived pilot that still
     reads `unknown` has measured process and nothing else; say so rather
     than letting it silently stand in for a value claim.
4. **Wall time** — when the run opened a dispatch marker
   (`log-run.mjs --begin`), derive `wall_time_minutes` from the ledger
   entry's measured `wall_ms` and set `wall_time_status: "available"`. Cost
   may honestly stay `unavailable` where the host exposes no billing surface.

A pilot is not closed by a validator pass; `vitruvius-field-pilot` checks the
record's shape, and this step fills the one field shape cannot.
