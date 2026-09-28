# Steal Map: Reference Patterns for Vitruvius

**Snapshot:** 2026-09-28  
**Implementation HEAD:** `2c0b1f0`  
**Scope:** local projects under `ref/`, the current Vitruvius tree, and the
`tasks/benchmark` + `evals` artifacts.  
**Rule:** steal design patterns, not domain scope or incompatible code. Every
transfer resolves to a local path.

This is the live status map. Historical audit prose lives in git history.

`scripts/steal-selfcheck.mjs` (wired into `npm test`) verifies the numbers in
this file against the tree: the HEAD above, every commit hash in the tables
below, the scale line, the reference count, and the E1 figures. A status map
whose own numbers drift is the failure this repo spent two rounds eliminating
elsewhere, and this file is what a reader trusts when deciding what to work on
next. It does **not** check whether the ranked list is the right judgement —
that is a human call — nor the CodeGraph node/edge columns, which need a
rebuild.

## CodeGraph Integration

Both the main repo and `ref/` were indexed with CodeGraph. **The main index is
stale** — locked by the MCP daemon, with the figures below predating the 9
local commits and the 11 suites added since:

| Index | Files | Nodes | Edges | Built | State |
|-------|-------|-------|-------|-------|-------|
| `vitruvius/` | 97 | 2,011 | 4,773 | 1.7s | **stale** — 143 source files now on disk |
| `vitruvius/ref/` | 1,711 | 39,041 | 125,821 | 10.1s | current |

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
- **Q1** ledger is local-only; B1 two-run majority scored (14/19 correct, 0 false blocks); E1 covers 4 of 25 skills behaviorally; the suite-coverage *floor* is 14/25 (`scripts/e1-coverage.mjs`); C1 is three local cases.
- **Read-only judges** (verifier/reviewer/arbiter/goal-checker/habit) are declared policy; the verifier needs Bash to hash mission pointers, so technical enforcement is a host concern.
- **`isSafeRelativePath`/two PDF extractors** are intentionally not unified (differing contracts; self-contained copied-skill installs).
- **General YAML** is out of scope by design; the parser is a bounded subset.

### Deferred or gated

| ID | Item | Gate |
|---|---|---|
| B1 | Real majority-of-N run | DONE — 3-run majority passed (16/19, 0 false blocks) |
| D1 | Retrieval-to-direct-read bridge (semble) | DONE — script + test created |
| E1-full | 25-skill behavioral catalog | 4/25 model-run behavioral; suite floor 14/25; remaining 11 need model runs |
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
| 27 | Two Step 6.5 reference links restored after a checkout destroyed them | `6bfae38` |
| 28 | `token-budgets.md` linked from the plan step | `34dac62` |
| 29 | Six unreachable references wired + reachability gate | this session |
| 30 | Margin-earnedness threshold made enforceable (`scripts/margin-earnedness-check.mjs`) | `143de14` |
| 31 | `engineering-research` unpinned from the 500-line cap (499 → 406) | `0be218d` |
| 32 | Behavioral suites for `summarize`, `standards-lookup`, `compare`, `audit`; floor 10 → 14/25 | this session |
| 33 | Six standards cards gained the mandatory/advisory convention | this session |
| 34 | Published benchmark numbers machine-verified (`scripts/benchmark-claims-check.mjs`) | `60a9e1f` |
| 35 | Gate registry: every script declares how it is reached (`scripts/gate-registry.mjs`) | `06591d4` |
| 36 | Margin-earnedness finding cleared by 5/5 canonical re-runs; benchmark 75 → 80% | `9eb4016` |
| 37 | Behavioral suites for the five discipline dispatchers (civil, electrical, mechanical, architectural, software) | `e0fb936` |
| 38 | Behavioral suites for `peer-review` and `artifact-reading`, + teeth harness for all 11 | `30b34cf` |
| 39 | Behavioral suites for `review`, `eli5`, `vitruvius`, `vitruvius-help`; floor 14 → 25/25 | `66a16e9` |
| 40 | E1 floor promoted from always-exit-0 reporter to a gate (`skills/e1-suite-manifest.json`) | `bce9cb2` |
| 41 | Two scripts repaired that were "covered" by tests which never ran them (`run-isolated-tests.mjs`, `retrieval-bridge.mjs`) | `2c0b1f0` |
| 42 | `scripts/steal-selfcheck.mjs` — this map's own numbers checked against the tree | this session |

## What the 2026-09-28 CodeGraph audit found

A pass over this map with `codegraph_explore`, plus a mechanical check of every
number it publishes. Four drifts — all in the map itself, all now fixed or
machine-checked:

1. **`Implementation HEAD` was five commits stale** (`6ffe74e`, describing the
   tree as of the reference-wiring round), so every "done" statement in the map
   referred to an older tree. Now pinned and checked by `steal-selfcheck.mjs`.
2. **The scale line understated the tree** — 39 scripts / 82 tests against 40
   and 83 on disk. Corrected, and now checked.
3. **The CodeGraph table presented a stale count as current**: 97 indexed files
   against 143 source files, with the node/edge figures older still. The row is
   now marked **stale** rather than deleted, because an unmarked stale number
   reads as current. The self-check accepts a stale figure only when the row
   says so.
4. **Two scripts were declared "covered" by tests that never executed them.**
   `run-isolated-tests.mjs` had a syntax error (`await` inside a non-async
   function) and had never run; `retrieval-bridge.mjs` was a facade whose
   steps 2 and 3 printed "completed" without doing anything, and its test
   asserted only that its *source text* contained the words "semantic recall",
   "exact search", and "direct read". Both repaired in `2c0b1f0`.

The generalisable lesson is item 4, and it is the same one as E1's teeth: **a
name match is not execution.** The gate registry's `reach()` counted any
filename mention as coverage — precisely the "weakly accept a script that is
merely present on disk" failure the registry was written to prevent. It now
requires a module import or a spawn call and reports a named-but-never-run
script separately. The stricter check found two on its first run.

Also added: the published tarball's re-export shims
(`scripts/verifier-parser.mjs` → `skills/proposal/scripts/…`) are now imported
**from the installed package** in `test-package-consumer.mjs`. They worked in
the repo and would have broken silently in the tarball if `skills/` were ever
trimmed from `package.json#files` — and nothing imported them from the install.

## Self-description is now checked

The repo verified that skills parse, that contracts hold, that references
resolve — and did **not** verify that the numbers it publishes about itself are
true. That is closed as of 2026-09-28.

```bash
node scripts/benchmark-claims-check.mjs    # docs vs the scorer, 5 claim sites, 20 figures
node scripts/gate-registry.mjs             # every script classified and re-verified
node scripts/gate-registry.mjs --explain margin-earnedness-check.mjs
node scripts/score-benchmark.mjs --strict-quality tasks/benchmark/results tasks/benchmark/cases
```

- **Claim check.** Re-scores the corpus and compares it to every published
  figure in `README.md` and `docs/VITRUVIUS.md`. It reads the numbers *from the
  scorer*: a check carrying its own copy of `75%` would be the stale artifact it
  exists to catch. The pressure suite ("4/5 held with one false approval") and
  the routing floor are separate measurements and are never compared against the
  benchmark. It found one real disagreement on first run —
  `docs/VITRUVIUS.md:202` published `75%` adversarial correctness with no
  accompanying counts while the next clause gave the pressure suite its
  weakness. Corrected, then the score moved and it caught all five sites again.
- **Gate registry.** A gate that is added and never wired produces the same
  silence as a gate that does not exist, but reads as coverage. Every script
  under `scripts/` declares how it is reached, and each declaration is
  re-derived from the tree — a stale claim fails. A `pinned-failure` label is
  re-**run** by the audit, so it cannot harden into a permanent excuse.
- **Quality gate.** `--strict-quality` existed but was unwired, so a false
  approval in any case would not have failed the build. Now it is in the chain.

`results-opencode/` is covered by `.gitignore`; the five re-run artifacts are
force-added because a 5/5 consistency claim is not reproducible without them.

**Not committed, on purpose.** `tasks/benchmark/run-api.mjs` is untracked and
stays that way: it has a hardcoded API key as an `||` fallback behind the env
var, which must not land in the repo. It is also non-functional here — the port
it posts to serves the OpenCode web UI, not an inference API. The tracked runner
is `run-opencode.sh`. Fix the credential handling before committing it, if it is
ever worth keeping.

## Reference wiring status

`references/` holds 24 files. **All 24 are cited from a loadable surface**
(`scripts/reference-reachability.mjs`, wired into `npm test`). This was not true
until 2026-09-28, when six references were unreachable — three of them written
and declared "done" in the same session that wrote them.

`validate-contract.mjs` resolves links *inside* skills but never requires a
reference to be cited, so `reference-reachability.mjs` closes that gap:

```bash
node scripts/reference-reachability.mjs            # 24/24
node scripts/reference-reachability.mjs --json     # machine report
node scripts/reference-reachability.mjs --allow <file>   # waive, reason in this map
```

An unreferenced reference file is a dead file, not a capability. A waiver is
recorded here, not in the script.

## E1 coverage: three numbers, not one

These are routinely conflated, and the confusion is what made the old "14/25"
look like a weaker version of a claim it was not. `scripts/e1-coverage.mjs`
(wired into `npm test`) now prints and gates the distinction:

| # | Number | Who computes it | Status |
|---|--------|-----------------|--------|
| 1 | **Model-run catalog** — a blind model run per skill | **nobody** — needs a model run per skill | **4/25**, hand-recorded in `skills/e1-suite-manifest.json` |
| 2 | **Suite floor** — a `tests/<skill>/` directory exists | the script, against the manifest | **25/25**, now a gate |
| 3 | **Teeth** — the suite can actually fail | `tests/all-skills/test-e1-suites-have-teeth.mjs` | all 25 proven by mutation |

A suite asserts a skill's decision rules; the catalog requires a blind model run
per skill. They are not the same measurement, and the first is not
machine-computable here — so the script refuses to derive it rather than printing
a number nothing can contradict.

**The floor is now a gate.** It previously always exited 0, so a skill could
lose its suite with a green build — the same class of false self-report this
repo spent a round eliminating, one layer down. The recorded floor lives in
`skills/e1-suite-manifest.json`; removing a suite deliberately means deleting its
entry in the same commit. Verified: moving `tests/civil/` aside makes the gate
fail and name it. `--report` prints state without gating.

**Teeth is the number that mattered most.** Eleven suites were added this round
(civil, electrical, mechanical, architectural, software, peer-review,
artifact-reading, review, eli5, vitruvius, vitruvius-help) and each is proven
by weakening one named rule and asserting its suite goes red. Two of the 23
mutation cases initially reported NOT DETECTED; both were harness bugs where the
edit landed without weakening the rule, which is how the earlier mutation
harness in this repo came to pass while asserting nothing.

**What is still open:** the model-run catalog stands at **4/25** and the script
deliberately cannot move it. To raise it, a blind model run per skill is needed
— the runner exists (`tasks/benchmark/run-opencode.sh`), but it has never been
pointed at the skill catalog. That is real remaining work, not a formatting gap.

## What's next (ranked)

1. **E1 model-run catalog: 4/25.** The suite floor is 25/25 and gated, so the
   remaining E1 work is the *other* number: a blind model run per skill. Nothing
   scripts this yet. The 4 existing records are in `tasks/benchmark/`; the
   runner to extend it is `tasks/benchmark/run-opencode.sh`, adapted to
   dispatch each skill against a held-out prompt set with no ground truth in
   context. Expensive, and the only E1 work left.
2. **H1: Authenticated approval, retention, workflow integration.** Interface designed (`references/authenticated-approval.md`). Host enforcement is the gate.
3. **U1: Run-local lessons, remote retrieval.** Needs a measured need.
4. **Read-only enforcement.** Host permission model.
5. **Rebuild the CodeGraph index.** The main index is stale (locked by the MCP daemon); this table quotes 97 indexed files against 129 source files on disk.

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

- scripts: 40 files · tests: 83 files · skills: 25 · agents: 7 canonical roles + 7 OpenCode adapters.
