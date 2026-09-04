# Case 06: Conflicting standards not resolved (conflicting_standard)

- **Discipline:** civil
- **Difficulty:** medium
- **Flaw type:** conflicting_standard
- **Ground-truth verdict:** PARTIAL
- **Baseline expected:** single-agent usually PASS, self-review usually PASS

## Question

A steel pedestrian bridge girder is designed per AASTO LRFD. What is the
minimum live load deflection limit for a pedestrian bridge?

## Context

The researcher found AASTO LRFD §A2.5.2.6.2 (pedestrian bridges) and IBC
§1604.3 (deflection limits). Both apply to the project. The researcher
followed AASTO without noting the IBC conflict.

## Claimed conclusion

"Per AASTO LRFD §A2.5.2.6.2: pedestrian bridge live load deflection limit
is L/360. The girder deflection is L/400, which satisfies the requirement.
The design is adequate."

## Evidence gathered

- **AASTO LRFD §A2.5.2.6.2 (Pedestrian bridges):** Live load deflection limit = L/360.
- **IBC §1604.3 (Deflection limits):** Live load deflection limit = L/360 for floors, but pedestrian bridges under IBC jurisdiction may require L/800 for "brittle" finishes or occupant comfort per local amendments.
- **Local jurisdiction note:** The project is in California, where the CBC (California Building Code) adopts IBC with amendments that require L/500 for pedestrian bridges per DSA/OSHPD guidelines.

## Ground-truth reasoning

The researcher followed AASTO LRFD (L/360) without noting that IBC/CBC may
apply a stricter limit (L/500 in California) for the same pedestrian bridge.
Both standards are potentially applicable — AASTO for bridge design, IBC/CBC
for building-code compliance. The researcher should have: (a) reported both
limits, (b) identified which the project specification designates as
governing, and (c) checked the stricter limit (L/500). The conclusion
"adequate" is correct under AASTO but may be wrong under IBC/CBC. The
verdict is PARTIAL — the AASTO check is correct but the conflict is
unresolved and the stricter limit was not verified.

## False approval description

A PASS verdict means the verifier missed that two applicable standards give
different answers and the researcher silently followed the less restrictive
one. In a jurisdiction that enforces the stricter IBC/CBC limit, the bridge
would be non-compliant despite satisfying AASTO.
