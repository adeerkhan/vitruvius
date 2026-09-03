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
license: MIT
---

# Engineering Research

Run the Feynman-style research loop for an engineering question or artifact.
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

## Required Artifacts

Derive a short **slug** from the topic: lowercase, hyphenated, no filler
words, at most 5 words (e.g. `steel-brace-connection`). Every run must leave
files on disk:

- `outputs/.plans/<slug>.md`
- `outputs/.drafts/<slug>-draft.md`
- `outputs/.drafts/<slug>-cited.md`
- `outputs/<slug>.md` or `papers/<slug>.md`
- `outputs/<slug>.provenance.md` or `papers/<slug>.provenance.md`

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

After writing the plan, stop and ask for explicit confirmation before gathering
evidence:

`Proceed with this research plan? Reply "yes" to continue, or tell me what to change.`

Do not run searches, fetch sources, spawn subagents, draft, cite, review, or
deliver until the user confirms. If the user requests changes, update the plan
first, then ask again.

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

## Step 5: Cite

If direct search was chosen:

- Do citation yourself. Verify reachable source references.
- Copy or rewrite `outputs/.drafts/<slug>-draft.md` to
  `outputs/.drafts/<slug>-cited.md` with inline citations and a Sources
  section. Do not spawn the `verifier` subagent for simple direct-search runs.

If researcher subagents were used, run the `verifier` agent after the draft
exists. This step is mandatory and must complete before any reviewer runs. Do
not run `verifier` and `reviewer` in the same parallel `subagent` call.

Citation rules:

- Every factual claim gets at least one citation: "AISC 360-16 §E3 requires a
  minimum slenderness check [1]."
- Multiple sources for one claim are fine. No orphan citations; no orphan
  sources.
- **Verify meaning, not just topic overlap.** A citation is valid only if the
  source actually supports the specific number, provision, or conclusion
  attached to it.
- For code-backed or quantitative claims, keep the claim only if the
  supporting artifact or calculation is present in the research files. If a
  number lacks a traceable source or artifact path, weaken or remove the claim.
- Remove unsourced factual claims or find them a source. Do not leave
  unsourced factual claims in a cited brief.
- Refuse fake certainty. Do not use `verified`, `confirmed`, or `reproduced`
  unless the evidence actually supports it.
- Dead/404 source? Search for an alternative (archived version, updated
  link). If none, remove the source and every claim that depended solely on it.

## Step 6: Review

If direct search was chosen:

- Review the cited draft yourself.
- Write `outputs/.drafts/<slug>-verification.md` with FATAL / MAJOR / MINOR
  findings and the checks performed.
- Fix FATAL issues before delivery. Do not spawn the `reviewer` subagent for
  simple direct-search runs.

If researcher subagents were used, only after the cited file exists, run the
`reviewer` agent against it. This is a verification pass, not a peer review:
flag unsupported claims, logical gaps, single-source critical claims, and
overstated confidence.

If the reviewer flags FATAL issues, fix them and run one more review pass. Note
MAJOR issues in Open Questions. Accept MINOR issues.

When applying fixes, use small localized edits for 1–3 simple corrections. For
section rewrites or more than 3 substantive fixes, read the cited draft and
write a corrected full file to `outputs/.drafts/<slug>-revised.md`.

After applying any fixes, run an explicit on-disk verification before saying
the fixes landed (read, grep, diff, or stat proving the old wording is gone
and the replacement exists). Provenance may only say an issue was fixed when
this post-edit verification passed.

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
