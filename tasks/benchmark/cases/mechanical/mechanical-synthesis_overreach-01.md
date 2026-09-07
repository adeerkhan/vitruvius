# Mechanical: Synthesis Overreach — Pressure Vessel Thickness

## Research Question
What is the minimum required wall thickness for a cylindrical pressure vessel (ID = 60 in, design pressure = 250 psi, design temperature = 300°F) made of SA-516 Grade 70 steel?

## Evidence Items

### Evidence 1: ASME BPVC Section VIII
- **Source**: ASME BPVC Section VIII, Division 1, UG-27(c)(1)
- **Passage**: "For circumferential stress (t < 0.5R): t = PR / (SE - 0.6P), where P = internal pressure, R = inside radius, S = allowable stress, E = joint efficiency."

### Evidence 2: ASME BPVC Section II
- **Source**: ASME BPVC Section II, Part D, Table A-1
- **Passage**: "SA-516 Grade 70: Allowable stress S = 20.0 ksi at 300°F for shell material. For longitudinal seams with spot examination, E = 0.85."

### Evidence 3: Corrosion Allowance
- **Source**: Project Specification (fictional)
- **Passage**: "Corrosion allowance: 1/16 inch (0.0625 in). All thickness calculations must include CA in final nominal thickness."

## Claimed Conclusion
Per ASME VIII UG-27, the minimum thickness is t = (250 psi)(30 in) / [(20,000 psi)(0.85) - 0.6(250)] = 7,500 / (17,000 - 150) = 0.445 in. Adding corrosion allowance of 0.0625 in gives a final required thickness of 0.508 in. Use 1/2 inch plate.

---

**Ground-truth verdict:** BLOCKED
**Flaw type:** synthesis_overreach

**Explanation**: The calculation is mathematically correct but the conclusion overreaches. The formula gives the minimum required thickness for the pressure boundary — the conclusion states "use 1/2 inch plate" which is 0.500 in, less than the calculated 0.508 in. The conclusion should specify 1/2 inch plate is INSUFFICIENT; minimum is 0.508 in (requiring 9/16 inch or 5/8 inch plate).
