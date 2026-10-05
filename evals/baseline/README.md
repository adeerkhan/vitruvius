# Baseline Comparison

The claim Vitruvius makes is comparative: on the same engineering question, running the method produces **more read sources, fewer fabricated references, and better-supported citations** than a plain prompt. Every other benchmark in this repo measures Vitruvius against its own controls; this layer measures it against not using it.

The framework is deterministic and self-testing. **No comparison result is claimed until real runs are recorded** — the checked-in state is the case set, the contract, and the scorer, not a score.

## Conditions

| Condition | What runs |
|-----------|-----------|
| `with-vitruvius` | The `/engineering-research` method (discipline lens), reading sources directly and marking each claim `verified` / `inferred` / `blocked`. |
| `baseline` | A plain prompt that asks the same question and requests citations. No method, no discipline lens. |

Run each condition in a **fresh session** so the baseline cannot inherit retrieved context.

## Metrics

Scored per citation from a `vitruvius-baseline.v1` record:

- **read-vs-recalled** — `read / (read + recalled)`. A `read` citation must carry a byte-pinned artifact (path + SHA-256 + byte count); `recalled` means the source was cited without retrieval. This is the core claim: reading sources directly instead of inferring from memory.
- **citation accuracy** — `(# citations that are read AND supported) / (# citations)`. `supported` is the graded judgment that the source actually backs the claim it is attached to.
- **fabricated references** — count of citations with status `fabricated`, plus **oracle violations**: any citation whose locator matches a case `fabrication_trap` (a locator that cannot exist).

## Recording a run

For each case in `cases.json`, and each condition, produce one record from `template.json`:

```bash
node scripts/baseline-scoring.mjs evals/baseline/results
```

The scorer validates every record fail-closed and refuses to score a case that is missing either condition. A `read` citation with no artifact, an unknown status, an unknown field, a hash that does not match the file, or a blank `notes` is rejected.

The oracle in `cases.json` is **document-level**: `real_sources` are the governing documents a grounded answer must cite, and `fabrication_traps` are locators that do not exist. The scorer checks whether a citation resolves to a real document; it does not assert a section's contents — that is what the per-citation `supported` grade is for.

## Honesty and limits

- The retrieval and support labels are **self-reported by the runner**. The contract forces a byte-pinned artifact for every `read` citation, which a fabricated citation cannot cheaply satisfy, but it is a structural check, not proof the artifact was read.
- The oracle is document-level; a real document cited for the wrong section has `supported: false`, which depends on the grader.
- A comparison depends on the host, model, and prompt used. Records capture `host` and `model`.
- The ten cases are a fixed sample, not a random draw. Differences within a few citations are not significant; report counts, not single-point deltas.
- This is not cross-host certification and not a product claim. It is a bounded, reproducible comparison.

## Status

Framework proven, comparison not yet measured. The case set, the fail-closed contract, and the scorer are tested in `tests/baseline/test-baseline.mjs`, and one pilot case has been recorded end to end (`results/RESULTS.md`). The pilot's baseline ran inside the Vitruvius harness, so its `context` is `shared-harness` and the scorer flags it: it is a procedure check, not a comparison result. A valid comparison needs an isolated baseline runner or a host tool trace.
