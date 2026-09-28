# Variance evidence — architectural-synthesis_overreach-01 re-run, 2026-09-28

These are the artifacts behind the "RESOLVED by re-run" section of
`tasks/benchmark/RESULTS.md`. This directory is covered by
`.gitignore` (`tasks/benchmark/*results*/`), so these five files are
force-added: the claim that the model honours the margin rule 5/5 times is not
reproducible without the runs themselves.

Produced with the canonical runner, mirroring `tasks/benchmark/run-opencode.sh`:

    opencode run --agent verifier \
      --model opencode-go/longcat-2.5-preview-free \
      --format json -f <blind case> "<dispatch prompt>"

Ground truth was stripped by cutting the case at `**Ground-truth verdict:**`
and re-checked against a leak guard, exactly as the runner does. Model
`longcat-2.5-preview-free` is the same model that produced the checked-in
results.

| File | Run |
|------|-----|
| `run1-result.md` | 1 |
| `run2-result.md` | 2 |
| `run3-result.md` | 3 |
| `run4-result.md` | 4 |

Run 1 is the copy now checked in at
`tasks/benchmark/results/architectural-synthesis_overreach-01-result.md`.

All five returned `MACHINE_VERDICT: PARTIAL | FLAW: synthesis_overreach`, which
is the ground truth. Scored with `scripts/score-benchmark.mjs` each returned
`CORRECT (expected=PARTIAL got=PARTIAL checks=8/8)`. Zero returned PASS, so the
sub-10% margin override that made this a false approval did not reproduce.

These are five runs of **one** case. They bound the flakiness of this case, not
the margin-earnedness boundary in general.
