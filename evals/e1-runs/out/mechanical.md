# Bearing Selection and Power Transmission — Gearbox

**Missing inputs first.** No power, speed, ratio, duty cycle, design life, reliability target, lubrication, or shaft geometry was supplied. This is therefore a method brief with one datasheet anchor, not a bearing choice for your box. Every selection below is `inferred`.

**Gear rating basis.** Size the mesh first; bearing loads follow from it. US practice is ANSI/AGMA 2001-D04 (metric 2101-D04): pitting stress σc and bending stress σt with overload Ko, dynamic Kv, size Ks, load-distribution Km, geometry factors I and J, and stress-cycle factors ZN and YN. ISO 6336-1/-2/-3 is the international equivalent; the two produce different ratings, so state which governs. Neither fixes your design factor — SH and SF are application-selected (industrial practice commonly SH ≥ 1.0, SF ≥ 1.25; confirm in the edition you hold, `inferred`). **Design factor for this gearbox: missing.**

**Bearing selection.** Use ISO 281 basic rating life L10 = (C/P)^p × 10⁶ rev, p = 3 for ball bearings and 10/3 for roller; apply a1 for reliability (0.62 at 95%, 0.21 at 99%) and aISO for contamination and lubrication. Check static safety s0 = C0/P0 and minimum load. Primary example, SKF 6208 (40 × 80 × 18 mm): C = 32.5 kN, C0 = 19 kN, Pu = 0.8 kN, limiting speed 11 000 r/min. At an assumed P = 5 kN, L10 = (32.5/5)³ = 275 × 10⁶ rev — arithmetic only; P is assumed, not derived.

**Power transmission.** Set shaft diameter from torque and allowable shear, then check deflection at the mesh and bearing slope. Keys per DIN 6885-1 / ISO 773 (ANSI B17.1 in US practice), checked for shear and bearing pressure, not just nominal size. Add lubrication and thermal rating; grease life and oil viscosity often govern before fatigue does.

**Sources.** ANSI/AGMA 2001-D04 §§5–19; ISO 6336-1:2019, -2, -3; ISO 281:2007; SKF 6208 product datasheet (accessed 2026-11-08). Research only — not for final design sign-off.
