---
name: peer-review
description: >
  Run an adversarial peer review of an engineering research artifact — brief,
  report, calculation set, or design document. Use when the user asks for
  "peer review", "critical review", "find weaknesses", or wants an independent
  assessment before submission. Produces severity-graded findings with evidence
  trails and a revision plan. Do NOT use for final approval — this skill
  identifies issues, it does not sign off.
argument-hint: "<artifact to review>"
allowed-tools: Write Edit Bash Read
license: MIT
metadata:
  version: "0.1.5"

---
<!-- VITRUVIUS-COMPILED-SKILL:BEGIN v1 sha256=e8ba0a7b5fcf45352100679e140369df1408b5d905b406a5dfa84808a3c23e71 -->

# Engineering Peer Review

Run an independent adversarial review of an engineering artifact. This skill reuses the `engineering-research` evidence discipline with a review-specific lens. The reviewer has NOT seen the author's reasoning — independence is the point.

## Input Gate

Before searching, name the question, the artifact/scope (or say it is a
literature review), the jurisdiction/edition, and the effort budget (user-set or
thorough). Ask ONE clarifying question if the ask is too vague, then proceed.
See `references/input-gate.md`.

## Invocation

```
/peer-review <artifact description or path>
```

Attach or point to: research brief, design document, calculation set, or report.

## Methodology

1. **Identify artifact and claims** — what is it, what does it claim, what standard/code governs it? List every critical claim, number, and citation.

2. **Verify load-bearing items** — for each critical claim:
   - Trace to source (standard + section + line, or URL)
   - Re-derive any calculation from stated formula, inputs, and units
   - Check code/standard applicability (right domain? right edition? right jurisdiction?)
   - Confirm the source actually supports the claim at the pinned location

3. **Sweep the strength-side checks** — the routine, labor-intensive
   scrutiny the study credits AI reviewers with doing better than
   time-pressed humans (arXiv:2605.20668, S1/S4/S5):
   - **Numerical and methodological rigor (S1)** — data/sample independence
     behind each quantitative claim, calibration vs. validation splits,
     uncertainty reporting (error bars, tolerances, confidence).
   - **Internal consistency across sections (S4)** — summary numbers match
     the body, conclusions match results, units and notation agree wherever
     a value reappears.
   - **Reproducibility and dependencies (S5)** — could a reader rebuild the
     result from the stated inputs, versions, and editions? Name the missing
     piece.

   Report what each sweep cleared in **Strengths** — a clean sweep is a
   result, not the absence of findings.

4. **Produce severity-graded findings**:
   - **FATAL** — unsafe, non-compliant, or unsupported; must fix before use
   - **MAJOR** — likely wrong or a real gap; fix before finalizing
   - **MINOR** — clarity, consistency, polish
   - Each finding cites the specific section/line/claim it targets

   Every finding must be fully substantiated — a location you read plus
   evidence that supports it. An empty tier is a valid result: write `none`
   rather than padding to a count.

   Ground severity in the artifact's own claims and stated limitations: a
   step it never claimed to take is a scope note, not a FATAL. For a FATAL,
   state the strongest defense and the evidence that rules it out — a FATAL
   without a refuted defense is a suspicion, not a FATAL.

5. **Check what was NOT verified** — mark `blocked` where the source could not be read. Never let a missing check read as a pass.

6. **Write a revision plan** — prioritized, concrete steps per finding.

## Output

### Inline Summary (chat response)
- Artifact scope and claim count
- FATAL / MAJOR / MINOR counts
- Top 3 issues with evidence trails
- Overall revision risk assessment

### Full Review (saved to disk)

Save to `outputs/peer-review/<slug>.md`:

```markdown
# Peer Review: <artifact>

## Summary Assessment
- **Artifact type:** <brief/design/calc set/report>
- **Claims reviewed:** <count>
- **FATAL:** <count> | **MAJOR:** <count> | **MINOR:** <count>
- **Revision risk:** low / medium / high

## Strengths
- <tied to specific evidence>

## Findings

### FATAL

#### F1: <title>
- **Location:** <section/line>
- **Issue:** <specific problem>
- **Evidence:** <source that contradicts or gap>
- **Fix:** <concrete action>

### MAJOR

#### M1: <title>
- **Location:** <section/line>
- **Issue:** <specific problem>
- **Evidence:** <source>
- **Fix:** <concrete action>

### MINOR

#### m1: <title>
- **Location:** <section/line>
- **Issue:** <specific problem>
- **Suggestion:** <improvement>

## Verification Status
- **Verified:** <count> claims traced to source
- **Blocked:** <count> claims (source unreachable)
- **Unverified:** <count> claims (default, not yet checked)

## Revision Plan
1. <FATAL fix — highest priority>
2. <FATAL fix>
3. <MAJOR fix>
4. <MINOR fix — if time permits>

## Evidence Trail (Line-Pinned)
| # | Finding | Source | Location (§/line) | Verdict |
|---|---------|--------|-------------------|---------|
| 1 | <flaw> | <source> | <§section or line> | contradicts / partially supports / missing |
```

Write `outputs/peer-review/<slug>.provenance.md` beside the review (sources consulted, accepted, and rejected; verification status). Minimal shape: `references/provenance-sidecar.md`.

## Scope and Boundaries

- This skill identifies issues — it does NOT approve or sign off. Final engineering sign-off requires a licensed engineer.
- **Research-only, not for final engineering sign-off.**
- Default-FAIL posture: every claim starts unverified, must be traced to source.
- Never soften a FATAL to MAJOR to avoid being harsh. Engineering accountability requires honest verdicts.
- Evidence quality: see `references/evidence-quality-tiers.md`.
