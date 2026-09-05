---
name: engineering-research
description: >
  The shared Vitruvius research method: discover → read → synthesize → verify →
  review with auditable provenance. Use for ANY engineering research task:
  researching an engineering question, standard, code provision, product,
  material, method, failure, or design alternative; writing an engineering
  brief, literature-style review, or state-of-practice survey; verifying a
  claim, number, or design against sources; or reviewing an engineering
  artifact. Discipline skills (/mechanical, /software, /civil, /electrical,
  /architectural) dispatch here with their domain payload. Do NOT use for
  engineering work that is not research (routine coding, direct design
  requests, calculations the user wants done inline).
argument-hint: "<research question or artifact to review>"
allowed-tools: Write Edit Bash Read
license: MIT
---

# Engineering Research

Run the Vitruvius research loop for an engineering question or artifact.
The discipline skill that dispatched here adds the evidence landscape and
verification criteria; this skill is the method itself. It applies to all five
disciplines unchanged.

## Tool Discipline (Read First)

- Use only tool names visible in the current tool set. If a tool returns "not
  found", do not retry the same invalid call — map to a canonical visible tool
  or record the capability as blocked.
- Prefer official standards portals, code body text, primary vendor
  documentation, and primary data over secondary summaries.
- When a source is paywalled or unreachable, cite it from search metadata and
  mark full-text access as `blocked` instead of guessing at its contents.
- To ask the user a question, write plain chat text and wait. Do not invent
  tool names for asking questions.

This is an execution request, not a request to explain the workflow. Execute
it. Do not answer by describing the protocol. Your first actions should be
tool calls that create the plan artifact.

## Context Management

To minimize API turns and context pressure:

1. **Write research notes to disk AFTER each search batch**
   - Don't accumulate search results in working memory
   - Extract what you need, write to `outputs/.drafts/<slug>-research-<scope>.md`, move on

2. **Read plans before continuing**
   - After interruption, re-read `outputs/.plans/<slug>.md` to restore context
   - Re-read your own research notes before drafting

3. **Bounded web searches**
   - Maximum 3-5 search queries per research phase
   - Extract findings to disk, then search again if needed
   - Don't loop on search — if 3 queries don't find it, mark `blocked`

4. **Progressive refinement**
   - First pass: plan + key sources (5-8 turns)
   - Second pass: draft from notes (5-8 turns)
   - Third pass: verify + provenance (5-8 turns)
   - Total target: 15-20 turns (not 25+)

## Context Management

To minimize API turns and context pressure:

1. **Write research notes to disk AFTER each search batch**
   - Don't accumulate search results in working memory
   - Extract what you need, write to `outputs/.drafts/<slug>-research-<scope>.md`, move on

2. **Read plans before continuing**
   - After interruption, re-read `outputs/.plans/<slug>.md` to restore context
   - Re-read your own research notes before drafting

3. **Bounded web searches**
   - Maximum 3-5 search queries per research phase
   - Extract findings to disk, then search again if needed
   - Don't loop on search — if 3 queries don't find it, mark `blocked`

4. **Progressive refinement**
   - First pass: plan + key sources (5-8 turns)
   - Second pass: draft from notes (5-8 turns)
   - Third pass: verify + provenance (5-8 turns)
   - Total target: 15-20 turns (not 25+)

## Required Artifacts

Derive a short **slug** from the topic: lowercase, hyphenated, no filler
words, at most 5 words (e.g. `steel-brace-connection`). Every run must leave
files on disk:

- `outputs/.plans/<slug>.md`
- `outputs/.drafts/<slug>-draft.md`
- `outputs/.drafts/<slug>-cited.md`
- `outputs/<slug>.md` or `papers/<slug>.md`
- `outputs/<slug>.provenance.md` or `papers/<slug>.provenance.md`

## File Write Fallback

The host must permit file writes for artifacts to persist. If a write fails:
1. Return the plan/draft/provenance content directly in the chat response
2. Continue the research loop — do not abort
3. Note in the final response that artifacts were not persisted to disk

Research content is valuable even without persistent artifacts. Never fail a
research task solely because file writes are not permitted.

Intermediate research goes to `<slug>-research-<scope>.md` in the working
directory or `outputs/.drafts/`. Never use generic names like `research.md` or
`brief.md`. Concurrent runs must not collide.

After the user approves the plan, if any capability fails, continue in
degraded mode and still write a blocked or partial final output and provenance
sidecar. Never end with chat-only output after plan approval.

## Step 1: Plan

Create `outputs/.plans/<slug>.md` immediately. The plan must include:

- Key questions
- Evidence needed (standards, code provisions, vendor docs, datasheets, prior
  designs, repos, prior art)
- Scale decision (below)
- Task ledger
- Verification log
- Decision log

Make the scale decision before assigning owners. If the topic is a narrow
"what is X" explainer, the plan must use lead-owned direct search tasks only;
do not allocate researcher subagents.

After writing the plan, proceed immediately to Step 2. Do not stop for
confirmation — the plan is written to disk for the user to review, but the
research loop continues without blocking.

## Step 2: Scale

Use direct search for:

- Single fact or narrow question, including "what is X" explainers
- Work you can answer with 3–10 tool calls

For "what is X" explainer topics, do NOT spawn researcher subagents unless the
user explicitly asks for comprehensive coverage or a broad survey. Do not
inflate a simple explainer into a multi-agent survey.

Use subagents only when decomposition clearly helps:

- Direct comparison of 2–3 items: 2 `researcher` subagents
- Broad survey or multi-faceted question: 3–4 `researcher` subagents
- Complex multi-domain research: 4–6 `researcher` subagents

## Step 3: Gather Evidence

If direct search was chosen:

- Skip researcher spawning entirely.
- Search and fetch sources yourself.
- Use multiple search terms/angles before drafting. Minimum: 3 distinct
  queries for direct-mode research.
- When the question is scholarly (papers, prior art, standards research),
  use the `/skill:scholarly-research` discovery layers: OpenAlex first
  (keyless REST), then Semantic Scholar / arXiv / alphaXiv fast search, and
  the host's own web or browser tools when visible.
- Record the exact search terms used and write notes to
  `outputs/.drafts/<slug>-research-direct.md`.
- Continue to synthesis.

If subagents were chosen:

- Write a per-researcher brief first (e.g. `outputs/.plans/<slug>-T1.md`).
- Keep tool-call JSON small and valid; do not place multi-paragraph
  instructions inside the `subagent` JSON.
- Always set `failFast: false`.
- Do not name exact tool commands in subagent tasks unless those tool names
  are visible in the current tool set. Prefer broad guidance: "use standards
  search and web search".
- Prefer file-based handoffs: the researcher writes findings to its output
  file and returns a one-line summary; the lead reads the file.

Evidence-gathering rules (researcher role):

1. **Never fabricate a source.** Every named standard, code, provision,
   product, material, project, or dataset must have a verifiable reference. If
   you cannot find one, do not mention it.
2. **Never claim something exists without checking.** Before citing a standard
   or code section, verify it exists and read the actual provision. If a
   search returns zero results, it does not exist — do not invent it.
3. **Never extrapolate details you haven't read.** If you have not fetched and
   inspected a source, you may note its existence but must not describe its
   contents, numbers, or claims.
4. **URL or it didn't happen.** Every evidence-table entry must include a
   direct, checkable source identifier: standard + section, URL, artifact
   path, or calculation.
5. **Read before you summarize.** Do not infer a code provision, a spec value,
   or a material property from a title, a snippet, or memory when a direct
   read is possible.
6. **Mark status honestly.** Distinguish `verified`, `inferred`, `blocked`,
   and `unverified`.

Source quality:

- **Prefer:** official standards bodies, code text, primary vendor
  documentation, datasheets, peer-reviewed engineering literature, reputable
  government and industry sources.
- **Accept with caveats:** well-cited secondary sources, established trade
  publications.
- **Deprioritize:** undated blog posts, content aggregators, forum posts
  without primary links, SEO listicles.
- **Reject:** sources with no author and no date, content that appears
  AI-generated with no primary backing.

Evidence table format — assign each source a stable numeric ID for downstream
traceability:

| # | Source | Reference (std+sec / URL / path) | Key claim | Type | Status |
|---|--------|----------------------------------|-----------|------|--------|
| 1 | ASME B31.3 | §304.1.2 | min wall thickness formula | code | verified |

Write findings with inline source references `[1]`, `[2]`. Label inferences as
inferences in the prose. End with a numbered Sources section matching the
table.

## Step 4: Draft

Write the brief yourself. Do not delegate synthesis.

Save to `outputs/.drafts/<slug>-draft.md`. Include:

- Executive summary
- Findings organized by question/theme
- Evidence-backed caveats and disagreements
- Open questions
- No invented sources, numbers, figures, tables, or claims

Before citation, sweep the draft: every critical claim, number, figure, or
table must map to a source reference, research note, raw artifact path, or
calculation. Remove or downgrade unsupported claims. Mark inferences as
inferences. **A numeric claim without a unit, sign convention, and source is
not a claim — it is noise.** Flag it.

## Step 5: Verify (Blind Verifier)

After the cited brief exists, run the **Blind Verifier** as a subagent with
FRESH context. This is mandatory for all non-trivial research. The verifier
receives:
- The research question
- The gathered evidence (with source locations)
- The claimed conclusion

It does **NOT** receive your reasoning chain — that separation is the point.
Activate it via `/skill:verifier`. It returns PASS / PARTIAL / BLOCKED with
an evidence trail and default-FAIL posture (it actively looks for flaws).

If the verifier returns BLOCKED, fix the fatal issues and re-run. If PARTIAL,
note the qualifications in Open Questions. Do not run the verifier and any
reviewer in the same parallel subagent call — verify first, then review.

## Step 6: Review

After the verifier passes, do a final self-review: check that all PARTIAL
qualifications are noted in Open Questions, all FATAL issues are fixed, and
the provenance sidecar is complete.

The final candidate is `outputs/.drafts/<slug>-revised.md` if it exists,
otherwise `outputs/.drafts/<slug>-cited.md`.

## Step 7: Deliver

Copy the final candidate to `outputs/<slug>.md` (or `papers/<slug>.md` for
paper-style artifacts). Write provenance next to it as `<slug>.provenance.md`:

```markdown
# Provenance: [topic]

- **Date:** [date]
- **Rounds:** [number of research rounds]
- **Sources consulted:** [count and/or list]
- **Sources accepted:** [count and/or list]
- **Sources rejected:** [dead, unverifiable, or removed]
- **Verification:** [PASS / PASS WITH NOTES / BLOCKED]
- **Plan:** outputs/.plans/<slug>.md
- **Research files:** [files used]
```

Before responding, verify on disk that all required artifacts exist. If
verification could not be completed, set `Verification: BLOCKED` or
`PASS WITH NOTES` and list the missing checks. Final response should be brief:
link the final file, the provenance file, and any blocked checks.
