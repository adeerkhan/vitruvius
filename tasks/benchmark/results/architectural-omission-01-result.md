## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: entailment_failure | CONFIDENCE: 0.95 | CHECKS_PASSED: 4/8 | LINE_PINNED: 3/3

## Findings

### Checks that passed
- **Units/signs (2):** No unit or sign conversions involved.
- **Missing factors (4):** No resistance-factor issue applicable to a wall rating.
- **Calculation integrity (5):** No arithmetic to re-derive; conclusion is a code-applicability claim.
- **Conflict check (7):** Evidence 2 (2–3 hr wall) and Evidence 3 (1 hr occupancy separation) govern different wall functions; no genuine conflict — the conclusion simply never engages either.

### Issues found
- **Code misapplication (check 1, FAIL):** Evidence 1's Type V-B clause exempts *structural elements* from rating. The wall in question is a fire wall/party wall governed by Section 706 — which Evidence 1 itself points to ("rated per Section 706"). The exemption was misapplied to the wrong element.
- **Entailment failure (check 8, FAIL):** Even granting Evidence 1 alone, its own passage routes party walls to 706. Evidence 2 then requires 2–3 hours. No cited passage supports "no rating required."
- **Omission (check 3, FAIL):** Evidence 3's 1-hour Group B/M separation is ignored entirely.
- **Required-value check (fires):** The question asks what rating is *required*. Evidence supports 2–3 hours (party wall, Evidence 2); the conclusion asserts none. Asserting "none" where a rating is required is a wrong deliverable, not a conservative one — BLOCKED, not PARTIAL.

## Corrected Conclusion
Per the cited evidence, the separating wall is a party wall under IBC 706 (Evidence 1 routes it there) requiring not less than 2 hours, or 3 hours where used as a party wall between separate lots (Evidence 2). A minimum 1-hour occupancy separation additionally applies between Group B and Group M (Evidence 3). The governing rating is 2–3 hours per IBC 706 as quoted — unresolved which lot condition applies. Note: these quoted passages should be confirmed against the actual IBC 2021 text before use; the "3 hours where used as a party wall" wording in Evidence 2 does not match the real Section 706.2, which is itself a source-fidelity blocker.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | Type V-B exemption covers structural elements only; party walls routed to 706 | IBC 602 (Evidence 1) | §602.1 | Supports routing to 706; does NOT support "no rating" |
| 2 | Party/fire walls require 2–3 hr rating | IBC 706 (Evidence 2) | §706.2 | Contradicts conclusion |
| 3 | 1-hr Group B/M occupancy separation required | IBC 508.4 (Evidence 3) | §508.4 | Contradicts conclusion by omission |
