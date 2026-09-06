# Plan — Joining Method for AM Ti-6Al-4V to Wrought Ti-6Al-4V in Aerospace

## Comparison Set
Joining methods for dissimilar-process Ti-6Al-4V joints (LPBF/SLM/EBM AM build → wrought plate/forging/billet) in primary or secondary aerospace structure.

## Alternatives Selected (4)
1. Linear friction welding (LFW) — solid-state
2. Friction stir welding (FSW) — solid-state
3. Laser beam welding (LBW) — fusion (with HIP closure)
4. Diffusion bonding (DB) / DB+SPF — solid-state diffusion

Excluded from comparison: EBW (vacuum requirement prohibitive for large aerospace assemblies), adhesive bonding (creep/thermal limits under FAA fatigue-critical rules), mechanical fastening (adds weight and is a different design philosophy — referenced for context only), brazing (low joint efficiency for primary Ti structure).

## Dimensions (matrix columns)
- Approach summary
- Governing standards (AMS/AWS/ASTM/MIL-STD)
- Fatigue performance
- Joint efficiency (σ_ultimate / σ_base)
- Inspectability (NDE-friendly defects)
- Manufacturing complexity / process control
- Cost (relative, $/m or $/joint)
- Code acceptance (FAA/EASA pathway)

## Weights (per user spec)
- Fatigue performance: 0.25
- Joint efficiency: 0.20
- Inspectability: 0.15
- Manufacturing complexity: 0.10
- Cost: 0.15
- Code acceptance: 0.15
Total = 1.00

## Expected Output
- `outputs/design-alternatives/joining-am-to-wrought-ti6al4v.md` — full analysis with sources
- Inline summary in response
- `outputs/test-4-design-alternatives-report.md` — test report

## Boundary
S7 — research-only, not for final engineering sign-off.