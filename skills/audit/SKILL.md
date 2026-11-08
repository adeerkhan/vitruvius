---
name: audit
description: >
  Audit a claim, specification, or documented result against its implementation
  or source — paper-vs-code, spec-vs-design, datasheet-vs-application,
  standard-vs-as-built. Use when the user asks to audit, check consistency,
  find mismatches, or confirm that what was claimed matches what was actually
  done. Flags omissions, mismatches, ambiguous defaults, and reproduction
  risks. The code, spec, or diff may be pasted inline: an inline pasted
  artifact is still an audit request.
argument-hint: "<what to audit>"
allowed-tools: Write Edit Bash Read
license: MIT
metadata:
  version: "0.1.3"

---
<!-- VITRUVIUS-COMPILED-SKILL:BEGIN v1 sha256=fcecb76083d67587a67bbb56a5b83a8529fa16e3e97d20fc41723f2b420465ed -->

# Engineering Audit

Audit a claimed/specified behavior against its actual implementation or
source. This reuses the `engineering-research` discipline, focused on
consistency between two things.

## Input Gate

Before searching, name the question, the artifact/scope (or say it is a
literature review), the jurisdiction/edition, and the effort budget (user-set or
thorough). Ask ONE clarifying question if the ask is too vague, then proceed.
See `references/input-gate.md`.

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
   Confirm each mismatch against the implementation itself before reporting
   it: a claim-level disagreement the code resolves is not a finding.
4. **Call out** — missing code or provisions, mismatched defaults, ambiguous
   parameters, claims that outrun the evidence, and reproduction risks. When
   a baseline exists, label a mismatch already present in it as pre-existing,
   not introduced by the change under audit. Zero mismatches is a valid
   report: state what was checked and found consistent — never invent a
   blocker to look thorough.
5. **Save one audit report** to `outputs/<slug>-audit.md`, ending with a
   **Sources** section (paper + repo URL, spec + section, standard + edition).

Never conclude "consistent" from a skim. Every claim in the audit's verdict
must name the exact provision, line, or commit it was checked against.

## Scope and Boundaries

- This skill produces research — it does NOT produce final designs or construction documents.
- **Research-only, not for final engineering sign-off.** Licensed engineers must review and approve any design based on this research.
