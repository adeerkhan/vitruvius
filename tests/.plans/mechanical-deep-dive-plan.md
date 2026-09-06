# Vitruvius Round 2 — Mechanical Deep Dive Test Plan

## Research Strategy

Three specialized test cases following the Vitruvius engineering-research method:
**Plan → Gather Evidence → Draft → Verify → Deliver**

---

## Test 4: Piping Stress — ASME B31.3 Process Piping

### Research Question
What are the sustained, thermal, and occasional stress requirements per ASME B31.3? Cite specific paragraphs (302.3.5, 302.3.6). What is the stress range formula? What is the significance of SL, SA, and the stress range reduction factor f? How does the code distinguish between sustained and thermal expansion stresses?

### Plan
1. Search for ASME B31.3 paragraphs 302.3.5, 302.3.6, 319
2. Extract sustained stress formula (Eq. 11b) and expansion stress formula (Eq. 12)
3. Extract allowable displacement stress range formula (Eq. 1a, 1b)
4. Document stress range reduction factor f from Table 302.3.5
5. Distinguish sustained vs. thermal expansion stress requirements
6. Create evidence table with source URLs
7. Run 7-check blind verifier
8. Draft final output

### Success Criteria
- All formulas cite specific B31.3 paragraphs
- SL, SA, f clearly defined with units
- Sustained vs. thermal distinction explained
- Evidence table with verified sources

---

## Test 5: Fatigue Analysis — ASME BPVC Section VIII Div 2

### Research Question
How does fatigue analysis work in ASME BPVC Section VIII Division 2? What is the elastic-plastic fatigue correction factor Ke? Cite paragraphs (5.5, 5.5.3). What is the number of cycles to failure for a given alternating stress amplitude? How does Part 5 differ from Part 4 (Div 1)?

### Plan
1. Search for ASME BPVC VIII-2 Part 5 paragraphs 5.5, 5.5.3, 5.5.4
2. Extract fatigue screening criteria
3. Document elastic fatigue analysis method (5.5.3)
4. Document elastic-plastic fatigue analysis method (5.5.4)
5. Extract Ke factor definition and calculation
6. Compare Part 5 (Div 2) vs. Part 4 (Div 1) approaches
7. Create evidence table
8. Run 7-check blind verifier
9. Draft final output

### Success Criteria
- Part 5 paragraphs correctly cited
- Ke factor definition with formula context
- Fatigue curves concept explained
- Part 4 vs Part 5 distinction clear

---

## Test 6: GD&T — ASME Y14.5-2018

### Research Question
What is the difference between position tolerance and location tolerance per ASME Y14.5? Cite specific sections. When is the MMC modifier used? What is virtual condition? How do datum reference frames work? Give a practical example.

### Plan
1. Search for ASME Y14.5-2018 position tolerance (Section 10), location tolerance
2. Extract MMC modifier application rules
3. Document virtual condition formulas (internal/external features)
4. Explain datum reference frame (DRF) concept
5. Create practical example with calculations
6. Create evidence table
7. Run 7-check blind verifier
8. Draft final output

### Success Criteria
- Position vs location distinction clear
- MMC modifier rules with section citations
- Virtual condition formulas verified
- Practical example with calculations

---

## Execution Order
1. Test 4 (piping stress)
2. Test 5 (fatigue analysis)
3. Test 6 (GD&T)
4. Consolidate all results to outputs/mechanical-deep-dive-tests.md
