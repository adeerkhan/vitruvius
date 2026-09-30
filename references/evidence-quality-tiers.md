# Evidence Quality Tiers

Shared reference for scoring engineering evidence quality. Used by all
research-producing skills in Vitruvius.

## Tier Definitions

### Tier 1 — Authoritative
- Standard or code provision (ASHRAE, ASME, ACI, AISC, IEEE, IEC, ISO, etc.)
- Government regulation or adopted building code
- Peer-reviewed source cited by standards or code commentaries
- High-impact verified source (>50 citations in engineering context)

**Weight: Highest.** These are the sources that govern engineering practice.

### Tier 2 — Reliable
- Peer-reviewed journal article with clear methodology
- Experimental data from named lab/protocol
- Validated computational model (FEA/CFD with verification)
- Official vendor datasheet with traceable test methods
- Established handbook (Marks', Shigley', Machinery's) when directly read

**Weight: High.** Solid primary evidence, but does not govern practice.

### Tier 3 — Supporting
- Conference paper or preprint (arXiv, engrXiv)
- Peer-reviewed paper tangential to the specific claim
- Well-cited trade publication with named author and date
- Manufacturer white paper with methodology section

**Weight: Medium.** Useful for context, not standalone proof.

### Tier 4 — Weak
- Vendor marketing material without test methods
- Low-citation paper (<5) with thin methodology
- Undated blog post or content aggregator
- Forum post without primary links
- Source that appears AI-generated with no primary backing

**Weight: Low.** Deprioritized; rejected if it is the only source for a claim.

## Engineering-Specific Weighting

When scoring evidence for an engineering claim, weight criteria in this order:

1. **Source tier** — Is it the governing standard or an authoritative source?
2. **Methodology** — Experimental data, validated models, formal proofs > surveys > opinions
3. **Citation authority** — Cited by standards, code commentaries, or high citation count
4. **Reproducibility** — Open data, open code, explicit methods enable re-verification
5. **Recency** — Within 10 years for fast-moving fields (software, AI); 20+ years acceptable for slow fields (structural, geotech)

## Usage in Research

- **Every claim must trace to at least one Tier 1 or Tier 2 source.**
- Tier 3 sources support but do not standalone critical claims.
- Tier 4 sources are rejected as primary evidence.
- When no Tier 1 or 2 source exists for a claim, mark it `blocked` or `unverified` — never downgrade the tier to force a pass.

## Integration Notes

Skills that use this reference:
- `engineering-research` — applies tiers during evidence gathering
- `gap-analysis` — scores edge papers during dossier construction
- `scholarly-research` — ranks paper results
- `verifier` — checks tier adequacy during claim verification
- `standards-lookup` — prioritizes Tier 1 sources
