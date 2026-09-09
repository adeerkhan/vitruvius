# Architectural: Synthesis Overreach â€” Egress Width Calculation

## Research Question
What is the required total egress width for a 2nd-floor office space with an occupant load of 300 people, served by two stairways?

## Evidence Items

### Evidence 1: IBC 1005.1
- **Source**: International Building Code (IBC) 2021, Section 1005.1
- **Passage**: "Minimum egress width for stairways: 0.3 inches per occupant. For other elements (doors, ramps, corridors): 0.2 inches per occupant. Total width = occupant load Ã— width per occupant factor."

### Evidence 2: IBC 1005.3
- **Source**: IBC 2021, Section 1005.3
- **Passage**: "Where two exits are required, each must provide at least half the total required width. The total width is the sum of all exit elements, not divided among them."

### Evidence 3: Occupant Load
- **Source**: IBC 1004.5
- **Passage**: "Business area occupant load factor: 100 sq ft gross per person. For 30,000 sq ft floor: occupant load = 30,000 / 100 = 300 persons."

## Claimed Conclusion
Per IBC 1005.1, the total required egress width is 300 occupants Ã— 0.3 in/occupant = 90 inches for stairways. With two stairways, each stairway must be at least 45 inches wide. Provide two 48-inch wide stairways (total 96 inches), which exceeds the minimum.

---

**Ground-truth verdict:** PARTIAL
**Flaw type:** synthesis_overreach

**Explanation**: The arithmetic is correct (90 in total; 45 in per stair minimum; 2x48 = 96 in provided) and the conclusion is directionally right. The flaw is rhetorical overreach: "exceeds the minimum" implies margin, but 48-inch stairs sit at the code-minimum stair width (45 in) and the 96-inch total barely clears 90 in. A qualified statement of compliance, not a margin claim, is what the evidence supports.

**Case revision (2026-09):** ground truth downgraded from BLOCKED to PARTIAL. The original explanation itself conceded "96 inches is correct" — penalizing tone ("which exceeds the minimum") rather than substance. Directionally correct with an overstated compliance claim is PARTIAL, not BLOCKED.