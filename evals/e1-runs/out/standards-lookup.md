## Retrieval Summary
- Standard: ACI 318 (ACI CODE-318-19; cross-checked against ACI CODE-318-25)
- Edition: 318-19 (IBC 2021) and 318-25 (IBC 2024)
- Sections: §21.2.1, Table 21.2.1; §21.2.2, Table 21.2.2; §21.2.2.2; §21.2.3; §22.2.4
- Access: retrieved (full code text, Ch. 21)
- Jurisdiction assumed: US buildings

## Provision
There is no single φ "for the tendon." The governing value follows the section action and the strain classification:

- **Flexure/moment:** §21.2.2 requires εty = 0.002 for *all* prestressed reinforcement. Tension-controlled (εt ≥ 0.005) → φ = 0.90. Compression-controlled → 0.65 (other transverse reinforcement) or 0.75 (spiral). Transition: φ = 0.65 + 0.25(εt − 0.002)/0.003.
- **Shear and torsion:** φ = 0.75 (Table 21.2.1(b),(c)).
- **Post-tensioned anchorage zones:** φ = 0.85 (Table 21.2.1(e)).
- §21.2.3's reduced φ = 0.75 near member ends applies to **pretensioned** strands only; it does not govern post-tensioned tendons.
- Chapter 21 makes no bonded/unbonded distinction for φ. For unbonded tendons, εt is not taken from plane-section compatibility; it follows from the §20.3.2.4 fps equations applied per §22.2.4.2.
- ACI 318-25 keeps these values; its new φ cap in §21.2.2.3 applies to *nonprestressed* members.

## Obligation level
Shall (mandatory).

## Applicability check
Typical bonded or unbonded PT slabs and beams are tension-controlled, so φ = 0.90 governs. Confirm εt at the section; anchorage-zone φ = 0.85 applies to the zone, not the tendon.

## Conflicts / cross-checks
Bridges designed to AASHTO LRFD use different resistance factors — ACI 318 does not govern there.

## Provenance
- ACI CODE-318-19, §21.2.1–21.2.3, Tables 21.2.1–21.2.2 (ACI, 2019); ACI CODE-318-25, same sections (ACI, 2025).
- Access: full-text retrieval, 8 Nov 2026.
- Warnings: ACI documents are copyrighted; verify clause numbers in your licensed edition before design use. Research-only, not for final engineering sign-off.
