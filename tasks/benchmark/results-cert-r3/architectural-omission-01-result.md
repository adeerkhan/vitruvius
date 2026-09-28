## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: omission | CONFIDENCE: 0.95 | CHECKS_PASSED: 3/8 | LINE_PINNED: 3/3

## Findings

### Checks that passed
1. **Code/standard applicability** — IBC 2021 is the correct standard for building construction type and fire-resistance ratings in the US.
2. **Units and signs** — No unit errors; fire-resistance ratings are expressed in hours consistently.
3. **Source-to-claim fidelity** — Evidence 1 (IBC 602) does state Type V-B has no required fire-resistance rating for structural elements. The conclusion accurately quotes this.

### Issues found

**P0 — Omission of governing fire-wall requirement (BLOCKING):**
The conclusion cites IBC 602 (construction type) but completely omits IBC 706 (fire walls), which is the governing provision for walls separating buildings. Evidence 2 explicitly states: "Fire walls shall have a fire-resistance rating of not less than 2 hours where separating buildings on the same lot, or 3 hours where used as a party wall between separate lots." The research question asks about a wall separating two distinct buildings — this is precisely the IBC 706 scope. The conclusion's assertion that "the separating wall does not need a fire-resistance rating" is directly contradicted by Evidence 2.

**P0 — Citation entailment failure:**
The conclusion does not follow from the cited evidence. Evidence 1 addresses structural element ratings within a single building's construction type — it does not address the rating of a wall *between* buildings. The leap from "Type V-B has no required rating for structural elements" to "the separating wall needs no rating" is an entailment failure: IBC 602 governs construction classification; IBC 706 governs fire walls between buildings.

**P1 — Omission of occupancy separation:**
Evidence 3 (IBC 508.4) requires a minimum 1-hour occupancy separation between Group B (office) and Group M (retail) when on the same lot. The conclusion does not address this additional requirement.

**P1 — Unsubstantiated adequacy claim:**
The conclusion asserts "Standard wood-frame construction with gypsum board finish is adequate" — no evidence item supports this specific assembly claim. This is an unsupported assertion.

## Corrected Conclusion

The wall separating a 2-story Type V-B office building from an adjacent 3-story Type V-B retail building must comply with IBC 706 fire-wall requirements: minimum 2-hour rating if on the same lot, 3-hour rating if a party wall between separate lots. Additionally, if both occupancies are on the same lot, IBC 508.4 requires a minimum 1-hour occupancy separation between Group B and Group M. The Type V-B "no rating" provision in IBC 602 applies to structural elements within a building, not to fire walls separating buildings.

## Evidence Trail (Line-Pinned)

| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | Type V-B has no required rating for structural elements | IBC 2021 §602.1 | Evidence 1 | Accurate but misapplied — does not govern inter-building walls |
| 2 | Fire walls between buildings require 2-hr (same lot) or 3-hr (party wall) | IBC 2021 §706.2 | Evidence 2 | Directly contradicts conclusion — omitted entirely |
| 3 | 1-hr occupancy separation required between Group B and Group M | IBC 2021 §508.4 | Evidence 3 | Additional requirement not addressed |