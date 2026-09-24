# B0 + H1 + R0 + L1 Implementation Checklist

## Phase 1: B0

- [x] Strict scorer/parser tests
- [x] Reusable benchmark scoring functions
- [x] PASS control fixtures for all five disciplines
- [x] Fail-closed benchmark runner and npm wiring
- [x] B0 checkpoint

## Phase 2: H1

- [x] Habit schema/redaction/validation tests
- [x] `habit.v1` validator and CLI
- [x] Approval/activation/load/revoke tests
- [x] Local store lifecycle implementation
- [x] H1 checkpoint

## Phase 3: Documentation

- [x] Bump Habit skill version and update workflow docs
- [x] Update README benchmark and Habit sections
- [x] Update audit map/report/provenance through L1
- [x] Full verification and independent review

## Phase 4: R0

- [x] Document extraction syntax, self-contained local parser commands, and binary/URL/image boundaries
- [x] Structured registration, digest/lineage manifest, and downstream invalidation
- [x] Complete binder artifact/verifier gate and atomic publication
- [x] Proposal test/npm wiring and execution claims
- [x] R0 checkpoint

## Phase 5: L1

- [x] Repair run logger and define `run.v1` contract
- [x] Add logger lifecycle/failure tests
- [x] Wire logger tests into `npm test`
- [x] L1 checkpoint

## Checkpoints

- After Phase 1: all benchmark cases and controls are accounted for; missing verdicts fail.
- After Phase 2: approved preference loads in a later run and is absent after revoke/expiry.
- After Phase 3: public claims match executable tests and no unrelated dirty files are staged.
