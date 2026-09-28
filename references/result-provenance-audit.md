# Result Provenance Audit

Before saving the final document, scan for unsupported quantitative claims.
Every numeric claim must map to a source URL, research note, raw artifact path,
or script path. If not, remove it or replace it with a TODO.

## Scan For

Before delivery, scan the draft for:

- **Numeric scores or percentages** — "94.2%", "3.5x faster", "85% accuracy"
- **Benchmark names and tables** — "MMLU", "HumanEval", "SWE-bench"
- **Figure or image references** — "Figure 1", "Table 2", "Chart 3"
- **Claims of improvement or superiority** — "outperforms", "state-of-the-art", "best"
- **Dataset sizes or experimental setup details** — "10,000 samples", "5-fold cross-validation"
- **Charts or visualizations** — any graphical representation of data

## For Each Item

Verify that it maps to one of:

| Source type | Example |
|-------------|---------|
| Source URL | `https://arxiv.org/abs/2301.12345` |
| Research note | `outputs/.drafts/<slug>-research-direct.md` |
| Raw artifact path | `evals/fixtures/c1/supported-evidence/test-report.md` |
| Script path | `scripts/score-benchmark.mjs` |

If the item does not map to any of these:

1. **Remove it** — delete the claim from the draft
2. **Or replace it with a TODO** — `[TODO: add source for this claim]`
3. **Add a short `Removed Unsupported Claims` section** — only when you remove material

## Rules

- **Do not preserve polished summaries that outrun the raw evidence.** If a
  summary claim cannot be traced to a raw artifact, remove it.
- **Treat captions such as "illustrative," "simulated," "representative," or
  "example" as insufficient** unless the user explicitly requested synthetic or
  example data.
- **A numeric claim without a unit, sign convention, and source is not a claim
  — it is noise.** Flag it.
- **A reference benchmark is not a Vitruvius benchmark.** Do not claim
  performance on a benchmark unless the benchmark was actually run.

## Integration with Verifier Citation Rules

The result provenance audit and verifier citation rules work together:

1. **Verifier citation rules** ensure every factual claim has a citation.
2. **Result provenance audit** ensures every quantitative claim has a
   traceable source.

Together, they close the two remaining gaps in the verification loop:
- Citation completeness (verifier citation rules)
- Quantitative claim integrity (result provenance audit)

## Output

If any claims were removed, add a section at the end:

```markdown
## Removed Unsupported Claims

- "Achieves 94.2% on MMLU" — no source URL or artifact path found
- "Outperforms baseline by 3.5x" — benchmark not actually run
```

This makes the removal auditable and prevents the claim from being silently
re-added later.
