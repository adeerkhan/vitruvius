# B0 + H1 Implementation Checklist

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

- [ ] Bump Habit skill version and update workflow docs
- [ ] Update README benchmark and Habit sections
- [ ] Update audit map/report/provenance
- [ ] Full verification and independent review

## Checkpoints

- After Phase 1: all benchmark cases and controls are accounted for; missing verdicts fail.
- After Phase 2: approved preference loads in a later run and is absent after revoke/expiry.
- After Phase 3: public claims match executable tests and no unrelated dirty files are staged.
