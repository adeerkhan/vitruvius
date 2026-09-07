---
name: proposal
description: >
  Research Proposal Generator — orchestrates the full pipeline from CV/Personal
  Statement to a humanized, verified research proposal for Ph.D./Masters
  applications. Wraps /gap-analysis, /evidence-ranking, /verifier, and /humanizer
  as isolated subagents. Use when the student invokes /proposal, asks to generate
  a research statement, or wants to apply for a funded position. Outputs a layered
  binder with all backing artifacts.
argument-hint: "<goal-or-topic> [--cv <path>] [--statement <path>] [--sample <path>]"
allowed-tools: Write Edit Bash Read
license: MIT
---

# Research Proposal Generator

Generate a complete research proposal package for Ph.D./Masters applications.
This skill orchestrates multiple subagents in isolation, verifies outputs, and
produces a humanized final proposal with full audit trail.

## Invocation

```
/proposal <goal-or-topic> [--cv <path>] [--statement <path>] [--sample <path>]
```

- **goal-or-topic**: research area or specific lab/professor being targeted
- **--cv**: path to student's CV (PDF)
- **--statement**: path to personal statement (optional, used for voice matching)
- **--sample**: path to separate writing sample (optional, used for voice matching)

## Workflow (Execute in Order)

### Phase 0 — Intake & Context Engineering (LLM executes, logs to provenance)

1. **Create project folder**: `projects/<student-slug>/`
   ```bash
   node skills/proposal/scripts/init-project.mjs <student-slug>
   ```

2. **Parse CV PDF** → raw text:
   ```bash
   node skills/proposal/scripts/parse-cv.mjs <student-slug> <cv-path.pdf>
   ```
   This saves raw text to `cv-raw.txt`. Then **LLM structures** this into:
   - Education (degrees, institutions, dates)
   - Research experience (projects, labs, durations)
   - Publications (titles, venues, DOIs if available)
   - Skills (technical, languages, tools)
   - Awards/honors
   - Target research interests (if stated)
   Save structured profile to `projects/<student-slug>/profile.json`

3. **Parse Personal Statement** (if provided):
   - Save as voice sample candidate (used in Phase 5)
   - Extract stated research interests, career goals

4. **Voice Sample** (for humanizer):
   - If `--sample` provided → use as voice sample
   - Else if personal statement provided → use as voice sample
   - Else → note "no voice sample, using default neutral voice"
   - Save to `projects/<student-slug>/voice-sample.txt`
   - **Do NOT search web for student writing** — student provides all materials

5. **Load target lab/professor context** (if specified):
   - Search web for lab website, recent publications
   - Extract research focus, ongoing projects, stated open problems
   - Save to `projects/<student-slug>/target-context.json`

**Phase 0 Provenance**: Log all inputs (CV path, statement path, sample path) and outputs (profile.json, voice-sample.txt, target-context.json) to `projects/<student-slug>/phase-0-provenance.md`

### Phase 1 — Gap Analysis (STRICT Isolation)

**Dispatch `/gap-analysis` as isolated subagent** — **fresh context, receives ONLY:**
- Research goal/topic (string)
- Discipline (inferred or asked)
- `--deep` flag

**Does NOT receive:** student CV, personal statement, target context, or any prior reasoning.

Outputs saved to `projects/<student-slug>/gap-analysis/`:
- `<slug>.md` — gap dossier
- `<slug>.provenance.md` — provenance sidecar

**Non-negotiable boundaries for gap-analysis subagent:**
- NEVER fabricate a DOI. Verify every DOI via https://doi.org/<doi> before writing.
- NEVER invent a statistic. If a source says "high accuracy," quote "high accuracy," not "95%."
- NEVER present an inferred claim as validated. Mark all inferences as `[inferred]`.
- Every gap claim MUST have a direct quote from a cited source.
- If a source cannot be verified via doi.org, DROP it or flag as "verified via citing-chain only."

**Phase 1 Provenance**: Subagent logs all search queries, hit counts, and DOI verification results to `<slug>.provenance.md`.

### Phase 2 — Evidence Ranking (STRICT Isolation)

**Dispatch `/evidence-ranking` as isolated subagent** — **fresh context, receives ONLY:**
- Path to gap dossier file
- Path to gap provenance file (source list)

**Does NOT receive:** student CV, personal statement, target context, or any prior reasoning.

Outputs saved to `projects/<student-slug>/evidence-ranking/`:
- `<slug>.md` — scored evidence table

**Non-negotiable boundaries:**
- NEVER fabricate a citation count. Verify via OpenAlex API if claiming "X cites."
- NEVER assign Tier 1 unless the source is a standard/code or has >500 cites with direct gap relevance.
- Tier 4 sources MUST be flagged as "rejected for primary use."

**Phase 2 Provenance**: Subagent logs all tier assignments and scoring rationale to `<slug>.md`.

### Phase 3 — Verification (STRICT Isolation)

**Dispatch `/verifier` as isolated subagent** — **fresh context, receives ONLY:**
- Research question (string)
- Path to evidence items file
- Path to claimed conclusion file (the 4 gaps)

**Does NOT receive:** gap-analysis reasoning, student CV, personal statement, or proposal draft.

Outputs saved to `projects/<student-slug>/verifier/`:
- `<slug>-verdict.md` — verifier verdict

**If verdict is PARTIAL or BLOCKED:**
1. Read the named flaws
2. Fix ONLY the named issues (do not rewrite the entire dossier)
3. Re-run `/verifier` on the corrected conclusion
4. Repeat until PASS or acceptable PARTIAL (no critical flaws)

**Phase 3 Provenance**: Verdict file includes MACHINE_VERDICT line with all check results.

### Phase 4 — Proposal Writing (STRICT Isolation)

**Dispatch proposal writer subagent** — **fresh context, receives ONLY:**
- Path to student profile (profile.json)
- Path to verified gap dossier (from Phase 1, corrected)
- Path to evidence table (from Phase 2)
- Path to target lab context (target-context.json, if any)

**Does NOT receive:** gap-analysis reasoning, verifier deliberation, or any prior subagent context.

**Proposal structure (1-2 pages narrative):**

```
# Research Proposal: [Specific Topic]

## Motivation
[Why this matters — connect to safety/economic/societal stakes. Use student's
own experience from CV to ground this.]

## Research Gaps
[State 3-4 gaps concisely, each with a cited source. Reference the detailed
gap analysis in Appendix A.]

## Proposed Research
[3-5 concrete research questions, each mapping to a gap. Show how the student's
background positions them to tackle these.]

## Fit with [Lab/Professor Name]
[Specific connections to the target lab's work. Reference their recent papers.]

## References
[Key citations — full references in Appendix B]
```

Save to `projects/<student-slug>/proposal-draft.md`

### Phase 5 — Humanization (STRICT Isolation)

**Dispatch `/humanizer` as isolated subagent** — **fresh context, receives ONLY:**
- Path to proposal draft (proposal-draft.md)
- Path to voice sample (voice-sample.txt, if available — else note "use default neutral voice")

**Does NOT receive:** gap dossier, evidence table, verifier verdict, student CV, or any prior reasoning.

**Humanizer scope:** Final proposal only (Phase 4 output). Leave gap analysis,
evidence table, and verifier verdict as technical reference documents.

**Voice matching:** If voice sample exists, humanizer matches:
- Sentence length variation
- Word choice patterns
- Punctuation habits (dashes, semicolons)
- Openings and transitions

Save to `projects/<student-slug>/proposal-final.md`

**Phase 5 Provenance**: Log voice sample source (provided file vs default) and humanizer patterns applied to `phase-5-provenance.md`.

### Phase 6 — Binder Assembly

**Create the final binder** — layered document:

```
# Research Proposal: [Topic]
**Student:** [Name from CV]
**Target:** [Lab/Professor/School]
**Date:** [Today]
**Slug:** [student-slug]

---

## Executive Summary
[Copy of humanized proposal — this is the primary document the student submits]

## Appendices

### Appendix A: Gap Analysis
[Link to gap-analysis/<slug>.md]

### Appendix B: Evidence Ranking
[Link to evidence-ranking/<slug>.md]

### Appendix C: Verdict
[Link to verifier/<slug>-verdict.md]

### Appendix D: Researcher Profile
[Link to profile.json]

### Appendix E: Provenance
[Link to gap-analysis/<slug>.provenance.md]
```

Save to `projects/<student-slug>/binder.md`

Also save a provenance sidecar to `projects/<student-slug>/binder.provenance.md`
documenting every subagent dispatch, all sources accessed, and all artifacts
generated.

## Non-Negotiable Boundaries (Apply to All Subagents)

1. **NEVER fabricate a DOI.** Verify via https://doi.org/<doi> before writing.
   Unresolvable DOI → drop the source or flag as "citing-chain only."

2. **NEVER invent a statistic.** "High accuracy" in a source stays "high accuracy"
   in the output. No converting qualitative to quantitative without evidence.

3. **NEVER present an inferred claim as validated.** Use `[inferred]` tag.
   Confidence levels must reflect evidence quality.

4. **NEVER let the verifier see the author's reasoning.** Independence is the
   entire point.

5. **NEVER skip the humanization step.** Raw LLM output goes through /humanizer.

6. **NEVER let subagents share verdict channels.** Concurrent reviewers must not
   see each other's outputs before reporting.

## Output Artifacts

```
projects/<student-slug>/
├── profile.json                    # Structured CV extraction
├── voice-sample.txt               # Writing sample (or note if none found)
├── target-context.json            # Target lab/professor context (if specified)
├── gap-analysis/
│   ├── <slug>.md                  # Gap dossier
│   └── <slug>.provenance.md       # Provenance sidecar
├── evidence-ranking/
│   └── <slug>.md                  # Scored evidence table
├── verifier/
│   └── <slug>-verdict.md          # Verifier verdict
├── proposal-draft.md              # Raw proposal (pre-humanization)
├── proposal-final.md              # Humanized proposal
├── binder.md                      # Layered binder (final output)
└── binder.provenance.md           # Full audit trail
```

## Scope and Boundaries

- This skill generates research proposals for academic applications.
- **Research-only, not for final submission without student review.** The student
  MUST review, fact-check, and personalize the output before submission.
- The agent does not guarantee admission. It guarantees a structured, verified,
  humanized proposal with full provenance.
- Fail-closed: if any phase fails, stop and report the blocker. Do not proceed
  with unverified claims.

## What to Steal from Reference Systems

| Pattern | Source | How /proposal Uses It |
|---------|--------|----------------------|
| Subagent isolation | autoprompt-skill | Each phase runs in fresh context, hands off via files |
| Non-negotiable boundaries | scientific-agent-skills | Hard "NEVER" rules enforced at every phase |
| Voice matching | humanizer | Matches student's own writing style |
| Receipts reconciliation | autoprompt-skill | Every search/query logged in provenance |
| Ledger-first audit | feynman | binder.provenance.md records every action |
