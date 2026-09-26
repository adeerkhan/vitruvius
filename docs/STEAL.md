# Steal Map: Reference Patterns for Vitruvius

**Snapshot:** 2026-09-25  
**Implementation HEAD:** `c742ea1` plus the PA1/entailment and R1/G1 slice (see the 2026-09-26 update below)  
**Scope:** local projects under `ref/` and the current Vitruvius working tree.  
**Rule:** steal design patterns, not domain scope or incompatible code. Keep every transfer traceable to a local path.

This is the current decision map. Historical audit prose remains in `docs/audit-2026-09.md`; it is not the live status source.

## 2026-09-26 update (supersedes statuses below where they differ)

Landed after the 2026-09-25 snapshot:

- **PA1 — problem anchor** (`vitruvius-problem-anchor.v1`): binds a run to the artifacts it studies (hash-pinned), requires every finding to name a landing site, every declared decision to reach a finding, negative coverage, and a `path:line` anchor for `repo` claims. A high-precision entailment proxy (`scripts/entailment.mjs`) gates `verified` on quoted spans, identifiers, and measures. Implemented and wired into `npm test`.
- **A real V1 run has happened.** The first field pilot ran on a real repository and produced a retained record (7 asks, 4 negative-coverage entries, 8 anchored findings). A later run exposed the adoption gap: the machine records were not written because no validator was installed in the project, which the next two items address.
- **Effort is user-controlled, default thorough.** The 15–20 turn target, the quick-mode default, and the 80% stop-and-deliver rule are removed. `--turns`/`--budget` (or plain language) set the ceiling; with none, the run continues until evidence saturates (`engineering-research` 0.2.8).
- **Page-anchored PDF reading.** A shared extractor stamps `[[page N]]`, reconstructs reading order, hashes the source, and deletes the binary only after a usable extraction. Fixes `pdf-parse` 1.x rejecting a Node `Buffer` ("bad XRef entry").
- **Records mandatory, validator optional.** Problem-anchor and GOAL-CHECK records are always written; a missing validator marks validation `BLOCKED` instead of dropping the record.
- **Provenance and citation lint.** `validate-artifacts` requires `Final SHA-256`, `Final bytes`, and the `GOAL-CHECK` line on engineering-research sidecars; `check-output-quality` flags Sources entries nothing cites and repo claims anchored to a bare filename.
- **R1 — package/consumer smoke.** `tests/artifacts/test-package-consumer.mjs` packs the exact tarball, checks its size budget and discovery surface, installs it into a clean consumer, resolves the four validator bins, and runs one (`npm run test:package-consumer`).
- **G1 — shared input gates.** `references/input-gate.md` is the gate; every standalone research skill declares `## Input Gate` and is checked by `tests/input-gate/test-input-gate.mjs` (`npm run test:input-gate`).
- **Cheap integrity pass (same slice).** Five methodology skills now name their `.provenance.md` sidecar (shared minimal shape in `references/provenance-sidecar.md`); the hypothesis-generation test uses a checked-in fixture plus negative mutations instead of skipping; the command contract now covers all 25 skills with regenerated adapters; and the adapter drift test compares the host ruleset after line-ending normalization.
- **M1 — need-based scholarly routing.** `scholarly-research` 0.2.0 adds six routing modes (`discover`, `known-id`, `citation-graph`, `semantic`, `full-text`, `code-prior-art`), the multi-query merge rule, and a first-class code prior-art path where a repository is a lead verified at `path:line`. Feynman source-routing transfer; checked by `tests/scholarly-research/test-scholarly-routing.mjs`.
- **N1 — exact-first source identity and negative coverage.** `evidence.v1` sources gain `aliases`, `merged_into`, `merge_rule`, and `discard_reason` (no chains, no self-merge, merged duplicates never load-bearing), and negative coverage distinguishes `documented`, `measured_zero`, `skipped`, `truncated`, `blocked`, and `not_reached`. BugTraceAI transfer; the evidence contract tests were extended.

`docs/` is now tracked (removed from `.gitignore`) because this map is the declared status source.

## Source inventory

| Source | Local revision | License | Decision |
|---|---|---|---|
| `ref/abrt` | `1ae85385932385711259cd06124e4306bfe75a23` (Git objects; no worktree) | GPL-2.0-or-later | Borrow failure-visible tests and trust boundaries only; no code |
| `ref/agent-skills` | `bcab6a1b8503100e8618c3b4e32cc78de43de769` | MIT | Borrow evaluation/contract mechanics |
| `ref/autoprompt-skill` | `91dc6edf336abea96ceb10eaf7efab77ca4c7007` | MIT | Borrow generation, drift checks, receipts, manifests |
| `ref/BugTraceAI-CLI` | `86172cec85a3df7d12147f736eaa600dc8e09fd4` | Apache-2.0 | Borrow negative coverage and auditable deduplication |
| `ref/feynman` | `fdf56b1ca111c2f516b9647593a20781f4d79598` | MIT | Borrow end-to-end evals, artifact pairing, release budgets |
| `ref/humanizer` | `9862685f575c65a8247f90369951df1b3416e3d6` | MIT | Borrow package smoke tests and prompt clarity |
| `ref/scientific-agent-skills` | `49c6e97775eaa18ba791bebe23162a70ae601c18` | MIT | Borrow ledgers, input gates, fixtures, scope discipline |
| `ref/semble` | `9bd776d7eaef0ee918ef39c546ea902399d7a5ba` | MIT | Borrow retrieval-to-direct-read bridge and benchmark method |

Cognee and Ponytail appear in older notes but have no current checkout under `ref/`; their claims are historical, not current evidence.

## Executive position

Vitruvius already has its moat: engineering-specific research, primary-source discipline, blind verification with declared read-only judge bounds, BLOCKED/PARTIAL outcomes, provenance labels, and an auditable research loop.

The first reliability and learning slices are now implemented: failed shared assertions terminate their test process, generated adapter drift is a hard checkable failure, benchmark scoring is fail-closed with PASS scoring fixtures, proposal intake has a bounded self-contained execution path, the run logger has a tested `run.v1` ledger, E1/C1 evaluation pilots are retained, and Habit has an explicit validation → approval → local activation → later-run load → revocation path. GC1 now has a deterministic GOAL-CHECK contract, PR1 has a recursive closure fixture gate, and V1 has a field-pilot record contract; no real external-source field result is claimed yet. The next wins are still reliability and observed value, not more catalogue breadth:

1. Run V1 on real engineering questions and retain source bytes or honest blocked records.
2. Use those observations to decide whether G1 input gates, broader source acquisition, or retrieval work is actually needed.
3. Keep the R0 proposal/document boundary explicit while downstream research remains agent-led.
4. Add package-consumer/release smoke checks (R1) after the proof contracts remain green.
5. Expand E1/C1 only when a field failure demonstrates the need; do not call partial coverage complete.

Keep the Q1 pilot local-only until a concrete external-source need justifies broader source types. The V1 contract records that need; it does not presume it.

## Current state

### Implemented in this slice

- **T1 — truthful test exits:** `tests/_contract/contract.mjs` now throws on a failed shared assertion; `tests/_contract/failing-check.mjs` and `tests/_contract/test-check.mjs` prove a deliberately broken fixture exits nonzero and is wired into `npm test`.
- **A1 — exact adapter delivery:** five corrupted OpenCode operative paths are repaired; `tests/agents/test-agents.mjs` requires an anchored canonical path and rejects control bytes; `scripts/generate-adapters.mjs --check` compares generated command surfaces without rewriting them, with a stale-output regression fixture wired into the test command.
- **B0 — truthful benchmark controls:** `scripts/benchmark-scoring.mjs` centralizes strict verdict parsing and complete-case accounting; the 20 adversarial cases and five deterministic PASS scoring fixtures are tested without skips; the benchmark runner fails on missing or invalid verdicts.
- **H1 — executable Habit lifecycle:** `scripts/habit-ledger.mjs` validates `habit.v1`, redacts secrets, records explicit approval, activates only approved rules into a project-local store, loads scoped context later, and supports expiry, supersession, revocation, locking, and sidecar enforcement.
- **R0 — bounded proposal/document execution:** local text intake, optional PDF parsing, fail-closed URL/image/binary boundaries, digest-bound provenance, structured registration, and complete binder gates pass; OCR, URL fetching, and downstream research remain explicit limits.
- **L1 — tested run ledger:** the skill-local logger and root compatibility wrapper emit validated `run.v1` JSONL with UUID/timestamp identity, bounded lock contention, duplicate refusal, and project-root/runs-directory isolation.
- **E1 pilot — fixture-linked behavioral contracts:** four priority skills have positive/owner-negative triggers, retained runtime fixture references, and fail-closed catalog validation; this is not full 25-skill behavioral coverage.
- **C1 pilot — fixed local research cases:** three local-only cases (`verified`, `blocked`, and `partial`) each have one fresh general-subagent run, paired final/provenance artifacts, hashes, and independent read-only grading. Host model cost is unavailable and no cross-host claim is made.
- **Q1 pilot — L1-bound evidence ledger:** `evidence.v1` requires an existing `run.v1` entry, byte-pinned local sources, strict source/search/claim IDs, screening counts, explicit support, and negative/ambiguous coverage; partial completion is valid but not complete. One local subagent example and independent review are retained in the explicitly tracked `outputs/.q1-example/` bundle. It is not a general evidence database.
- **GC1 — deterministic GOAL-CHECK contract:** `vitruvius-goal-check.v1` binds the original question, a hash-bound frozen requirements/scope manifest, candidate bytes/hash, plan, provenance, scope/prompt checks, evidenced findings, and the E2E report. Positive, manifest-omission, repeated-gap, false-DONE, unevidenced-finding, duplicate-provenance, and tampering fixtures pass; a valid `NOT-DONE` is retained but not promotable. Semantic omission from the pre-dispatch manifest remains a host/model smoke boundary.
- **PR1 — recursive closure contract:** temporary-directory tests cover nested final/provenance pairs, orphan and missing sidecars, stale hashes/bytes, path escapes, and working/judge-file exclusions. The mutable local `outputs/` tree is now an explicit opt-in scan (`npm run check:local-artifacts`) that reports legacy debt, not the normal CI oracle.
- **V1 — field-pilot contract:** `vitruvius-field-pilot.v1` records the original question, source retrieval state, retained bytes or blocked reason plus unblock path, plan/final/provenance/strict-verifier/GOAL-CHECK artifacts, matching identities, hashes/bytes, time/cost availability, user corrections, and decision outcome. The checked-in template is intentionally incomplete; no real pilot result is claimed.

### Shipped

- 25-skill structural contract, local-link checks, skill-reference lint, security scan, and S7 boundary checks (`package.json:50-70`, `scripts/validate-contract.mjs`).
- T1 test-integrity gate: shared failures throw, a deliberately failing fixture exits nonzero, and `npm test` includes the regression check.
- A1 adapter-delivery gate: operative role paths are exact, control-byte corruption is rejected, and `generate-adapters.mjs --check` detects generated drift without writing.
- Seven canonical role definitions with declared read-only judge bounds, terminal behavior, and machine report lines (`agents/`, `.opencode/agent/`, `tests/agents/test-agents.mjs`); mission-pointer coverage and technical permission enforcement remain partial.
- Default-FAIL verifier, eight adversarial checks, severity-to-verdict gate, bidirectional citation checks, and BLOCKED/PARTIAL outcomes (`agents/verifier.md`, `skills/verifier/SKILL.md`).
- Scored verifier benchmark, deterministic PASS scoring fixtures, strict result-integrity checks, and pressure suite (`tasks/benchmark/RESULTS.md`, `tasks/benchmark/pressure/`); latest adversarial results report 75%, one false approval, zero false blocks, and one conservative overcall, while the five PASS fixtures score 5/5. Single-run residuals remain open.
- Routing collision/rank-1 evaluation and provenance validation (`tests/routing/eval-routing.mjs`, `scripts/validate-artifacts.mjs`).
- Habit lifecycle runtime and fixtures (`scripts/habit-ledger.mjs`, `tests/habit/test-habit-runtime.mjs`, `tests/habit/test-habit-cli.mjs`); later-run context is explicit, scoped, and project-local.
- R0 proposal/document runtime and binder fixtures (`skills/proposal/scripts/`, `tests/proposal/test-proposal.mjs`); supported local intake is executable and unsupported OCR/URL/image paths fail closed.
- L1 run-ledger runtime and concurrency/failure fixtures (`skills/engineering-research/scripts/log-run.mjs`, `scripts/log-run.mjs`, `tests/logging/test-log-run.mjs`); `run.v1` identity and duplicate refusal are tested without a full governance/provider claim.
- README hero, quantified value, install/uninstall, command tables, FAQ, and three worked examples (`README.md`, `docs/examples.md`).
- Thin command generation from `scripts/command-contract.mjs` (`scripts/generate-adapters.mjs`).

### Partial

- Habit’s core lifecycle is executable, but normal research runs still do not automatically invoke it; cryptographic approval identity, retention/deletion policy, and cross-project user scope remain future work.
- N10 has verifier pressure coverage, but broad per-skill behavioral/eval coverage is incomplete.
- N9 input-gate work exists in `engineering-research` only and is duplicated in the historical roadmap.
- F3 progressive disclosure is a selective refactor, not a missing principle.
- Run logging now has a tested `run.v1` JSONL slice, but it remains a precursor rather than a complete governance/provider system. Command generation now has a deterministic `--check` drift gate, but the command contract still does not enumerate every skill.
- PR1 validates new closure behavior with temporary fixtures; the existing ignored output tree still contains legacy method-specific layouts and is intentionally not silently grandfathered by the generic contract.
- V1 has a validated record format but no real external-source run, user-impact measurement, or source-type decision yet; the template is not a result.

### Confirmed defects to fix before feature expansion

- “Read-only” judge/Habit roles still expose Bash in their declared tools; this is policy, not a technical permission boundary, until host restrictions and negative tests enforce it.
- `scripts/yaml-frontmatter.mjs:14-45` is not host-compatible YAML parsing.
- `scripts/validate-artifacts.mjs:16-18,134-149` still checks only selected legacy paths; the new generic closure contract is `scripts/artifact-closure.mjs`, and the local combined audit is opt-in.
- `docs/`, `outputs/`, and `ref/` are ignored by `.gitignore:3-4,14`; the Q1 example under `outputs/.q1-example/` is an explicit tracked exception, while the audit/map remain local ignored artifacts.

- N7 disposition: the runtime lifecycle and skill contract are behavioral changes; the current baseline carries `skills/habit/SKILL.md` version `0.1.3` after the prior `0.1.2` audit edit. Any later behavioral change requires another bump.

### Additional P0/P1 findings

- `scripts/extract-document.mjs:5-7` is now a thin wrapper over the self-contained `skills/proposal/scripts/document-extractor.mjs`; the original `await` syntax defect is repaired, `pdf-parse@1.1.1` is declared as optional, binary masquerading/empty/PDF fallback/URL/image boundaries fail closed, and the focused proposal test covers copied-skill execution. PDF OCR/URL fetching and the downstream agent-enriched research phases remain partial.
- `skills/proposal/scripts/parse-posting.mjs` and `parse-cv.mjs` now provide append-only raw intake plus phase-0 provenance; `register-structured.mjs` records structured digests, updates `run-manifest.json`, and invalidates descendants. `assemble-binder.mjs` requires one current lineage marker per phase, exact raw sidecars, hashed parsed provenance, a structured profile, explicit voice status, the complete verifier contract with one `PASS`, non-empty core artifacts, and no blocked retry sidecar; stale outputs are renamed rather than left as current.
- `scripts/security-scan.mjs` scans skill-local runtimes plus the root extractor/verifier and E1/C1 eval scripts; the deterministic proposal extractor no longer invokes a subprocess, and `npm test` includes proposal, run-ledger, and eval-contract execution. Broader pressure and package-consumer discovery remain open.
- `agents/reviewer.md:4,22-25` declares no Bash while requiring hash/byte verification; researcher/writer mission-pointer coverage remains partial, as documented in `docs/VITRUVIUS.md:134-139`.
- `scripts/command-contract.mjs:11-138`, generated commands, README, and `vitruvius-help` still do not form one complete contract; `generate-adapters.mjs --check` now detects generated-file drift, but role adapters are validated separately.
- Existing outputs contain unresolved consistency issues: ACI status counts, design-alternatives “best overall” wording, evidence-ranking Tier 3 count, FMEA Critical threshold labeling, and `docs/examples.md` links to ignored/local-only benchmark artifacts.
- `scripts/check-output-quality.mjs:5-9,19-75` still advertises provenance checking but does not implement final/sidecar pairing; generic pairing is now owned by `scripts/artifact-closure.mjs` and the legacy scan remains opt-in.
- `CONTRIBUTING.md:9,36,45` references missing `IMPLEMENTATION.md` and nonexistent `scripts/validate-skills.mjs`; `scripts/test-skills.mjs:24-36` has a stale writer allowlist.

## Habit learning: target lifecycle

**Status: core lifecycle implemented; integration and governance remain partial.** The role still proposes only. The lead now validates a `habit.v1` ledger, records explicit approval, activates a project-local store, loads scoped rules in a later run, and supports expiry, supersession, revocation, locking, and sidecar enforcement. No passive scan, hidden cross-project memory, or `AGENTS.md` write exists.

```text
user turns + stable IDs
        ↓
read-only habit role
        ↓
candidate JSON or {"c":[]}
        ↓
lead validation + redaction + human approval
        ↓
outputs/.habits/<slug>.json + provenance sidecar
        ↓
project-local activation → later-run scoped context
        ↓
expiry / supersession / revocation
```

### Remaining contract work

1. Decide whether authenticated approval identity is required beyond the explicit host-level `approvedBy` audit field.
2. Define retention/deletion policy for embedded transcript windows and project-local stores.
3. Integrate explicit Habit activation/load into selected research workflows without automatic capture.
4. Add broader behavioral fixtures for reversals, task-scoped drops, privacy precedence, and retention deletion.
5. Preserve the precedence boundary: preferences cannot override source-integrity, safety, or verification rules.

Do not call this model training. It is an explicit, provenance-backed user-preference ledger.

## Ranked steal backlog

**Canonical execution order:** final-gate proof → recursive artifact closure → real-question field pilot → source-type decision → test integrity → adapter delivery → benchmark controls → proposal/document execution → run logger → Habit lifecycle → source/claim ledger → fixtures → end-to-end eval → input gates → package/release → retrieval/routing/dedup polish. GC1, PR1, and the V1 contract are implemented; the next bounded work is a real V1 run, then evidence-driven G1/R1 or retrieval work. The table is an inventory; this order controls execution.
| Priority | ID | Steal | Sources | Done when |
|---|---|---|---|---|
| P0 (partial) | H1 | Executable habit-ledger validator and activation lifecycle | Humanizer, Scientific Agent Skills, Feynman | Core lifecycle and fixtures pass; approval identity, retention/deletion, and workflow integration remain |
| P0 (pilot) | Q1 | Per-run source/search/claim ledger | Scientific Agent Skills, BugTraceAI, Feynman | Unknown IDs, orphan mappings, unverified support, byte/hash mismatches, and coverage ambiguity fail closed; partial ledgers report non-complete status |
| P0 (implemented) | GC1 | Deterministic GOAL-CHECK contract and promotion gate | Autoprompt, Feynman | Omitted asks and open findings produce valid non-promotable `NOT-DONE`; positive records are hash-bound and wired into `npm test`; semantic model coverage remains a separate smoke |
| P0 (implemented) | PR1 | Recursive final/provenance closure | Agent Skills, Scientific Agent Skills | Nested pairs, orphan/missing sidecars, stale bytes/hashes, and path escapes fail closed; local legacy scan remains opt-in |
| P1 (contract; run pending) | V1 | Real-question field-pilot record and source-access feedback | Feynman, Humanizer, ABRT | Retained source bytes or blocked reasons, final/provenance/verifier/GOAL-CHECK artifacts, outcome metrics, and an honest completion state validate; no result is claimed until a real run exists |
| P0 (implemented) | T1 | Test harness that can fail | Agent Skills | Deliberately broken fixtures produce nonzero exits; regression check is in `npm test` |
| P0 (implemented) | A1 | Exact adapter/command parity and control-byte rejection | Autoprompt, Humanizer, Feynman | Exact role paths, control-byte rejection, and generated-command `--check` drift gate are covered |
| P0 (implemented) | L1 | Repair and test run logger | Autoprompt, Feynman | `run.v1` JSONL, stable UUID/timestamp, validation, duplicate refusal, and isolated test runs are proven |
| P0 (implemented) | B0 | Truthful benchmark controls | Feynman, Agent Skills | Complete case coverage, strict verdict grammar, PASS scoring fixtures, distinct false-approval/block metrics, and fail-on-missing-verdict |
| P0 (implemented) | R0 | Repair proposal/document execution or narrow the claim | Feynman, ABRT | Self-contained local intake, syntax/dependency checks, fail-closed provenance, structured registration/lineage, and complete binder gates pass; OCR/URL and downstream research coverage remain explicit limits |
| P1 (pilot) | E1 | Fixture-driven per-skill evals with owner negatives | Agent Skills, Scientific Agent Skills | Four fixture-backed priority skills have positive/negative triggers, retained runtime artifacts, and fail-closed contract checks; full catalog coverage remains open |
| P1 | G1 | Operational input gates | Scientific Agent Skills | Every research-producing skill has a short explicit gate |
| P1 (pilot) | C1 | End-to-end fixed-case research eval | Feynman | Three local-only cases have one fresh subagent run each, final+provenance, expected evidence, hashes, and independent grading; host cost and broader case breadth remain open |
| P1 | R1 | Package/plugin discovery smoke and release provenance | Humanizer, Feynman | Exact tarball passes budget, install, manifest, and consumer checks |
| P1 | B1 | Majority-of-3/stronger-model benchmark certification | Feynman, Autoprompt | Variance and residuals are published; no point estimate is called certification |
| P2 | D1 | Retrieval-to-direct-read bridge and retrieval benchmark | Semble | Optional semantic recall improves end-to-end evidence quality, not just NDCG |
| P2 | M1 | Need-based scholarly routing and stable-ID cross-check | Feynman | Existing scholarly skill gains bounded modes; no new database skill |
| P2 | N1 | Exact-first source/claim deduplication with merge trail | BugTraceAI | Aliases and discard reasons survive; semantic merging is advisory only |
| P2 | O1 | Append-only rejected-change ledger | Agent Skills | Rejected prompt/skill/eval changes retain before/after evidence |
| P3 | U1 | Run-local lessons, remote retrieval, social proof | Feynman, Semble, Humanizer | Added only after a measured need; never auto-promoted to global preferences |

## Transfer anchors

The backlog’s project names resolve to these local evidence anchors; claims are not supported by project names alone.

| ID | Local source anchor | Transfer |
|---|---|---|
| H1 | `ref/humanizer/scripts/validate-package.py:30-87`; `ref/scientific-agent-skills/skills/hypothesis-generation/assets/evidence_ledger_template.csv:1-2`; `ref/feynman/evals/run.mjs:87-106`; `scripts/habit-ledger.mjs`; `tests/habit/test-habit-runtime.mjs` | Executable validation, local ledgers, lifecycle states, and privacy fixtures |
| Q1 | `ref/scientific-agent-skills/skills/hypothesis-generation/scripts/audit_evidence_ledger.py:32-65,134-205`; `ref/BugTraceAI-CLI/bugtrace/agents/xss/coverage.py:44-99`; `ref/feynman/evals/run.mjs:165-241` | Source/claim IDs, search boundaries, negative coverage, citation checks, and retained run evidence |
| GC1 | `ref/autoprompt-skill/agents/contracts/generic.md`; `agents/goal-checker.md`; `scripts/goal-check-contract.mjs`; `tests/agents/test-goal-check.mjs` | Derived completion verdict, literal final evidence, retained `NOT-DONE`, and promotion refusal |
| PR1 | `ref/agent-skills/scripts/validate-artifact-paths.js:4-52`; `ref/scientific-agent-skills` fixture/provenance patterns; `scripts/artifact-closure.mjs`; `tests/artifacts/test-validate-artifact-closure.mjs` | Recursive final/sidecar pairing, stale-byte refusal, and method-boundary exclusions |
| V1 | `ref/feynman/evals/run.mjs:165-241`; `ref/humanizer/scripts/validate-package.py:30-87`; `ref/abrt` failure bundles; `scripts/field-pilot-contract.mjs` | Real-question records, source retrieval outcomes, retained artifacts, and honest blocked/partial states |
| T1 | `ref/agent-skills/scripts/run-evals-test.js:70-147`; `ref/agent-skills/scripts/lib/skill-lint-test.js:40-135` | Tests that genuinely fail |
| A1 | `ref/autoprompt-skill/scripts/generate-provider-contracts.cjs:1116-1249`; `tests/agents/test-agents.mjs:83-95` | Canonical generation and exact adapter parity |
| L1 | `ref/autoprompt-skill/agents/contracts/generic.md:23-35`; `skills/engineering-research/scripts/log-run.mjs`; `scripts/log-run.mjs`; `tests/logging/test-log-run.mjs` | Run manifest and tested logger |
| B0 | `ref/feynman/evals/run.mjs:87-106`; `scripts/benchmark-scoring.mjs`; `scripts/verifier-parser.mjs`; `tests/verifier/test-verifier.mjs`; `tasks/benchmark/controls/` | Complete, non-vacuous benchmark controls and strict integrity gates |
| R0 | `ref/abrt` committed `tests/runtests/incomplete-problem/runtest.sh`; `skills/proposal/scripts/document-extractor.mjs`; `skills/proposal/scripts/assemble-binder.mjs`; `tests/proposal/test-proposal.mjs` | Self-contained intake, failure-visible execution, provenance, and complete artifact gates |
| E1 | `ref/agent-skills/evals/README.md:36-45,90-97`; `ref/scientific-agent-skills/tests/hypothesis-generation/test_scripts.py:50-168` | Per-skill fixtures and owner negatives |
| G1 | `ref/scientific-agent-skills/skills/clinical-reports/SKILL.md:37-49`; `skills/engineering-research/SKILL.md:96-110` | Operational input gates |
| C1 | `ref/feynman/evals/run.mjs:165-241`; `ref/humanizer/.github/workflows/validate.yml:22-29` | End-to-end and package/discovery smoke |
| D1 | `ref/semble/src/semble/search.py:12-132`; `ref/semble/src/semble/mcp.py:67-118` | Retrieval-to-direct-read bridge |
| M1 | `ref/feynman/.feynman/agents/researcher.md:21-40`; `ref/feynman/extensions/research-tools/science-databases.ts:260-327` | Need-based scholarly routing |
| N1 | `ref/BugTraceAI-CLI/bugtrace/agents/consolidation/core.py:167-300`; `ref/BugTraceAI-CLI/bugtrace/agents/consolidation/semantic_dedup.py:16-125` | Exact-first auditable deduplication |
| O1 | `ref/agent-skills/CONTRIBUTING.md:65-73`; `ref/agent-skills/evals/skill-impact.md:1-6` | Rejected-change ledger |
| U1 | `ref/feynman/prompts/log.md:1-14`; `ref/semble/benchmarks/README.md:122-139` | Later continuity and benchmark patterns |

## Per-source map

### Agent Skills

**Keep:** primary-source/version discipline, bounded repair, thin adapters, routing collisions.  
**Steal:** real failing tests, per-skill eval contracts, owner-based negative routing, artifact-path graph validation, parser/host parity, no-op-loop detection, rejected-change ledger.  
**Reject:** software-delivery lifecycle, generic productivity hooks, cross-model debate on every cycle, second router, generic memory.

### Autoprompt

**Keep:** independent judges, default-FAIL, conditional escalation, named-item repair, goal-check.  
**Steal:** canonical-to-provider generation, drift checks, content-addressed installed payloads, run manifest, receipts/rollback/locks for configuration mutation.  
**Reject:** 25-persona swarm, full supervisor/runtime, write-capable judges, reference benchmark headline.

### BugTraceAI-CLI

**Keep:** signal-versus-proof, bounded retries, direct evidence, human-reviewed preferences.  
**Steal:** immutable negative coverage, exact-first auditable deduplication.  
**Reject:** persona consensus, confidence arithmetic, fail-open validation, success-only learning, offensive tooling.

### Feynman

**Keep:** research loop, source layers, blocked outcomes, artifact lifecycle.  
**Steal:** fixed-case end-to-end evals, final/provenance pairing, minimal manifest, need-based scholarly routing, package budget, exact-tarball provenance, command parity, plan-as-working-memory.  
**Reject:** CLI/Pi runtime, editing verifier, automatic memory, workbench, telemetry, broad database suite.

### Humanizer

**Keep:** thin packaging, versioning, concise prompts, abstention.  
**Steal:** executable package/plugin discovery, pinned CI tools, positive prompt checklist, operational meaning for Habit `d`.  
**Reject:** single-root layout, one-version architecture, style catalog, package-only quality gate.

### Scientific Agent Skills

**Keep:** closed skill contracts, tests outside skills, security scanning, provenance, F1 scope.  
**Steal:** source/search/claim ledgers, input gates, fixture mutation tests, selective progressive disclosure.  
**Reject:** biology breadth, adjacent productivity tooling, Autoskill passive capture, Arbor optimization, fail-open scanning.

### Semble

**Keep:** context budgets, line anchors, direct-read rule, thin adapters.  
**Steal:** semantic recall → exact search → direct read, compact location schema, separate retrieval provenance, end-to-end retrieval benchmark.  
**Reject:** dedicated search subagent, global installer, telemetry, custom embedding platform, NDCG/token headline as research proof.

### ABRT

**Keep:** explicit completeness, honest blocked state, retained failure evidence.  
**Steal:** host smoke tests with failure bundles, trust-boundary negative tests, positive controls, and cleanup assertions.  
**Reject:** daemon/D-Bus/GUI/reporting architecture, crash deduplication, destructive cleanup, GPL code, BeakerLib/tmt stack.

## Reconciliation of old map entries

| Old item | Current decision |
|---|---|
| N1/N11 agent contracts | Shipped in canonical roles; adapter delivery and exact-path regression gate now repaired |
| N2 benchmark | Shipped but variance-limited; latest adversarial run reports 75%, one false approval, zero false blocks, and one conservative overcall; five PASS scoring fixtures report 5/5, while majority-of-three certification remains open |
| N3 routing | Shipped at 16/20; extend with owner negatives |
| N4/N5 provenance/citations | Shipped; add canonical per-run IDs and nested path closure |
| N7 versioning | Shipped |
| N8 examples | Three shipped; expand only with real runs |
| N9 input gates | Partial; generalize selectively |
| N10 behavioral evals | Verifier pressure phase shipped; per-skill fixtures/end-to-end runs remain |
| A1–A4 independent judges | Shipped in adapted form; do not import write-capable or huge swarms |
| A5 governance ledger | Tested `run.v1` precursor (`scripts/log-run.mjs`); full governance/provider integration remains open |
| A6 provider generation | Generated-command drift checking is shipped; full command-contract coverage remains partial; do not add provider sprawl |
| R1 value proposition | Shipped in README |
| R3 demo GIF | Parked until a real run recording exists |
| R4 benchmark chart | Parked; publish only reproducible data |
| R6 FAQ | Shipped |
| R7 starting-point table | Shipped |
| R9 “How it works” | Shipped in README |
| R10 uninstall table | Shipped |
| R12 command reference | Content shipped; generated-command parity check exists, while full one-contract enumeration remains partial |
| F3 progressive disclosure | Selective later refactor |
| F4 blocked access | Shipped |

## Non-negotiable boundaries

- Research-only, not for final engineering sign-off.
- Never fabricate or silently repair evidence.
- A judge never edits the artifact it judges.
- BLOCKED, PARTIAL, NOT-DONE, and rejected candidates are valid outcomes.
- A retrieved snippet is a lead, not a citation.
- A reference benchmark is not a Vitruvius benchmark.
- No passive screen mining, automatic skill promotion, or unreviewed global memory.
- No incompatible source-code copying; preserve licenses and notices.

## Verification and maintenance

- Keep this map synchronized with `outputs/ref-steal-repo-audit.md` and the independent handoffs under `outputs/.ref-audits/`.
- Run `npm test`, `npm run test:benchmark`, `npm run test:habit`, `npm run test:goal-check`, `npm run test:field-pilot`, `npm run test:package-contract`, contract validation, security scan, routing evaluation, and focused skill tests before committing.
- Run `npm run check:local-artifacts` when the mutable ignored output tree is intentionally being audited; do not use its legacy layout as a CI prerequisite.
- Treat green output as meaningful now that the shared assertion path fails closed; keep the deliberate failing fixture in the test command.
- Mark reference claims `verified`, `partial`, `blocked`, or `inferred`; do not turn static source inspection into runtime proof.
- Independent final review: B0/H1/R0/L1/E1/C1 scope is **PASS** through `6372fab`; the Q1 example was independently reviewed as PASS, with its minor provenance findings corrected and rechecked. The current working tree additionally passes GC1, PR1, and V1 deterministic contracts. Package consumer breadth, a real V1 run, downstream proposal-research evaluation, authenticated Habit identity/retention/integration, majority-of-three certification, and broader Q1 source types remain open.
- `docs/` is currently ignored by `.gitignore`; decide separately whether this map should become a tracked deliverable.

## R0/L1/E1/C1/Q1/GC1/PR1/V1 implementation record

- `node tests/proposal/test-proposal.mjs` — PASS: syntax, self-contained copied-skill execution/local CLI, raw intake, empty/PDF/URL/image refusal, digest-bound append-only phase provenance, structured registration/downstream invalidation, mixed-generation refusal, complete verifier-quality gates, non-PASS/duplicate verdicts, stale-binder invalidation, and package manifest checks.
- `npm test` — PASS after R0/L1/E1/C1/Q1/GC1/PR1/V1 wiring: proposal, run-ledger, Q1 evidence-ledger, eval-contract, goal-check, closure, and field-pilot checks are included; security scanning covers the shipped proposal runtime, engineering-research logger, E1/C1/Q1 validators, root extractor, and new contract runtimes.
- `npm pack --dry-run --json` — PASS: the package includes the root wrappers plus the proposal, engineering-research, GC1/PR1/V1 validation runtimes, and the field-pilot template.
- Packed consumer smoke — PASS: the tarball installed into a clean temporary consumer and exposed `vitruvius-field-pilot`; the intentionally incomplete template was rejected with actionable errors.
- `npm view pdf-parse@1.1.1` — verified package version `1.1.1`, MIT license; PDF extraction remains optional and fail-closed when tooling is absent.
- `npm run test:logger` — PASS: `run.v1` JSONL, UUID/timestamp generation, documented-field validation, bounded lock contention, duplicate refusal (including case aliases), date partitioning, explicit project/runs-directory isolation, copied-skill execution, controlled hold-then-release waiting, pre-locked fail-closed behavior, and invalid-input refusal.
- `npm run test:evals` — PASS: E1 catalog mutations fail closed; C1 synthetic suite/result mutations fail closed without model calls.
- `node tests/routing/eval-routing.mjs` — PASS: baseline 16/20 rank-1 remains above the 75% floor; E1 positive top-k 4/4 and owner-negative 4/4.
- C1 retained result bundle — PASS: three local cases, three fresh general-subagent sessions, paired final/provenance artifacts with exact status checks, fixture/result SHA-256 and byte counts, distinct-session/reviewer checks, and independent reviewer grades 3/3. Model/cost fields are explicitly unavailable.
- Q1 retained example — PASS: `outputs/.q1-example/` is an explicit tracked exception with an L1 JSONL entry, byte-pinned `evidence.v1` ledger, raw draft, manifest, and provenance sidecar; completion is honestly `partial` and the independent review is PASS.
- GC1 focused contract — PASS: `npm run test:goal-check` proves positive completion, manifest-omission `NOT-DONE`, repeated-gap retention, open-finding blocking, hash/path/binding consistency, and realpath-safe package entry behavior; semantic omission from the pre-dispatch manifest remains a host/model smoke boundary.
- PR1 closure fixtures — PASS: `npm run test:artifacts` proves nested final/provenance pairing, missing/orphan sidecar refusal, stale hash/byte refusal, and path-escape refusal; `npm run test:quality` remains deterministic.
- V1 contract fixture — PASS: `npm run test:field-pilot` proves source/artifact/GOAL-CHECK binding, canonical verifier grammar, physical identity/distinctness, and honest cost/completion states; no real external-source run or user-impact result is recorded yet.


- **shipped** — implemented and directly evidenced in the current tree.
- **partial** — useful mechanism exists, but acceptance is incomplete.
- **next** — highest-value bounded work.
- **later** — plausible, but not yet justified by a core research need.
- **parked** — deliberately deferred.
- **reject** — outside F1, unsafe, redundant, or license-incompatible.
