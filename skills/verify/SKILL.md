---
name: verify
description: >
  Verify an engineering claim, number, calculation, or design statement
  against authoritative sources. Use when the user asks "is this right", "check
  this claim", "verify this calculation", "does this meet code", or wants a
  number, material property, or provision confirmed against a standard,
  datasheet, or primary source. Produces a verdict with the evidence trail.
argument-hint: "<claim or calculation to verify>"
allowed-tools: Write Edit Bash Read
license: MIT
---

# Engineering Verification

Verify a specific claim or calculation against authoritative sources. This is
the `engineering-research` method scoped to a single, falsifiable question —
run it in direct mode unless the claim spans many sources.

## Workflow

Follow the artifact contract: save verification to `outputs/<slug>-verification.md`.

1. **Restate the claim precisely** — extract the exact number, unit, sign
   convention, and context. A claim without units or a named object (grade,
   part, code section) is not yet verifiable; ask for the missing pieces.
2. **Find the governing source** — the code/standard section, datasheet
   revision, material spec, or primary document that the claim depends on.
   Prefer the discipline lens's evidence landscape.
3. **Read the source directly** — do not verify from a snippet or memory.
   Record the exact provision, table value, or formula and its section + page.
4. **Re-run the math** — for calculations, recompute from the stated formula
   and inputs with units. Show the working so it can be checked.
5. **Verdict** — one of:
   - `verified` — the source directly supports the claim as stated
   - `contradicted` — the source directly contradicts it (quote the source)
   - `partial` — true with qualifications (edition, jurisdiction, condition)
   - `unverifiable` / `blocked` — no source, paywalled, or ambiguous
6. **Review** — check the verdict against the quoted source before delivery.

## Output

Save to `outputs/<slug>-verification.md`:

- the claim as restated
- the governing source (standard + section + edition, or URL/artifact)
- the quoted provision or computed working
- the verdict with reasoning
- what would change the verdict

Never soften a `contradicted` or `blocked` verdict to avoid disappointing.
