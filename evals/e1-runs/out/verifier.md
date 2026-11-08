## Verdict: BLOCKED

MACHINE_VERDICT: BLOCKED | FLAW: missing_artifact | CONFIDENCE: 0.0 | CHECKS_PASSED: 0/8 | LINE_PINNED: 0/0

**No claim and no standard were supplied.** The request names "a fatigue claim" and "the cited standard" but contains neither the claim text nor a citation. I will not invent an S-N curve, a detail category, or a clause to verify against.

## What I need (one round)

- **The claim as written:** stress range Δσ and units, cycle count N, material/grade, detail or joint category, and the acceptance criterion (e.g. Δσ at 2×10⁶ cycles, or damage sum ≤ 1.0).
- **The standard, identified:** designation, edition, and clause/table — e.g. AISC 360-22 §K, EN 1993-1-9 Table 8.1, BS 7608, IIW recommendations.
- **The artifact** the claim came from, if one exists.

## How the verdict gates

- **BLOCKED (P0)** — claim or governing clause unreadable, paywalled, or applied to the wrong detail category or edition.
- **PARTIAL** — directionally correct but a material qualification is unaddressed: wrong cycle regime below the constant-amplitude knee, unreduced stress range, missing partial factor, or a cited-but-unused second criterion. A material finding caps here; it is never softened to PASS.
- **PASS** — only if all 8 checks pass on opened, quoted text: correct standard and edition, correct detail category, unit/sign consistency, no omitted load case, correct factor, arithmetic re-derived, source-to-claim pinned to a location, and citation entailment holds.

## What would change the verdict

A pasted claim plus an identifiable clause I can open and quote. If the standard is paywalled, name it with edition — I will mark the provision blocked and assess only the claim's internal logic, labelled as conditional, not verified.

No source was read, so nothing here is verified.

Research-only, not for final engineering sign-off.
