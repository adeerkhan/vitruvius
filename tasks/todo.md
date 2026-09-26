# B0 + H1 + R0 + L1 + E1/C1 + Q1 Implementation Checklist

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

## Phase 8: Q1 ledger

- [x] Refresh ignored audit/provenance through E1/C1
- [x] Define `evidence.v1` schema and fail-closed mutations
- [x] Implement per-run CLI, wrapper, atomic write, and package wiring
- [x] Run one fresh subagent example and independent inspection
- [x] Q1 pilot checkpoint

## Phase 9: GC1 + PR1 + V1

- [x] Deterministic GOAL-CHECK contract and positive/manifest-omission/repeated-gap fixtures
- [x] Recursive final/provenance closure validator and temporary-directory tests
- [x] V1 field-pilot contract and incomplete-record refusal tests
- [x] GC1/PR1/V1 contract checkpoint
- [ ] Run the first real V1 question and retain its evidence/outcome record

## Phase 10: PA1 problem anchor

- [x] `vitruvius-problem-anchor.v1` contract and validator with cross-repo anchor resolution
- [x] `repo` evidence-table type, mandatory `changes` landing site, negative-coverage binding
- [x] Anchor-resolution, link-escape, record/report drift, and line-boundary fixtures
- [x] `scholarly-research` boundary, question tagging, and handback
- [x] Final-deliverable grounding checks scoped to records, not filename guesses
- [x] PA1 contract checkpoint
- [x] Re-run the floorplanner audit under the new contract as a real adoption test
      (`outputs/solver-frontier-verification*`, 2026-09-26: first real V1 question,
      7 asks delivered, 4 negative-coverage entries, 8 anchored findings)
- [x] Close the number/identifier half of rule 2 with a high-precision entailment
      proxy (`scripts/entailment.mjs`, gated on `status: "verified"` so a paraphrase
      scores `partial` rather than being punished as a falsehood)
- [ ] Close the remaining half of rule 2: an anchored line that carries every
      token of a claim but does not support it. The proxy is a token check, not
      comprehension. The V1 pilot produced the cleanest example yet — a claim that
      cited `RoomProfile.ts:35` as the aspect gate when `Constraints.ts:394-399`
      names `AR_CAP` as the gate and RoomProfile as sizing-only. Both lines carry
      `maxAspectRatio` and `2.0`, so the proxy passed it and the blind verifier
      did not. Attentive re-anchoring is still a human act.
- [ ] Close rule 3: `changes` is a required enum, so a finding can name
      `change` without the change being specified. Nothing checks that the named
      landing site is actionable.
- [x] Close rules 2 and 3, first pass: a decision with no finding and a finding
      with no landing site are both refused by the contract

## Checkpoints

- After Phase 1: all benchmark cases and controls are accounted for; missing verdicts fail.
- After Phase 2: approved preference loads in a later run and is absent after revoke/expiry.
- After Phase 3: public claims match executable tests and no unrelated dirty files are staged.
- After E1 pilot: four priority skills have valid positive/negative/artifact contracts; no 25-skill completion claim.
- After C1 pilot: three fixed local cases have one isolated recorded run each; cost/model coverage remains explicit.
- After GC1: a final artifact with an omitted ask cannot be promoted.
- After PR1: nested final/provenance closure is tested without making ignored local outputs a CI oracle.
- After V1: the field-pilot format exists, but no real-run outcome is claimed without retained evidence.
- After PA1: a report cannot claim anything about an artifact without an anchor that resolves to real, non-blank, hash-pinned bytes, and every declared decision reaches a finding. Whether the anchored line *supports* the claim is explicitly not proven.
