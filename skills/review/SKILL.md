---
name: review
description: >
  Run a tough but constructive internal critique of an engineering artifact —
  a design, draft report, calculation set, specification, or research brief.
  Use when the user asks for a review, critique, feedback, or wants weaknesses
  found before something is finalized or submitted. Severity-graded findings
  with a concrete revision plan.
argument-hint: "<artifact to review>"
allowed-tools: Write Edit Bash Read
license: MIT
---

# Engineering Artifact Review

Run an adversarial review of an engineering artifact. This reuses the
`engineering-research` evidence discipline but the artifact is the subject,
not a question to research.

## Workflow

Follow the artifact contract: save findings to `outputs/<slug>-review.md`.

1. **Identify the artifact and its claims** — what is it (design, calc set,
   spec, brief, report), what does it claim, and what standard/code governs it?
2. **Verify the load-bearing items** — for a design: loads, factors, material
   properties, code sections, sign conventions. For a report: every number,
   figure, and citation. Check each against the primary source.
3. **Produce a severity-graded review**:
   - **FATAL** — unsafe, non-compliant, or unsupported; must fix before use
   - **MAJOR** — likely wrong or a real gap; fix before finalizing
   - **MINOR** — clarity, consistency, polish
   Each finding cites the specific section/line/claim it targets.
4. **Check what was NOT verified** — mark `blocked` where the source could not
   be read; never let a missing check read as a pass.
5. **Write a revision plan** — prioritized, concrete steps per finding.

## Output

Save exactly one review to `outputs/<slug>-review.md`:

- Summary assessment
- Strengths (tied to specific evidence)
- Findings (FATAL / MAJOR / MINOR, each anchored to a section/claim)
- Verification status (`verified` / `inferred` / `blocked` per load-bearing item)
- Revision plan

Do not praise vaguely. Do not predict "approval" — assess revision risk and
evidence quality.
