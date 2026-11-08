# Research Gaps: FRP Bonding to Concrete in Civil Structures

**Civil · 2026-11-08 · 4 gaps, 3 tiers triangulated**

## What's Missing
1. **Load–environment coupling.** Bond is studied two axes at a time: moisture+sustained (Zhou 2017), freeze–thaw+sustained (Shi 2012), fatigue+hygrothermal (Zheng 2015). A fatigue+environment+bonding query returns 0 OpenAlex records; no test holds all three over a bridge's service life.
2. **Validated service-life model.** No multi-mechanism model converts accelerated bond ageing into field life. Arrhenius extrapolation is used although several competing processes violate its single-reaction assumption.
3. **Field data with baselines.** In-service bond measurements are sparse and rarely have pre-exposure baselines, so accelerated tests cannot be correlated with real exposure.
4. **Fire after ageing.** Residual bond of aged EB/NSM joints after fire is nearly unstudied; post-fire work targets bars and FRCM.

## Why It Matters
Debonding is sudden and non-ductile, yet design factors come from short-term, single-environment tests — under-design risks brittle failure, over-design wastes retrofit economics.

## Validation
- OpenAlex: coupled queries 0–2 hits, single-axis 9–69.
- arXiv: no relevant preprints (top hits: lattice corrosion, phase-field fatigue).
- Open-problem signals: NIST SP 1244 (2019) flags bond-lifetime prediction as unresolved; Tatar, *Polymers* 2021, calls for "multi-reaction deterioration models"; a US DOT study reports field bond retention below ACI 440.2R values.

## Key Papers
1. Zhou et al. 2017, doi:10.1016/j.cemconcomp.2017.03.019 — moisture+sustained; no cycling.
2. Zheng et al. 2015, doi:10.1016/j.conbuildmat.2015.07.172 — fatigue+hygrothermal; no sustained load.
3. Shi et al. 2012, doi:10.1061/(ASCE)CC.1943-5614.0000349 — freeze–thaw+sustained; no cycling.
4. Carloni et al. 2011, doi:10.1016/j.compstruct.2011.10.026 — fatigue cohesive model; no environment.
5. Al-Tamimi et al. 2014, doi:10.1061/(ASCE)MT.1943-5533.0001226 — harsh environments, static.

## Research Questions
1. What is bond capacity after 10⁷ cycles at 30–60% of static capacity under simultaneous sustained load and hygrothermal or alkaline exposure?
2. Can a multi-reaction model predict field bond retention from 6–12 months of accelerated data within ±15%?
3. What bond-specific environmental reduction factor should replace the FRP-material factor in ACI 440.2R and fib Bulletin 14?

## Confidence
**Medium-High.** Service-life and field-data gaps are strongly triangulated. Coupling rests on zero-hit queries and two-axis papers. Fire-after-ageing is weakest: thin, bar-level evidence.
