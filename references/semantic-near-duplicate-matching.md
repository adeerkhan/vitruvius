# Semantic Near-Duplicate Matching

From BugTraceAI-CLI. Proposes merges for sources that are semantically similar
but not exact duplicates. **Advisory-only** — it never deletes evidence.

## The Problem

Exact-first deduplication (already implemented) catches sources with the same
DOI, arXiv ID, or normalized URL. But it misses:
- The same paper posted to two different URLs
- A preprint and a published version with different titles
- A paper and a technical report with overlapping content
- Two sources that cite the same primary data but have different identifiers

## The Pattern

Semantic near-duplicate matching uses embeddings to find sources that are
semantically similar but not exact duplicates. It **proposes** merges — it
never deletes evidence.

## Rules

1. **Advisory-only.** The matcher proposes a merge; a human or the lead agent
   decides whether to accept it. The matcher never deletes evidence.

2. **Proposes merges, never deletes.** A proposed merge creates a `proposed_merge`
   record with the two source IDs and a similarity score. The lead agent reviews
   and accepts or rejects.

3. **Similarity threshold.** Only propose merges with similarity ≥ 0.85. Below
   that, the sources are too different to be duplicates.

4. **Never merge blocked sources.** A blocked source (paywalled, unreachable)
   cannot be merged with a verified source — the blocked source's content is
   unknown.

5. **Record the proposal.** Every proposed merge is recorded in the evidence
   ledger with a `proposed_merge` field. The proposal includes:
   - `source_a` and `source_b` (the two source IDs)
   - `similarity` (0.0-1.0)
   - `proposed_by` (the matcher)
   - `proposed_at` (timestamp)
   - `status` (`proposed`, `accepted`, `rejected`)

## Integration with Exact-First Deduplication

Exact-first deduplication (already implemented) runs first. Semantic
near-duplicate matching runs second, on the survivors:

1. **Exact-first dedup** — merge sources with the same DOI, arXiv ID, or
   normalized URL. (Already implemented.)
2. **Semantic near-duplicate matching** — propose merges for sources that are
   semantically similar but not exact duplicates. (This pattern.)

## Output

For each proposed merge, the matcher outputs:

```
PROPOSED MERGE:
  source_a: SRC-001 (title A, DOI: 10.1000/a)
  source_b: SRC-002 (title B, URL: https://example.com/b)
  similarity: 0.92
  reason: Same paper, different URLs (preprint and published version)
  action: Review and accept or reject
```

The lead agent reviews each proposal and either:
- **Accept** — merge the two sources (the survivor keeps both identifiers)
- **Reject** — keep the two sources separate

## Why This Matters

Without semantic near-duplicate matching, the same paper can appear twice in
the evidence ledger under different identifiers. This inflates the source count
and can lead to double-counting in the analysis.

With semantic near-duplicate matching, the lead agent can identify and merge
these duplicates, keeping the evidence ledger clean and auditable.

## Reject

- **Persona consensus** — multiple personas voting on whether sources are
  duplicates. This is overkill for a research agent.
- **Confidence arithmetic** — averaging confidence scores across sources.
  Confidence is per-source, not aggregate.
- **Fail-open validation** — treating unverifiable sources as duplicates.
  A blocked source cannot be merged with a verified source.
- **Success-only learning** — only learning from successful merges. Failed
  merges are also valuable — they tell the matcher what not to merge.
