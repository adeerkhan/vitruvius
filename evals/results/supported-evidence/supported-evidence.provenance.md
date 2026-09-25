# Provenance — supported-evidence

- **Date:** 2026-09-25
- **Case:** `supported-evidence`
- **Sources consulted:**
  - `SRC-REQ-001` — `evals/fixtures/c1/supported-evidence/requirement.md`
  - `SRC-TEST-001` — `evals/fixtures/c1/supported-evidence/test-report.md`
- **Sources accepted:** Both listed local fixture files. They were read directly and are sufficient for this synthetic comparison; no external or real standard was used.
- **Verification:** verified
  - **Status:** `verified`
  - **Check:** Compared the stated 250 MPa allowable stress in the requirement [1] with the reported 240 MPa test value [2]. The arithmetic check is 240 MPa < 250 MPa, with a 10 MPa difference, and the report records PASS [2].
  - **Access and scope:** Local source access succeeded for both files. The sources identify themselves as synthetic fixtures, so the verification does not establish compliance for a real standard, product, or test.
- **Claim counts:**
  - **verified:** 3
  - **partial:** 0
  - **blocked:** 0
  - **unverified:** 0
  - **inferred:** 0
  - **failed:** 0
- **Plan:** Read the two case-listed local sources; compare the stated allowable stress with the reported test value; record the conclusion, inline source mapping, and limitations; write the paired final and provenance artifacts.
