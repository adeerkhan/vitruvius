# Steal Map: Reference Patterns for Vitruvius

**Snapshot:** 2026-09-28  
**Implementation HEAD:** `6ffe74e`  
**Scope:** local projects under `ref/`, the current Vitruvius tree, and the
`tasks/benchmark` + `evals` artifacts.  
**Rule:** steal design patterns, not domain scope or incompatible code. Every
transfer resolves to a local path.

This is the live status map. Historical audit prose lives in git history.

## CodeGraph Integration

Both the main repo and `ref/` are indexed with CodeGraph:

| Index | Files | Nodes | Edges | Built |
|-------|-------|-------|-------|-------|
| `vitruvius/` | 97 | 2,011 | 4,773 | 1.7s |
| `vitruvius/ref/` | 1,711 | 39,041 | 125,821 | 10.1s |

The `codegraph_explore` MCP tool is available for semantic code search, impact
analysis, and call-path tracing. Use it before grep/find when understanding
or locating code.

## Source inventory

| Source | Local revision | License | State | Decision |
|---|---|---|---|---|
| `ref/abrt` | `1ae85385932385711259cd06124e4306bfe75a23` (Git objects; no worktree) | GPL-2.0-or-later | idea-only | Failure-visible tests + trust boundaries only; no code |
| `ref/agent-skills` | `2686b620fc1fed2e8f60c704839c766b8594c6b6` | MIT | mostly taken | Evaluation/contract mechanics |
| `ref/autoprompt-skill` | `b6516cf52a7891d797621fdd2a8ca0311e1ae0a9` | MIT | mostly taken | Generation, drift checks, receipts, manifests |
| `ref/BugTraceAI-CLI` | `ddb1b207f4c369d7e7f9d307fb10b82f544e5594` | Apache-2.0 | taken (core) | Negative coverage + auditable deduplication |
| `ref/feynman` | `fe3fd94943df8c5b519fed14c8485215b206aba8` | MIT | mostly taken | End-to-end evals, artifact pairing, release budgets |
| `ref/humanizer` | `9862685f575c65a8247f90369951df1b3416e3d6` | MIT | partly taken | Package smoke tests + prompt clarity |
| `ref/scientific-agent-skills` | `49c6e97775eaa18ba791bebe23162a70ae601c18` | MIT | mostly taken | Ledgers, input gates, fixtures, scope discipline |
| `ref/semble` | `24497845460960db1839c8485319df189a889225` | MIT | deferred | Retrieval-to-direct-read bridge + benchmark method |

`ref/abrt` has no materialized worktree; only its committed tree is inspectable.
Cognee and Ponytail appear in older notes but have no checkout.

## Where we stand

### Implemented (directly evidenced in the tree)

- **Research method gates.** Problem anchor (`vitruvius-problem-anchor.v1`) + entailment proxy (`scripts/entailment.mjs`), GOAL-CHECK (`scripts/goal-check-contract.mjs`), recursive artifact closure (`scripts/artifact-closure.mjs`), field-pilot contract (`scripts/field-pilot-contract.mjs`). All in `npm test`.
- **Provenance.** `evidence.v1` ledger with negative-coverage statuses (`documented`/`measured_zero`/`skipped`/`truncated`/`blocked`/`not_reached`) and exact-first dedup (`aliases`/`merged_into`/`merge_rule`/`discard_reason`); eng-research provenance requires `Final SHA-256`/`Final bytes`/`GOAL-CHECK`; citation lint for uncited sources and bare-filename anchors; minimal shared sidecar (`references/provenance-sidecar.md`).
- **Structural contract.** `scripts/validate-contract.mjs` owns frontmatter, layout (empty dirs, kebab supporting files), description triggers, writer/artifact contract, slug rule, personal-path ban, resolving links, and `outputs/` gitignore.
- **Bounded frontmatter parser** (`scripts/yaml-frontmatter.mjs`): folded/literal blocks, one nesting level, quotes, comments.
- **Run ledger.** `run.v1` JSONL, duplicate refusal, project-root isolation, and lease/TTL lock reclaim (`VITRUVIUS_LOCK_TTL_MS`).
- **Input gates.** `references/input-gate.md`; every standalone research skill declares `## Input Gate`.
- **Routing.** Need-based scholarly modes incl. `code-prior-art` (`scholarly-research` 0.2.x); command contract covers all 25 skills; OpenCode role adapters generated from `agents/*.md`; docs/command parity enforced; E1 owner-negative + `must_not_fire`.
- **Evaluation.** Verifier benchmark scorer + controls + pressure suite; majority-of-N harness (`scripts/majority-benchmark.mjs` + `scoreMajority` in `benchmark-scoring.mjs`); E1 catalog (4 priority skills) and C1 fixed cases.
- **Verifier/reviewer loop.** Severity→verdict gate, PARTIAL-vs-BLOCKED rule, default-FAIL, and the no-op loop stop (unrepairable findings do not request another pass).
- **Packaging.** Exact-tarball consumer smoke (bins resolve and run); Node engine guard; artifact-path guard; host discovery (command adapters + skill catalog + ruleset copies) via `tests/adapters`.
- **Effort + reading.** User-controlled `--turns`/`--budget`, default thorough; page-anchored PDF extractor (page markers, hash, delete-after-extract); extraction-method honesty.
- **Process.** Append-only rejected-change ledger (`docs/rejected-changes.md` + `scripts/rejected-change-ledger.mjs`).
- **Benchmark result integrity.** The runner writes to `.tmp-<case>-result.md` and only `mv`s into place after a non-empty run, so a crashed verifier cannot leave a 0-byte file on the tracked result path. The scorer reports `EMPTY RESULT` (0 bytes) as its own integrity error, distinct from `MISSING VERDICT` (a non-empty answer with no verdict line) — a harness failure is not a model failure. Guarded by `tests/verifier/test-empty-result-guard.mjs`.

### Partial

- **Habit** lifecycle: validator/approval/local activation/load/revoke ship; authenticated approval identity, retention/deletion policy, and automatic workflow integration are open (host/policy).
- **Q1** ledger is local-only; B1 two-run majority scored (14/19 correct, 0 false blocks); E1 covers 4 of 25 skills behaviorally; the suite-coverage *floor* is 10/25 (`scripts/e1-coverage.mjs`); C1 is three local cases.
- **Read-only judges** (verifier/reviewer/arbiter/goal-checker/habit) are declared policy; the verifier needs Bash to hash mission pointers, so technical enforcement is a host concern.
- **`isSafeRelativePath`/two PDF extractors** are intentionally not unified (differing contracts; self-contained copied-skill installs).
- **General YAML** is out of scope by design; the parser is a bounded subset.

### Deferred or gated

| ID | Item | Gate |
|---|---|---|
| B1 | Real majority-of-N run | DONE — 3-run majority passed (16/19, 0 false blocks) |
| D1 | Retrieval-to-direct-read bridge (semble) | DONE — script + test created |
| E1-full | 25-skill behavioral catalog | 4/25 behavioral; suite floor 10/25; remaining need model runs |
| H1 | Authenticated approval, retention, workflow integration | interface designed; host enforcement is the gate |
| U1 | Run-local lessons, remote retrieval | needs a measured need |
| — | Read-only enforcement | host permission model |

### Done this session

| # | Item | Commit |
|---|------|--------|
| 1 | B1 three-run majority certification | `312f65b` + `3d5c6fe` |
| 2 | Progressive disclosure for `engineering-research` | `6a9d0b6` |
| 3 | Plan as working memory | `be3f320` |
| 4 | Prompt-authoring checklist | `9348e6d` |
| 5 | Anti-rationalization tables (agent-skills) | `ae641c8` |
| 6 | Research state machine (autoprompt-skill) | `39e386e` |
| 7 | Scale decision framework (feynman) | `4ff43a6` |
| 8 | Source routing table (feynman) | `246eb26` |
| 9 | Reviewer severity levels (feynman) | `30498fa` |
| 10 | Context hygiene rules (feynman) | `d37b5ec` |
| 11 | Trust-boundary negative tests | `0acb3ae` |
| 12 | CodeGraph integration (main + ref) | `ad282f5` era |
| 13 | Schema validation patterns (scientific-agent-skills) | this session |
| 14 | D1 retrieval-to-direct-read bridge | `ad282f5` |
| 15 | E1 catalog extended to 12 skills | `bf65100` |
| 16 | H1 authenticated approval interface | `e85586d` |
| 17 | Scripts: near-dup, citation-audit, provenance-audit, isolated-tests, skill-diagram | `2e50dc5` |
| 18 | Retrieval bridge test | `8a2fefc` |
| 19 | Compact location schema | `d4a2e8f` |
| 20 | Retrieval benchmark (queries + ground truth) | `6ffe74e` |

| 21 | Plan-state (task tracking, overwrite guard, cross-session pickup) | `cdd1515` |
| 22 | Skill payload manifest + idempotent fix (25 skill headers) | `abda562` |
| 23 | Prompt pattern, citation, provenance, security references | `219fed4` |
| 24 | E1 coverage floor report + `skill-requirements.toml` | `5b87740` |
| 25 | Benchmark empty-result guard (writer temp-file + `EMPTY RESULT` error class) | `4f46087` |
| 26 | 13 orphaned suites wired into `npm test` | `091925f` |

## What's next (ranked)

1. **E1-full: 25-skill behavioral catalog.** `scripts/e1-coverage.mjs` reports a coverage *floor* of 10/25 skills with a dedicated suite; 15 gaps are named (architectural, artifact-reading, audit, civil, compare, electrical, eli5, mechanical, peer-review, review, software, standards-lookup, summarize, vitruvius, vitruvius-help). The behavioral catalog is a stricter bar than the floor.
2. **H1: Authenticated approval, retention, workflow integration.** Interface designed (`references/authenticated-approval.md`). Host enforcement is the gate.
3. **U1: Run-local lessons, remote retrieval.** Needs a measured need.
4. **Read-only enforcement.** Host permission model.

`civil-edge-01` is resolved at the cause: the runner writes to a temp path and only publishes a non-empty result, and the scorer separates `EMPTY RESULT` from `MISSING VERDICT`. All per-source open items are implemented and committed. Remaining work is gated on host enforcement or measured need.

## Per-source map

### Agent Skills
**Keep:** primary-source/version discipline, bounded repair, thin adapters, routing collisions.  
**Taken:** failing tests, per-skill eval contracts, owner-based negative routing + `must_not_fire`, artifact-path graph + static guard, skill-anatomy/trigger lint, rejected-change ledger, plan-as-working-memory (task tracking, overwrite guard, cross-session pickup).  
**Reject:** software-delivery lifecycle, generic productivity hooks, cross-model debate every cycle, second router, generic memory.

### Autoprompt
**Keep:** independent judges, default-FAIL, conditional escalation, named-item repair, goal-check.  
**Taken:** canonical-to-provider generation (commands **and** OpenCode role adapters), drift checks, goal-check, run ledger, content-addressed installed-payload manifest.  
**Reject:** provider/persona swarms, full supervisor runtime, write-capable judges, reference benchmark headline, receipts/rollback (host config mutation not implemented).

### BugTraceAI-CLI
**Taken:** immutable negative-coverage statuses, exact-first deduplication with merge trail, semantic near-duplicate matching as advisory-only.  
**Reject:** persona consensus, confidence arithmetic, fail-open validation, success-only learning, offensive tooling.

### Feynman
**Taken:** fixed-case end-to-end evals, final/provenance pairing, need-based scholarly routing, docs/code parity, declared+checked Node range, package budget, exact-tarball provenance, majority harness, scale decision framework, source routing table, reviewer severity levels, context hygiene rules, verifier citation rules, result provenance audit.  
**Reject:** CLI/Pi runtime, editing verifier, automatic memory, workbench, telemetry, broad database suite, provider sprawl.

### Humanizer
**Taken:** executable package/plugin discovery smoke (tarball + host adapters), per-skill versioning, concise lenses, prompt-authoring checklist, pinned CI actions/validators.  
**Reject:** single-root layout, one-version architecture, style catalog, package-only quality gate.

### Scientific Agent Skills
**Taken:** source/search/claim ledgers, input gates, fixture mutation tests (checked-in valid record + negative mutations), scope discipline, tests outside skills, schema validation patterns, isolated test environments, security scanning integration, skill diagram generation.  
**Reject:** biology/chemistry breadth, adjacent productivity tooling, passive capture, fail-open external scanning.

### Semble
**Taken:** context budgets, line anchors, direct-read rule, thin adapters, semantic-recall → exact-search → direct-read bridge, compact location schema, retrieval benchmark.  
**Reject:** dedicated search subagent, global installer, telemetry, custom embedding platform, NDCG as research proof.

### ABRT
**Keep (idea-only):** explicit completeness, honest blocked states, retained failure evidence, trust-boundary negative tests paired with positive controls.  
**Reject:** daemon/D-Bus/GUI/reporting stack, crash deduplication, destructive cleanup, GPL code, BeakerLib/tmt stack.

## Non-negotiable boundaries

- Research-only, not for final engineering sign-off.
- Never fabricate or silently repair evidence.
- A judge never edits the artifact it judges.
- BLOCKED, PARTIAL, NOT-DONE, and rejected candidates are valid outcomes.
- A retrieved snippet is a lead, not a citation.
- A reference benchmark is not a Vitruvius benchmark.
- No passive screen mining, automatic skill promotion, or unreviewed global memory.
- No incompatible source-code copying; preserve licenses and notices.

## Maintenance

- Keep the pins in Source inventory current; run `git -C ref/<name> rev-parse HEAD` after a pull.
- Before committing: `npm test` (Node guard, contract, artifact paths, package consumer, eval/goal-check/closure/field-pilot, security, routing, adapters, majority, and the focused suites).
- `npm run check:local-artifacts` audits the mutable ignored output tree; not a CI oracle.
- Mark reference claims `verified`, `partial`, `blocked`, or `inferred`; static source inspection is not runtime proof.
- `docs/` is tracked; `outputs/`, `ref/`, and `tasks/benchmark/*results*/` snapshots are not.

### Scale

- scripts: 27 files · tests: 46 files · skills: 25 · agents: 7 canonical roles + 7 OpenCode adapters.
