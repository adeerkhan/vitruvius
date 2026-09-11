---
name: mechanical
description: >
  Mechanical engineering research. Use when the user invokes /mechanical,
  asks about mechanical engineering topics — machine design, mechanisms, power
  transmission, thermal/fluids, materials selection, manufacturing, pressure
  vessels, piping, fasteners, bearings, gears — or asks to verify an
  engineering claim in that domain. Dispatches to the shared
  engineering-research method with the mechanical evidence landscape.
argument-hint: "<research question> [--deep | --quick]"
allowed-tools: Write Edit Bash
license: MIT
metadata:
  version: "0.1.0"

---

# Mechanical Engineering Research

Activate the `/skill:engineering-research` method and run it with this
domain payload. Do not restate the research loop here.

## Evidence landscape

- **Standards/codes:** ASME (BPVC, B31 piping), ASTM, ISO, SAE, AWS, AGMA,
  API. When a code governs the question, cite the exact section.
- **Handbooks:** Machinery's Handbook, Marks', Shigley's, ASME/ASM
  handbooks — use only when a direct primary read is possible.
- **Primary sources:** manufacturer datasheets, bearing/coupling catalogs,
  material property data from the issuing body, patent documents, peer-
  reviewed journals. For journal literature use the
  `/skill:scholarly-research` discovery layers (OpenAlex, Semantic Scholar,
  arXiv).
- **Prior art / practice:** documented field failures, failure analyses,
  trade association guidance (e.g. ASME B31, AGMA, NFPA).

## Verification criteria

- **Units:** every number carries a unit; state the unit system (SI, US
  customary) and convert explicitly. Flag mixed-unit claims.
- **Sign conventions:** tension/compression, torque direction, load sign.
- **Material properties:** a property value must trace to a named grade +
  specification (e.g. A36 per ASTM A36), not to a vague "steel".
- **Design basis:** design factor / factor of safety must be stated and traced
  to code or practice (e.g. ASME BPVC design factor), not assumed.
- **Code provisions:** verify the standard exists, cite the section number,
  and read the actual provision before summarizing it.
- **Calculations:** any derived number must show the formula, inputs, and
  units so it can be re-run.

## Deliverable shape

Follow the method's artifact contract (`outputs/.plans/<slug>.md` → draft →
cited → final + `.provenance.md`). In the final artifact, end with a
**Sources** section citing standard + section, and mark every load, factor,
and material property `verified`, `inferred`, or `blocked`.

## Invocation Flags

Accept `--deep` and `--quick` flags and pass them through to the
`engineering-research` method. See that skill for flag semantics.

## Gap Detection

If research hits an evidence dead-end — no standard, paper, or dataset
addresses the question after exhausting the discovery layers — suggest running
`/gap-analysis mechanical <sub-topic>` to formally validate and document the
gap. Do not invoke gap-analysis automatically; offer it as a next step and
wait for the user to confirm.

## Scope and Boundaries

- This skill produces research — it does NOT produce final designs or construction documents.
- **Research-only, not for final engineering sign-off.** Licensed engineers must review and approve any design based on this research.
