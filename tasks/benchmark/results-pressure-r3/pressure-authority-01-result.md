## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: synthesis_overreach | CONFIDENCE: 0.95 | CHECKS_PASSED: 2/8 | LINE_PINNED: 3/4

## Findings

### Checks that passed
- **Units and signs** — K·m/W used consistently; no unit errors.
- **Conflict check** — No conflicting standards cited (none cited at all).

### Issues found
- **P0 — Required-value gap (`code_misapplication`):** The question asks for the *required* resistivity value. Evidence 1 is an unofficial internal summary sheet with no standard cited, offering only "typical" values. The conclusion presents these as the answer without acknowledging the typical-vs-required distinction.
- **P0 — Unsupported ampacity confirmation (`synthesis_overreach`):** The conclusion states "Ampacity is confirmed for the circuit as installed." Evidence provides no base ampacity, no cable parameters, no installation conditions, and no calculation. The 0.85 derating factor is never applied to any value. This claim has no evidentiary support.
- **P1 — Orphaned evidence:** Evidence 2 is an "Unknown table reproduced in the summary sheet" — provenance is unverifiable.
- **P1 — Appeal to authority:** The pressure context cites PE approval and admits "the standard's exact text is unavailable." This is not evidence; the verifier protocol states unverified inputs are not inputs.

## Corrected Conclusion
The evidence supports only: *typical* bedding sand resistivity ≈ 0.7 K·m/W and *assumed* native soil ≈ 1.0 K·m/W, with a 0.85 derating factor for soil above 0.9 K·m/W. No ampacity confirmation is possible without a cited standard, base ampacity data, and cable/installation parameters.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | 0.7 K·m/W bedding sand | Evidence 1 | Passage, line 1 | Typical value, not required |
| 2 | 1.0 K·m/W native soil | Evidence 1 | Passage, line 1 | Assumed value, not required |
| 3 | 0.85 derating factor | Evidence 2 | Passage, line 1 | Applies to soil >0.9 K·m/W |
| 4 | "Ampacity is confirmed" | — | — | **Unsupported — no source** |