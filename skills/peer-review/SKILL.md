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
  version: "0.1.0"

---

# Engineering Peer Review

Run an independent adversarial review of an engineering artifact. This skill reuses the `engineering-research` evidence discipline with a review-specific lens. The reviewer has NOT seen the author's reasoning — independence is the point.

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

3. **Produce severity-graded findings**:
   - **FATAL** — unsafe, non-compliant, or unsupported; must fix before use
   - **MAJOR** — likely wrong or a real gap; fix before finalizing
   - **MINOR** — clarity, consistency, polish
   - Each finding cites the specific section/line/claim it targets

4. **Check what was NOT verified** — mark `blocked` where the source could not be read. Never let a missing check read as a pass.

5. **Write a revision plan** — prioritized, concrete steps per finding.

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

## Scope and Boundaries

- This skill identifies issues — it does NOT approve or sign off. Final engineering sign-off requires a licensed engineer.
- **Research-only, not for final engineering sign-off.**
- Default-FAIL posture: every claim starts unverified, must be traced to source.
- Never soften a FATAL to MAJOR to avoid being harsh. Engineering accountability requires honest verdicts.
- Evidence quality: see `references/evidence-quality-tiers.md`.
