/**
 * report-lines.mjs — the exact text the routing eval prints per case.
 *
 * Extracted so tests/routing/test-eval-routing-flags.mjs can pin the scores
 * the output must carry. src-02 #760: a positive prompt that slipped to rank
 * 2 printed nothing about the gap between its top-k pass and its rank-1
 * miss, so finding which prompt had drifted took a hand-built harness around
 * the ranker. The line IS the diagnostic; pinning its shape keeps the
 * diagnostic from being quietly dropped.
 *
 * Every line names the outranking skill and the scores of both sides, so a
 * miss is actionable without re-running the ranker by hand.
 */

export function fmtScore(score) {
  return Number(score).toFixed(3);
}

/** `rank N score` for a ranked skill; rank 0 means it did not rank at all. */
export function fmtRank(rank, score) {
  return rank > 0 ? `rank ${rank} ${fmtScore(score)}` : "unranked";
}

/** Persisted miss line for a positive case (feeds last-misses/e1-misses). */
export function positiveMissLine({ skill, prompt, top, targetRank, targetScore, topK }) {
  return (
    `${skill} <- "${prompt}" (got ${top.name} ${fmtScore(top.score)}, ` +
    `target ${fmtRank(targetRank, targetScore)}; want rank <= ${topK})`
  );
}

/** Console form of the same miss: short prompt, same facts. */
export function positiveMissConsole({ skill, prompt, top, targetRank, targetScore, topK }) {
  return (
    `  MISS: "${prompt.slice(0, 50)}..." → got ${top.name} ${fmtScore(top.score)}, ` +
    `want ${skill} ${fmtRank(targetRank, targetScore)} (rank <= ${topK})`
  );
}

/**
 * A positive inside top-k but not rank-1 passes the case while the rank-1
 * floor does not count it — src-02 #760's gap, printed as info, never as a
 * miss (the case did pass).
 */
export function positiveInfoLine({ skill, prompt, top, targetRank, targetScore, topK }) {
  return (
    `  INFO: "${prompt.slice(0, 50)}..." → ${skill} ${fmtRank(targetRank, targetScore)} ` +
    `is a top-${topK} pass, not rank-1: ${top.name} ${fmtScore(top.score)} outranks it; ` +
    `the rank-1 floor does not count this hit`
  );
}

/** Owner-negative miss: both sides ranked, both scores shown. */
export function negativeMissLine({ owner, skill, prompt, ownerRank, ownerScore, targetRank, targetScore }) {
  return (
    `${owner} must outrank ${skill} for "${prompt}" ` +
    `(owner ${fmtRank(ownerRank, ownerScore)}, target ${fmtRank(targetRank, targetScore)})`
  );
}

/** Must-not-fire miss: where the forbidden skill landed and what beat it. */
export function mustNotFireMissLine({ skill, prompt, targetRank, targetScore, top, topK }) {
  return (
    `${skill} must stay out of top-${topK} for "${prompt}" ` +
    `(${fmtRank(targetRank, targetScore)}, top: ${top.name} ${fmtScore(top.score)})`
  );
}
