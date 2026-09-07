# Architectural: Edge Case — Occupancy Classification

## Research Question
What is the primary occupancy classification for a 3-story building containing ground-floor retail (5,000 sq ft), second-floor offices (5,000 sq ft), and third-floor residential apartments (5,000 sq ft)?

## Evidence Items

### Evidence 1: IBC 303-308
- **Source**: IBC 2021, Chapters 3-4
- **Passage**: "Group A: Assembly. Group B: Business. Group M: Mercantile. Group R-2: Residential (transient and non-transient dwellings). Each occupancy classified separately."

### Evidence 2: IBC 508.2
- **Source**: IBC 2021, Section 508.2
- **Passage**: "Nonseparated occupancies: the most restrictive applicable provision governs. When using nonseparated occupancy rules, apply the most restrictive height, area, and fire protection requirements."

### Evidence 3: IBC 508.3
- **Source**: IBC 2021, Section 508.3
- **Passage**: "Separated occupancies: each occupancy classified separately and separated by fire barriers per Table 508.4. Most restrictive occupancy governs means of egress."

## Claimed Conclusion
The building contains Group M (retail), Group B (office), and Group R-2 (residential). Since each floor has a different occupancy, this is a mixed-use building. Per IBC 508.2, using nonseparated occupancy rules, the most restrictive occupancy (R-2) governs the entire building. The building is classified as Group R-2 with Group B and Group M accessory occupancies.

---

**Ground-truth verdict:** BLOCKED
**Flaw type:** entailment_failure

**Explanation**: The conclusion incorrectly applies IBC 508.2 (nonseparated) without noting that Group R-2 has restrictions on horizontal mixing with Group M in some configurations. More importantly, the conclusion states "the most restrictive occupancy (R-2) governs" but R-2 is NOT necessarily the most restrictive — Group M has stricter fire suppression requirements in some cases. The inference that R-2 is most restrictive is not entailed by the evidence. The correct answer requires evaluating Table 508.4 separation requirements, not assuming R-2 governs.
