# Majority-of-3 certification — 2026-09-29

Full run artifacts. The per-case table is reproduced in
`tasks/benchmark/RESULTS.md`; regenerate it with
`node tasks/benchmark/certify-report.mjs`.

## What is here

| directory | suite | runs | contents |
|-----------|-------|------|----------|
| `results-cert-r1/` | adversarial, run 1 | 20 | `<case>-result.md` + `journal.jsonl` |
| `results-cert-r2/` | adversarial, run 2 | 20 | same |
| `results-cert-r3/` | adversarial, run 3 | 20 | same |
| `results-pressure-r1/` | pressure, run 1 | 5 | same |
| `results-pressure-r2/` | pressure, run 2 | 5 | same |
| `results-pressure-r3/` | pressure, run 3 | 5 | same |

75 result files, 6 journals. Nothing here is synthesised: every file is the
verbatim text `opencode run --agent verifier` produced, written only after a
parseable `MACHINE_VERDICT` was found, so a truncated or unparseable run never
occupies a result path.

These directories are covered by `.gitignore` (`tasks/benchmark/*results*/`)
and are force-added. That is deliberate: a certification nobody can recompute is
a claim.

## Reproducing

```bash
# adversarial: 3 runs x 20 cases, resumable
node tasks/benchmark/certify-runner.mjs --all-runs 3 --retries 2

# pressure: separate directories, separate denominator
node tasks/benchmark/certify-runner.mjs --all-runs 3 --retries 2 \
  --cases-dir tasks/benchmark/pressure --out-prefix results-pressure

# the tables
node tasks/benchmark/certify-report.mjs
node tasks/benchmark/certify-report.mjs \
  --prefix results-pressure --cases-dir tasks/benchmark/pressure
```

`--status` reports coverage without executing anything, and `--dry-run` lists
what would run. A case that already has a parseable result is skipped, so an
interrupted sweep resumes rather than restarting.

## journals

`journal.jsonl` has one line per case attempt, including failures and retry
counts, so a gap is visible rather than inferred from a missing file. The full
sweep recorded 51 ok + 9 already present + 0 failed (79.5 min) for the
adversarial suite, and 14 ok + 1 already present + 0 failed (16.5 min) for
pressure. A failed run is never counted as a result.

## Runner fidelity

`certify-runner.mjs` invokes opencode differently from `run-opencode.sh`: a
`.cmd` shim cannot be spawned directly on Windows, and PowerShell's `>`
redirection writes UTF-16 the verdict parser cannot read. Both differences are
real constraints, not preferences.

`certify-fidelity-check.mjs` verifies the two runners feed the model the same
inputs — the blind cut, produced by the runner's own exported function, and the
dispatch prompt compared phrase-by-phrase against what `run-opencode.sh`
embeds. Run live on `software-omission-01`, both invocations returned
`BLOCKED | synthesis_overreach` at identical confidence 0.95 and pinned 2/2,
differing only in `CHECKS_PASSED` (6/8 vs 3/8) — a sampling difference, not a
configuration difference.
