---
name: electrical
description: >
  Electrical and electronics engineering research. Use when the user invokes
  /electrical or asks about electrical engineering topics — power systems,
  electronics, circuit design, controls, signal integrity, EMC, motors and
  drives, grid and renewables — or asks to verify an electrical claim or a
  component's specs. Dispatches to the shared engineering-research method
  with the electrical evidence landscape.
argument-hint: "<research question>"
license: MIT
---

# Electrical / Electronics Engineering Research

Activate the `/skill:engineering-research` method and run it with this
domain payload. Do not restate the research loop here.

## Evidence landscape

- **Standards/codes:** IEEE, IEC, UL, NEC (NFPA 70), NFPA 79, IPC, CISPR.
  When a standard governs, cite the exact clause or section.
- **Primary sources:** component datasheets and errata from the manufacturer,
  official standards portals, application notes, reference designs, peer-
  reviewed literature, grid/utility interconnection rules.
- **Prior art / practice:** documented field failures, recall/advisory
  databases, failure-analysis reports, trade association guidance.

## Verification criteria

- **Units and notation:** every number carries a unit; watch SI prefixes
  (mA vs A, nF vs uF), RMS vs peak, dB vs linear, phasor conventions. Flag
  mixed or ambiguous claims.
- **Datasheet claims:** verify against the actual datasheet — a part number
  without a datasheet read is `inferred`, not `verified`. Name the part, the
  manufacturer, and the datasheet revision.
- **Passive/active part values:** a property must trace to a named part +
  datasheet, not a vague "a resistor".
- **Safety and code:** anything touching mains, protection, or grounding must
  cite the governing code clause (e.g. NEC article). Design margins must be
  stated, not assumed.
- **Standards:** verify the standard exists and read the actual clause before
  summarizing it. Cite clause numbers, not just the standard number.
- **Calculations:** show formula, inputs, and units (impedance, power, gain,
  bandwidth) so the check can be re-run.

## Deliverable shape

Follow the method's artifact contract. In the final artifact, end with a
**Sources** section citing standard + clause, and datasheet + revision for
every part value, marking each `verified`, `inferred`, or `blocked`.
