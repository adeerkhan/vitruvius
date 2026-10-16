# AI-Reviewer Prompt Lessons (from arXiv:2605.20668)

Empirical source: Kim et al. (2026), *On the limits and opportunities of AI reviewers:
Reviewing the reviews of Nature-family papers with 45 expert scientists*,
arXiv:2605.20668 (PDF: https://arxiv.org/pdf/2605.20668). A 469-hour,
45-scientist expert annotation study of 2,960 review items across 82 Nature-family
papers, with the AI reviewer prompt (Appendix B.6), meta-reviewer prompt
(Appendix F.6), and qualitative failure/strength categories.

Use this as a checklist when authoring or revising agent prompts that review,
verify, or judge engineering research.

## 1. Correctness before significance
State the primary gate first and make it.ordering explicit. A significance rule
without a correctness gate produces "impressive but wrong" output. For reviewers,
correctness = the main point is factually wrong (not a peripheral detail).

## 2. Hard caps as precision filters, not volume quotas
Caps like "at most five items; zero allowed if none qualify" and "no
introduction/summary" are cheap and effective. State them as rules, not
preferences. A cap is a selection filter, not a budget to fill: in the
paper's platform comparison (Table 9), raising GPT-5.4's per-paper cap from
5 to 15 roughly doubled output (3.60 → 7.35 items) rather than filling it,
and precision rose (93.81% → 95.46%) while recall climbed (26.55% →
42.32%). Output stayed under the cap in both runs — the reviewer chose what
to raise instead of padding to a count.

## 3. Evidence must be exact and checkable
Require exact quotes (paper/code/literature), a citation list with a minimum
count, and rule out paraphrases. This is what makes the output auditable and
makes hallucination detectable.

## 4. Ordered principles and ordered criteria
Order evaluation criteria explicitly ("Validity > Conclusions > ...") and say
that earlier criteria outrank later ones. Unordered rubrics drift toward what
the model prefers.

## 5. Explicit workflow checklist, not just a goal
List concrete steps (read paper/supplement/images -> read/run code -> design
search queries -> retrieve + read -> verify -> write). The meta-reviewer's
Part A/B steps plus a verification-before-finish checklist are what make
output consistent across runs.

## 6. Calibrated significance in one sentence
Define the bar in natural language: "Would addressing this improve the paper?"
Classify missing statistics/undefined annotations/mismatches as Significant and
only typos/stylistic preferences as Marginal. A single well-worded sentence
outperforms an abstract 0-2 scale. Severity is field-relative: the same demand
can be Significant in one subfield and noise in another (the study's most
frequent weakness category, W1), so ground each grade in the artifact's own
claims and stated limitations.

## 7. Devil's advocate before predicting agreement
On borderline judgments, argue the other side explicitly; if both readings remain
plausible, record disagreement / PARTIAL rather than PASS. Do not treat
plausible disagreement as agreement.

## 8. Hard boundaries where failure is tempting
Filesystem limits, domain blocklists (avoid retrieving the published version),
"read-only, no edits," verification-before-stopping. Boundary text does more than
the rubric at preventing cheating and fabrication.

## 9. Tool-enabled scrutiny, then iteration
Give agents real terminal/file/web tools and tell them to iterate before writing.
Code inspection and literature cross-checking are the strongest value vs. human
reviewers and are skipped by humans due to time, not ability.

## 10. Treat AI as an augmenter, not a substitute
AI reviewers overlap heavily with each other; mixed panels preserve diversity
better. Match reviewer identity to the review phase (human or mixed panel), and
evaluate on per-axis standards rather than verdict agreement.

## 11. Evidence closure, not first-hit evidence
The meta-reviewer's signature failure was the partial-evidence trap: accepting
the first sentence that supports an item while a later passage contradicts or
qualifies it. Require the full bearing passage to be read before a support or
absence verdict, and require absence claims to record the span searched — an
unbounded "not found" is not evidence.