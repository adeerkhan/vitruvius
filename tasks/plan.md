# Implementation Plan: Reliability Slices (B0, H1, R0, L1, E1, C1)

## Overview

Implement bounded reliability slices: B0 makes verifier benchmark scoring complete, deterministic, and fail-closed; H1 turns the Habit proposal contract into a validated, explicitly approved, locally activated lifecycle; R0 makes proposal/document intake and binder gates executable at the supported local boundary; L1 adds a tested run ledger with stable identity; E1 pilots fixture-linked positive/negative behavioral cases for the four priority skills that already have real executable fixtures; C1 pilots one fixed local engineering case across three isolated subagent runs. Update public claims only after executable behavior and tests exist.

## Architecture Decisions

- Keep the existing 20 adversarial benchmark cases unchanged. Add separate deterministic PASS controls so flawed cases are not relabeled merely to create positive coverage.
- Put benchmark classification in a small importable scoring module used by both the CLI and tests. Missing, malformed, duplicate, or unmatched results are integrity errors; quality metrics remain visible without making a known model residual the same thing as missing evidence.
- Habit remains opt-in and project-local. The default store is `outputs/.habits/active.json`, with an explicit `--store` override; no global home-directory store, passive capture, or `AGENTS.md` mutation.
- Habit activation requires a valid `habit.v1` ledger, explicit approval metadata, secret-redacted transcript data, scope/expiry checks, and a later-run `load` command. Revocation is recorded rather than silently deleting history.
- README language will describe only behavior demonstrated by tests and checked-in fixtures.
- E1 is a pilot, not a 25-skill completion claim. Its initial priority set is `engineering-research`, `verifier`, `proposal`, and `habit`, because each already has a real executable fixture path; every entry must also carry a positive trigger, an owner-labeled negative trigger, and verifiable behavioral expectations.
- C1 uses a deterministic local-code research case rather than live web search. Three fresh subagents write to separate fixture directories; the repository stores their final artifacts, provenance sidecars, hashes, and independent grading. Model cost that the host does not expose is recorded as unavailable, never invented.
- `npm test` validates eval contracts and recorded C1 evidence only; it never launches model calls. Subagent runs are on-demand and run once per recorded case.

## Task List

### Phase 1: B0 benchmark controls

- [x] Task 1: Define strict benchmark result classification and reusable scoring functions.
  - Acceptance: all case files are discovered; missing ground truth, missing result, malformed verdict, duplicate verdict, and unknown result are reported as integrity errors; PASS/PARTIAL/BLOCKED false-approval and false-block metrics are distinct.
  - Verification: focused unit tests fail before implementation and pass after; scorer CLI remains usable.

- [x] Task 2: Add deterministic PASS controls and fail-closed benchmark execution.
  - Acceptance: at least one PASS control per discipline; all controls have checked-in results; `run-benchmark.sh` exits nonzero when an expected case lacks a verdict; the benchmark integrity test is in `npm test`.
  - Verification: `npm run test:benchmark` and full `npm test` pass; current residual quality metrics remain explicitly reported.

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

- [ ] Four priority skills have executable positive/negative/artifact contracts; broader skill coverage remains explicitly partial.

## Phase 7: C1 fixed-case pilot

- [ ] Task 11: Define one local fixed case, strict run-artifact schema, and fail-closed result validator.
  - Acceptance: source paths, required final/provenance files, claim expectations, hashes, byte counts, and grading records are required; missing or malformed evidence fails.
  - Verification: synthetic valid/invalid C1 fixtures pass/fail as expected without model calls.

- [ ] Task 12: Execute three isolated subagent runs and independently grade them.
  - Acceptance: three fresh workspaces each produce a final artifact plus provenance; a read-only reviewer grades every declared expectation; retained hashes and unavailable cost fields are explicit.
  - Verification: focused C1 validator, one read-only review, and the repository's final full-suite run.

### Checkpoint: C1 pilot

- [ ] One fixed case has three isolated, provenance-backed example runs and recorded grading; multi-case breadth and model-cost certification remain open.

## Open Questions

- Whether to promote the project-local Habit store to a user-scoped home-directory store later; defer until a real cross-project need is demonstrated.
- Whether benchmark quality should become a hard CI threshold after a majority-of-three run; keep the current point estimate informational for now.
