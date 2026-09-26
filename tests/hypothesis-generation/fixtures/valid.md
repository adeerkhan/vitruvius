# Hypothesis Generation: fatigue cracking at a welded bracket toe

## Observation (Frozen)
- **Date observed:** 2026-09-08
- **Phenomenon:** Through-thickness cracking initiated at the weld toe of a
  Ti-6Al-4V bracket within 4,000 cycles of a bench test that design analysis
  predicted would survive 50,000 cycles.
- **Distinguish:** measured vs inferred — the crack location and initiation
  cycle count are measured; the causal mechanism is inferred and not yet tested.
- **Context:** aerospace bracket, Ti-6Al-4V, room-temperature bench fatigue,
  constant-amplitude loading.

## Research Question
- **Question:** Which mechanism best explains early fatigue initiation at the
  weld toe under the observed constant-amplitude load?
- **Claim type:** causal

## Evidence Boundary
- **Search date:** 2026-09-08
- **Databases:** OpenAlex, arXiv, ASM Handbook (index only), vendor datasheets
- **Query terms:** "Ti-6Al-4V weld toe fatigue", "residual stress weld toe
  fatigue initiation", "undercut stress concentration fatigue"
- **Inclusion:** Ti alloys, welded joints, fatigue initiation
- **Exclusion:** steels, aluminium, corrosion-fatigue-only studies
- **Limitations:** no full text for two paywalled standards; no metallography
  available at the time of generation.

## Rival Hypotheses

### H1: Weld-toe stress concentration (geometric)
- **Mechanism:** An undercut/toe radius below the inspected limit concentrates
  strain above the nominal analysis value.
- **Prediction:** Measured toe radius < 0.5 mm; FEA with measured radius
  reproduces the initiation site.
- **Falsifier:** Toe radius within drawing tolerance and FEA still predicts
  initiation elsewhere.
- **Rival contrast:** H2 predicts initiation independent of local radius.

### H2: Tensile residual stress at the toe (process)
- **Mechanism:** Welding residual stress adds to the applied stress range,
  raising the effective R-ratio and crack-driving force.
- **Prediction:** X-ray diffraction shows toe residual stress well above base
  metal; stress-relieved coupons survive.
- **Falsifier:** Residual stress comparable to base metal and no life change
  after stress relief.
- **Rival contrast:** H1 predicts life change from geometry alone.

### H3: Microstructural embrittlement in the heat-affected zone (material)
- **Mechanism:** A coarse or transformed HAZ microstructure lowers fatigue
  crack initiation resistance at the toe.
- **Prediction:** HAZ hardness/microstructure differs from base metal;
  base-metal coupons outlive HAZ coupons under the same stress.
- **Falsifier:** HAZ microstructure and hardness match base metal; coupon lives
  are equal.
- **Rival contrast:** H1 and H2 predict a location effect that follows geometry
  or stress, not microstructure.

## Discriminating Tests
- **Test that separates H1 from H2:** measure toe radius and residual stress on
  the same coupons; a life change after stress relief isolates H2.
- **Test that separates H1 from H3:** machine matched coupons with the same
  geometry but base-metal microstructure; equal lives weaken H3.
- **Test that separates H2 from H3:** stress-relieve a subset; H3 predicts no
  life recovery.

## Pre-registration Record
- **Generated:** 2026-09-08T14:00:00Z
- **Status:** candidate (never scored/selected by tool)
- **Deviations:** none yet
- **S7 boundary:** Research-only; hypothesis selection requires human
  engineering judgment and is not for final engineering sign-off.
