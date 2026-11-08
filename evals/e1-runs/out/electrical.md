# Motor Drives and Power Systems — Grid-Tied Installation

**Scope:** No installation data was supplied — no voltage, frequency, motor rating, drive topology, utility, or jurisdiction. What follows is a framework, not a finding about your plant. Any claim about what *your* installation does would be invented, so none is made.

## Missing basis (blocking)
- Voltage and frequency (e.g. 400/230 V 50 Hz vs 480/277 V 60 Hz) — **unstated**
- Motor schedule: rating, duty, starting method (DOL, star-delta, VFD)
- Interconnection: supply-side or load-side, export or non-export
- Jurisdiction and code edition (NEC year vs IEC/EN region)

## Standards that would govern
| Area | Standard | Status |
|---|---|---|
| Drive safety | IEC 61800-5-1:2022 (UL 61800-5-1 harmonized) | existence verified |
| Drive EMC | IEC 61800-3:2022 | existence verified |
| Motor circuits | NEC Art. 430, *Motors, Motor Circuits, and Controllers* | existence verified |
| Grid interconnection | IEEE 1547-2018; NEC Art. 705 | existence verified |
| Harmonics | IEEE 519-2022 | existence verified |
| Motors (US) | NEMA MG 1 | not read |

Only titles and years were confirmed, from standards-body catalogs. **No clause text was read**, so no clause-level requirement is asserted.

## Datasheet values vs inferred selection
- **Datasheet (needed, not supplied):** motor nameplate, drive input/output ratings, short-circuit current rating, filter data.
- **Inferred, not verified:** line reactor/dV/dt filter need, derating for altitude/temperature, feeder and protection sizing. All follow from documents I have not seen, so they are left open.
- **Not a measured value:** harmonic limits. IEEE 519-2022 is a design constraint at the coupling point, not an observed distortion level.

## Two points that bind a grid-tied drive installation
1. Drives are nonlinear loads; harmonic compliance is assessed at the point of common coupling and usually needs utility agreement.
2. Grid-tied generation shifts the design onto interconnection rules — IEEE 1547-2018 performance and NEC Art. 705 wiring.

**To make this specific:** send voltage/frequency, motor schedule, drive model, a single-line diagram, and the jurisdiction.

*Research only — not for final sign-off.*
