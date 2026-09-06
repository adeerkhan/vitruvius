# Civil/Structural Engineering Research — Round 2 Deep Dive Tests

---

## Test 4: Shallow Foundation Bearing Capacity — Terzaghi / Meyerhof

### Overview

The ultimate bearing capacity of a shallow foundation is the maximum vertical pressure the soil can support before shear failure occurs. Two foundational theories govern: Terzaghi (1943) and Meyerhof (1963). Modern practice extends these with shape, depth, inclination, and groundwater correction factors.

### Terzaghi's Bearing Capacity Theory (1943)

Terzaghi derived the first practical bearing capacity equation using plasticity theory for a strip footing on weightless soil. The ultimate bearing capacity for a **strip foundation** of width B is:

$$q_u = c N_c + \frac{1}{2} \gamma B N_\gamma + \gamma D_f N_q$$

Where:
- **c** = soil cohesion (or undrained shear strength $S_u$)
- **γ** = unit weight of soil
- **B** = footing width
- **$D_f$** = embedment depth below ground surface
- **$N_c$, $N_\gamma$, $N_q$** = dimensionless bearing capacity factors (function of friction angle φ)

**Terzaghi's bearing capacity factors** are derived from the passive earth pressure coefficient $K_{p\gamma}$ and were originally provided in chart form. Best-fit approximations:

- $N_q = \frac{e^{2(3\pi/4 - \phi/2)\tan\phi}}{2\cos^2(45 + \phi/2)}$ (exact solution for weightless soil)
- $N_c = (N_q - 1)\cot\phi$
- $N_\gamma \approx 1.8(N_q - 1)\tan\phi$ (approximate; Terzaghi did not provide a closed-form)

**Modifications for footing shape** (Terzaghi, 1943):

| Footing Type | Equation |
|---|---|
| Strip | $q_u = cN_c + \gamma D_f N_q + 0.5\gamma B N_\gamma$ |
| Square (B = L) | $q_u = 1.3 c N_c + \gamma D_f N_q + 0.4\gamma B N_\gamma$ |
| Circular (diameter B) | $q_u = 1.3 c N_c + \gamma D_f N_q + 0.3\gamma B N_\gamma$ |
| Rectangular (Hansen, 1966) | $q_u = c N_c (1 + 0.3 B/L) + \gamma D_f N_q + 0.5\gamma B N_\gamma (1 - 0.2 B/L)$ |

**Local shear failure**: For loose-to-medium sands ($D_r < 65\%$) and soft clays ($S_u < 50$ kPa), Terzaghi recommends using reduced friction angle $\phi_l = \arctan(\frac{2}{3}\tan\phi)$ and reduced cohesion $c_l = \frac{2}{3}c$.

### Meyerhof's General Bearing Capacity Equation (1963)

Meyerhof extended Terzaghi's work to include:
- Shape factors (not just strip/square/circular)
- **Depth factors** ($d_c$, $d_q$, $d_\gamma$) for embedment
- **Inclination factors** ($i_c$, $i_q$, $i_\gamma$) for sloped loads
- A generalized effective width concept for eccentric loading

**Meyerhof's general equation** (vertical load, horizontal base, horizontal ground):

$$q_u = c N_c s_c d_c + \gamma D_f N_q s_q d_q + 0.5 \gamma B' N_\gamma s_\gamma d_\gamma$$

Where $B' = B - 2e$ is the effective footing width (Meyerhof's effective area hypothesis).

**Meyerhof's bearing capacity factors** (using Prandtl's $N_c$, Reissner's $N_q$):

- $N_q = e^{\pi \tan\phi} \tan^2(45 + \phi/2)$
- $N_c = (N_q - 1)\cot\phi$
- $N_\gamma = (N_q - 1)\tan(1.4\phi)$ (Meyerhof, 1963, for rough footing)

**Shape factors** (Meyerhof):

| Factor | Expression |
|---|---|
| $s_c$ | $1 + 0.2 N_\phi (B/L)$ |
| $s_q$ | $s_\gamma = 1 + 0.1 N_\phi (B/L)$ for $\phi > 10°$ |
| $N_\phi$ | $\tan^2(45 + \phi/2)$ |

**Depth factors** (Meyerhof):

| Factor | Expression |
|---|---|
| $d_c$ | $1 + 0.2 \sqrt{N_\phi} (D_f/B)$ |
| $d_q$ | $d_\gamma = 1 + 0.1 \sqrt{N_\phi} (D_f/B)$ for $\phi > 10°$ |

**Inclination factors** (Meyerhof):

| Factor | Expression |
|---|---|
| $i_c$ | $i_q = (1 - \alpha°/90°)^2$ |
| $i_\gamma$ | $(1 - \alpha°/\phi°)^2$ |

Where α is the load inclination from vertical (degrees).

### Comparison: Terzaghi vs Meyerhof vs Hansen vs Vesic

| Method | N Factors | Shape | Depth | Inclination | Base/ground |
|---|---|---|---|---|---|
| Terzaghi (1943) | Charts | Fixed coefficients | None | None | None |
| Meyerhof (1963) | Prandtl/Reissner + own $N_\gamma$ | Yes | Yes | Yes | No |
| Hansen (1970) | Same as Meyerhof $N_q$, $N_c$; different $N_\gamma$ | Yes | Yes | Yes | Yes (b, g) |
| Vesic (1973) | Same as Meyerhof $N_q$, $N_c$; own $N_\gamma$ | Yes | Yes | Yes | Yes |

**Key difference in $N_\gamma$**:
- Meyerhof: $N_\gamma = (N_q - 1)\tan(1.4\phi)$
- Hansen: $N_\gamma = 1.5(N_q - 1)\tan\phi$
- Vesic: $N_\gamma = 2(N_q + 1)\tan\phi$

For $\phi = 30°$: Terzaghi $N_\gamma \approx 22$, Meyerhof $\approx 16$, Hansen $\approx 20$, Vesic $\approx 22$.

### Groundwater Effects

Three cases based on water table depth relative to foundation level:

1. **WT below $D_f + B$**: No reduction needed
2. **WT at foundation level**: Use submerged unit weight $\gamma'$ for the wedge term
3. **WT above foundation level**: Use effective unit weight throughout

### Design Standards

- **AASHTO LRFD Bridge Design Specifications** (Table 10.5.5.2.7-1) — uses Meyerhof-type equations
- **EN 1997-1 (Eurocode 7)** — partial factor approach with Hansen/Vesic factors
- **FHWA Geotechnical Engineering Circular** — uses Vesic factors for deep foundations
- **USACE EM 1110-2-2504** — uses the general bearing capacity equation with Hansen factors

### Sources

1. Terzaghi, K. (1943). *Theoretical Soil Mechanics*. Wiley.
2. Meyerhof, G.G. (1963). "Some recent research on the bearing capacity of foundations." *Canadian Geotechnical Journal*, 1(1), 16-26.
3. Hansen, J.B. (1970). *A Revised and Extended Formula for Bearing Capacity*. Danish Geotechnical Institute Bulletin 28.
4. Vesic, A.S. (1973). "Analysis of ultimate loads of shallow foundations." *Journal of the Soil Mechanics and Foundations Division*, ASCE, 99(1), 45-73.
5. Das, B.M. & Sivakugan, N. (2017). *Fundamentals of Geotechnical Engineering*. Cengage Learning. Ch. 16.
6. Kouretzis, G. (2025). "Common bearing capacity equations and practical considerations." *Fundamentals of Foundation Engineering and their Applications 2e*, LibreTexts/CAUL. §5.4.
7. USACE EM 1110-2-2504, *Retaining and Flood Walls*. Ch. 1.

---

## Test 5: Steel Column Buckling — AISC 360 Chapter E

### Overview

AISC 360 Chapter E governs the design of steel compression members. The critical limit state is **stability** — buckling before material yield. The chapter addresses flexural buckling, torsional buckling, flexural-torsional buckling, and slender-element effects.

### Section E1 — General Provisions

The nominal compressive strength is:

$$P_n = F_{cr} \cdot A_g$$

Where $F_{cr}$ is the critical stress and $A_g$ is the gross cross-sectional area.

**Design strengths:**
- **LRFD**: $\phi_c P_n = 0.90 \cdot F_{cr} \cdot A_g$
- **ASD**: $P_n / \Omega_c = F_{cr} \cdot A_g / 1.67$

### Section E2 — Effective Length

The effective length factor K transforms actual column length into an equivalent pin-ended length. The slenderness ratio KL/r is the single most important parameter.

| End Conditions | Theoretical K | Recommended K |
|---|---|---|
| Fixed–Fixed | 0.50 | 0.65 |
| Fixed–Pinned | 0.70 | 0.80 |
| Pinned–Pinned | 1.00 | 1.00 |
| Fixed–Free (cantilever) | 2.00 | 2.10 |

**Direct Analysis Method (DAM)**: Use K = 1.0 always. Account for stability through reduced stiffness ($EI^* = 0.8\tau_b EI$, $EA^* = 0.8 EA$) and notional horizontal loads ($N_i = 0.002 Y_i$).

### Section E3 — Flexural Buckling (Most Common)

The Euler elastic buckling stress:

$$F_e = \frac{\pi^2 E}{(KL/r)^2}$$

Where $E = 29,000$ ksi (200,000 MPa).

**Two-regime column curve:**

#### Inelastic Buckling ($KL/r \leq 4.71\sqrt{E/F_y}$)

$$F_{cr} = \left(0.658^{F_y/F_e}\right) F_y$$

- This equation accounts for **residual stresses** from hot-rolling (typically 10-15 ksi compressive at flange tips) and initial geometric imperfections.
- Calibrated to SSRC Column Curve 2P.
- At low slenderness (KL/r = 20), $F_{cr} \approx 0.95 F_y$.

#### Elastic Buckling ($KL/r > 4.71\sqrt{E/F_y}$)

$$F_{cr} = 0.877 \cdot F_e$$

- The 0.877 factor (~1/1.14) accounts for initial out-of-straightness (L/1000 per ASTM A6).
- Residual stresses have minimal effect in this regime (entire section is elastic at buckling).

**Transition slenderness** for A992 steel ($F_y = 50$ ksi):

$$\frac{KL}{r} = 4.71\sqrt{\frac{29,000}{50}} = 113.4$$

| KL/r Range | Fcr/Fy | Behavior |
|---|---|---|
| 0-20 | 95-100% | Essentially squash load |
| 20-50 | 85-95% | Inelastic, close to yield |
| 50-80 | 65-85% | Inelastic, significant reduction |
| 80-113 | 40-65% | Approaching transition |
| 113-150 | 20-40% | Elastic buckling governs |
| 150-200 | 10-20% | Highly slender (avoid in primary members) |

### Strong Axis vs Weak Axis Buckling

For W-shapes, the weak axis ($r_y$) typically governs because $r_y \ll r_x$ (often 40-60% of $r_x$). The larger KL/r controls:

$$\left(\frac{KL}{r}\right)_{\text{governs}} = \max\left(\frac{K_x L_x}{r_x}, \frac{K_y L_y}{r_y}\right)$$

**Example — W10×49 (A992):** $r_x = 4.35$ in, $r_y = 2.54$ in. At L = 20 ft, K = 1.0:
- $KL/r_x = 55.2$
- $KL/r_y = 94.5$ ← governs

### Residual Stress Effects

Residual stresses from hot-rolling create 10-15 ksi compressive stress at flange tips and 5-8 ksi tensile stress at flange-web junctions. When axial load is applied, portions in compressive residual stress yield early, reducing the effective elastic core and lowering buckling capacity. The 0.658 exponent in the inelastic equation captures this empirically.

Without residual stresses, the column curve would follow a modified Johnson parabola with higher capacity at moderate slenderness (KL/r = 40-80). The combined effect of residual stresses and initial crookedness reduces capacity by ~20-35% at KL/r = 40-80 compared to an ideal Euler column.

### Section E4 — Torsional and Flexural-Torsional Buckling

- **Doubly symmetric shapes** (W, HSS): Buckle by flexure or pure torsion only.
- **Singly symmetric shapes** (WT, channels): Can buckle by flexural-torsional coupling.
- **Unsymmetric shapes** (single angles): Must check flexural-torsional mode.

For doubly symmetric sections, torsional buckling stress:

$$F_e = \left(\frac{\pi^2 E C_w}{(K_z L)^2} + GJ\right) \frac{1}{I_x + I_y}$$

### Section E7 — Slender Elements

Before computing $F_{cr}$, check element width-to-thickness ratios against Table B4.1a limits:

| Element | Limit $\lambda_r$ | A992 Value |
|---|---|---|
| Flanges of I-shapes | $0.56\sqrt{E/F_y}$ | 13.5 |
| Webs of I-shapes | $1.49\sqrt{E/F_y}$ | 35.9 |
| HSS walls | $1.40\sqrt{E/F_y}$ | 33.7 |
| Angles | $0.45\sqrt{E/F_y}$ | 10.8 |
| Round HSS/Pipe | $0.11 E/F_y$ | 63.8 |

If $\lambda > \lambda_r$: reduce effective area using Q-factor approach ($Q = Q_s \cdot Q_a$).

### Slenderness Recommendation

AISC recommends $KL/r \leq 200$ for compression members. At KL/r = 200, only ~13% of squash load remains.

### Sources

1. AISC (2022). *ANSI/AISC 360-22: Specification for Structural Steel Buildings*. Chicago: AISC. Chapter E.
2. AISC (2022). *AISC Steel Construction Manual*, 16th Ed. Tables 4-1, 4-22.
3. CalcSteel (2026). "AISC 360 Compression Check — Columns Ch. E." calcsteel.com/docs/standards/aisc/compression.
4. SteelCalculator.app (2026). "Column Design Guide — AISC 360 Chapter E Fcr KL/r."
5. Geschwindner, L.F. & Troemner, M. (2016). "Notes on the AISC 360-16 Provisions for Slender Compression Members." *Engineering Journal*, AISC.

---

## Test 6: Wind Loads — ASCE 7 Chapters 26-30

### Overview

ASCE 7-22 *Minimum Design Loads and Associated Criteria for Buildings and Other Structures* provides the wind load provisions for U.S. practice. Chapters 26-30 cover general requirements, MWFRS (directional and envelope), appurtenances, and components & cladding.

### Chapter 26 — General Requirements

Chapter 26 establishes the fundamental parameters used by all subsequent wind chapters.

#### Basic Wind Speed (V)

The 3-second gust speed at 33 ft (10 m) above ground in Exposure C, with a specified annual probability of exceedance. Separate maps provided for Risk Categories I, II, III, and IV. ASCE 7-22 incorporates updated wind data and refined hurricane modeling.

#### Exposure Categories (§26.7)

| Category | Terrain | Typical Kz at 33 ft |
|---|---|---|
| B | Urban/suburban, many obstructions | 0.70 |
| C | Open terrain, scattered obstructions | 1.00 |
| D | Flat open terrain, smooth, no obstructions | 1.03 |

#### Velocity Pressure (§26.10)

$$q_z = 0.00256 \cdot K_z \cdot K_{zt} \cdot K_e \cdot V^2 \quad (\text{psf})$$

**Key change in ASCE 7-22**: $K_d$ (directionality factor) was removed from this equation and placed explicitly into the pressure equations in Chapters 27-30.

**Factors:**

| Factor | Description | Value |
|---|---|---|
| $K_z$ | Velocity pressure exposure coefficient (varies with height z and exposure) | Table 26.10-1 |
| $K_{zt}$ | Topographic factor ($= (1 + K_1 K_2 K_3)^2$) | 1.0 for flat terrain |
| $K_e$ | Ground elevation factor (**NEW in ASCE 7-22**) | 1.0 at sea level; ~0.85 at 5,000 ft |
| $K_d$ | Wind directionality factor (moved to pressure equations) | 0.85 for buildings |
| $V$ | Basic wind speed (mph) | From maps |

**ASCE 7-22 $K_z$ revision**: Table 26.10-1 constants changed — $\alpha$ for B/C, $z_g$ for B/C/D updated. Cap raised from 2.01 to 2.41.

#### Wind Directionality Factor $K_d$ (§26.6)

| Structure Type | $K_d$ |
|---|---|
| Buildings (MWFRS and C&C) | 0.85 |
| Arched roofs | 0.85 |
| Chimneys, tanks (circular) | 0.95 |
| Solid signs | 0.85 |
| Trussed towers | 0.85 |

#### Gust Effect Factor G (§26.11)

- **Rigid buildings** (natural frequency $f \geq 1$ Hz): $G = 0.85$
- **Flexible buildings** ($f < 1$ Hz): Must calculate $G_f$ per §26.11.5, accounting for resonant amplification.

#### Internal Pressure Coefficient $GC_{pi}$ (§26.13)

| Enclosure Classification | $GC_{pi}$ |
|---|---|
| Enclosed | ±0.18 |
| Partially enclosed | ±0.55 |
| Partially open | ±0.55 |

### Chapter 27 — MWFRS Directional Procedure

The **Directional Procedure** (formerly Chapter 27 Part 1) develops wind pressures using wind-direction-specific external pressure coefficients $C_p$. It applies to enclosed and partially enclosed buildings of any height.

**Design wind pressure** (Eq. 27.3-1):

$$p = q \cdot K_d \cdot G \cdot C_p - q_i \cdot K_d \cdot (GC_{pi})$$

Where:
- $q = q_z$ for windward wall (varies with height)
- $q = q_h$ for leeward wall, sidewalls, and roof
- $q_i = q_h$ for enclosed buildings

**External pressure coefficients $C_p$** (Figure 27.3-1):

| Surface | $C_p$ |
|---|---|
| Windward wall | +0.8 |
| Leeward wall | -0.5 (varies with L/B) |
| Sidewalls | -0.7 |
| Windward roof | Depends on slope θ |
| Leeward roof | -0.5 |

**Four design wind load cases** (§27.3.5, Figure 27.3-8):

| Case | Description |
|---|---|
| 1 | Full design pressures on each principal axis, one at a time |
| 2 | 75% of Case 1 + torsion (resultant shifted ±15% of face width) |
| 3 | 75% on both axes simultaneously (quartering wind) |
| 4 | 56.3% on both axes + torsion |

**Minimum wind load**: 16 psf on wall area + 8 psf on roof area, projected vertically.

### Chapter 28 — MWFRS Envelope Procedure

The **Envelope Procedure** uses combined gust-effect and external pressure coefficients $(GC_{pf})$ from wind tunnel testing, which envelope maximum structural actions regardless of wind direction. Limited to **low-rise buildings** ($h \leq 60$ ft, $h \leq$ least horizontal dimension).

**Design wind pressure** (Eq. 28.3-1):

$$p = q_h \left[(GC_{pf}) - (GC_{pi})\right]$$

Where:
- $q_h$ = velocity pressure at mean roof height
- $(GC_{pf})$ = external pressure coefficients from Figure 28.3-1 (pseudo loading conditions)
- $(GC_{pi})$ = internal pressure coefficient

The $(GC_{pf})$ values are constant for specific roof and wall zones based on building geometry ($L/B$ and $h/L$ ratios). Torsional load cases per Figure 28.3-2.

### MWFRS vs C&C

| Aspect | MWFRS | C&C |
|---|---|---|
| What it resists | Overall wind forces on building | Direct wind loads on individual elements |
| Structural elements | Moment frames, shear walls, diaphragms | Wall studs, roof trusses, glazing, panels |
| Tributary area | Large (entire face/roof) | Small (individual elements) |
| Pressure coefficients | Lower (large areas average out peaks) | Higher (accounts for local suction peaks at corners/edges) |
| Code chapters | Ch. 27 (directional) or Ch. 28 (envelope) | Ch. 30 |

### Chapter 29 — Appurtenances and Other Structures

Covers wind loads on roof-mounted equipment, parapets, signs, and similar structures using force coefficients from Figures 29.3-1 through 29.4-3.

### Chapter 30 — Components and Cladding

C&C design uses higher pressure coefficients to account for localized pressure peaks. Pressures are based on effective wind area (smaller area = higher pressure). Simplified methods from ASCE 7-16 have been deleted in 7-22.

### Key ASCE 7-22 Changes (vs 7-16)

| Change | Impact |
|---|---|
| $K_d$ relocated from $q_z$ to pressure equations | Pressures ~15% lower if not updated |
| $K_z$ recalibration (Table 26.10-1) | Slight shift for Exposure B/C; cap raised to 2.41 |
| $K_e$ ground elevation factor (new) | Meaningful reduction at high-altitude sites |
| Ch. 27 Part 2 deleted | No simplified method for simple diaphragm buildings |
| Ch. 28 Part 2 deleted | No tabular envelope for low-rise buildings |
| Elevated buildings §27.3.1.1 | New three-part procedure for buildings on stilts/columns |
| Tornado loads (Ch. 32) | Required for Risk Category III/IV in tornado-prone regions |

### Sources

1. ASCE (2022). *ASCE/SEI 7-22: Minimum Design Loads and Associated Criteria for Buildings and Other Structures*. Chapters 26-30.
2. Prose Engineering (2026). "ASCE 7-22 Main Wind Force Resisting System Wind Load Changes." prose-eng.com.
3. EngineersUniverse (2026). "ASCE 7-22 Chapter 26 Wind Loads: How to Determine Design Wind Speeds and Pressures." engineersuniverse.com.
4. SteelCalculator.app (2026). "ASCE 7-22 Wind Load Full Calculation Example — MWFRS & C&C."
5. StructSuite (2026). "Wind Load Calculation: Directional Procedure (ASCE 7-22 Ch. 27)."
6. CED Engineering (2026). "Calculating Wind Loads on Buildings Using the Envelope Procedure of ASCE 7-22 Code."
7. SEAUtah (2024). "ASCE 7-22 Updates." Satyendra Ghosh presentation.

---

*Generated: 2026-09-05 | Vitruvius Engineering Research — Round 2 Deep Dive*
