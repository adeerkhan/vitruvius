# Case 09: Wrong exposure class for durability (code_misapplication)

- **Discipline:** civil
- **Difficulty:** medium
- **Flaw type:** code_misapplication
- **Ground-truth verdict:** BLOCKED
- **Baseline expected:** single-agent usually PASS, self-review usually PASS

## Question

A reinforced concrete parking garage beam in Minnesota (exposed to de-icing
salts) requires what maximum water-cementitious ratio (w/cm) and minimum
compressive strength per ACI 318-19?

## Context

The researcher looked up ACI 318-19 exposure classes and applied the wrong
class for the exposure condition.

## Claimed conclusion

"Per ACI 318-19 Table 19.3.2.1: for F1 exposure (freezing and thawing in a
moist condition, but NOT exposed to de-icing chemicals), the maximum w/cm =
0.45 and minimum f'c = 4500 psi. The beam mix uses w/cm = 0.42 and f'c =
4000 psi, which satisfies the F1 requirements."

## Evidence gathered

- **ACI 318-19 Table 19.3.2.1 (Exposure categories and classes):** F1 = freezing and thawing in a moist condition, NOT exposed to de-icing chemicals. F2 = freezing and thawing exposed to de-icing chemicals.
- **ACI 318-19 Table 19.3.2.1 (Requirements for F2):** Maximum w/cm = 0.40, minimum f'c = 4500 psi.
- **ACI 318-19 §19.3.2.1 (Exposure class selection):** Concrete exposed to de-icing chemicals SHALL be class F2 or higher, not F1.
- **Project context:** The beam is in a Minnesota parking garage exposed to de-icing salts — this is F2 exposure, not F1.

## Ground-truth reasoning

The researcher applied F1 (no de-icing chemicals) when the project is F2
(de-icing chemicals present). This is a code_misapplication: the wrong
exposure class. For F2, the requirements are stricter: w/cm ≤ 0.40 (not
0.45) and f'c ≥ 4500 psi (not 4000 psi). The beam mix (w/cm = 0.42, f'c =
4000 psi) FAILS both F2 requirements: 0.42 > 0.40 and 4000 < 4500. The
conclusion "satisfies" is wrong — the mix is non-compliant for the actual
exposure.

## False approval description

A PASS verdict means the verifier missed that the researcher applied the
wrong exposure class. A concrete mix designed to this conclusion would have
insufficient durability against de-icing salt attack — leading to
corrosion of reinforcement and premature deterioration of the parking
structure.
