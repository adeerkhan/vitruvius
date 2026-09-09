---
name: proposal
description: >
  Research Proposal Generator — orchestrates the full pipeline from position
  posting + CV + Personal Statement to a humanized, verified research proposal
  for Ph.D./Masters applications. Parses position postings (PDF/image/URL),
  researches professor/lab, identifies lab-specific gaps, and generates a
  targeted proposal with deep fit analysis. Wraps /gap-analysis,
  /evidence-ranking, /verifier as isolated subagents.
argument-hint: "[--posting <path-or-url>] [--cv <path>] [--statement <path>] [--sample <path>]"
allowed-tools: Write Edit Bash Read
license: MITmetadata:
  version: "0.1.0"

---

# Research Proposal Generator

Generate a complete research proposal package for Ph.D./Masters applications.
This skill orchestrates multiple subagents in isolation, verifies outputs,
produces a humanized final proposal with full audit trail, and targets the
specific lab/professor from the position posting.

## Invocation

### CLI

```
/proposal --posting <path-or-url> --cv <path> [--statement <path>] [--sample <path>]
```

- **`--posting`**: Position posting as PDF file, image file (screenshot), or URL
- **`--cv`**: Path to student's CV (PDF)
- **`--statement`**: Path to personal statement (optional, used for voice matching)
- **`--sample`**: Path to separate writing sample (optional, used for voice matching)

### Desktop Apps (Claude Desktop, Cursor, Windsurf, etc.)

Attach files through the harness UI (drag-and-drop, file picker, or @file reference). The harness makes attached files available as paths. Then invoke:

```
/proposal --posting <attached-path> --cv <attached-path> [--statement <attached-path>]
```

The skill receives file paths in both cases — it does not matter whether the files came from CLI arguments or desktop attachments. The harness is responsible for making attached files accessible at readable paths.

**Examples:**
- **CLI**: `/proposal --posting ./posting.pdf --cv ./cv.pdf --statement ./statement.pdf`
- **Claude Desktop**: Attach `posting.pdf`, `cv.pdf`, `statement.pdf` → `/proposal --posting /tmp/claude-xyz/posting.pdf --cv /tmp/claude-xyz/cv.pdf`
- **Cursor**: `@posting.pdf @cv.pdf` → skill receives resolved paths

## Workflow (Execute in Order)

### Phase 0 — Intake & Context Engineering

**0a. Create Project Folder**
```bash
node skills/proposal/scripts/init-project.mjs <student-slug>
```

**0b. Parse Documents (STRICT Isolation via Artifact-Reading Subagent)**

Dispatch `/skill:artifact-reading` as isolated subagent — **fresh context, receives ONLY:**
- Path to position posting (if `--posting` provided)
- Path to CV (if `--cv` provided)
- Path to personal statement (if `--statement` provided)
- Path to writing sample (if `--sample` provided)

**Does NOT receive:** any prior reasoning, target context, or other project files.

Artifact-reading subagent:
1. For each file, runs `node scripts/extract-document.mjs <path>`
2. Extracts structured content (markdown, pages, method used)
3. If method is `vision`, uses LLM vision to extract text
4. Returns structured content with sections and provenance

**Output saved by subagent:**
- `posting.json` — structured position posting data:
  ```json
  {
    "professor": { "name": "...", "title": "...", "email": "..." },
    "university": "Georgia Tech",
    "department": "School of Building Construction",
    "lab": { "name": "...", "url": "..." },
    "position": { "type": "PhD", "funding": "...", "start": "Spring 2027" },
    "research": { "areas": ["..."], "keywords": ["..."], "description": "..." },
    "requirements": { "required": ["..."], "preferred": ["..."] },
    "contact": { "email": "...", "url": "..." },
    "deadline": "...",
    "raw_text": "..."
  }
  ```
- `profile.json` — structured CV data
- `voice-sample.txt` — writing sample for humanizer

**0c. Voice Sample**
- `--sample` > `--statement` > default neutral voice
- Save to `voice-sample.txt`

**0c. Research Professor/Lab (NEW)**
```bash
node skills/proposal/scripts/research-professor.mjs <slug>
```
- Generates search plan in `professor-search-plan.txt`
- LLM executes web searches:
  - "[professor] [university] lab research"
  - "[professor] recent papers 2024 2025 2026"
  - "[lab name] projects"
  - Fetches lab website if found
- LLM saves structured research to `professor-research.json`:
  ```json
  {
    "professor": { "name": "...", "title": "...", "profile_url": "..." },
    "lab": { "name": "...", "url": "...", "description": "...", "members": [...] },
    "recent_papers": [{ "title": "...", "year": 2024, "doi": "...", "key_contribution": "..." }],
    "research_focus": ["..."],
    "ongoing_projects": ["..."],
    "sources_consulted": ["..."]
  }
  ```

**0d. Provenance**
Log all inputs, extractions, and research queries to `phase-0-provenance.md`

### Phase 1 — Gap Analysis (STRICT Isolation, Enhanced)

**Before dispatching:** LLM reads `posting.json` and `professor-research.json` (if they exist). Extracts:
- Research areas and keywords from posting
- Professor's recent papers and research focus from professor-research
- Lab's ongoing projects and techniques

**Dispatch `/gap-analysis` as isolated subagent** — **fresh context, receives ONLY:**
- Research goal/topic (extracted from posting/professor research)
- Discipline (inferred or asked)
- `--deep` flag
- Text summary of lab research context (extracted from files, not file paths)

**Does NOT receive:** file paths, student CV, personal statement, or any prior reasoning.

**Gap analysis produces:**
- **General gaps**: Field-level research gaps (as before)
- **Lab-specific gaps**: Gaps aligned with the lab's ongoing work
  - Areas where lab has active projects but unresolved questions
  - Techniques the lab uses but hasn't applied to new problems
  - Adjacent areas the lab could expand into

Outputs saved to `projects/<student-slug>/gap-analysis/`:
- `<slug>.md` — gap dossier (general + lab-specific)
- `<slug>.provenance.md` — provenance sidecar

**Non-negotiable boundaries:**
- NEVER fabricate a DOI. Verify via https://doi.org/<doi> before writing.
- NEVER invent a statistic. Quote sources as-is.
- NEVER present inferred claims as validated. Mark `[inferred]`.
- NEVER fabricate lab details. If not found in research, mark "not found".

### Phase 2 — Evidence Ranking (STRICT Isolation)

**Dispatch `/evidence-ranking` — receives ONLY:**
- Path to gap dossier file
- Path to gap provenance file

Output: `evidence-ranking/<slug>.md`

### Phase 3 — Verification (STRICT Isolation)

**Dispatch `/verifier` — receives ONLY:**
- Research question (string)
- Path to evidence items file
- Path to claimed conclusion file

Output: `verifier/<slug>-verdict.md`

**If PARTIAL or BLOCKED:** Fix named issues, re-verify until PASS.

### Phase 4 — Proposal Writing (STRICT Isolation, Enhanced)

**File availability:**
- **Required:** `profile.json` (from CV), gap dossier, evidence table
- **Optional:** `posting.json` (from `--posting`), `professor-research.json` (from web research)

**Dispatch proposal writer — receives ONLY:**
- Path to student profile (profile.json) — REQUIRED
- Path to verified gap dossier — REQUIRED
- Path to evidence table — REQUIRED
- Path to posting.json (if exists) — OPTIONAL
- Path to professor-research.json (if exists) — OPTIONAL

**If optional files missing:** Proposal adapts — general field proposal without lab-specific fit section. Still functional, less targeted.

**Proposal structure (adapts to available files):**

```markdown
# Research Proposal: [Specific Topic]
**Target:** [Professor Name or "Engineering Research"], [University or "Target Institution"]
**Position:** [PhD/MS] starting [Date or "Fall 2027"]

## Motivation
[Field-level motivation, grounded in student's CV experience]

## Research Gaps
### General Gaps
[2-3 field-level gaps with citations]

### Lab-Specific Opportunities (IF posting.json + professor-research.json available)
[1-2 gaps aligned with professor's recent work, referencing specific papers]

## Proposed Research
[3-5 research questions mapping to gaps]

## Fit with [Professor]'s Lab (IF posting.json + professor-research.json available)
### Research Alignment
[How student's background connects to lab's trajectory]

### Specific Contributions
[Projects student could contribute to, based on lab's ongoing work]

### Skills Match
[How student's skills (from CV) match position requirements]

## References
[Key citations]
```

**If posting.json missing:** Skip "Lab-Specific Opportunities" and "Fit with Lab" sections. Proposal is still complete — just field-level targeting.

Save to `proposal-draft.md`

### Phase 5 — Humanization (STRICT Isolation)

**Dispatch a fresh isolated subagent (no skill exists for this — the lead
performs the rewrite itself only if subagent dispatch is unavailable) with a
plain-language tone pass prompt that receives ONLY:**
- Path to proposal draft
- Path to voice sample (if available)

**Scope:** Final proposal only. Leave gap analysis, evidence table, verifier as technical docs.

Save to `proposal-final.md`

### Phase 6 — Binder Assembly

Create layered binder with all appendices:

```
# Research Proposal: [Topic]
**Student:** [Name]
**Target:** [Professor], [University]
**Position:** [PhD/MS] starting [Date]

## Executive Summary
[Humanized proposal]

## Appendices
### Appendix A: Gap Analysis
### Appendix B: Evidence Ranking
### Appendix C: Verdict
### Appendix D: Researcher Profile
### Appendix E: Position Posting (posting.json)
### Appendix F: Professor Research (professor-research.json)
### Appendix G: Provenance
```

Save to `binder.md` + `binder.provenance.md`

## Output Artifacts

```
projects/<student-slug>/
├── profile.json                    # Structured CV extraction
├── voice-sample.txt               # Writing sample (or default note)
├── posting.json                   # Structured position posting data
├── posting-raw.txt                # Raw text from posting
├── professor-research.json        # Professor/lab web research
├── professor-search-plan.txt      # Search queries used
├── gap-analysis/
│   ├── <slug>.md                  # Gap dossier (general + lab-specific)
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

## Non-Negotiable Boundaries (All Subagents)

1. **NEVER fabricate a DOI.** Verify via https://doi.org/<doi> before writing.
2. **NEVER invent a statistic.** Quote sources as-is.
3. **NEVER present inferred claims as validated.** Mark `[inferred]`.
4. **NEVER let the verifier see the author's reasoning.**
5. **NEVER skip the humanization step.**
6. **NEVER let subagents share verdict channels.**
7. **NEVER fabricate professor details.** If not found, mark "not found".
8. **NEVER claim to read unfetched papers.** Mark paywalled sources `blocked`.
9. **NEVER invent lab projects.** Only state what research found.
10. **ALWAYS distinguish** posting claims vs. web research findings.

## Scope and Boundaries

- This skill generates research proposals for academic applications.
- **research-only, not for final submission without student review.** The student MUST review, fact-check, and personalize the output before submission.
- The agent does not guarantee admission. It guarantees a structured, verified, humanized proposal with full provenance.
- Fail-closed: if any phase fails, stop and report the blocker.
- **Not for final engineering sign-off.** This is an academic application tool, not an engineering design tool.

## What to Steal from Reference Systems

| Pattern | Source | How /proposal Uses It |
|---------|--------|----------------------|
| Subagent isolation | autoprompt-skill | Each phase runs in fresh context, hands off via files |
| Non-negotiable boundaries | scientific-agent-skills | Hard "NEVER" rules enforced at every phase |
| Voice matching | isolated tone-pass subagent | Matches student's own writing style |
| Receipts reconciliation | autoprompt-skill | Every search/query logged in provenance |
| Ledger-first audit | feynman | binder.provenance.md records every action |
| Claim-vs-diff verification | autoprompt-skill | Verifier maps every claim to source line |
