# B0 + H1 + R0 + L1 + E1/C1 Implementation Checklist

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

## Phase 6: E1 pilot

- [x] Four-skill positive/negative/artifact catalog
- [x] Fail-closed catalog tests
- [x] Routing integration without baseline duplication
- [x] E1 pilot checkpoint

## Phase 7: C1 pilot

- [x] Three fixed local cases and strict run schema
- [x] One isolated subagent run per case
- [x] Independent grading and retained hashes
- [x] C1 pilot checkpoint

## Checkpoints

- After Phase 1: all benchmark cases and controls are accounted for; missing verdicts fail.
- After Phase 2: approved preference loads in a later run and is absent after revoke/expiry.
- After Phase 3: public claims match executable tests and no unrelated dirty files are staged.
- After E1 pilot: four priority skills have valid positive/negative/artifact contracts; no 25-skill completion claim.
- After C1 pilot: three fixed local cases have one isolated recorded run each; cost/model coverage remains explicit.
