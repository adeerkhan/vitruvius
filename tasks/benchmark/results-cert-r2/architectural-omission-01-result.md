## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: omission | CONFIDENCE: 0.95 | CHECKS_PASSED: 0/8 | LINE_PINNED: 1/3

## Findings

### Checks that passed
None. The conclusion is contradicted by the evidence provided.

### Issues found

**1. Omission of governing provision in Evidence 1 (P0 — contradiction)**
Evidence 1 (IBC 602.1) states: *"Party walls between buildings under separate ownership shall be rated per Section 706."* The conclusion cherry-picks the second sentence of Evidence 1 ("Type V-B construction has no required fire-resistance rating for structural elements") while ignoring the first sentence, which explicitly requires party walls to be rated per Section 706. The conclusion is contradicted by the very evidence it cites.

**2. Omission of IBC 706.2 fire wall rating requirement (P0 — contradiction)**
Evidence 2 (IBC 706.2) requires fire walls to have a rating of *"not less than 2 hours where separating buildings on the same lot, or 3 hours where used as a party wall between separate lots."* The research question describes two adjacent buildings (office + retail), which are likely on separate lots/ownership — triggering the 3-hour party wall requirement. The conclusion asserts no rating is needed; Evidence 2 says 2–3 hours are required.

**3. Omission of IBC 508.4 occupancy separation (P1 — incomplete)**
Evidence 3 (IBC 508.4) requires a *"minimum 1-hour occupancy separation between Group B (office) and Group M (retail) when on the same lot."* Even if the buildings were on the same lot (not separate), a 1-hour separation is required. The conclusion ignores this entirely.

**4. Unsupported adequacy claim (P0 — synthesis_overreach)**
The conclusion asserts *"Standard wood-frame construction with gypsum board finish is adequate."* No evidence item supports this. Gypsum board assemblies can achieve fire ratings, but the conclusion provides no source showing that "standard" construction meets any required rating. This is an unverified assertion presented as fact.

**5. Source-to-claim fidelity failure**
The conclusion cites IBC 602 for the proposition that no rating is required. Evidence 1 does not support this — it says the opposite (party walls shall be rated per Section 706). The citation is used to support a claim the source contradicts.

## Corrected Conclusion

The separating wall between a 2-story Type V-B office building and an adjacent 3-story Type V-B retail building requires a fire-resistance rating. Per IBC 602.1, party walls between buildings under separate ownership shall be rated per Section 706. Per IBC 706.2, a party wall between separate lots requires a minimum 3-hour fire-resistance rating (or 2 hours if on the same lot). Additionally, per IBC 508.4, a 1-hour occupancy separation is required between Group B and Group M occupancies when on the same lot. Type V-B construction's lack of structural fire-resistance rating does not exempt the separating wall from these requirements.

## Evidence Trail (Line-Pinned)

| # | Finding | Source | Location (§/line) | Verdict on claim |
|---|---------|--------|-------------------|------------------|
| 1 | Type V-B has no structural fire-resistance rating | IBC 2021 | §602.1 | Misleading — ignores same-section party wall provision |
| 2 | Party walls shall be rated per Section 706 | IBC 2021 | §602.1 | Contradicts conclusion |
| 3 | Fire walls: 2-hr same lot / 3-hr party wall | IBC 2021 | §706.2 | Contradicts conclusion |
| 4 | 1-hr occupancy separation B/M same lot | IBC 2021 | §508.4 | Omitted by conclusion |
| 5 | "Standard wood-frame + gypsum is adequate" | None | N/A | Unsupported assertion |