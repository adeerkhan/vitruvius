# Baseline Pilot — software-http-404-cache

**Date:** 2026-10-05 · **Coverage:** 1 of 10 cases · **Host:** opencode · **Model:** unavailable

This is a procedure pilot, not a comparison result. Read the interpretation before the numbers.

## Numbers

| Metric | with-vitruvius | baseline |
|--------|----------------|----------|
| read-vs-recalled | 100% | 100% |
| citation accuracy | 100% | 100% |
| fabricated references | 0 | 0 |
| oracle violations | 0 | 0 |

The scorer emits a contamination warning for this run:

```
software-http-404-cache: baseline context is "shared-harness", not "isolated" —
a baseline sharing the Vitruvius harness or tools is not a clean comparison
```

## Interpretation

**The delta of zero is not evidence that the method adds nothing.** It is an artifact of how the pilot was run. Both conditions ran as subagents inside this repository, so the "baseline" inherited the host's retrieval tools and the repo's integrity rules. It downloaded RFC 9110 and RFC 9111, read the relevant sections, and marked all four citations `read` — the same behavior the method asks for. The control was not a control.

This is the framework's own guard working: the record declares `context: "shared-harness"`, and the scorer refuses to let it read as a clean baseline. Without that field, the table above is exactly the kind of number that gets quoted as "Vitruvius adds nothing."

## What this pilot does prove

- The `vitruvius-baseline.v1` contract validates real model output and hash-pins the retrieved sources (both RFC files are retained under `sources/`).
- The scorer computes all three axes from real records, and the CLI scores a partial pilot (1/10) without pretending the other nine were run.
- A non-isolated baseline is recorded but flagged, and `compareConditions` still fails closed on an incomplete pair.

## What a valid comparison requires

- A runner that gives the `baseline` condition **no** Vitruvius context — no skills, no repo rules, no method instruction — so the only difference between conditions is the method. The current in-repo subagent harness cannot provide that.
- Or a host that exposes the run's tool trace, so retrieval is verified independently instead of self-reported.

Until then, the honest state of the baseline layer is: **framework proven, comparison not yet measured.**

## Files

- `software-http-404-cache/with-vitruvius/answer.md`, `.../baseline/answer.md` — the two answers as produced.
- `software-http-404-cache/sources/` — the two retrieved RFCs (shared; both runs fetched the same files).
- `software-http-404-cache/records/` — the two scored records.
