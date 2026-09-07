# Architectural: Code Misapplication — Accessibility Ramp Slope

## Research Question
What is the maximum allowable slope for an accessible ramp serving an entrance to a new commercial building?

## Evidence Items

### Evidence 1: ADA 2010 Standards
- **Source**: ADA Standards for Accessible Design, Section 405.2
- **Passage**: "The maximum slope of a ramp run shall be 1:12 (8.33%). The maximum rise for any ramp run shall be 30 inches. Cross slope shall not exceed 1:48."

### Evidence 2: IBC 1012.2
- **Source**: IBC 2021, Section 1012.2
- **Passage**: "Ramp slopes shall not be steeper than 1:8 (12.5%) for rises up to 3 inches. For rises exceeding 3 inches, ramps shall comply with ADA Standards (1:12 maximum)."

### Evidence 3: Site Condition
- **Source**: Topographic Survey (fictional)
- **Passage": "Entrance floor elevation: 18 inches above grade. Horizontal distance available: 15 feet from grade to entrance landing."

## Claimed Conclusion
Per IBC 1012.2, the maximum ramp slope is 1:8 (12.5%). With an 18-inch rise and 15 feet (180 inches) of horizontal run, the actual slope is 18:180 = 1:10 (10%), which is less than 12.5%. The ramp complies with code.

---

**Ground-truth verdict:** BLOCKED
**Flaw type:** code_misapplication

**Explanation**: The conclusion applies the wrong code section. IBC 1012.2 allows 1:8 only for rises up to 3 inches. For an 18-inch rise, the ramp must comply with ADA Section 405.2, which mandates 1:12 maximum slope. The actual slope of 1:10 exceeds 1:12 (10% > 8.33%), so the ramp does NOT comply. The conclusion misapplies the exception threshold.
