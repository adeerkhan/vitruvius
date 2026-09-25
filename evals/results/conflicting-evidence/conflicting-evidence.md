# Conflicting Allowable-Stress Evidence

**Research status:** `partial`

## Answer

No. The 240 MPa test result does not resolve the conflicting allowable-stress statements.

Requirement R-002 states an allowable stress of 250 MPa [1]. Test T-002 reports a measured result of 240 MPa and a PASS against a 250 MPa criterion [2]. Engineering note N-002 states that the governing allowable stress for the same condition is 200 MPa and does not explain which document controls [3].

By arithmetic inference, 240 MPa is below 250 MPa but above 200 MPa. Thus, the result supports the test report's PASS against its stated 250 MPa criterion [1][2], but it does not establish that 250 MPa is the governing limit. The available local evidence supplies no document hierarchy, applicability rationale, or reconciliation that identifies a governing limit.

**Unresolved conflict:** whether the governing allowable stress for the same condition is 250 MPa [1][2] or 200 MPa [3]. No governing limit is selected here.

*Research-only, not for final engineering sign-off.*

## Sources

[1] Requirement R-002, local synthetic fixture, `evals/fixtures/c1/conflicting-evidence/requirement.md`, line 3.

[2] Test T-002, local synthetic fixture, `evals/fixtures/c1/conflicting-evidence/test-report.md`, line 3.

[3] Engineering note N-002, local synthetic fixture, `evals/fixtures/c1/conflicting-evidence/engineering-note.md`, line 3.
