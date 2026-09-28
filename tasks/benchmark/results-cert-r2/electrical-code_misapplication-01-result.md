## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: entailment_failure | CONFIDENCE: 0.9 | CHECKS_PASSED: 5/8 | LINE_PINNED: 0/1

## Findings

### Checks that passed
1. **Code/standard applicability:** NEC Table 250.66 is the correct table for GEC sizing based on service entrance conductors.
2. **Units and signs:** AWG sizes are consistent throughout.
3. **Missing factors:** No missing factors identified.
4. **Conflict check:** No conflicting standards identified.
5. **Source-to-claim fidelity (partial):** Correctly identifies Table 250.66 as the governing table and correctly does not apply the made-electrode exception (Evidence 2) since the service uses a concrete-encased electrode.

### Issues found
1. **Entailment failure (BLOCKING):** The conclusion claims "for 600 kcmil service entrance conductors, the grounding electrode conductor must be 1/0 AWG copper." Evidence 1 shows only 500 kcmil → 1/0 AWG. The 600 kcmil row is **absent** from the provided evidence. The conclusion's specific mapping is unsupported.
2. **Unverifiable load-bearing number:** The question asks for the minimum GEC size. The load-bearing number (600 kcmil → 1/0 AWG) is not in the evidence. The deliverable rests on an unverifiable source.
3. **Evidence gap:** Evidence 1 shows Table 250.66 entries only up to 500 kcmil. No evidence bridges 500 kcmil to 600 kcmil.

### Corrected Conclusion
Cannot be corrected without the actual NEC Table 250.66 row for 600 kcmil copper service entrance conductors. The evidence provided does not contain this information.

### Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | 600 kcmil → 1/0 AWG GEC | Evidence 1 | NEC Table 250.66 | **UNSUPPORTED** — 600 kcmil row not in evidence |
| 2 | 500 kcmil → 1/0 AWG GEC | Evidence 1 | NEC Table 250.66 | Supported |
| 3 | Concrete-encased electrode | Evidence 3 | Service Size | Supported |
| 4 | Made electrode exception (6 AWG) | Evidence 2 | NEC 250.66 Exception | Not applicable — service uses Ufer ground, not made electrode |