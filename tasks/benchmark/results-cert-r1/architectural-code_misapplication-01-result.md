## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: code_misapplication | CONFIDENCE: 0.97 | CHECKS_PASSED: 2/8 | LINE_PINNED: 4/4

## Findings

### Checks that passed
- **Check 2 (Units and signs):** 15 ft = 180 in conversion correct; slope ratio 18:180 = 1:10 mathematically correct.
- **Check 5 (Calculation integrity):** Arithmetic 18/180 = 10% and 10% < 12.5% are internally consistent.

### Issues found

1. **Code misapplication (P0 — BLOCKING):** The conclusion cites IBC 1012.2 and asserts the maximum slope is 1:8 (12.5%). Evidence 2 states 1:8 applies only "for rises up to 3 inches." The site rise is 18 inches — far exceeding 3 inches — so the governing provision is the ADA 1:12 (8.33%) maximum, which IBC 1012.2 explicitly incorporates for rises >3 inches. The conclusion applies a conditional provision unconditionally.

2. **Entailment failure (P0 — BLOCKING):** Given the cited passages, the conclusion does not follow. Evidence 2 mandates ADA 1:12 compliance for rises >3 inches. The conclusion ignores this branch and derives compliance against the wrong threshold.

3. **Wrong compliance determination (P0 — BLOCKING):** With the correct 1:12 (8.33%) maximum, the actual slope of 1:10 (10%) is **steeper** than allowed. The ramp does **not** comply with code. The conclusion's claim "The ramp complies with code" is false and would lead a reader to build a non-compliant ramp.

4. **Omission of governing case (P1):** The conclusion never acknowledges the ADA 1:12 threshold or the IBC's >3-inch trigger, omitting the controlling criterion.

## Corrected Conclusion

For an 18-inch rise, IBC 1012.2 requires compliance with ADA Standards (1:12 maximum slope). The actual slope of 1:10 (10%) exceeds the 1:12 (8.33%) maximum. The ramp does **not** comply with code. To achieve compliance, the horizontal run must be increased to at least 216 inches (18 ft) for a 1:12 slope, or a switchback/intermediate landing configuration must be used.

## Evidence Trail (Line-Pinned)

| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | 1:8 slope applies only to rises ≤3 in | Evidence 2 (IBC 1012.2) | Passage, sentence 1 | Contradicts conclusion's unconditional 1:8 assertion |
| 2 | Rises >3 in must comply with ADA 1:12 | Evidence 2 (IBC 1012.2) | Passage, sentence 2 | Omitted by conclusion; governs this case |
| 3 | ADA maximum slope is 1:12 (8.33%) | Evidence 1 (ADA 405.2) | Passage, sentence 1 | Contradiction: actual 1:10 > 1:12, so non-compliant |
| 4 | Site rise = 18 in (>3 in trigger) | Evidence 3 (Survey) | Passage | Triggers ADA branch; conclusion ignores |