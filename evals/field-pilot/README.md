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
