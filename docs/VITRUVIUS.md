# Vitruvius — Engineering Research Agent (Architecture)

> Internal architecture documentation. For the user-facing overview, install
> instructions, and FAQ, see the [README](../README.md). For the steal map and
> live roadmap, see [docs/STEAL.md](STEAL.md). Status of claims in this file:
> verified against the repo as of 2026-09.

---

## Table of Contents

1. [What Vitruvius Is](#what-vitruvius-is)
2. [Repository Layout](#repository-layout)
3. [The Research Loop](#the-research-loop)
4. [The Verification System](#the-verification-system)
5. [Provenance and Evidence](#provenance-and-evidence)
6. [Multi-Agent Orchestration](#multi-agent-orchestration)
7. [Measurement](#measurement)
8. [Artifact Conventions](#artifact-conventions)
9. [Security](#security)
10. [CI](#ci)

---

## What Vitruvius Is

Vitruvius is an **engineering research agent**: it runs a
**discover → read → synthesize → verify → review** loop over engineering
questions and artifacts, with auditable provenance throughout. Five
disciplines: mechanical, software, civil, electrical, architectural.

It is **not** an engineering coach, a CAD/BIM tool, a calculation engine, or a
writing assistant. Scope discipline (AGENTS.md §F1): every capability must
serve a core research job — discovering, reading, ranking, verifying, or
synthesizing engineering knowledge — or it is rejected.

The differentiator, stated in one sentence: **Vitruvius is an engineering research agent whose verification claims are backed by checked-in benchmark and pressure artifacts, with their limitations published** — the latest adversarial benchmark reports 75% with one false approval, zero false blocks, and one conservative overcall; five deterministic PASS scoring fixtures report 5/5; the latest pressure artifact reports 4/5 with one false approval. The PASS fixtures test parser/scorer behavior, not independent verifier capability.

## Repository Layout

```
skills/                 25 skills (frontmatter contract, ≤500 lines each)
  <discipline>/           5 thin dispatchers with domain evidence landscapes
  engineering-research/   the shared method (all others dispatch into it)
  verifier/               blind verification (8 checks, default-FAIL)
  gap-analysis, evidence-ranking, design-alternatives, ...   methodology
agents/                 seven canonical role files (researcher, writer, verifier,
                        reviewer, arbiter, goal-checker, habit) — dispatch targets,
                        with declared tool bounds and uneven N11 coverage
.opencode/agent/        thin host adapters pointing at agents/*.md
.opencode/plugins/      OpenCode plugin entry
references/             shared long-form references (blocked-access policy,
                        evidence-quality tiers, token budgets, context mgmt)
scripts/                validators, scorer, benchmark runner, adapters
tests/                  contract, routing evals, skill tests
tasks/benchmark/        20 adversarial cases + 5 PASS scoring fixtures + 5 pressure cases + results
outputs/                research artifacts (gitignored)
docs/                   STEAL map, this file, audit, examples, portability
```

## The Research Loop

`skills/engineering-research/SKILL.md` is the shared method for discipline and
multi-phase research workflows. Standalone skills such as `summarize` and
`artifact-reading` retain their own narrower boundaries and do not all dispatch
through it. Steps and their gates:

| Step | Gate / mechanism |
|------|------------------|
| **1. Plan** | Input Gate: research-question-not-coding check, slug derivability, jurisdiction/edition awareness, write availability. Plan to `outputs/.plans/<slug>.md` immediately; no blocking for confirmation |
| **2. Scale** | Direct search for narrow questions; 2–6 researcher subagents only when decomposition helps. Parallel fan-out (T2) for independent skills |
| **3. Gather** | Increment checklist: ≥3 distinct queries, direct reads (never snippet/memory), notes to disk after each batch |
| **4. Draft** | Every claim carries a source reference; blocked sources cited from metadata only |
| **5. Verify** | Blind verifier (below); conditional escalation 1→2→3 (A4); severity→verdict gate |
| **6. Review** | Final self-review, then the mandatory post-edit citation audit (Step 6.5); do not claim an independent reviewer where the method requires self-review |
| **7. Deliver** | **GOAL-CHECK gate**: independent re-derivation of every ask from the original question — default NOT-DONE, machine line `E2E: scope= prompt= flaws= ran=`. Then artifacts + provenance sidecar |

Repair rule: a NOT-DONE goal check or a verifier FAIL sends work back to the
responsible step to **repair the named items only** — accepted evidence and
verifier results are retained, the run is not redone. A second NOT-DONE on
the same axis is delivered honestly with the unmet asks listed.

## The Verification System

### Blind verifier

`agents/verifier.md` (skill: `skills/verifier/SKILL.md`, v0.3.0). The
verifier receives only the question, the evidence, and the claimed conclusion
— never the author's reasoning. It has **no Write/Edit**: it is a judge, not
a fixer.

Eight checks, in order: code/standard applicability, units and signs,
completeness (governing cases), missing factors, calculation integrity
(re-derivation), source-to-claim fidelity (line-pinned), conflict check,
citation entailment.

**Default-FAIL posture:** every claim starts FAILED; PASS is earned only on
opened, quoted evidence. Uncertain means PARTIAL or BLOCKED.

**Severity→verdict gate** (added after Run 1's false approvals): the word
"non-blocking" may only describe an issue that changes neither the number a
reader would use nor the decision a reader would make. Any detected
discrepancy caps the verdict at PARTIAL. Margin/compliance language must be
quantified; cited-but-unused answer-changing evidence is a criterion
mismatch → PARTIAL.

**PARTIAL vs BLOCKED decision rule:** can a reader use the answer as
delivered? A wrong, contradicted, or unverifiable deliverable is BLOCKED (a
qualified wrong number is still a wrong number). A directionally correct
deliverable needing qualification is PARTIAL.

**Verdict vocabulary:** exactly `PASS | PARTIAL | BLOCKED`. "FAIL" is the
starting posture, never a verdict value. The `MACHINE_VERDICT:` line is a
machine contract (bare-token fields) — scored by `scripts/verifier-parser.mjs`.

### Escalation (A4)

Routine claim → 1 verifier. Critical (life-safety, code-provision-sole-basis,
design-governing number, cross-discipline, `--deep`) → 2 parallel verifiers.
Disagreement → arbiter (`agents/arbiter.md`): adjudicates from the two
evidence trails, never re-researches; harsher verdict wins ties;
BLOCKED > PARTIAL > PASS.

### GOAL-CHECK

`agents/goal-checker.md`. Independent end-of-run check, default NOT-DONE.
Re-derives every ask from the **original question text alone** (the plan is a
cross-reference; a plan that dropped an ask is caught as `prompt=gap`).
Tri-axis machine line `E2E: scope=<pass|gap> prompt=<pass|gap> flaws=<n>
ran=<phrase>`; DONE requires scope=pass, prompt=pass, flaws=0 (MINOR
included; WONTFIX needs a one-line evidenced justification). Documented
BLOCKED verdicts in the artifact are not flaws.

### Agent contracts (N11)

Canonical role files declare **activation** (no brief → `INVALID-DISPATCH`),
**terminal-only** behavior (no subagent spawning or re-dispatch), and
machine-parseable report shapes. Mission-pointer coverage is uneven: some
judge roles declare path + SHA-256 + byte-count checks, while researcher and
writer coverage remains partial; declared policy is not a uniform technical
permission boundary.

## Provenance and Evidence

Research outputs are intended to ship `<slug>.provenance.md` next to the
artifact. `scripts/validate-artifacts.mjs` validates selected root, plan, and
draft provenance paths, including required fields, the 6-label enum, labeled
claim counts, zero-claims-must-be-BLOCKED, plan reference, and — since the
inferred-semantics rule — a `## Derivations` section whenever a claim is
labeled `inferred`. Nested and method-specific sidecar closure remains
pending.

| Label | Meaning | Rule |
|-------|---------|------|
| `verified` | Source read directly, claim traces to §/line | Every load-bearing claim must reach this |
| `partial` | Directionally correct, needs qualification | — |
| `blocked` | Source unreachable or unverifiable | Cite from metadata, never guess contents |
| `unverified` | Default — not yet checked | **Memory-recalled values land here, never `inferred`** |
| `inferred` | Logical deduction **from read sources** | Requires a derivation trace (which sources + what reasoning) — validator-enforced |
| `failed` | Source contradicts the claim | Fix the claim or find a better source |

Bidirectional citation integrity (verifier check 6): no orphan citations, no
orphan sources, artifact sweep over numbers/figures/tables.

## Measurement

Five measurement layers are documented here; enforcement and reproducibility vary by layer, and the limitations are part of the result:

| Layer | Instrument | Current status |
|-------|-----------|----------------|
| Verdict correctness | 20 adversarial cases × 5 disciplines plus 5 PASS scoring fixtures, blind headless runs (`tasks/benchmark/run-benchmark.sh` + `scripts/score-benchmark.mjs`) | Latest checked-in adversarial run: 75%; one false approval, zero false blocks, one conservative overcall; PASS scoring fixtures 5/5. Run-to-run variance is material and decision-grade certification remains open. Residuals: margin-earnedness and required-value boundaries sit on the variance line |
| Integrity under persuasion | 5 pressure cases (authority, sunk-cost, time, reframe, pedantic) in `tasks/benchmark/pressure/` | Latest artifact: 4/5 held with one false approval; no false-block guarantee is claimed |
| Trigger routing | `tests/routing/eval-routing.mjs`: trigram collision check + TF-IDF rank-1 over 20 labeled prompts covering all 5 disciplines | 16/20 rank-1 (75% floor); misses persisted to `tests/routing/last-misses.txt` |
| Structural contract | `scripts/validate-contract.mjs`: frontmatter (with merged-key guard), 500-line cap, link/skill-reference resolution, no stray tests | 25/25 pass |
| Provenance schema | `scripts/validate-artifacts.mjs` (incl. inferred-derivation gate) | selected root/plan/draft paths pass; nested closure remains pending |

Benchmark history and per-case residuals live in
`tasks/benchmark/RESULTS.md`. Ground truth is never shown to the verifier
(`run-benchmark.sh` strips it, with a leak guard that aborts on residual
ground-truth material).

## Artifact Conventions

Slug-prefixed files per run (lowercase, hyphenated, ≤5 words):
plan `outputs/.plans/<slug>.md`, research `<slug>-research-<scope>.md`, draft
`outputs/.drafts/<slug>-draft.md`, cited `<slug>-cited.md`, verification
`<slug>-verification.md`, final `outputs/<slug>.md`, provenance
`<slug>.provenance.md`. `outputs/` is gitignored; the 20 adversarial and five PASS scoring-fixture result files are explicitly tracked under `tasks/benchmark/`, with the run summary in `tasks/benchmark/RESULTS.md`.

## Security

`scripts/security-scan.mjs` (pattern scan: secrets, dangerous calls,
exfiltration, personal paths) runs in CI (`.github/workflows/security-scan.yml`).
Policy: [SECURITY.md](../SECURITY.md). S7 boundary on every skill:
**research-only, not for final engineering sign-off.**

## CI

`.github/workflows/`: Vitruvius CI (`npm test` — contract, artifacts,
security, routing, adapter parity, benchmark-integrity fixtures, Habit runtime,
proposal intake, run-ledger execution, E1/C1 contract checks, and test-integrity
regressions), Release, Security Scan, Skill Validation. `npm test` now uses deterministic artifact-closure and output-quality fixtures rather than treating the mutable ignored `outputs/` tree as a CI oracle. The shared assertion path fails closed; the fixed-case C1 pilot, GC1 GOAL-CHECK contract, PR1 closure contract, and V1 field-pilot contract are implemented. The standalone benchmark CLI, pressure suite, package-consumer checks, real V1 field run, and broader case breadth remain open. Current reported checks are 75% latest adversarial benchmark correctness, 5/5 PASS scoring fixtures, 4/5 latest pressure cases with one false approval, and a 75% routing rank-1 floor.
