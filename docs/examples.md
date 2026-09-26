# Worked Examples (N8)

Three real runs from this repo, each grounded in on-disk artifacts you can
open and check. These are the honest versions — including the run that ended
in BLOCKED, which is the point. Boundary for all examples: research-only, not
for final engineering sign-off.

## Example 1 — Research run that ends in an honest BLOCKED

**Question:** "What reduction factor does ACI 318-19 specify for
post-tensioning tendons under seismic loading?"
**Mode:** `--quick` (direct search, no subagents, single verifier)
**Artifacts:** `outputs/aci-318-19-pt-reduction-factor.md` +
`.provenance.md`

What the run did: confirmed ACI 318-19 exists, found §20.3 (prestressing
reinforcement) paywalled, disambiguated the question into its four possible
meanings (section-level φ vs tendon stress limit vs loss factor vs seismic
modifier), and stopped at the paywall.

**Verdict: BLOCKED.** The exact provision values were never read; the run
does not guess them. Its "industry-typical" ranges are explicitly labeled
`unverified` with a provenance note: *"memory-recalled values are
unverified — treat as leads only, not as values."* (The sidecar also
documents its own correction: the first draft had laundered those recalled
numbers as `inferred`; the provenance validator now rejects that pattern in
CI.)

This is the differentiator: an agent that returns "unverifiable, here is the
unblock path (obtain §20.3 and Ch. 18)" instead of a confident fabrication.

## Example 2 — Blind verification catching a code misapplication

**Case:** civil synthesis-overreach benchmark case
(`tasks/benchmark/cases/civil/civil-synthesis_overreach-01.md`)
**Verifier report:** `tasks/benchmark/results/civil-synthesis_overreach-01-result.md`

The blind verifier receives only the question, evidence passages, and a
claimed conclusion — never the author's reasoning or the expected answer. It
re-derives the math, checks the provision, and returns a machine-parseable
verdict:
```
MACHINE_VERDICT: BLOCKED | FLAW: code_misapplication | CONFIDENCE: 0.95
| CHECKS_PASSED: 3/8 | LINE_PINNED: 5/5
```

with a line-pinned evidence trail (§, quote, verdict-per-finding). The
conclusion's arithmetic was internally correct — the flaw was in *which
provision* was applied, which only opens-and-reads verification catches.

**Status:** scored — current numbers, weaknesses, and per-case residuals
live in `tasks/benchmark/RESULTS.md` (this doc does not duplicate them). A
separate pressure suite (`tasks/benchmark/pressure/`) tests verdict integrity
*under persuasion* — authority, sunk-cost, time pressure, reframe, pedantry;
its scored results are in that directory's README.

## Example 3 — Methodology skill: scored design alternatives, no "best" pick

**Question:** joining method for additively manufactured Ti-6Al-4V brackets
to wrought spars in aircraft structures
**Artifact:** `outputs/design-alternatives/am-ti64-bracket-to-wrought-spar-joining.md`

The `design-alternatives` skill structures the problem (hard constraints:
damage tolerance per FAA AC 25.571-1D, spectrum fatigue life, NDI
inspectability; evaluation criteria: performance, cost, durability, risk,
certification) and scores each alternative — mechanical fastening, bonding,
welding, hybrid — against the same criteria. It deliberately does **not**
declare a winner: scoring is evidence ranking, selection is the engineer's
call. Every governing standard named (MMPDS, AWS D17.1, AMS process specs) is
a real, checkable reference.

## Reproducing these

```bash
bash tasks/benchmark/run-benchmark.sh            # 20 blind verifier runs
node scripts/score-benchmark.mjs tasks/benchmark/results
bash tasks/benchmark/run-benchmark.sh "" tasks/benchmark/pressure   # pressure suite
node scripts/score-benchmark.mjs tasks/benchmark/pressure-results tasks/benchmark/pressure
```
