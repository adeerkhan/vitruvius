---
name: verifier
description: >
  Engineering Verifier — verify a claim, calculation, or design statement
  against authoritative sources. Two modes: (1) direct verification — agent
  reads the source and judges the claim; (2) blind subagent — dispatched with
  fresh context, receives only question + evidence + conclusion, NO author
  reasoning. Blind mode is default for research outputs. Produces PASS /
  PARTIAL / BLOCKED with evidence trail. Default-FAIL: the verifier must find
  specific reasons the conclusion could be wrong; PASS must be earned.
argument-hint: "<claim or calculation> [--direct | --blind]"
allowed-tools: Write Edit Bash Read
license: MIT
---

# Engineering Verifier

Verify a claim, calculation, or design statement against authoritative sources.

## Invocation

```
/verifier <claim or calculation> [--direct | --blind]
```

- **`--direct`** — Agent reads the source directly and judges the claim. Use for
  single, focused questions ("is this right?", "check this calculation").
- **`--blind`** — Dispatched as isolated subagent with fresh context. Receives
  only: research question, evidence items (with source locations), claimed
  conclusion. Does NOT receive the reasoning that connected evidence to
  conclusion. Use after research produces a claim (gap analysis, design, etc.).

Default: `--blind` for research outputs, `--direct` for one-off questions.

## Mode 1: Direct Verification

Use when the user asks a focused verification question.

### Workflow

1. **Restate the claim** — extract the exact number, unit, sign convention, and
   context. A claim without units or a named object is not yet verifiable; ask.
2. **Find the governing source** — code/standard section, datasheet, material
   spec, or primary document. Prefer the discipline lens's evidence landscape.
3. **Read directly** — do not verify from a snippet or memory. Record the exact
   provision, table value, or formula and its section + page.
4. **Re-run the math** — for calculations, recompute from the stated formula and
   inputs with units. Show the working.
5. **Verdict** — `verified` / `contradicted` / `partial` / `unverifiable` / `blocked`
6. **Review** — check the verdict against the quoted source before delivery.

### Output (Direct)

Save to `outputs/<slug>-verification.md`:

- the claim as restated
- the governing source (standard + section + edition, or URL/artifact)
- the quoted provision or computed working
- the verdict with reasoning
- what would change the verdict

## Mode 2: Blind Subagent (Default for Research)

Use as an independent subagent after research produces a claim. The subagent
judges the claim on its merits WITHOUT seeing the author's reasoning.

### THE BLOCKED INVARIANT (non-negotiable)

Verification checks the REAL standard in its REAL context — NEVER fake a pass, NEVER
fabricate a citation, NEVER declare VERIFIED over an unverifiable or paywalled source. On
ANY blocker, STOP and report the attempt + the concrete unblock path, then return BLOCKED
as the honest verdict. BLOCKED is a legitimate outcome, not a failure. Stay in the closed
loop and resolve every open question through evidence — NEVER yield to the user with "I
can't verify this."

### Default-FAIL Posture

Every claim starts FAILED. PASS is earned only when ALL 8 checks pass on opened, quoted
evidence. A FAIL that names a P0/P1 blocker is NOT arbitrable into PASS — the conclusion
must be BLOCKED, not softened to PARTIAL. Your job is to find specific reasons the
conclusion could be wrong. When in doubt, return PARTIAL or BLOCKED.

### Adversarial Protocol (8 Checks)

Run these checks in order. For each, cite the specific evidence item or note its absence:

#### 1. Code/Standard Applicability
- Is the cited code/standard the right one for this domain and jurisdiction?
- Is the right chapter/section applied?
- Is the code edition current?
- Flag: `code_misapplication`

#### 2. Unit and Sign Conversions
- Are all units consistent (kips vs kN, in vs mm, psi vs ksi)?
- Are sign conventions and load directions correct?
- Flag: `unit_sign_error`

#### 3. Completeness — Omitted Governing Cases
- Were all required load combinations checked?
- Were stability, serviceability, durability checked?
- Flag: `omission`

#### 4. Missing Factors and Checks
- Was the correct resistance factor applied?
- Were material properties traced to a named grade + spec?
- Flag: `missing_factor`

#### 5. Calculation Integrity
- Re-derive any calculation from the stated formula, inputs, and units.
- Does the math hold?
- Flag: `calculation_error`

#### 6. Source-to-Claim Fidelity (Line-Pinned)
- Pin each claim to a specific line in the source evidence.
- Does the cited source actually support the specific claim at that line?
- Flag: `synthesis_overreach` if conclusion outruns what sources support.

#### 7. Conflict Check
- Do applicable standards give different answers?
- Flag: `conflicting_standard`

#### 8. Citation Entailment
- Does the cited passage actually entail the specific claim?
- Prompt: "Given only the cited section, does this conclusion follow?"
- Flag: `entailment_failure`

### Verdict (Blind)

Return one of:

- **PASS** — every load-bearing claim directly supported. All 8 checks pass.
- **PARTIAL** — directionally correct but needs named qualifications.
- **BLOCKED** — unsupported, contradicted, or based on clear error. Name the flaw.

### Output Format (Blind)

```
## Verdict: [PASS | PARTIAL | BLOCKED]

MACHINE_VERDICT: <verdict> | FLAW: <flaw_type_or_none> | CONFIDENCE: <0.0-1.0> | CHECKS_PASSED: <n>/8 | LINE_PINNED: <n>/<total_findings>

## Findings
### Checks that passed
### Issues found

## Corrected Conclusion
## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict on claim |
```

## Non-Negotiable Boundaries

- **NEVER fabricate a DOI.** Verify via https://doi.org/<doi> before writing.
- **NEVER invent a statistic.** Quote sources as-is.
- **NEVER present inferred claims as validated.** Mark `[inferred]`.
- **NEVER let the blind verifier see the author's reasoning.**
- **NEVER soften a BLOCKED into PARTIAL.**

## Scope and Boundaries

- This skill verifies claims against evidence — it does NOT produce final designs.
- **Research-only, not for final engineering sign-off.**
