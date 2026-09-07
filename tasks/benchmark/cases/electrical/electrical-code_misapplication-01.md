# Electrical: Code Misapplication — Grounding Electrode

## Research Question
What is the minimum size grounding electrode conductor for a 400A service entrance with copper service-entrance conductors?

## Evidence Items

### Evidence 1: NEC Table 250.66
- **Source**: NFPA 70 (NEC), Table 250.66
- **Passage**: "Grounding electrode conductor size based on service entrance conductors: 3/0 AWG copper → 2 AWG copper GEC. 4/0 AWG copper → 2 AWG copper GEC. 500 kcmil copper → 1/0 AWG copper GEC."

### Evidence 2: NEC 250.66
- **Source**: NEC 250.66, Exception
- **Passage**: "For connections to made electrodes (ground rods), the GEC need not be larger than 6 AWG copper."

### Evidence 3: Service Size
- **Source**: Project One-Line Diagram (fictional)
- **Passage**: "400A service, 480Y/277V 3-phase. Service entrance conductors: 600 kcmil copper per phase. Grounding electrode: concrete-encased electrode (Ufer ground)."

## Claimed Conclusion
Per NEC Table 250.66, for 600 kcmil service entrance conductors, the grounding electrode conductor must be 1/0 AWG copper. This conductor runs from the service disconnect to the concrete-encased electrode.

---

**Ground-truth verdict:** BLOCKED
**Flaw type:** code_misapplication

**Explanation**: The conclusion cites the exception wrong. For concrete-encased electrodes (Ufer ground), NEC 250.66 Exception allows the GEC to be sized per Table 250.66 OR not larger than 6 AWG if the connection is accessible. However, 600 kcmil requires 1/0 AWG per the table. The actual error: for concrete-encased electrodes, the GEC can be 4 AWG per 250.52(A)(3) — the table doesn't apply at all for Ufer grounds. The conclusion misapplies the exception.
