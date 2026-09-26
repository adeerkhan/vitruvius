# Steal Map: Reference Patterns for Vitruvius

**Snapshot:** 2026-09-26  
**Implementation HEAD:** `bf192d2`  
**Scope:** local projects under `ref/`, the current Vitruvius tree, and the
`tasks/benchmark` + `evals` artifacts.  
**Rule:** steal design patterns, not domain scope or incompatible code. Every
transfer resolves to a local path.

This is the live status map. Historical audit prose lives in git history.

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

### Partial

- **Habit** lifecycle: validator/approval/local activation/load/revoke ship; authenticated approval identity, retention/deletion policy, and automatic workflow integration are open (host/policy).
- **Q1** ledger is local-only; B1 is a harness with no real multi-run result; E1 covers 4 of 25 skills; C1 is three local cases.
- **Read-only judges** (verifier/reviewer/arbiter/goal-checker/habit) are declared policy; the verifier needs Bash to hash mission pointers, so technical enforcement is a host concern.
- **`isSafeRelativePath`/two PDF extractors** are intentionally not unified (differing contracts; self-contained copied-skill installs).
- **General YAML** is out of scope by design; the parser is a bounded subset.

### Deferred or gated

| ID | Item | Gate |
|---|---|---|
| B1 | Real majority-of-N run | needs a model run |
| D1 | Retrieval-to-direct-read bridge (semble) | needs a measured source-acquisition failure M1 does not already fix |
| E1-full | 25-skill behavioral catalog | needs a model run; roadmap says do not do 25/25 blind |
| H1 | Authenticated approval, retention, workflow integration | host policy |
| U1 | Run-local lessons, remote retrieval | needs a measured need |
| — | Read-only enforcement | host permission model |

## What's next (ranked)

1. **Run B1 on real questions.** `npm run benchmark:majority -- <run1> <run2> <run3>` over three fresh blind runs. This is the only step that turns the scaffolding into a measurable claim, and its residuals decide whether D1/E1-full are worth anything. Needs a model.
2. **Progressive disclosure for `engineering-research`.** It sits at the 500-line cap; move stable detail into `skills/engineering-research/references/` and link it. Cheap, lowers activation cost, and is the scientific-agent-skills transfer still untaken.
3. **Plan as working memory.** The method's plan already has Task/Verification/Decision logs; make a run update it at phase boundaries (AGENTS.md convention, feynman `project-scaffold.ts` transfer). Cheap doc + one checklist line.
4. **Prompt-authoring checklist.** A short positive-prompt note beside the integrity prohibitions (humanizer transfer). Cheap.
5. **Autoprompt content-addressed installed-payload manifest.** Only if `generate-adapters.mjs --check` proves insufficient for adapter drift; today content equality already gates it.
6. **abrt trust-boundary negative tests + positive controls.** Idea-only (repo has no worktree); extend the existing path-escape/hash fixtures where a new boundary appears.

None of 1–6 is a new skill. Everything else in the map is either done or gated.

## Per-source map

### Agent Skills
**Keep:** primary-source/version discipline, bounded repair, thin adapters, routing collisions.  
**Taken:** failing tests, per-skill eval contracts, owner-based negative routing + `must_not_fire`, artifact-path graph + static guard, skill-anatomy/trigger lint, rejected-change ledger.  
**Open:** plan-as-working-memory (see next #3).  
**Reject:** software-delivery lifecycle, generic productivity hooks, cross-model debate every cycle, second router, generic memory.

### Autoprompt
**Keep:** independent judges, default-FAIL, conditional escalation, named-item repair, goal-check.  
**Taken:** canonical-to-provider generation (commands **and** OpenCode role adapters), drift checks, goal-check, run ledger.  
**Open:** content-addressed installed-payload manifest, receipts/rollback if host config mutation is ever added.  
**Reject:** provider/persona swarms, full supervisor runtime, write-capable judges, reference benchmark headline.

### BugTraceAI-CLI
**Taken:** immutable negative-coverage statuses, exact-first deduplication with merge trail.  
**Open:** semantic near-duplicate matching as advisory-only (only if it proposes merges and never deletes evidence); duplicate-url/edition fixtures.  
**Reject:** persona consensus, confidence arithmetic, fail-open validation, success-only learning, offensive tooling.

### Feynman
**Taken:** fixed-case end-to-end evals, final/provenance pairing, need-based scholarly routing, docs/code parity, declared+checked Node range, package budget, exact-tarball provenance, majority harness.  
**Open:** plan-as-working-memory enforcement; a real multi-run outcome record.  
**Reject:** CLI/Pi runtime, editing verifier, automatic memory, workbench, telemetry, broad database suite, provider sprawl.

### Humanizer
**Taken:** executable package/plugin discovery smoke (tarball + host adapters), per-skill versioning, concise lenses.  
**Open:** prompt-authoring checklist; pinned CI actions/validators.  
**Reject:** single-root layout, one-version architecture, style catalog, package-only quality gate.

### Scientific Agent Skills
**Taken:** source/search/claim ledgers, input gates, fixture mutation tests (checked-in valid record + negative mutations), scope discipline, tests outside skills.  
**Open:** selective progressive disclosure for `engineering-research`.  
**Reject:** biology/chemistry breadth, adjacent productivity tooling, passive capture, fail-open external scanning.

### Semble
**Taken:** context budgets, line anchors, direct-read rule, thin adapters.  
**Open (deferred):** semantic-recall → exact-search → direct-read bridge; compact location schema; retrieval benchmark. Build only after a measured failure.  
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

- scripts: 27 files · tests: 45 files · skills: 25 · agents: 7 canonical roles + 7 OpenCode adapters.
