# Test 5 Draft: Acoustic Insulation — STC and IIC Ratings

## Research Question
What are STC and IIC ratings? How are they measured? What are IBC/IRC minimum requirements? What are typical STC values for common wall assemblies? How does flanking transmission affect performance?

## Evidence Table

| # | Source | Standard/Section | Key Finding | Verified |
|---|--------|------------------|-------------|----------|
| 1 | ASTM E90-09(2016) | Test Method | Laboratory measurement of airborne sound transmission loss of building partitions | ✓ |
| 2 | ASTM E492-22 | Test Method | Laboratory measurement of impact sound transmission through floor-ceiling assemblies using tapping machine | ✓ |
| 3 | ASTM E413 | Rating Method | Classification for Rating Sound Insulation (converts E90 data to STC) | ✓ |
| 4 | ASTM E989 | Rating Method | Classification for Determining Impact Insulation Class (IIC) | ✓ |
| 5 | IBC 2024 | §1206.2 | Walls separating dwelling units: STC 50 lab / NNIC 45 field minimum | ✓ |
| 6 | IBC 2024 | §1206.3 | Floor-ceiling assemblies: IIC 50 lab / AIIC 45 field minimum | ✓ |
| 7 | IBC 2024 | §1206.4 | Penetrations must be sealed to maintain rated assembly performance | ✓ |
| 8 | IRC Appendix K | AK102-AK103 | STC 45 for walls, IIC 45 for floors between dwelling units | ✓ |
| 9 | ASTM E336 | Test Method | Field measurement of airborne sound transmission (NNIC) | ✓ |
| 10 | ASTM E1007 | Test Method | Field measurement of impact sound (AIIC) | ✓ |
| 11 | NRC Canada | CBD-239 | Acoustic design guide for multi-unit housing | ✓ |

## Findings

### 1. Sound Transmission Class (STC)

**Definition:** STC is a single-number rating derived from laboratory-measured transmission loss data (ASTM E90) that quantifies a partition's ability to block airborne sound. Higher STC = better sound isolation.

**Rating scale:** 0-100. Relevant range for building assemblies: 25-70.

| STC Range | Perception |
|-----------|------------|
| 25-30 | Normal speech clearly audible |
| 30-35 | Loud speech audible |
| 35-40 | Loud speech audible; music bass audible |
| 40-45 | Loud speech barely audible |
| 45-50 | Loud speech inaudible; shouting barely audible |
| 50-55 | Shouting barely audible |
| 55-60 | Shouting inaudible |
| 60-65 | Most sounds inaudible |

**Measurement:** ASTM E90 measures sound transmission loss at 18 one-third-octave frequency bands (100-5000 Hz). ASTM E413 converts this data into the single STC number using a contour-fitting method.

### 2. Impact Insulation Class (IIC)

**Definition:** IIC is a single-number rating derived from laboratory-measured impact sound data (ASTM E492) that quantifies a floor-ceiling assembly's ability to block impact noise (footsteps, dropped objects).

**Measurement:** ASTM E492 uses a standardized tapping machine (5 hammers, 2 lb each, dropping 16 inches) on the upper floor. Sound pressure levels are measured in the room below at 16 one-third-octave frequency bands (100-3150 Hz). ASTM E989 converts this to the IIC number.

**Key difference from STC:** IIC is heavily influenced by the floor surface. Carpet + padding can increase IIC by 15-25 points over hard surface. STC is largely independent of surface finish.

**Delta IIC (ASTM E2179):** Measures the IIC improvement added by a floor covering over a bare concrete subfloor. Useful for comparing underlayment products.

### 3. IBC/IRC Minimum Requirements

**IBC 2024 §1206.2 (Airborne Sound):**
- Walls/floors/ceilings separating dwelling units: **STC 50** lab-tested (ASTM E90/E413)
- Alternative field path: **NNIC 45** (ASTM E336)
- Also applies to walls between sleeping units and public service areas (corridors, stairs, mechanical rooms)

**IBC 2024 §1206.3 (Impact Sound):**
- Floor-ceiling assemblies between dwelling units: **IIC 50** lab-tested (ASTM E492/E989)
- Alternative field path: **AIIC 45** (ASTM E1007)

**IBC 2024 §1206.4 (Penetrations):**
- Penetrations for piping, electrical devices, recessed cabinets, bathtubs, soffits, ducts must be sealed, lined, insulated, or treated to maintain the required rating

**IRC Appendix K (AK102-AK103):**
- Walls between dwelling units: **STC 45** minimum (ASTM E90)
- Floor-ceiling assemblies: **IIC 45** minimum (ASTM E492)
- Lower thresholds than IBC (residential vs. commercial)

**Edition note:** IBC §1206 was previously §1207 in editions before 2018. The 2024 IBC added a new §1207 for classroom acoustics (separate topic).

### 4. Typical STC Values for Common Wall Assemblies

**Wood Stud Walls:**

| Assembly | STC | Performance |
|----------|-----|-------------|
| 2×4 stud, single layer 5/8" gypsum each side, no insulation | 33-35 | Below code |
| 2×4 stud, double layer 5/8" gypsum each side, batt insulation | 40-45 | Still below IBC 50 |
| 2×4 stud, resilient channel one side, double layer gypsum, batt insulation | 50-54 | Code compliant |
| Staggered 2×4 stud (2×6 plate), double layer gypsum, batt insulation | 52-57 | Reliable multifamily |
| Double 2×4 stud, 1" air gap, double layer gypsum, batt insulation | 58-63 | Studio/premium |

**Metal Stud Walls:**

| Assembly | STC | Performance |
|----------|-----|-------------|
| 3-5/8" 20-ga stud, single layer 5/8" gypsum each side, batt insulation | 42-44 | Below code |
| 3-5/8" 20-ga stud, double layer 5/8" gypsum each side, batt insulation | 49-52 | Borderline |
| 3-5/8" metal stud, resilient channel one side, double layer gypsum | 51-55 | Code compliant |
| Iso-clip on metal stud, double layer gypsum each side, batt insulation | 56-60 | Premium |

**Masonry/Concrete:**

| Assembly | STC | Performance |
|----------|-----|-------------|
| 8" CMU, painted | 50-52 | Code compliant |
| 8" CMU, furring + batt + double layer gypsum inside | 60-65 | Premium |
| 6" reinforced concrete | 52-55 | Code compliant |
| 200 mm concrete | 50-52 | Mass-dominated |

**The STC 50 target (IBC minimum):**
- Most cost-effective: 2×4 wood stud, resilient channel one side, double layer 5/8" Type X gypsum on RC side, single layer opposite, batt insulation, fully sealed perimeter (~STC 50-52)
- Commercial: 3-5/8" 20-ga metal stud, double layer 5/8" gypsum each side, batt insulation (~STC 50-52)
- Masonry: 8" CMU solid/grouted (~STC 50-54)

### 5. Flanking Transmission

**Definition:** Flanking transmission is sound that travels around the rated partition through adjacent structural elements, rather than through the partition itself. It is the primary cause of field performance falling below lab ratings.

**Common flanking paths:**
1. **Shared studs/floor decks** — Sound travels through connected framing members
2. **Electrical boxes back-to-back** — Acoustic short circuit through wall cavity (drops STC 2-5 points)
3. **Unsealed perimeter joints** — Gaps at floor/ceiling plates allow sound bypass (1/8" gap = 5 dB loss)
4. **HVAC ductwork** — Shared duct between units acts as sound conduit
5. **Continuous floor/ceiling slabs** — Sound travels through the structural slab above or below the wall
6. **Recessed lighting/speakers** — Breach the ceiling membrane
7. **Doors** — An STC 50 wall with an STC 25 hollow-core door becomes acoustically an STC 27 wall

**Lab vs. Field gap:**
- Lab STC (ASTM E90): Controlled conditions, no flanking, perfect installation
- Field STC (ASTM E336, reported as ASTC or FSTC): Real construction with flanking
- Typical gap: **3-7 STC points** (code allows 5-point reduction: STC 50 lab → NNIC 45 field)
- Worst case: 8-10 point drop with poor detailing

**Mitigation strategies:**
- Offset electrical boxes by at least one stud bay
- Wrap each box with acoustic putty pad
- Apply acoustic sealant at all perimeter joints and penetrations
- Use acoustic doors with full perimeter gasketing and drop seals
- Install inline silencers on shared HVAC ducts
- Use rated back-boxes for recessed fixtures
- Design to STC 55 in lab to land at FSTC 50 in field

### 6. STC vs OITC vs IIC

| Rating | Source Test | What It Measures | When To Use |
|--------|-------------|------------------|-------------|
| STC | E90 lab, E413 rating | Airborne sound, speech-weighted | Interior partitions, doors, demising walls |
| OITC | E90 lab, E1332 rating | Airborne sound, low-frequency-weighted | Exterior walls, windows, near traffic/aircraft |
| IIC | E492 lab, E989 rating | Impact (footstep) sound through floors | Floor/ceiling assemblies in multi-family |

Same E90 lab data can produce both STC and OITC (different weighting curves).

## Provenance
- Sources: astm.org (ASTM test methods), commercial-acoustics.com, usmadesupply.com, iccsafe.org (IBC digital codes), floorexpert.com, simulations4all.com, infinitalab.com
- Standards referenced: ASTM E90-09(2016), ASTM E492-22, ASTM E413, ASTM E989, ASTM E336, ASTM E1007, ASTM E2179, IBC 2024 §1206, IRC Appendix K
- Last verified: 2026-09-05
- Confidence: High (ASTM and IBC sources cross-referenced with multiple acoustical consultants)
