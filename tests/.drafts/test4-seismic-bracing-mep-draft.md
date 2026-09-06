# Test 4 Draft: Seismic Bracing — MEP Systems (ASCE 7-22 Chapter 13)

## Research Question
What are the seismic bracing requirements for MEP systems per ASCE 7-22 Chapter 13? What are the component Importance Factor Ip values? What are the horizontal and orthogonal load requirements? When is seismic analysis required versus prescriptive bracing?

## Evidence Table

| # | Source | Standard/Section | Key Finding | Verified |
|---|--------|------------------|-------------|----------|
| 1 | ASCE 7-22 | Chapter 13 (§13.1-13.6) | Nonstructural component seismic design scope and provisions | ✓ |
| 2 | ASCE 7-22 | §13.1.3 | Ip = 1.5 for life-safety, hazardous materials, Risk Category IV; Ip = 1.0 otherwise | ✓ |
| 3 | ASCE 7-22 | Eq. 13.3-1 | Fp = 0.4 × SDS × Ip × Wp × (Hf / Rμ) × (CAR / Rpo) | ✓ |
| 4 | ASCE 7-22 | §13.3.1 | Fp,max = 1.6 × SDS × Ip × Wp; Fp,min = 0.3 × SDS × Ip × Wp | ✓ |
| 5 | ASCE 7-22 | §13.3.1.2 | Vertical force: Fv = ±0.2 × SDS × Wp | ✓ |
| 6 | ASCE 7-22 | §13.6.5-13.6.7 | Distribution system bracing thresholds (piping, ductwork, conduit) | ✓ |
| 7 | ASCE 7-22 | Table 13.6-1 | ap (component amplification) and Rp (response modification) values | ✓ |
| 8 | ASCE 7-22 | §13.2.2 | Designated seismic systems require certification (shake table or experience data) | ✓ |
| 9 | FEMA P-784 | Chapter 3 | Nonstructural earthquake hazard guidance | ✓ |
| 10 | SMACNA | Seismic Restraint Manual | HVAC duct bracing pre-engineered details | ✓ |
| 11 | MSS SP-58/SP-127 | Pipe hanger standards | Pipe hanger and seismic bracing standards | ✓ |

## Findings

### 1. Scope — What Chapter 13 Covers (§13.1)

Chapter 13 applies to **permanently attached nonstructural components**, their supports, and their attachments to the structure. Explicitly includes:
- **Architectural components** — partitions, ceilings, cladding, glass, parapets, signs
- **Mechanical and electrical components** — HVAC equipment, generators, transformers, pumps, switchgear, batteries
- **Distribution systems** — piping, ductwork, electrical conduit, cable tray, busway
- **Supports** (frames, skids, hangers, trapezes) and **attachments** (anchors, welds, bolts)

Does NOT cover non-building structures (Chapter 15 governs those).

### 2. Component Importance Factor Ip (§13.1.3)

Ip is binary — either 1.0 or 1.5:

**Ip = 1.5 when:**
- Component is required to function for life-safety after earthquake (fire pumps, smoke control, emergency power)
- Component conveys, supports, or contains toxic, highly toxic, or explosive substances above code thresholds
- Component is in or attached to a Risk Category IV structure (hospitals, fire stations, EOCs) and is needed for continued operation
- Component conveys hazardous substances and is attached to Risk Category III or IV structure

**Ip = 1.0** for all other components.

**Common Ip = 1.5 MEP components:** emergency generators, fire pumps, ATSs, UPSs, switchgear serving life-safety loads, smoke control fans and ductwork, medical gas equipment, fuel oil tanks for emergency generators.

**Common Ip = 1.0 MEP components in hospitals:** comfort-only HVAC equipment, domestic water heaters for non-essential areas, decorative ceilings in non-critical spaces.

**Cascade effect:** Setting Ip = 1.5 increases Fp by 50%, triggers special seismic certification (§13.2.2), and requires Certificate of Compliance (typically ICC-ES AC156 shake-table testing).

### 3. Horizontal Seismic Design Force Fp (§13.3.1)

**ASCE 7-22 Eq. 13.3-1 (new formulation replacing ASCE 7-16):**

```
Fp = 0.4 × SDS × Ip × Wp × (Hf / Rμ) × (CAR / Rpo)
```

Where:
- **SDS** = Design spectral acceleration at short periods (from USGS, site-specific)
- **Ip** = Component importance factor (1.0 or 1.5)
- **Wp** = Operating weight of component including contents
- **Hf** = Height amplification factor (replaces old 1+2z/h); calculated from building period Ta per Eq. 13.3-4; ≈1.0 at grade, can exceed 2.5 at roof of tall flexible buildings
- **Rμ** = Building ductility reduction factor (from Table 13.3-1 based on SFRS; 1.0 at grade plane, up to 1.3+ above grade for ductile systems)
- **CAR** = Component resonance ductility factor (from Tables 13.5-1/13.6-1)
- **Rpo** = Component overstrength factor (typically 1.5 for most MEP equipment)

**Upper and lower bounds:**
```
Fp,max = 1.6 × SDS × Ip × Wp
Fp,min = 0.3 × SDS × Ip × Wp
```

**Component classification (ap/Rp from Tables 13.5-1 and 13.6-1):**

| Component Type | ap | Rp | Notes |
|----------------|----|----|-------|
| Mechanical/electrical (rigid, fp > 16.7 Hz) | 1.0 | 2.5 | Low-deformability equipment |
| Mechanical/electrical (flexible) | 2.5 | 2.5 | Flexible equipment |
| Piping (high-deformability steel) | 2.5 | 6.0 | Standard distribution piping |
| Piping (limited-deformability) | 2.5 | 3.0 | Some specialty piping |
| Distribution systems (conduit, cable tray) | 2.5 | 6.0 | Standard electrical distribution |

### 4. Vertical Seismic Force Fv (§13.3.1.2)

```
Fv = ±0.2 × SDS × Wp
```

Fv combines with Fp using Chapter 2 load combinations: E = ρFp + 0.2SDS D acting upward or downward.

### 5. Orthogonal Load Combination (§13.4)

Per §13.4, the component shall be designed for the combination of 100% of Fp in one direction plus 30% of Fp in the orthogonal direction (SRSS combination per ASCE 7 §12.5.3). This applies to:
- Component anchorage
- Support design
- Attachment design

### 6. Distribution System Bracing Thresholds (§13.6.5-13.6.7)

**Piping (§13.6.5):**
- Ip = 1.5 systems: bracing required for ≥ 1" NPS
- Ip = 1.0 systems: bracing required for ≥ 2½" NPS
- Exceptions: trapeze loads below threshold, hangers < 12" length, pipe in wall openings with thermal expansion clearance

**Ductwork (§13.6.6):**
- Bracing required if cross-sectional area > 6 ft² OR weight > 17 lb/ft
- Duct supporting other equipment (fire dampers, VAV terminals) gets additional anchorage
- Duct through fire-rated walls requires anchorage maintaining rated assembly integrity

**Conduit and Cable Tray (§13.6.7):**
- Trapeze-supported conduit: bracing required if trapeze weight + cable weight > 10 lb/ft
- Cable tray: bracing for tray ≥ 12" wide depending on fill
- Bus duct: always braced (treat as rigid duct)

**Longitudinal vs Transverse bracing:**
- Transverse braces: every 40 ft (typical for piping)
- Longitudinal braces: every 80 ft
- Each elbow/branch needs brace pair within 24" of the turn

**General exceptions (§13.6.8):**
- 12-inch rule: hangers < 12" length exempt from bracing
- Trapeze weight < 10 lb/ft exempt from bracing calculations
- Ip = 1.0 discrete components ≤ 400 lb, center of mass ≤ 4 ft above floor, with flexible connections

### 7. Prescriptive Bracing vs Seismic Analysis (§13.2.2)

**Prescriptive bracing (pre-engineered):**
- Available for distribution systems using SMACNA Seismic Restraint Manual details or MSS SP-58/SP-127
- Pre-engineered cable braces at 30°-60° from vertical
- Applicable when component falls within table limits (size, weight, SDS)
- Does NOT require detailed Fp calculation for brace sizing

**Seismic analysis required when:**
- Component is a Designated Seismic System (Ip = 1.5) in SDC C-F — requires Certificate of Compliance via:
  - ICC-ES AC156 shake-table testing, OR
  - Experience data per §13.2.2, OR
  - Analysis per §13.2.2 (limited to nonactive components)
- Component weight ≥ 20% of supporting structure's effective seismic weight (§13.2.9)
- Component does not fit pre-engineered table limits
- High SDS regions exceed assumed table values
- Long unbraced runs through atriums
- Heavy mid-span equipment exceeding table allowances

### 8. Hospital-Specific Rules (HCAI/OSHPD)

Under California HCAI:
- All medical gas piping: Ip = 1.5, bracing at smaller threshold
- All fire pump discharge piping: Ip = 1.5
- All emergency power feeders: Ip = 1.5
- All smoke control ductwork: Ip = 1.5
- Pre-engineered SMACNA tables sized for Ip = 1.0 must be rechecked for Ip = 1.5 demand

### 9. Designated Seismic Systems (§13.2.2-13.2.3)

Active mechanical and electrical components with Ip = 1.5 are Designated Seismic Systems requiring a Certificate of Compliance proving post-earthquake operability. Certification pathways:
1. ICC-ES AC156 shake-table testing (most common)
2. Experience data (documented performance in prior earthquakes)
3. Analysis (limited to nonactive components only)

## Provenance
- Sources: panacheg.com (PE/SE engineering firm), seblog.strongtie.com (Simpson Strong-Tie), scribd.com (ASCE 7-22 text excerpts), asce.org, dgs.ca.gov (California DSA)
- Standards referenced: ASCE/SEI 7-22, FEMA P-784, SMACNA Seismic Restraint Manual, MSS SP-58/SP-127, ICC-ES AC156
- Last verified: 2026-09-05
- Confidence: High (multiple engineering sources cross-referenced)
