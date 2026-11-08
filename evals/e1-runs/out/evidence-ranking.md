# Evidence Ranking: fatigue question

## Question

You asked me to rank "these five papers" by evidence quality for your fatigue
question. No papers were attached — the message names five but supplies no
titles, authors, DOIs, or text. I will not invent them, and I will not assign
applicability to a paper I have not read.

**Send the five papers** (title + DOI or URL, or the PDFs) and tell me which
fatigue question they serve — material/component, high-cycle vs low-cycle,
variable-amplitude or constant, and the decision the ranking feeds.

## The ranking frame I will apply

Each paper will be scored on the five criteria in `evidence-quality-tiers.md`,
in this order:

1. **Source tier** — 1 (standard/code, peer-reviewed and cited by standards),
   2 (peer-reviewed journal, validated model, traceable datasheet), 3 (conference
   paper, preprint, tangential paper), 4 (marketing, thin methodology, undated).
2. **Methodology** — experiment with stated protocol > validated model > survey
   > opinion.
3. **Citation authority** — cited by standards or high citation count.
4. **Reproducibility** — open data/code, explicit methods.
5. **Recency** — 20+ years acceptable for structural fatigue; tighter for
   fast-moving areas.

Recorded **beside** the tier, never summed into it:

- **GRADE certainty**, outcome-specific (likely `not-applicable`: a paper is not
  a body of evidence, and fatigue data usually has no randomized comparison).
- **Risk of bias** — RoB 2 only for randomized comparisons, otherwise
  ROBINS-I, otherwise `n/a` with the reason.
- **Applicability** — `direct`, `indirect (material/load regime)`, or `unstated`.

A Tier 1 source can carry a low-certainty, indirect finding; the two calls stay
separate so a single number never hides that.

## What I will not do

Assign tiers, scores, certainty, or applicability to unread papers. Rank from a
summary alone. Sum tier and appraisal into one score.

Send the five and I will return the ranked table plus conflicts.

*Research-only, not for final engineering sign-off.*
