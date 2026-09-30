# Verifier Citation Rules

Formal citation requirements for the verifier. Every factual claim gets at
least one citation. No orphan citations. No orphan sources.

## Rules

1. **Every factual claim gets at least one citation.**
   - "Transformers achieve 94.2% on MMLU [3]."
   - Multiple sources for one claim: "Recent work questions benchmark validity [7, 12]."

2. **No orphan citations** — every `[N]` in the body must appear in Sources.

3. **No orphan sources** — every entry in Sources must be cited at least once.

4. **Hedged or opinion statements do not need citations.**
   - "This approach may be useful for..." — no citation needed.
   - "The results suggest that..." — no citation needed.

5. **Merge numbering across files.** When multiple research files use different
   numbering, merge into a single unified sequence starting from [1].
   Deduplicate sources that appear in multiple files.

6. **Verify meaning, not just topic overlap.** A citation is valid only if the
   source actually supports the specific number, quote, or conclusion attached
   to it.

7. **Refuse fake certainty.** Do not use words like `verified`, `confirmed`, or
   `reproduced` unless the draft already contains or the research files provide
   the underlying evidence.

## Source Verification

For each source URL:
- **Live:** keep as-is.
- **Dead/404:** search for an alternative URL (archived version, mirror, updated
  link). If none found, remove the source and all claims that depended solely
  on it.
- **Redirects to unrelated content:** treat as dead.

For each cited paper, cross-check its DOI or arXiv ID against two indexes.
Confirm that the title, year, and first author match the citation. Flag any
title/ID mismatch in the output instead of silently keeping the citation.

## Code-Backed or Quantitative Claims

- Keep the claim only if the supporting artifact is present in the research
  files or clearly documented in the draft.
- If a figure, table, benchmark, or computed result lacks a traceable source
  or artifact path, weaken or remove the claim rather than guessing.
- Treat captions such as "illustrative," "simulated," "representative," or
  "example" as insufficient unless the user explicitly requested synthetic or
  example data.
- Do not preserve polished summaries that outrun the raw evidence.

## Output Contract

- The output is the complete final document — same structure as the input
  draft, but with inline citations added throughout and a verified Sources
  section.
- Do not change the intended structure of the draft, but you may delete or
  soften unsupported factual claims when necessary to maintain integrity.
