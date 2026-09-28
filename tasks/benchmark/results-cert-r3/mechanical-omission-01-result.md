## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: omission | CONFIDENCE: 0.95 | CHECKS_PASSED: 3/8 | LINE_PINNED: 3/3

## Findings

### Checks that passed
1. **Code/standard applicability** — VDI 2230 and ISO 898-1 are the correct standards for bolted joint preload and bolt mechanical properties.
2. **Units and signs** — All values in kN, consistent throughout.
3. **Conflict check** — No disagreement between VDI 2230 and ISO 898-1.

### Issues found
1. **Omission (P0 blocker)** — The conclusion omits the governing proof-load check. Evidence 2 states Sp = 67.5 kN. The conclusion must verify F0 ≤ Sp (or a safe fraction, typically 0.9×Sp ≈ 60.8 kN). This check is entirely absent.
2. **Calculation error / self-contradiction (P0 blocker)** — The conclusion states "75 kN is below the proof load of 67.5 kN." This is factually inverted: 75 kN > 67.5 kN. The conclusion contradicts its own cited evidence.
3. **Dangerous deliverable** — A reader following this conclusion would tighten to 75 kN, exceeding the proof load by 11%, permanently yielding the bolt. The error is not conservative — it is unsafe.

### Quality gate
- CHECKS_PASSED 3/8 < 6/8 → verdict MUST be PARTIAL or BLOCKED.
- The specific value asked for (required preload) is wrong and self-contradictory → BLOCKED per the "conservatism is not correctness" rule.

## Corrected Conclusion
Per VDI 2230, the minimum preload to prevent separation is F0 = 1.5 × 50 kN = 75 kN. However, this exceeds the proof load Sp = 67.5 kN (ISO 898-1), which is unacceptable — the bolt would yield. The governing limit is the proof load: F0 ≤ Sp = 67.5 kN (or more conservatively ≤ 0.9 × Sp ≈ 60.8 kN). The required preload cannot be 75 kN; the joint must be redesigned (e.g., higher property class, larger diameter, or reduced external load) to reconcile the separation-prevention requirement with the proof-load limit.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | F0 = 1.5 × 50 = 75 kN is arithmetically correct | VDI 2230 §5.4 | Evidence 1, line 10 | Pass — calculation correct |
| 2 | 75 kN > 67.5 kN (proof load), not "below" | ISO 898-1 Table 4 | Evidence 2, line 14 | Fail — conclusion inverts the comparison |
| 3 | Proof-load check omitted; 75 kN would yield bolt | ISO 898-1 Table 4 | Evidence 2, line 14 | Fail — governing criterion missing |