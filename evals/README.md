# Vitruvius Evaluation Pilot

This directory contains the bounded E1/C1 evaluation slice. It is intentionally
separate from the verifier benchmark: E1 checks fixture-linked skill contracts,
while C1 checks a small fixed research suite.

## E1 pilot

`catalog.json` covers four fixture-backed priority skills:

- `engineering-research`
- `habit`
- `proposal`
- `verifier`

Each case has a positive trigger, an owner-labeled negative trigger, a retained
runtime fixture/test path, and source-backed expectations. This is a pilot, not
a claim that all 25 skills have behavioral coverage.

Deterministic checks:

```bash
npm run test:evals
node tests/routing/eval-routing.mjs
```

The routing test reports the existing baseline separately from E1 top-k and
owner-negative results. Model calls are never made by these checks.

## C1 pilot

`cases/local-evidence-suite.json` defines three local-only cases:

1. `supported-evidence` → expected `verified`
2. `unavailable-source` → expected `blocked`
3. `conflicting-evidence` → expected `partial`

Each case pins its fixture tree by SHA-256. A result must retain a final artifact,
an adjacent provenance sidecar, artifact hashes/byte counts, a fresh subagent
session identifier, a research status, and a complete expectation grade. Missing
host cost is recorded as `null` with `cost_status: unavailable`; it is never
invented.

Validate the suite contract and retained result bundle:

```bash
node tests/evals/test-fixed-case.mjs
node scripts/fixed-case.mjs case evals/cases/local-evidence-suite.json
node scripts/fixed-case.mjs results evals/results/manifest.json evals/results
```

The three subagent runs are on-demand evidence, not part of `npm test`. The
current pilot is not cross-host certification, a majority-of-three benchmark,
or proof of model quality.

## V1 field pilot

V1 is the real-question pilot layer. It is separate from C1 because C1 proves
local artifact contracts, while V1 records source access, final/provenance
pairing, verifier/GOAL-CHECK evidence, user corrections, and decision outcome
for actual engineering questions.

The format is documented in `evals/field-pilot/README.md` and validated with
`node scripts/field-pilot-contract.mjs <record.json>`. The checked-in template
is intentionally incomplete; no pilot result is claimed until a real record
retains the source bytes or an honest blocked reason and all artifact hashes.
