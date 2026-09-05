---
name: audit
description: >
  Audit a claim, specification, or documented result against its implementation
  or source — paper-vs-code, spec-vs-design, datasheet-vs-application,
  standard-vs-as-built. Use when the user asks to audit, check consistency,
  find mismatches, or confirm that what was claimed matches what was actually
  done. Flags omissions, mismatches, ambiguous defaults, and reproduction
  risks.
argument-hint: "<what to audit>"
allowed-tools: Write Edit Bash Read
license: MIT
---

# Engineering Audit

Audit a claimed/specified behavior against its actual implementation or
source. This reuses the `engineering-research` discipline, focused on
consistency between two things.

## Workflow

1. **Outline the audit** — what is being compared (paper vs code, spec vs
   design, standard vs as-built, datasheet vs application), which claims to
   check, and the governing references. Write the plan to
   `outputs/.plans/<slug>.md`; briefly summarize and continue.
2. **Read both sides directly** — the claim AND the implementation/source.
   For code: read the actual code, not the README. For a standard: read the
   actual provision. Record versions/editions/commits.
3. **Compare claim-by-claim** — for each checked item record:
   - the claim (with its source location)
   - the actual behavior (with its location)
   - match / mismatch / missing / ambiguous
4. **Call out** — missing code or provisions, mismatched defaults, ambiguous
   parameters, claims that outrun the evidence, and reproduction risks.
5. **Save one audit report** to `outputs/<slug>-audit.md`, ending with a
   **Sources** section (paper + repo URL, spec + section, standard + edition).

Never conclude "consistent" from a skim. Every claim in the audit's verdict
must name the exact provision, line, or commit it was checked against.
