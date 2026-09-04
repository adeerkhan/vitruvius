# Vitruvius Verification Benchmark

A benchmark of engineering research cases with **known injected flaws** and
**ground-truth verdicts**. Used to measure whether the Blind Verifier
reduces false approvals versus single-agent and self-review baselines.

## Purpose

This benchmark tests the claim: *"a fresh verifier checking a claim against
evidence (without seeing the author's reasoning) catches errors that
self-review misses."*

Each case is a small engineering research task where the "author" has reached
a conclusion. The conclusion contains a known flaw. The verifier receives
the question, the gathered evidence (with source locations), and the claimed
conclusion — but NOT the reasoning chain. It returns PASS / PARTIAL / BLOCKED.

A verifier that returns PASS on a flawed case has committed a **false
approval** — the error we most want to reduce.

## Case Schema

Each case is one markdown file with this structure:

```markdown
# Case NN: [short title]

- **Discipline:** civil | mechanical | electrical | architectural | software
- **Difficulty:** easy | medium | hard
- **Flaw type:** [see flaw taxonomy below]
- **Ground-truth verdict:** PASS | PARTIAL | BLOCKED
- **Baseline expected:** single-agent usually [PASS/PARTIAL], self-review usually [PASS/PARTIAL]

## Question
[The engineering research question the author attempted to answer]

## Context
[Given facts, constraints, code/standard references the author worked with]

## Claimed conclusion
[The author's conclusion — stated as they would present it. This is what the
verifier must judge.]

## Evidence gathered
[The evidence the author assembled, each item tagged with its source
location: standard + section + edition, URL, or artifact path. The verifier
receives this.]

## Ground-truth reasoning
[Why the correct verdict is what it is. The flaw, specifically. This is
withheld from the verifier — it's the scoring key.]

## False approval description
[What a PASS verdict here would mean the verifier missed — the concrete
engineering error that slipped through.]
```

## Flaw Taxonomy

The injected flaws are drawn from real engineering research failure modes.
A case should have **one primary flaw** (tagged) so we can measure per-type
catch rates.

| Flaw type | Description | Why it matters |
|-----------|-------------|----------------|
| **code_misapplication** | Applied the wrong code/standard section (e.g., AISC Chapter E column buckling to a flexural member) | Most common engineering research error — using the right-looking but inapplicable provision |
| **unit_sign_error** | Wrong unit conversion, sign convention, or direction (kips vs kN, tension vs compression) | Catastrophic in practice; easy to miss in self-review because the author "knows what they meant" |
| **omission** | Cherry-picked supporting evidence; omitted a contradictory source or a governing limit state | The author found 6 sources that agree and missed the 1 that governs |
| **missing_factor** | Left out a required factor, check, or limit state (phi factor, stability check, deflection) | Directionally right but incomplete — unsafe to act on |
| **synthesis_overreach** | Conclusion requires synthesizing multiple clauses and a judgment call; overstates what the sources directly support | Engineering conclusions often outrun the cited evidence |
| **conflicting_standard** | Two applicable codes/standards give different answers; author followed the less conservative without noting the conflict | Common in multi-jurisdiction or multi-material work |

## Scoring

For each case × configuration (single-agent, self-review, blind-verifier,
verifier+specialist, full-chain):

- **Correct:** verifier verdict matches ground truth (PASS on a sound claim,
  or PARTIAL/BLOCKED on a flawed one).
- **False approval:** verifier returns PASS on a flawed case (the dangerous
  error — acting on bad engineering).
- **False block:** verifier returns BLOCKED on a sound case (conservative but
  costly — drives users to bypass verification).

Primary metric: **false-approval rate per token** across the benchmark.
Secondary: false-block rate, catch rate per flaw type.

## How to add a case

1. Pick a discipline and a single primary flaw type.
2. Write a question + context + claimed conclusion where a competent engineer
   would reach the ground-truth verdict unambiguously.
3. Provide evidence tagged with real source locations (standard + section +
   edition). The evidence should support the ground-truth verdict — if the
   claim is BLOCKED, the evidence should show why.
4. Withhold the reasoning in the scoring key.
5. Have a human review the case before it counts toward the benchmark.
