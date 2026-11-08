# Eurocode vs AISC — "this connection"

**No connection detail was provided.** The request names no joint type, drawing, member sizes, fasteners, or loads, so a joint-specific comparison would require inventing the connection. What can be compared now is how the two codes frame connection design; the clause-level resistance checks need the missing detail.

**Editions to confirm first:**
- US: AISC 360-22 (referenced by IBC 2024); AISC 360-16 if the project is under IBC 2021.
- EU/UK: EN 1993-1-8:2024 is published, but first-generation EN 1993-1-8:2005 with its National Annex remains the applicable UK standard until withdrawal on 30 March 2028. National Annex NDPs (including γM2) are mandatory, not optional.

| Topic | AISC 360-22 | EN 1993-1-8 |
|---|---|---|
| Safety format | LRFD φRn ≥ Ru, or ASD | Rk/γM ≥ Ed; γM0, γM1, γM2 |
| Connection provisions | Ch. J: J1 general, J2 welds, J3 bolts/threaded parts, J4 affected elements, J5 fillers, J6 splices, J7 bearing, J8 column bases, J9 anchor rods, J10 concentrated forces; Ch. K for HSS | 2005: §3 bolts/rivets/pins, §4 welds, §5 analysis and classification, §6 H/I joints, §7 hollow sections. 2024 moves analysis and joints to §7–8 and adds Annex C (pinned connections) and Annex D (column bases) |
| Joint modelling | J1 requires the connection to support the analysis assumptions; no stiffness-classification scheme | §5.2 classifies nominally pinned, semi-rigid, or rigid by rotational stiffness Sj |
| Bolts | §J3: bearing versus slip-critical, pretension, spacing/edge distance, combined shear and tension; RCSC governs installation | §3.4 categories A–E; Table 3.3 spacing and edge distances; §3.6 individual fastener resistance |
| Welds | §J2 effective throat and weld strength; AWS D1.1 for procedure and qualification | §4 design resistance of fillet and groove welds, including the directional method |
| HSS | Chapter K | §7 |

**One question:** what is the connection — joint type, member sizes, bolt/weld callout, and governing editions plus National Annex? With that, the comparison can move to clause-level resistance equations for that joint.

*Research-only, not for final engineering sign-off.*
