# Test 3: Bearing Selection — L10 Life Calculation

## Research Question
How is L10 bearing life calculated per ABMA/ISO 281? What is the relationship between load, speed, and life? Show the formula with units.

## Plan

### Phase 1: Source Discovery
- Search for ISO 281:2007 standard
- Search for ABMA Standards 9 and 11
- Locate basic rating life formula
- Locate modified rating life formula

### Phase 2: Formula Extraction
- Extract basic L10 formula: L10 = (C/P)^p × 10^6 revolutions
- Extract life in hours: L10h = L10 × 10^6 / (60 × n)
- Document life exponents: p=3 (ball), p=10/3 (roller)
- Document modified rating life: Lnm = a1·aISO·L10

### Phase 3: Factor Analysis
- Reliability factor a1: 1.0 (90%), 0.62 (95%), 0.25 (99%)
- ISO life modification factor aISO: lubrication and contamination
- Viscosity ratio κ: actual vs reference viscosity

### Phase 4: Verification
- Verify formulas against ISO 281:2007 references
- Cross-check with bearing manufacturer references
- Apply 7-check adversarial verification protocol

## Success Criteria
- [x] Correct ISO 281 formulas extracted
- [x] All modification factors documented
- [x] Standard references verifiable
- [x] Units clearly specified
