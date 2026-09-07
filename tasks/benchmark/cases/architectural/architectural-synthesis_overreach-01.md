# Architectural: Synthesis Overreach — Egress Width Calculation

## Research Question
What is the required total egress width for a 2nd-floor office space with an occupant load of 300 people, served by two stairways?

## Evidence Items

### Evidence 1: IBC 1005.1
- **Source**: International Building Code (IBC) 2021, Section 1005.1
- **Passage**: "Minimum egress width for stairways: 0.3 inches per occupant. For other elements (doors, ramps, corridors): 0.2 inches per occupant. Total width = occupant load × width per occupant factor."

### Evidence 2: IBC 1005.3
- **Source**: IBC 2021, Section 1005.3
- **Passage**: "Where two exits are required, each must provide at least half the total required width. The total width is the sum of all exit elements, not divided among them."

### Evidence 3: Occupant Load
- **Source**: IBC 1004.5
- **Passage**: "Business area occupant load factor: 100 sq ft gross per person. For 30,000 sq ft floor: occupant load = 30,000 / 100 = 300 persons."

## Claimed Conclusion
Per IBC 1005.1, the total required egress width is 300 occupants × 0.3 in/occupant = 90 inches for stairways. With two stairways, each stairway must be at least 45 inches wide. Provide two 48-inch wide stairways (total 96 inches), which exceeds the minimum.

---

**Ground-truth verdict:** BLOCKED
**Flaw type:** synthesis_overreach

**Explanation**: The conclusion calculates total width correctly (90 inches) but then divides it between two stairs per Evidence 2's "half the total required width" — that rule means each stair must be at least 45 inches, so two stairs = 90 inches minimum total. The conclusion says "two 48-inch wide stairways (total 96 inches), which exceeds the minimum" — but 96 inches is correct. However, the conclusion overreaches by implying this provides margin. In reality, 48-inch stairs are the CODE MINIMUM (45 inches per stair), not a margin. The conclusion misrepresents code compliance as exceeding requirements.
