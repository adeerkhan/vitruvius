# Implementation Plan: Reliability Slices (B0, H1, R0, L1, E1, C1, Q1)

## Overview

Implement bounded reliability slices: B0 makes verifier benchmark scoring complete, deterministic, and fail-closed; H1 turns the Habit proposal contract into a validated, explicitly approved, locally activated lifecycle; R0 makes proposal/document intake and binder gates executable at the supported local boundary; L1 adds a tested run ledger with stable identity; E1 pilots fixture-linked positive/negative behavioral cases for the four priority skills that already have real executable fixtures; C1 pilots three fixed local engineering cases across three isolated subagent runs; Q1 adds a per-run source/search/claim ledger tied to the L1 identity. Update public claims only after executable behavior and tests exist.

## Architecture Decisions

- Keep the existing 20 adversarial benchmark cases unchanged. Add separate deterministic PASS controls so flawed cases are not relabeled merely to create positive coverage.
- Put benchmark classification in a small importable scoring module used by both the CLI and tests. Missing, malformed, duplicate, or unmatched results are integrity errors; quality metrics remain visible without making a known model residual the same thing as missing evidence.
- Habit remains opt-in and project-local. The default store is `outputs/.habits/active.json`, with an explicit `--store` override; no global home-directory store, passive capture, or `AGENTS.md` mutation.
- Habit activation requires a valid `habit.v1` ledger, explicit approval metadata, secret-redacted transcript data, scope/expiry checks, and a later-run `load` command. Revocation is recorded rather than silently deleting history.
- README language will describe only behavior demonstrated by tests and checked-in fixtures.
- E1 is a pilot, not a 25-skill completion claim. Its initial priority set is `engineering-research`, `verifier`, `proposal`, and `habit`, because each already has a real executable fixture path; every entry must also carry a positive trigger, an owner-labeled negative trigger, and verifiable behavioral expectations.
- C1 uses three deterministic local-code cases rather than live web search: supported evidence, unavailable evidence, and conflicting evidence. One fresh subagent writes each case to a separate result directory; the repository stores final artifacts, provenance sidecars, hashes, and independent grading. Model cost that the host does not expose is recorded as unavailable, never invented.
- `npm test` validates the full repository suite, including eval contracts and retained C1 evidence; it never launches model calls. Subagent runs are on-demand and run once per recorded case.
- Q1 is a minimal `evidence.v1` JSON document per run, stored beside the L1 run identity. It records source, search, and claim records plus explicit support mappings and negative/ambiguous coverage; it is not a general database, crawler, or telemetry system.
- Q1 validation is fail-closed: the writer requires an existing L1 `run.v1` entry, every source is a confined repository artifact with a byte hash/access date, every referenced ID must exist, every search must record screening state and negative coverage, and every claim must have explicit support and coverage status. Valid partial/blocked ledgers remain storable but report non-complete completion.
- Q1 writes atomically under the shared L1 `.log-run.lock` and refuses replacement of an existing run ledger. The repository wrapper preserves the historical project-local `.runs/` default; the skill-local implementation can be copied with the skill.

## Task List

### Phase 1: B0 benchmark controls

- [x] Task 1: Define strict benchmark result classification and reusable scoring functions.
  - Acceptance: all case files are discovered; missing ground truth, missing result, malformed verdict, duplicate verdict, and unknown result are reported as integrity errors; PASS/PARTIAL/BLOCKED false-approval and false-block metrics are distinct.
  - Verification: focused unit tests fail before implementation and pass after; scorer CLI remains usable.

- [x] Task 2: Add deterministic PASS controls and fail-closed benchmark execution.
  - Acceptance: at least one PASS control per discipline; all controls have checked-in results; `run-benchmark.sh` exits nonzero when an expected case lacks a verdict; the benchmark integrity test is in `npm test`.
  - Verification: `node tests/verifier/test-benchmark-scoring.mjs && node tests/verifier/test-verifier.mjs` and full `npm test` pass; current residual quality metrics remain explicitly reported.

### Checkpoint: B0

- [x] Complete-case coverage, control coverage, and missing-verdict failure are proven by fixtures.

### Phase 2: H1 Habit lifecycle

- [x] Task 3: Implement `habit.v1` validation, redaction, and deterministic CLI.
  - Acceptance: schema/version, stable IDs, user-only evidence, window bounds, duplicate detection, secret rejection/redaction, timestamps, scope, and expiry are validated; malformed ledgers fail nonzero.
  - Verification: runtime unit tests cover valid, abstention, assistant-only, out-of-window, duplicate, malformed, secret, and expiry cases.

- [x] Task 4: Implement approval, local import/activation, later-run loading, and revocation.
  - Acceptance: only approved candidates enter the store; later-run context is explicit and read-only; rejected/superseded/revoked rules never load; store history records transitions; no `AGENTS.md` path is written.
  - Verification: lifecycle tests prove approval, activation, later-run visibility, scope filtering, expiry, conflict/reversal, and revocation.

### Checkpoint: H1

- [x] A valid approved preference can be loaded by a later unrelated run and disappears after revocation/expiry.

### Phase 3: Documentation and release-facing truth

- [x] Task 5: Update Habit skill, README, audit map, and provenance.
  - Acceptance: versions are bumped for behavioral skill changes; README distinguishes proposal from executable lifecycle and reports benchmark controls honestly; current limitations and commands are reproducible.
  - Verification: contract validation, focused tests, full `npm test`, artifact validation, and an independent read-only review pass.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Existing benchmark residuals make a strict quality gate red | High | Separate integrity failures from quality metrics; expose `--strict-quality` for later certification runs |
| Habit ledger stores sensitive transcript text | High | Redact recognized secrets, bound window size, require explicit store path/scope, and test rejection |
| Local store is mistaken for global memory | Medium | Default project-local ignored path, explicit commands, README boundary, and no automatic invocation |
| Existing dirty audit edits are overwritten | High | Stage and commit only files belonging to each slice; inspect status before every commit |

## Phase 4: R0 proposal/document execution

- [x] Task 6: Repair document extraction and add local posting/CV parser commands.
  - Acceptance: `node --check scripts/extract-document.mjs` passes; plain text/Markdown/JSON extraction works; renamed binary content, PDF fallback, URL, and image inputs fail closed; `parse-posting.mjs` and `parse-cv.mjs` exist and fail closed; copied-skill-local extraction uses the active project root.
  - Verification: focused proposal parser tests and package dependency/syntax checks.

- [x] Task 7: Make binder assembly prove the complete core artifact set.
  - Acceptance: missing gap/evidence/verifier/draft/final/profile/provenance artifacts fail before writing a binder; digest-bound structured fields are registered into one manifest lineage, explicit voice status, complete verifier evidence, and one PASS verdict are required; every intake/registration/failure change archives descendants; valid fixtures produce binder and provenance.
  - Verification: positive and negative binder fixtures, stale-output and rerun invalidation checks.

- [x] Task 8: Wire proposal checks into npm and update execution claims.
  - Acceptance: `npm test` includes proposal execution; README/skill distinguish runnable local paths from explicit URL/image transcription and blocked PDF/dependency paths; skill version is bumped.
  - Verification: full suite, package dry-run, and independent review.

### Checkpoint: R0

- [x] Proposal/document execution is runnable for supported local text intake, PDF/URL/image boundaries fail closed, and copied-skill execution is covered; full downstream proposal research remains an agent workflow, not a claim of deterministic generation.

## Phase 5: L1 run ledger

- [x] Repair `scripts/log-run.mjs` and define a minimal `run.v1` JSONL contract.
- [x] Add focused valid/invalid/duplicate/isolation tests and wire them into `npm test`.
- [x] Verify the logger with a temporary runs directory and preserve the existing default `.runs/` behavior.

### Checkpoint: L1

- [x] A real run can be appended as valid JSONL with a generated stable ID and timestamp; invalid input and duplicate IDs fail closed.

## Phase 6: E1 behavioral-eval pilot

- [x] Task 9: Define a fail-closed E1 catalog for the four fixture-backed priority skills.
  - Acceptance: every priority skill has one positive trigger, one owner-labeled negative trigger, a real behavioral test path, and source-backed expectation markers; missing/duplicate/unknown/path-invalid entries fail before routing evaluation.
  - Verification: focused catalog tests prove valid acceptance and malformed-case refusal.

- [x] Task 10: Wire the E1 catalog into the existing routing/evaluation path without duplicating the 20-case baseline.
  - Acceptance: E1 positive cases are routed, negative cases require the named owner to outrank the target, and the existing collision/rank floor remains visible.
  - Verification: `npm run test:evals` and the existing focused routing test pass once after implementation.

### Checkpoint: E1 pilot

- [x] Four priority skills have executable positive/negative/artifact contracts; broader skill coverage remains explicitly partial.

## Phase 7: C1 fixed-case pilot

- [x] Task 11: Define three local fixed cases, a shared strict run-artifact schema, and a fail-closed result validator.
  - Acceptance: each case has pinned local source paths, expected research status, required final/provenance files, claim expectations, hashes, byte counts, and grading records; missing or malformed evidence fails without model calls.
  - Verification: synthetic valid/invalid C1 fixtures pass/fail as expected.

- [x] Task 12: Execute one isolated subagent run per fixed case and independently grade them.
  - Acceptance: three fresh isolated result directories each produce a final artifact plus provenance; a read-only reviewer grades every declared expectation; retained hashes and unavailable cost fields are explicit.
  - Verification: focused C1 validator, one read-only review, and the repository's final full-suite run.

### Checkpoint: C1 pilot

- [x] Three fixed cases have isolated, provenance-backed example runs and recorded grading; multi-case breadth beyond this suite and model-cost certification remain open.

## Phase 8: Q1 source/search/claim ledger

- [x] Task 13: Refresh the ignored audit map, report, and provenance sidecar through E1/C1.
  - Acceptance: current commit, file hashes, C1 manifest/reviewer evidence, and remaining limits are recorded without presenting ignored artifacts as tracked deliverables.
  - Verification: recompute hashes and inspect the audit status against `git status` and the retained result bundle.

- [x] Task 14: Define and test the `evidence.v1` contract.
  - Acceptance: stable source/search/claim IDs, explicit claim support mappings, search boundary/result state, negative coverage, ambiguous coverage, and status enums are required; unknown IDs, orphan mappings, unverified support, and missing/ambiguous coverage fail closed.
  - Verification: synthetic valid fixtures and mutation tests prove every refusal without network access.

- [x] Task 15: Implement the per-run ledger CLI and root compatibility wrapper.
  - Acceptance: a valid ledger is written atomically under the project-local runs directory, tied to a UUID `run_id`, refuses overwrite, and leaves no partial file after failure; the root wrapper preserves the historical default.
  - Verification: focused lifecycle/portability tests, syntax checks, and package wiring pass.

- [x] Task 16: Run one local Q1 example through a fresh subagent and independently inspect it.
  - Acceptance: the example records supported and challenging/null evidence, preserves blocked or ambiguous states honestly, and produces a provenance/verification record; no model-quality certification is claimed.
  - Verification: one on-demand subagent run, focused validator, independent review, and final full-suite run.

### Checkpoint: Q1 pilot

- [x] One run-local source/search/claim ledger is executable, fail-closed, provenance-backed, and honestly limited to a pilot rather than a general evidence database.

## Phase 9: GC1, PR1, and V1 proof loop

- [x] Task 17: Add a deterministic GOAL-CHECK completion contract and negative/positive fixtures.
  - Acceptance: a valid `DONE` report is promotable; a manifest-declared omitted ask or open finding is non-promotable `NOT-DONE`; report fields, frozen-manifest binding, final bytes/hash, and provenance binding are checked fail-closed; the focused test is wired into `npm test`. Semantic omission from the manifest remains an explicit host/model smoke boundary.
  - Verification: `npm run test:goal-check` and the full suite pass.

- [x] Task 18: Add recursive final/provenance closure validation with deterministic fixtures.
  - Acceptance: nested ordinary finals require adjacent sidecars, stale hash/byte bindings and path escapes fail closed, working/judge files are excluded, and current ignored outputs remain an explicit opt-in scan rather than a CI oracle.
  - Verification: `npm run test:artifacts` and the full suite pass; `npm run check:local-artifacts` is wired as an explicit fail-closed diagnostic and currently reports known legacy output debt.

- [x] Task 19: Define the V1 real-question field-pilot contract without inventing results.
  - Acceptance: the pilot records original question, source/retrieval status, raw-byte or blocked record with unblock path, final/provenance pair, strict verifier/GOAL-CHECK results with matching identities, time/cost availability, user corrections, and decision outcome; no result is marked complete without retained evidence.
  - Verification: contract tests reject incomplete or hash-inconsistent records; a real pilot run remains explicitly pending until questions and source access are supplied.

### Checkpoint: GC1/PR1/V1

- [x] The roadmap has executable proof for the final gate and artifact closure, plus a bounded field-pilot format; no new source connector or skill catalogue is added without observed need.
- [ ] Run the first real V1 question and record the observed source-access/value result.

## Phase 10: PA1 — bind research to the artifact it studies

A floorplanner audit was fully and correctly cited yet contained no repository
path, recommended a furniture module the repo already had, asserted a
simulation dependency the repo does not have, and graded twelve changes
"very high impact" with no ground. The failure is grounding, not relevance, so
the fix is a contract rather than a prompt.

- [x] Task 20: Add a `vitruvius-problem-anchor.v1` contract binding a run to the artifacts it studied.
  - Acceptance: `repo` findings carry a `path:line` that resolves through links to a real non-blank line inside a hash-pinned artifact; every finding names a `changes` landing site; every declared decision reaches a finding; negative coverage is non-empty and bound to the candidate; the record sits beside the candidate; the report cites every anchor and every id, with the line number delimited on both sides.
  - Verification: `npm run test:problem-anchor` and the full suite pass. Cross-repo resolution, link-escape refusal, record/report drift, and a wrong-line citation are all exercised. The residual limit — an anchor that resolves but does not support its claim — passes and is documented as the verifier's job.

- [x] Task 21: Enforce the grounding rules in the shared method and the roles.
  - Acceptance: `engineering-research` freezes artifacts/decisions/non-goals before searching, requires `## What we did not find` and `## Impact vs. evidence`, and bumps to 0.2.5; `scholarly-research` refuses to write the report, tags every source with the question it answers, requires a handback, and bumps to 0.1.1; `researcher` and `writer` carry the anchor and landing-site rules; `goal-checker` treats an unsupported anchor or an unchecked absence claim as a finding.
  - Verification: contract assertions live in `tests/engineering-research/test-problem-anchor.mjs`; routing stays 16/20 with 0 collisions.

- [x] Task 22: Scope the cheap drift checks so they cannot condemn required or non-report artifacts.
  - Acceptance: grounding checks apply only to files carrying a GOAL-CHECK or problem-anchor record, never to provenance sidecars, FMEA tables, comparison matrices, or reviews; a heading without content does not satisfy a section; a command with a result counts as an anchor.
  - Verification: `npm run test:quality` passes; `npm run check:local-artifacts` reports only genuine pre-contract debt in the local tree, documented in the README.

### Checkpoint: PA1

- [x] Research output is bound to the artifact it studies, and the boundary of that guarantee is stated in AGENTS.md, the README, the skill, and the contract reference rather than implied.
- [x] Re-run the floorplanner audit under the new contract as a real adoption test. Done 2026-09-26: `outputs/solver-frontier-verification*`, and it earned its keep by catching a mis-anchored claim in its own first draft.
- [ ] Close rules 2 and 3 mechanically if a cheap, non-false-positive check exists. Partly done: the number/identifier half of rule 2 is closed by `scripts/entailment.mjs`. The token-but-not-meaning case and rule 3's unenforced landing site are not, and the pilot showed why the remaining gap is real rather than theoretical.

## Open Questions

- ~~Which real engineering question should be the first V1 field pilot?~~ Answered 2026-09-26: the floorplanner unit-cell baseline, at `d351ae3`. It is now `outputs/solver-frontier-verification*`. The next open question is what binds its 130 unsolved units, since a twelve-family ablation returns delta 0 for all of them.
- Whether a `dependencyStdout` guard belongs in the shared extractor contract or only in the optional-dependency call sites. Dogfooding the pilot found that `pdf-parse` writes to stdout and corrupts the `--json` payload; the fix landed in `skills/proposal/scripts/document-extractor.mjs` and `proposal` is bumped to 0.1.9. Other optional-dependency call sites have not been audited for the same hazard.
- Whether to promote the project-local Habit store to a user-scoped home-directory store later; defer until a real cross-project need is demonstrated.
- Whether benchmark quality should become a hard CI threshold after a majority-of-three run; keep the current point estimate informational for now.
- G1 input gates and R1 package-consumer/release checks are the next bounded reliability slices after the Q1 pilot.
