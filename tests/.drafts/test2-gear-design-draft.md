# Test 2 Draft: Gear Design — AGMA Stress Numbers

## Evidence Table

| Claim | Source | URL | Status |
|-------|--------|-----|--------|
| Bending stress: σ = Wt·Ko·Kv·Ks·Pd/(F·Km·KB/J) | ANSI/AGMA 2001-D04 | engineersedge.com, kntu.ac.ir | VERIFIED |
| Contact stress: σc = Cp·√(Wt·Ko·Kv·Ks·Km·Cf/(d·F·I)) | ANSI/AGMA 2001-D04 | engineersedge.com | VERIFIED |
| Ko = 1.0–1.75 (overload factor) | AGMA 2001-D04 §9 | mechcodex.com | VERIFIED |
| Kv depends on gear quality and velocity | AGMA 2001-D04 §8 | AGMA standard | VERIFIED |
| Km = load distribution factor | AGMA 2001-D04 §15 | AGMA standard | VERIFIED |
| Cp = elastic coefficient | AGMA 2001-D04 §12 | AGMA standard | VERIFIED |
| Through-hardened steel: σat = 250–400 MPa | AGMA material tables | mechcodex.com | VERIFIED |
| Case-hardened steel: σac = 1000–1500 MPa | AGMA material tables | mechcodex.com | VERIFIED |

## Findings

### Bending Stress (Pitting Resistance)

σ = Wt · Ko · Kv · Ks · Pd / (F · Km · KB / J)

Or equivalently:
σ = Wt · Ko · Kv · Ks · Km · KB / (F · Pd^-1 · J)

Where:
- σ = bending stress number (psi or MPa)
- Wt = transmitted tangential load (lb or N)
- Ko = overload factor (1.0–1.75)
- Kv = dynamic factor (depends on gear accuracy class)
- Ks = size factor (typically 1.0)
- Pd = diametral pitch (in^-1) or module m (mm)
- F = face width (in or mm)
- Km = load distribution factor (1.0–1.6)
- KB = rim thickness factor (1.0 for solid gears)
- J = AGMA geometry factor for bending (from AGMA 908-B89)

### Contact Stress (Bending Strength)

σc = Cp · √(Wt · Ko · Kv · Ks · Km · Cf / (d · F · I))

Where:
- σc = contact stress number (psi or MPa)
- Cp = elastic coefficient (psi^0.5 or MPa^0.5)
  - Steel on steel: Cp ≈ 2300 psi^0.5 (191 MPa^0.5)
- d = pitch diameter (in or mm)
- I = geometry factor for pitting resistance (from AGMA 908-B89)
- Cf = surface condition factor (typically 1.0)

### Typical K-Factor Ranges

| Factor | Description | Typical Range |
|--------|-------------|---------------|
| Ko | Overload | 1.0–1.75 |
| Kv | Dynamic | 0.85–1.5 (quality dependent) |
| Ks | Size | 1.0 |
| Km | Load distribution | 1.0–1.6 |
| KB | Rim thickness | 1.0 (solid gears) |

### Allowable Stress Numbers (Typical Steel Gears)

| Material | σat (Bending) | σac (Contact) |
|----------|---------------|---------------|
| Through-hardened (300 HB) | 250–300 MPa | 600–750 MPa |
| Through-hardened (400 HB) | 300–400 MPa | 800–1000 MPa |
| Case-carburized (58–62 HRC) | 350–450 MPa | 1200–1500 MPa |

## Sources
1. ANSI/AGMA 2001-D04, "Fundamental Rating Factors for Involute Spur and Helical Gear Teeth"
2. AGMA 908-B89, "Geometry Factors for Pitting Resistance and Bending Strength"
3. ANSI/AGMA 2101-D04 (SI version)
