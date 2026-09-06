# Test 6 Draft: Green Building — LEED v4.1 Energy & Atmosphere

## Research Question
What are the LEED v4.1 prerequisites and credits for the Building Energy and Atmosphere category? What is the ECB method vs Performance Rating Method? What are the points available? How does ASHRAE 90.1-2019 relate to LEED energy credits?

## Evidence Table

| # | Source | Standard/Section | Key Finding | Verified |
|---|--------|------------------|-------------|----------|
| 1 | USGBC | LEED v4.1 BD+C | EA category offers up to 33 points total | ✓ |
| 2 | USGBC | EAp1 | Fundamental Commissioning — prerequisite (required, no points) | ✓ |
| 3 | USGBC | EAp2 | Minimum Energy Performance — prerequisite, 10% improvement for new construction | ✓ |
| 4 | USGBC | EAp3 | Building-Level Energy Metering — prerequisite | ✓ |
| 5 | USGBC | EAc1 | Enhanced Commissioning — up to 6 points | ✓ |
| 6 | USGBC | EAc2 | Optimize Energy Performance — up to 18 points (energy + GHG dual metric) | ✓ |
| 7 | USGBC | EAc5 | Renewable Energy — up to 5 points | ✓ |
| 8 | ASHRAE 90.1-2019 | Section 11 | Energy Cost Budget (ECB) Method — dependent baseline | ✓ |
| 9 | ASHRAE 90.1-2019 | Appendix G | Performance Rating Method (PRM) — independent baseline | ✓ |
| 10 | DOE/energycodes.gov | Performance compliance | ECB vs Appendix G comparison | ✓ |
| 11 | USGBC | 2024 Energy Update | Raised minimum from 5% to 10%, added GHG metric | ✓ |

## Findings

### 1. LEED v4.1 EA Category Structure

The Energy and Atmosphere (EA) category in LEED v4.1 BD+C offers **up to 33 points** — the largest single category opportunity. Structure:

**Prerequisites (required, 0 points):**
| Prerequisite | Requirement |
|-------------|-------------|
| EAp1: Fundamental Commissioning and Verification | Commissioning of energy systems per ASHRAE Guideline 0 |
| EAp2: Minimum Energy Performance | 10% improvement over ASHRAE 90.1-2010 baseline (new construction) |
| EAp3: Building-Level Energy Metering | Permanent metering of total building energy; 5-year data sharing commitment |

**Credits (optional, up to 33 points):**
| Credit | Points | Description |
|--------|--------|-------------|
| EAc1: Enhanced Commissioning | Up to 6 | Monitoring-based commissioning (MBCx) |
| EAc2: Optimize Energy Performance | Up to 18 | Energy efficiency (9 pts) + GHG emissions reduction (9 pts) |
| EAc3: Advanced Energy Metering | 1 | Sub-metering of end-use loads |
| EAc4: Demand Response | Up to 2 | Automated demand response participation |
| EAc5: Renewable Energy | Up to 5 | On-site or off-site renewable procurement |
| EAc6: Enhanced Refrigerant Management | 1 | Reduce refrigerant GHG impact |
| EAc7: Green Power and Carbon Offsets | Up to 2 | Renewable energy certificates / carbon offsets |

### 2. EA Prerequisite: Minimum Energy Performance (EAp2)

**What it requires:**
- Demonstrate minimum 10% improvement in energy cost (or source energy or GHG emissions) over ASHRAE 90.1-2010 Appendix G baseline
- For new construction; different thresholds for existing buildings
- On-site renewable energy can contribute toward prerequisite compliance (2024 update)

**Compliance paths (per 2024 Energy Update):**
1. Whole-building energy simulation per Appendix G (Option 1)
2. Prescriptive compliance per ASHRAE 90.1-2016 Sections 5-10 with credit substitution (Option 2)
3. ASHRAE Advanced Energy Design Guide strategies (Option 3)

**2024 Update changes (effective March 1, 2024):**
- Minimum raised from 5% to 10% improvement for new construction
- Added GHG emissions metric alongside cost metric
- Added source energy metric as alternative
- On-site renewable energy now credited toward prerequisite

### 3. EA Credit: Optimize Energy Performance (EAc2)

**Points:** Up to 18 (most BD+C project types), up to 16 (Schools), up to 20 (Healthcare)

**Dual metric structure (v4.1):**
- **Table 1: Cost Improvement** — up to 9 points
- **Table 2: GHG Emissions Reduction** — up to 9 points
- Total = Table 1 + Table 2 (maximum 18 points)

**Point thresholds (Table 1 — Cost Improvement):**

| % Improvement | Points (NC/CS/Retail/Data Centers) | Points (Healthcare) |
|---------------|-------------------------------------|---------------------|
| 5% | 1 | 1 |
| 10% | 2 | 2 |
| 15% | 3 | 3 |
| 20% | 4 | 4 |
| 25% | 5 | 5 |
| 30% | 6 | 6 |
| 35% | 7 | 7 |
| 40% | 8 | 8 |
| 45%+ | 9 | 9 |

**Option 1: Energy Performance Compliance** — Most projects use this. Requires Appendix G energy modeling demonstrating Performance Cost Index (PCI) below target (PCIt). Dual metric: cost + GHG.

**Option 2: Prescriptive Compliance (ASHRAE AEDGs)** — For projects using prescriptive path in prerequisite. Implement ASHRAE 50% Advanced Energy Design Guide strategies. Maximum 6 points.

**Option 3: Systems Optimization** — Prescriptive improvements across systems. Maximum 6 points. Limited to ≤ 2,000 SF of data center/lab/manufacturing.

**Renewable energy treatment:**
- On-site renewables can reduce Proposed Building Performance for both cost and GHG metrics
- For GHG metric only, Tier 2 off-site renewables also qualify

### 4. Energy Cost Budget (ECB) Method vs Performance Rating Method (PRM)

**ECB Method (ASHRAE 90.1-2019 Section 11):**
- **Purpose:** Code compliance demonstration
- **Baseline:** "Dependent" — clone of proposed design with components adjusted to just meet prescriptive requirements
- **Criterion:** Design Energy Cost (DEC) ≤ Energy Cost Budget (ECB)
- **Trade-offs:** Envelope, lighting, HVAC, service water heating
- **Renewables:** Reduce proposed (DEC) only; NOT included in budget
- **Budget HVAC:** Follows proposed system type per Figure 11.5.2
- **Best for:** Complex buildings needing flexibility while demonstrating code compliance

**PRM / Appendix G (ASHRAE 90.1-2019 Appendix G):**
- **Purpose:** Beyond-code performance rating
- **Baseline:** "Independent" — based on standard practice, not cloned from proposed
- **Criterion:** Performance Cost Index (PCI) below Performance Cost Index Target (PCIt)
- **Trade-offs:** All systems including unregulated loads
- **Renewables:** Can be included in both proposed and baseline models per rules
- **Budget HVAC:** Standardized baseline systems per Table G3.1.1-3
- **Best for:** LEED, ENERGY STAR, incentive programs, beyond-code certifications

**Key differences:**

| Feature | ECB (Section 11) | PRM (Appendix G) |
|---------|-------------------|-------------------|
| Primary purpose | Code compliance | Beyond-code rating |
| Baseline type | Dependent (cloned from proposed) | Independent (standard practice) |
| Budget HVAC | Proposed system type | Standardized baseline systems |
| On-site renewables | Reduce DEC only | Can reduce both proposed and baseline |
| Unregulated loads | Not modeled | Included in both models |
| LEED compatibility | Not used for LEED credits | Required for LEED energy credits |

### 5. ASHRAE 90.1-2019 and LEED

**Relationship:** LEED v4.1 references ASHRAE 90.1-2010 as the baseline standard for Appendix G modeling, but allows alternative pathways using ASHRAE 90.1-2016 or 2019.

**ASHRAE 90.1-2019 updates relevant to LEED:**
- Added pump definitions, requirements, and efficiency tables
- Replaced fan efficiency grade (FEG) with fan energy index (FEI)
- New energy recovery requirements for high-rise residential
- New condenser heat recovery for acute care hospitals
- Refined ECB requirements for orientation, shading, renewables
- Updated Appendix G baseline HVAC system definitions
- New simulation software requirements aligned with ASHRAE 140

**LEED v4.1 pathway options:**
1. ASHRAE 90.1-2010 Appendix G (original LEED v4 baseline)
2. ASHRAE 90.1-2016 prescriptive compliance (with credit substitution per 2024 update)
3. ASHRAE 90.1-2019 pathways (where accepted by USGBC)

**Performance Cost Index (PCI) calculation:**
```
PCI = PBP / BBP
```
Where PBP = Proposed Building Performance (energy cost) and BBP = Baseline Building Performance (energy cost).

**PCIt (target):** Set based on building type and climate zone. Projects must demonstrate PCI below PCIt to earn points.

### 6. Additional EA Credits

**Enhanced Commissioning (EAc1, up to 6 points):**
- Option 1: Enhanced + monitoring-based commissioning (MBCx) — up to 6 points
- Option 2: Enhanced commissioning only — up to 4 points
- Requires commissioning provider engaged at schematic design phase
- 10-month monitoring-based commissioning period

**Renewable Energy (EAc5, up to 5 points):**
- On-site renewable energy (Tier 1)
- Off-site renewable energy procurement (Tier 2)
- Points based on percentage of annual energy offset

**Advanced Energy Metering (EAc3, 1 point):**
- Sub-meter all end-use loads ≥ 10% of total
- Data tracking and fault detection

**Demand Response (EAc4, up to 2 points):**
- Automated demand response capability
- Participation in utility program

## Provenance
- Sources: usgbc.org (LEED v4.1 rating system), support.usgbc.org (energy update details), energycodes.gov (ECB vs PRM), ashrae.org (90.1-2019 updates), docs.betterbuilding.io (LEED v4.1 OEP details), envigilance.com (LEED energy credits guide)
- Standards referenced: ASHRAE 90.1-2019, ASHRAE 90.1-2016, ASHRAE 90.1-2010, ASHRAE Guideline 0, LEED v4.1 BD+C Reference Guide
- Last verified: 2026-09-05
- Confidence: High (USGBC official sources and ASHRAE documentation)
