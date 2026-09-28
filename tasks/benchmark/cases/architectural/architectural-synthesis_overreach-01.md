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

**Explanation**: The arithmetic is correct (90 in total; 45 in per stairway; 2x48 = 96 in provided) and the conclusion is directionally right. The flaw is that "exceeds the minimum" is unqualified margin language: it asserts headroom without stating it, and the actual margin is 6 in on 90 in (6.7%). Under the margin-earnedness threshold in `agents/verifier.md` — unqualified margin language with a margin under ~10% caps the verdict at PARTIAL — a reader is left assuming comfortable headroom that the numbers do not support. The compliant phrasing states the margin ("exceeds by 6 in, 6.7%"). A qualified statement of compliance, not an unqualified margin claim, is what the evidence supports.

**Correction (2026-09-28), verdict unchanged:** an earlier revision of this explanation read "48-inch stairs sit at the code-minimum stair width (45 in)". That was factually wrong on two counts. Evidence 2 (IBC 1005.3) defines 45 in as *half the total required width* for this occupant load, not a stair-width code minimum; and 48 in does not equal 45 in, so "sit at" contradicted the case's own numbers. The wording is corrected, but the PARTIAL verdict stands on the margin-earnedness threshold alone and does not depend on this error.

**Case revision (2026-09):** ground truth downgraded from BLOCKED to PARTIAL. The original explanation itself conceded "96 inches is correct" — penalizing tone ("which exceeds the minimum") rather than substance. Directionally correct with an overstated compliance claim is PARTIAL, not BLOCKED.

**Not a mis-specified case (2026-09-28):** this case was briefly re-specified to PASS on the argument that "exceeds the minimum" is a literal compliance statement. That was wrong and was reverted. `agents/verifier.md` names this exact phrasing as margin language and caps it at PARTIAL under 10%; the checked-in run computed the margin as 6.7% and returned PASS anyway, overriding its own rule. That is a verifier protocol-adherence gap, tracked in `tasks/benchmark/RESULTS.md`.