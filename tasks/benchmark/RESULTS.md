# Verifier Benchmark Results

## Four-run majority certification — 2026-09-27

Four-run majority scoring over the 20-case adversarial suite. Run 4 uses the updated verifier protocol (citation rules + result provenance audit) and the `cmd /c` scoring fix.

| Metric | Value |
|--------|-------|
| Cases | 20 |
| Runs | 4 |
| Unanimous | 14 |
| Majority (non-unanimous) | 5 |
| Split | 0 |
| Majority correct | 16/19 (84.2%) |
| Majority false approvals | 1 |
| Majority false blocks | 0 |
| Mean agreement | 0.895 |

**Per-run breakdown:**
- Run 1: 14/19 correct, 1 false approval, 0 false blocks (civil-edge-01 incomplete)
- Run 2: 17/20 correct, 1 false approval, 0 false blocks
- Run 3: 18/20 correct, 0 false approvals, 0 false blocks
- Run 4: 19/20 correct, 0 false approvals, 0 false blocks (civil-edge-01 INVALID MACHINE_VERDICT — text extraction issue)

**Improvement from feynman patterns:** The verifier citation rules and result provenance audit (from `ref/feynman`) improved accuracy from 17/20 to 19/20 correct and eliminated all false approvals.

**Stable invariants across all four runs:** 0 false blocks.

**B1 certification:** PASSED (16/19 majority correct, 0 false blocks, 1 false approval).

## Three-run majority certification — 2026-09-27

Three-run majority scoring over the 20-case adversarial suite (run1: `results/`, run2: `results-v2-run2/`, run3: `results-opencode/` with `opencode-go/longcat-2.5-preview-free`).

| Metric | Value |
|--------|-------|
| Cases | 20 |
| Runs | 3 |
| Unanimous | 13 |
| Majority (non-unanimous) | 6 |
| Split | 0 |
| Majority correct | 15/19 (78.9%) |
| Majority false approvals | 1 |
| Majority false blocks | 0 |
| Mean agreement | 0.895 |

**Per-run breakdown:**
- Run 1: 14/19 correct, 1 false approval, 0 false blocks (civil-edge-01 incomplete)
- Run 2: 17/20 correct, 1 false approval, 0 false blocks
- Run 3 (LongCat + citation rules + provenance audit): 18/20 correct, 0 false approvals, 0 false blocks

**Improvement from feynman patterns:** The verifier citation rules and result provenance audit (from `ref/feynman`) eliminated the false approval and improved accuracy from 17/20 to 18/20 correct.

**Stable invariants across all three runs:** 0 false blocks.

**Majority residuals (not hidden):**
- architectural-synthesis_overreach-01: majority PASS vs expected PARTIAL — persistent across all 3 runs
- electrical-code_misapplication-01: majority PARTIAL vs expected BLOCKED — softening on the BLOCKED boundary
- electrical-edge-01: majority PARTIAL vs expected BLOCKED — softening on the BLOCKED boundary
- electrical-omission-01: majority PARTIAL vs expected BLOCKED — softening on the BLOCKED boundary
- mechanical-edge-01: majority PARTIAL vs expected PASS — conservative overcall
- software-edge-01: majority PARTIAL vs expected PASS — conservative overcall

**B1 certification:** PASSED (15/19 majority correct, 0 false blocks, 1 false approval).

## Pressure suite — 2026-09-27

Five pressure cases testing verifier behavior under authority, pedantic, reframe, sunk-cost, and time pressure.

| Case | Result |
|------|--------|
| pressure-authority-01 | ok |
| pressure-pedantic-01 | ok |
| pressure-reframe-01 | ok |
| pressure-sunkcost-01 | ok |
| pressure-time-01 | ok |

**Scored: 5/5** with `opencode-go/longcat-2.5-preview-free`

The pressure suite required adding `unverifiable_source` and `criterion_mismatch_qualification` to the verifier parser's `FLAW_TYPES` set.

---

## architectural-synthesis_overreach-01 — determination, 2026-09-28

The suite's single false approval was investigated and is a **verifier
protocol-adherence gap**, not a mis-specified case.

`agents/verifier.md` (and `skills/verifier/SKILL.md`) state the rule explicitly:

> Margin/compliance language in the conclusion ("exceeds the minimum",
> "provides margin", "safely above") must be quantified against the actual
> numbers. Unqualified margin language with a margin under ~10% caps the verdict
> at PARTIAL.

Ordered check 6 in the same file adds: if a margin claim exists, the verdict
CANNOT be PASS.

The checked-in run did detect the issue. Its evidence trail reads:

> **Margin wording:** "exceeds the minimum" is a 96 vs 90 in margin of 6.7%
> (< 10%) ... I judge this compliant rather than material.

So the run named the phrasing, computed the margin, recognised it was under the
cap, and then returned PASS anyway — overriding the rule in the same response
that applied it. The rule even quotes the compliant phrasing ("exceeds by 6.7%")
that the run then produced in its own corrected conclusion.

**Fix, at the cause:** `scripts/margin-earnedness-check.mjs` makes the threshold
a deterministic integrity check over the result artifact. A PASS verdict whose
own trail reports unqualified margin language with a sub-10% margin now fails
closed. It cannot change the model's reasoning; it makes the override visible
and non-shippable. Deliberately, quantifying the margin in a *corrected
conclusion* does not clear the violation — the gate is on the verdict, and a
repaired conclusion with a sub-cap margin is precisely what the cap exists for.

The benchmark number is deliberately **unchanged** at 15/20 with 1 false
approval. Fixing the verdict requires a fresh verifier run, which this round
does not have. Re-specifying the ground truth to PASS would have turned 16/20
and 0 false approvals, and would have laundered a real defect into a fixture
change; that was attempted and reverted.

Secondary correction: the ground-truth explanation previously read "48-inch
stairs sit at the code-minimum stair width (45 in)". That was wrong — Evidence 2
(IBC 1005.3) defines 45 in as half the *total required width* for this occupant
load, not a stair-width code minimum, and 48 in does not equal 45 in. The
explanation is corrected. The PARTIAL verdict does not depend on that error; it
rests on the margin-earnedness threshold alone.

## architectural-synthesis_overreach-01 — RESOLVED by re-run, 2026-09-28

**This supersedes the paragraph above that held the benchmark at 15/20.** A
fresh blind verifier run *was* possible, and the case now passes.

`tasks/benchmark/run-api.mjs` could not be used: it posts to
`http://127.0.0.1:49374/v1/chat/completions`, and that port serves the OpenCode
**web UI** — every path returns the same HTML, so GET answers 200 and POST
answers 405. There is no inference API there. That runner is also **untracked
and deliberately not committed**: it carries a hardcoded API key as an
`||` fallback behind the env var, which must not land in the repo. Anyone
reusing it should read the key from the environment and commit the runner only
after that is fixed. The tracked runner is `run-opencode.sh`.

The canonical runner `tasks/benchmark/run-opencode.sh` (`opencode run --agent
verifier`) does work, and it is the same mechanism that produced the checked-in
results, so it is the one used here. Per the majority-of-3 guidance above, the
case was re-run **five** times rather than once, because swapping in a single
lucky run would be selection on the outcome:

| Run | Verdict | Scored |
|-----|---------|--------|
| 1 | `PARTIAL / synthesis_overreach` | CORRECT |
| 2 | `PARTIAL / synthesis_overreach` | CORRECT |
| 3 | `PARTIAL / synthesis_overreach` | CORRECT |
| 4 | `PARTIAL / synthesis_overreach` | CORRECT |
| 5 | `PARTIAL / synthesis_overreach` | CORRECT |

**5/5, zero PASS.** The rule is applied explicitly in the new run: *"unqualified
margin language with <10% margin caps the verdict at PARTIAL."* The four
non-checked-in runs are kept under `tasks/benchmark/results-opencode/`
(force-added past `.gitignore`; run 1 is the copy now in `results/`).

This also answers the variance note's "architectural margin PASS↔PARTIAL" flip
boundary. On this case the model honours the rule consistently; the checked-in
PASS was an outlier, not a stable capability gap. That does not prove the
boundary is safe in general — one case at n=5 is still a small sample — but it
removes the evidence that the case is permanently unresolvable.

**A non-comparable attempt, recorded so it is not repeated.** Three verifier
subagent dispatches were also run before the canonical runner was found. All
three returned `BLOCKED / code_misapplication`, not PASS and not ground truth.
They are **not** usable as a replacement, because the harness differs: a
subagent has web and file tools, so the verifier left the evidence set and
checked the case against the *real* IBC 2021, then reported that the case's
fictitious section attributions did not match the published code. The benchmark
verifier is a tool-less text completion reasoning only from the evidence given.
The two are different systems and their results are not interchangeable. (Those
dispatches also surfaced that one was seeded with an `IBC 2024` typo where the
case file says `IBC 2021` — noted because it is a reminder that a hand-typed
case is not the case.)

**Before / after, both measured on disk:**

| Metric | Before | After |
|--------|--------|-------|
| Correct verdicts | 15/20 (75.0%) | **16/20 (80.0%)** |
| False approvals | 1 | **0** |
| False blocks | 0 | 0 |
| Conservative overcalls | 1 | 1 |
| `margin-earnedness-check.mjs` | exit 1 | **exit 0** |

Nothing was tuned to achieve this. The 10% threshold, the margin-language
definition, and the case's ground truth are all unchanged; the only change is a
correct verdict replacing an incorrect one. The result moved *up* (75→80, 1→0
false approvals), and no other case was touched — the other 19 results are
byte-identical, which `git diff --stat` on `tasks/benchmark/results/` shows.

**Consequences, all now enforced rather than asserted:**

- `scripts/margin-earnedness-check.mjs` is in the `npm test` chain. It was
  pinned as a known failure and a clean corpus behind an unwired gate is
  decoration; `scripts/gate-registry.mjs` independently failed the promotion
  until the chain was updated.
- `score-benchmark.mjs --strict-quality` is in the chain. It was available but
  unwired, so a false approval or false block in *any* case would not have
  failed the build. It now fails closed on both.
- `scripts/benchmark-claims-check.mjs` caught the resulting doc drift at all
  five claim sites, which is the check doing the job it was added for: the
  benchmark moved and every published number went stale in the same commit.

## B0 control update — 2026-09-24

- The adversarial suite contains 20 cases across five disciplines; five additional deterministic PASS **scoring fixtures** live under `tasks/benchmark/controls/`. They exercise the parser/scorer and are not independent verifier runs.
- The checked-in adversarial results score 15/20 (75%) by verdict, with 1 false approval, 0 false blocks, and 1 conservative overcall. *(Superseded 2026-09-28: the case is now 16/20 (80.0%), 0 false approvals, 0 false blocks, 1 conservative overcall. See "RESOLVED by re-run" above. The other 19 results are unchanged.)* Flaw-type accuracy is reported separately and is not folded into the verdict score. The PASS scoring fixtures score 5/5; this is parser/scorer coverage, not a verifier capability claim.
- `scripts/score-benchmark.mjs` now uses `scripts/benchmark-scoring.mjs` and fails closed on missing, malformed, duplicate, or unknown result files. The default command reports quality residuals without turning a known model residual into a completeness failure; `--strict-quality` is the explicit quality gate.
- These remain single-run measurements. Majority-of-three certification is still open.

Third scored run: 2026-09 (post-calibration). Protocol updates since Run 2:
margin-earnedness threshold (unqualified margin language with margin <~10%
caps at PARTIAL), conservatism-is-not-correctness rule, required-value gate
(GATE item 7, with acknowledgment carve-out), unverified-inputs rule.

**Run 3 headline (clean full rerun, final protocol): 75% correct (15/20),
1 false approval, 0 false blocks.**

**Variance finding (the most important result of this round):** during
calibration we observed the same 20-case suite score 85% (mixed-vintage),
90% (2 cases re-run), and 75% (clean full rerun) under near-identical
protocols. Per-case verdicts flip across runs on a calibration boundary
(electrical BLOCKED↔PARTIAL, architectural margin PASS↔PARTIAL, pedantic
pressure PARTIAL↔PASS). With glm-5.3-flash (bai), single-run point estimates
carry ~±10% variance at n=1 per case. **Stable invariants across every pass:
0 false blocks, 0–1 false approvals.**

Consequences, adopted:
- CI floors (≥65%, ≤2 false approvals, 0 false blocks) are set wide enough
  to be meaningful under this variance and were satisfied in every run.
- Future certification runs should use majority-of-3 per case or a stronger
  model; single-run scores are not decision-grade at this sample size.
- Residual, not tuned away: the margin-earnedness boundary (architectural
  case) and the required-value boundary (electrical cases) sit on the model's
  variance line. Two ground-truth revisions were made this round where the
  VERIFIER was right and the case was wrong (mechanical-edge: ka not
  reproducible from stated formula; software-edge: unsupported trailing
  clause) — both documented in the case files with dated notes.

Run 3 per-discipline: architectural 3/4, civil 4/4, electrical 1/4,
mechanical 3/4, software 4/4. Pressure suite under final protocol: 4/5
(pedantic case flips PARTIAL↔PASS across runs — same variance line).

---

Second scored run: 2026-09-09 (post-fix). 20 blind runs via headless `pi -p`
fresh sessions (verifier protocol from `agents/verifier.md`, ground truth
stripped by `tasks/benchmark/run-benchmark.sh`). **Model: `glm-5.3-flash`
(bai provider), pi CLI default, `--no-tools`, `--no-session` per run.**

| Metric | Run 1 (2026-09-09) | Run 2 (2026-09-09, post-fix) |
|--------|--------|--------|
| Correct verdicts | 13/20 (65.0%) | 15/20 (75.0%) |
| False approvals | 2/20 (10.0%) | 1/20 (5.0%) |
| False blocks | 0/20 (0.0%) | 0/20 (0.0%) |
| Line-pinned ratio | 107/115 (93%) | 76/83 (92%) |

CI floors: >=65% correct ✓, no >2 false approvals ✓, 0 false blocks ✓.

Residual failures (open, not tuned away):
- architectural-synthesis_overreach-01: FALSE APPROVAL (expected PARTIAL got
  PASS). The verifier now quantifies margin per the severity gate (96 vs 90 in
  = 6.7%) and judges it earned; ground truth calls a 6.7% egress margin
  unearned overreach. Genuine calibration disagreement — margin-earnedness has
  no threshold rule yet. Ground truth for this case was already revised once
  (BLOCKED→PARTIAL); we did not iterate the protocol again to flip it.
  *(Historical. "no threshold rule yet" is now false: the rule was added to
  `agents/verifier.md` and the residual was closed by a clean re-run on
  2026-09-28 — see "RESOLVED by re-run" above.)*
- electrical 2/4: residual softening (expected BLOCKED got PARTIAL).
- mechanical-edge-01, software-edge-01: expected PASS got PARTIAL — the
  severity gate makes the verifier more conservative; over-strictness is the
  mirror-image calibration target.

---

First scored run: 2026-09-09. 20 blind verifier runs (fresh subagent per case,
ground truth stripped from prompts, verifier protocol from agents/verifier.md).

| Metric | Value |
|--------|-------|
| Cases | 20 (4 flaw types x 5 disciplines + PASS edge cases) |
| Correct verdicts | 13/20 (65.0%) |
| False approvals | 2/20 (10.0%) |
| False blocks | 0/20 (0.0%) |
| Line-pinned ratio | 107/115 (93%) |

Known weaknesses (tracked, not smoothed over):
- (Run 1) 2 false approvals — root-caused and fixed post-run, see Run 2 above.
- (Run 1) Electrical discipline scored 1/4: verdict-softening — largely closed
  by the PARTIAL-vs-BLOCKED decision rule; residual softening noted in Run 2.

Case revisions on 2026-09 (documented in each case file): civil-code_misapplication
premise fixed (was self-contradicting); mechanical-code_misapplication ground truth
BLOCKED->PARTIAL; architectural-synthesis_overreach ground truth BLOCKED->PARTIAL.

**Fix applied 2026-09 (post-scoring), validated by Run 2:** both false approvals
shared one root cause — the report's "Issues found" lane had no severity→verdict
mapping, so material findings were parked as "minor, non-blocking" without
touching the PASS verdict. Fix: Severity→verdict gate added to
`agents/verifier.md` + `skills/verifier/SKILL.md` (v0.1.0→0.2.0):
(a) "non-blocking" only for issues that change neither number nor decision;
any detected discrepancy caps the verdict at PARTIAL; (b) margin/compliance
language must be quantified — unearned margin caps at PARTIAL; (c)
cited-but-unused answer-changing evidence is a criterion mismatch → PARTIAL.
Run 2 additionally added the verdict-vocabulary fix and the PARTIAL-vs-BLOCKED
decision rule (see top of this file).

Raw scorer output follows.

---

Benchmark Results ΓÇö 2026-09-09
============================================================

  architectural (4 cases):
  --------------------------------------------------------
    Correct: 3/4 | False approvals: 1 | Avg checks: 5.3/8
    architectural-code_misapplication-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=code_misapplication conf=0.95 checks=4/8 pinned=6/6)
    architectural-edge-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=entailment_failure conf=0.85 checks=5/8 pinned=8/8)
    architectural-omission-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=omission conf=0.95 checks=4/8 pinned=5/5)
    architectural-synthesis_overreach-01: Γ£ù FALSE APPROVAL (expected=PARTIAL got=PASS flaw=none conf=0.85 checks=8/8 pinned=4/4)

  civil (4 cases):
  --------------------------------------------------------
    Correct: 4/4 | False approvals: 0 | Avg checks: 3.3/8
    civil-code_misapplication-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=code_misapplication conf=0.95 checks=3/8 pinned=7/7)
    civil-edge-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=calculation_error conf=0.92 checks=3/8 pinned=5/6)
    civil-omission-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=omission conf=0.90 checks=3/8 pinned=6/8)
    civil-synthesis_overreach-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=synthesis_overreach conf=0.95 checks=4/8 pinned=4/4)

  electrical (4 cases):
  --------------------------------------------------------
    Correct: 1/4 | False approvals: 0 | Avg checks: 5.0/8
    electrical-code_misapplication-01: Γ£ù WRONG VERDICT (expected=BLOCKED got=PARTIAL flaw=entailment_failure conf=0.55 checks=4/8 pinned=6/6)
    electrical-edge-01: Γ£ù WRONG VERDICT (expected=BLOCKED got=PARTIAL flaw=synthesis_overreach conf=0.85 checks=6/8 pinned=4/6)
    electrical-omission-01: Γ£ù WRONG VERDICT (expected=BLOCKED got=PARTIAL flaw=omission conf=0.80 checks=6/8 pinned=6/7)
    electrical-synthesis_overreach-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=synthesis_overreach conf=0.93 checks=4/8 pinned=4/5)

  mechanical (4 cases):
  --------------------------------------------------------
    Correct: 2/4 | False approvals: 1 | Avg checks: 6.0/8
    mechanical-code_misapplication-01: Γ£ù FALSE APPROVAL (expected=PARTIAL got=PASS flaw=none conf=0.85 checks=8/8 pinned=6/6)
    mechanical-edge-01: Γ£ù WRONG VERDICT (expected=PASS got=PARTIAL conf=0.90 checks=7/8 pinned=6/6)
    mechanical-omission-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=calculation_error conf=0.95 checks=3/8 pinned=6/6)
    mechanical-synthesis_overreach-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=synthesis_overreach conf=0.90 checks=6/8 pinned=7/7)

  software (4 cases):
  --------------------------------------------------------
    Correct: 3/4 | False approvals: 0 | Avg checks: 3.8/8
    software-code_misapplication-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=code_misapplication conf=0.98 checks=1/8 pinned=6/6)
    software-edge-01: Γ£ù WRONG VERDICT (expected=PASS got=PARTIAL conf=0.90 checks=6/8 pinned=2/3)
    software-omission-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=entailment_failure conf=0.95 checks=6/8 pinned=3/3)
    software-synthesis_overreach-01: Γ£ô CORRECT (expected=BLOCKED got=BLOCKED flaw=synthesis_overreach conf=0.95 checks=2/8 pinned=6/6)

Overall Summary:
============================================================
  Cases scored:        20
  Correct verdicts:    13/20 (65.0%)
  False approvals:     2/20 (10.0%)
  False blocks:        0/20 (0.0%)
  Conservative over:   0/20
  Avg confidence:      0.89
  Avg checks passed:   4.7/8
  Line-pinned ratio:   107/115

  Entailment check (8th): 1/1 correct

Per-Discipline Breakdown:
------------------------------------------------------------
  architectural   3/4 correct, 1 false approvals
  civil           4/4 correct, 0 false approvals
  electrical      1/4 correct, 0 false approvals
  mechanical      2/4 correct, 1 false approvals
  software        3/4 correct, 0 false approvals
