---
name: proposal
description: >
  Research Proposal Generator — an intended pipeline from position posting + CV
  + Personal Statement to a humanized research proposal for Ph.D./Masters
  applications. Local text/Markdown/JSON intake is executable; PDF extraction
  uses optional tooling and URL/image inputs require an explicitly recorded
  fetch or transcription before intake. The workflow researches professor/lab, identifies
  lab-specific gaps, and generates a targeted proposal with deep fit analysis.
  Wraps /gap-analysis, /evidence-ranking, and /verifier as isolated subagents.
argument-hint: "[--posting <path>] [--cv <path>] [--statement <path>] [--sample <path>]"
allowed-tools: Write Edit Bash Read
license: MIT
metadata:
  version: "0.1.8"

---

# Research Proposal Generator

The intended workflow generates a research proposal package for Ph.D./Masters applications. Local text/Markdown/JSON intake is executable; PDF extraction uses the optional `pdf-parse` dependency, while URL/image inputs require an explicitly recorded fetch or transcription before intake. The parser commands record raw intake and provenance; an isolated research step must verify and structure profile/posting fields before downstream work. The workflow orchestrates isolated subagents, verifies outputs, produces a humanized final proposal with an audit trail, and targets the specific lab/professor from the posting. Stop with a blocker when an execution check fails.

## Invocation

### CLI

```
/proposal --posting <path> --cv <path> [--statement <path>] [--sample <path>]
```

- **`--posting`**: Local text/Markdown/JSON or text-layer PDF path. Fetch URLs and transcribe images explicitly before intake; they are not deterministic parser inputs.
- **`--cv`**: Local text/Markdown/JSON or text-layer PDF path
- **`--statement`**: Path to personal statement (optional, used for voice matching)
- **`--sample`**: Path to separate writing sample (optional, used for voice matching)

The parser scripts write `projects/<slug>/` beneath the active working directory. Set `VITRUVIUS_PROJECT_ROOT` when the active project workspace is elsewhere. When a host copies only this skill, run the scripts from the copied skill directory or adapt the displayed checkout paths; the proposal runtime is self-contained.

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

> **Execution gate:** local text/Markdown/JSON paths are supported. PDF extraction uses optional `pdf-parse`; scanned/unsupported/image/URL inputs are blocked until explicitly transcribed/read. `parse-posting.mjs` and `parse-cv.mjs` intentionally produce raw intake (`structured: false`) and an append-only phase-0 provenance ledger. Stop and report `BLOCKED` until an isolated step verifies and writes the structured fields (`structured: true`); never treat raw intake as a complete profile or posting.

Dispatch `/skill:artifact-reading` as isolated subagent — **fresh context, receives ONLY:**
- Path to position posting (if `--posting` provided)
- Path to CV (if `--cv` provided)
- Path to personal statement (if `--statement` provided)
- Path to writing sample (if `--sample` provided)

**Does NOT receive:** any prior reasoning, target context, or other project files.

Artifact-reading subagent:
1. For each file, run `node <proposal-skill-root>/scripts/extract-document.mjs <path>` after the execution gate passes. In a repository checkout, the equivalent compatibility command is `node scripts/extract-document.mjs <path>`; the local wrapper is self-contained.
2. Extracts structured content (markdown, pages, method used)
3. If method is `vision`, deterministic proposal intake stops; a separate, explicit LLM read may transcribe the document, but that transcription must be saved as a new text artifact and provenance entry before re-running intake
4. Returns structured content with sections and provenance

All downstream phase artifacts (gap dossier/provenance, evidence table, verifier verdict, proposal draft, and proposal final) must include the current `RUN_INPUT_SHA256: <lineage_id>` from `run-manifest.json`; the binder rejects mixed-generation artifacts.

The deterministic parser commands are an intake boundary, not a field extractor:
- `node skills/proposal/scripts/parse-posting.mjs <slug> <local-path>`
- `node skills/proposal/scripts/parse-cv.mjs <slug> <local-path>`
They fail closed for empty, URL, image, or unsupported extraction paths, preserve blocked attempts, and never invent identity fields. Each raw artifact carries source/raw byte counts and SHA-256 digests plus an `unverified` marker. The isolated artifact-reading step must verify the digests against `phase-0-provenance.md`, enrich the fields, set `verification.status: verified`, then run `node skills/proposal/scripts/register-structured.mjs <slug>` before Phase 1. Registration records structured digests and a new lineage; changing intake archives downstream artifacts.

**Output saved by subagent (after raw intake and verification):**
- `posting.json` — structured position posting data (the deterministic parser initially writes `structured: false`; the subagent must set verified fields and `structured: true`):
  ```json
  {
    "status": "parsed",
    "structured": true,
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
- `profile.json` — structured CV data (`status: parsed`, `structured: true`; raw intake is not sufficient)
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
    "status": "parsed",
    "structured": true,
    "input_lineage": "<run-manifest.lineage_id>",
    "professor": { "name": "...", "title": "...", "profile_url": "..." },
    "lab": { "name": "...", "url": "...", "description": "...", "members": [...] },
    "recent_papers": [{ "title": "...", "year": 2024, "doi": "...", "key_contribution": "..." }],
    "research_focus": ["..."],
    "ongoing_projects": ["..."],
    "sources_consulted": ["..."],
    "search_plan_sha256": "<sha256 of professor-search-plan.txt>",
    "provenance": "phase-0-provenance.md",
    "verification": { "status": "verified", "provenance": "phase-0-provenance.md" }
  }
  ```

**0d. Provenance**
Log all inputs, extraction methods, statuses, hashes, and research queries to `phase-0-provenance.md`. The parser appends each attempt; never replace a prior source record.

### Phase 1 — Gap Analysis (STRICT Isolation, Enhanced)

**Before dispatching:** LLM reads `posting.json` and `professor-research.json` only when they are marked `structured: true` and supported by provenance. If they are raw or blocked, stop with `BLOCKED`. Extracts:
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

**If posting.json is missing:** skip "Lab-Specific Opportunities" and "Fit with Lab" sections, label the result as a field-level draft, and do not call it a complete proposal.

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

The `verification` object is a provenance assertion, not authentication; a host with stronger identity controls should bind it to the approver. Binder assembly is fail-closed: it requires non-empty phase artifacts, digest-bound structured profile/posting fields, a recorded phase-0 source ledger, an explicit voice sample or neutral baseline, the complete verifier output contract with exactly one `PASS` verdict, and no blocked retry sidecar. Intake or research changes archive downstream artifacts. Save to `binder.md` + `binder.provenance.md` only after all gates pass.

## Output Artifacts

```
projects/<student-slug>/
├── profile.json                    # Raw intake, then verified structured CV data
├── voice-sample.txt               # Writing sample (or explicit neutral baseline)
├── posting.json                   # Raw intake, then verified structured posting data
├── posting-raw.txt                # Raw text from posting
├── cv-raw.txt                     # Raw text from CV
├── phase-0-provenance.md          # Append-only intake/extraction ledger
├── run-manifest.json              # Current intake generation/lineage
├── *.blocked                      # Failed retry sidecars, when present
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
- The agent does not guarantee admission. When all required phases pass, it produces a structured, humanized proposal with provenance; the current parser/document path must be checked before treating the package as complete.
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
