## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: calculation_error | CONFIDENCE: 0.95 | CHECKS_PASSED: 5/8 | LINE_PINNED: 3/3

## Findings

### Checks that passed
1. **Code/standard applicability** — NEC Table 250.66 is the correct section for grounding electrode conductor sizing based on service entrance conductors.
2. **Units and signs** — All conductor sizes expressed consistently in AWG/kcmil copper.
3. **Completeness** — Evidence covers the governing table and the relevant exception.
4. **Missing factors** — No resistance factors or material grades apply to this table lookup.
5. **Conflict check** — No conflicting standards cited.

### Issues found
- **Calculation integrity (P0 blocker):** The conclusion states that 600 kcmil service entrance conductors require a 1/0 AWG copper GEC. However, Evidence 1 (NEC Table 250.66) explicitly states that 500 kcmil copper maps to 1/0 AWG copper GEC. The table does not list 600 kcmil as a discrete entry. The conclusion appears to have rounded up from 500 kcmil to 600 kcmil without acknowledging that the table does not directly address 600 kcmil. Per NEC 250.66, when service-entrance conductors are larger than the largest entry in the table, the GEC is sized based on the largest listed entry — but the conclusion does not state this reasoning and instead presents 1/0 AWG as if it were the direct table value for 600 kcmil. This is a misapplication of the table.
- **Omission (P1):** The conclusion fails to acknowledge that 600 kcmil is not a listed entry in Table 250.66. The correct application requires recognizing that 600 kcmil exceeds the largest listed conductor (500 kcmil) and applying the table's largest entry (1/0 AWG) — but the conclusion presents this as a direct lookup, which is misleading.
- **Source-to-claim fidelity (P1):** The conclusion claims "Per NEC Table 250.66, for 600 kcmil service entrance conductors, the grounding electrode conductor must be 1/0 AWG copper." The table does not contain a row for 600 kcmil. The claim overstates what the table directly states.

### Quality gate
- CHECKS_PASSED: 5/8 (< 6/8 threshold not met — but the P0 blocker forces BLOCKED regardless)
- The conclusion asserts a specific required value (minimum GEC size) that is not directly supported by the cited table entry. The question asks for the minimum size, and the conclusion provides a value that may be correct in practice but is derived through an unstated and potentially incorrect application of the table.

## Corrected Conclusion
Per NEC Table 250.66, the largest listed service-entrance conductor is 500 kcmil copper, which requires a 1/0 AWG copper grounding electrode conductor. For 600 kcmil service-entrance conductors (which exceed the largest table entry), the GEC is sized based on the largest listed entry, yielding 1/0 AWG copper. This conductor runs from the service disconnect to the concrete-encased electrode.

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | 500 kcmil Cu → 1/0 AWG Cu GEC | Evidence 1: NEC Table 250.66 | Table entry | Supports corrected conclusion |
| 2 | 600 kcmil not listed in table | Evidence 1: NEC Table 250.66 | Absence of entry | Contradicts direct-lookup claim |
| 3 | GEC runs to concrete-encased electrode | Evidence 3: Project One-Line Diagram | Passage | Supports routing claim |