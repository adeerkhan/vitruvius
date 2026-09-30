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
argument-hint: "<research question or artifact to review> [--deep | --quick]"
allowed-tools: Write Edit Bash Read
license: MIT
metadata:
  version: "0.5.0"

---
<!-- VITRUVIUS-COMPILED-SKILL:BEGIN v1 sha256=ff51abf4f018298bdc31577f8897fc6630e0a534b022ca944867f84ee7954f0a -->

# Engineering Research

Run the Vitruvius research loop for an engineering question or artifact.
The discipline skill that dispatched here adds the evidence landscape and
verification criteria; this skill is the method itself. It applies to all five
disciplines unchanged.

## Invocation Flags

```
/engineering-research <question> [--deep | --quick] [--turns N | --budget N]
```

- **`--deep`**: Force multi-agent mode. Spawns researcher subagents regardless of query complexity; uses parallel verification lanes. For comprehensive coverage or safety-critical topics.
- **`--quick`**: Force direct search mode. No subagents, no parallel verification. Only when the user explicitly asks for a fast lookup.
- **`--turns N` / `--budget N`**: The user's effort ceiling (`N` research turns, or an approximate token budget). Record it in the plan and report when you approach it; it is a ceiling you honor, not an internal default you impose.
- **No flag**: Default to thorough research, bounded by a user-set budget when one is given and by evidence saturation when not. The user can change the budget mid-run.

Discipline skills pass these flags through to this method.

## Tool Discipline (Read First)

- Use only tool names visible in the current tool set. If a tool returns "not
  found", do not retry the same invalid call — map to a canonical visible tool
  or record the capability as blocked.
- Prefer official standards portals, code body text, primary vendor
  documentation, and primary data over secondary summaries.
- When a source is paywalled or unreachable, cite it from search metadata and
  mark it `blocked` instead of guessing at its contents. See
  `references/blocked-access-policy.md` for the full rules.
- To ask the user a question, write plain chat text and wait. Do not invent
  tool names for asking questions.

This is an execution request. Execute it; do not answer by describing the
protocol. Your first actions should be tool calls that create the plan artifact.

## Context Management

Write notes to disk after each batch and re-read plans after an interruption.
**Effort is the user's call:** honor `--turns`/`--budget` or plain language;
keep researching while rounds add grounded evidence, and never stop at a fixed
turn count. See `references/context-management.md`.

## Required Artifacts

Derive a short **slug** from the topic: lowercase, hyphenated, no filler
words, ≤5 words (e.g. `steel-brace-connection`). Every run must leave on disk:

- `outputs/.plans/<slug>.md`
- `outputs/.drafts/<slug>-draft.md`
- `outputs/.drafts/<slug>-cited.md`
- `outputs/<slug>.md` or `papers/<slug>.md`
- `outputs/<slug>-problem-anchor.json` (beside the candidate, not in a drafts dir)
- `outputs/<slug>.provenance.md` or `papers/<slug>.provenance.md`

## File Write Fallback

If a write fails: return the content inline, continue the loop, and note that
artifacts were not persisted. Never fail a research task solely because file
writes are not permitted.

Intermediate research goes to `<slug>-research-<scope>.md` in the working
directory or `outputs/.drafts/`. Never use generic names. Concurrent runs must
not collide.

After plan approval, if any capability fails, continue in degraded mode and
still write a blocked or partial final output and provenance sidecar.

## Step 1: Plan

### Input Gate (all must hold before proceeding)

1. The request is a research question, artifact review, or verification task —
   not routine coding, a direct design request, or an inline calculation the
   user wants performed.
2. The question is specific enough to derive a slug and evidence needs. If it
   is too vague, ask ONE clarifying question, then proceed.
3. The user's jurisdiction/edition context is known or the run will mark
   edition-sensitive claims `partial`.
4. File writes are available OR the File Write Fallback below is acceptable.

If any gate fails, resolve it before writing the plan. Do not silently
degrade — note the gate resolution in the plan's Decision log.

### Problem anchor (freeze before searching)

Before any search, name what the report is *about*, not just what it will look
up, and keep it stable for the run: the **artifacts under study** with the commit
that pins them, the **2-5 decisions** the reader will make, and the **non-goals**
(usually product policy and jurisdiction choice). A run with no artifact is a
literature review; say so rather than implying a codebase was read. Research
that cannot name its decisions is scope drift.

These become the `artifacts` and `decisions` of the machine record in
`references/problem-anchor-contract.md`, written beside the candidate and
validated with `vitruvius-problem-anchor`. Anchors resolve against real bytes,
so a `repo` claim that does not match the snapshot fails closed. The `path:line`
anchor format is specified in `references/compact-location-schema.md`.

Create `outputs/.plans/<slug>.md` immediately. The plan must include:

- Key questions
- Problem anchor: artifacts under study (+ commit), decisions to inform, non-goals
- Evidence needed (standards, code provisions, vendor docs, datasheets, prior
  designs, repos, prior art)
- Effort budget (user-set turns/tokens, or thorough until evidence saturates)
- Scale decision (below)
- Task ledger
- Verification log
- Decision log
- Phase-boundary update reminder (update logs at each phase transition)

Make the scale decision before assigning owners. If the topic is a narrow
"what is X" explainer, the plan must use lead-owned direct search tasks only;
do not allocate researcher subagents.

After writing the plan, proceed immediately to Step 2. Do not stop for
confirmation — the plan is written to disk for the user to review, but the
research loop continues without blocking.

### Plan as Working Memory

The plan is a living document, not a one-time contract. At each phase boundary
(after Gather, after Draft, after Verify, after Review), update the plan's
Task/Verification/Decision logs before moving to the next phase:

- **Task log** — check off completed tasks; add new ones if the phase revealed
  unplanned work.
- **Verification log** — record verifier verdicts and escalation outcomes.
- **Decision log** — record any decisions made during the phase (scale changes,
  dropped sources, revised claims).

This keeps the plan synchronized with reality so that an interrupted run can
resume from disk without losing state. The formal state machine (states,
transitions, crash recovery, GOAL-CHECK integration) is in
`references/research-state-machine.md`. The task ledger format, in-place update
rules, overwrite guard, and cross-session pickup are in
`references/plan-state.md`; per-skill token estimates in `references/token-budgets.md`.

### Overwrite Guard

Before writing a plan, check whether `outputs/.plans/<slug>.md` already
exists. If it has incomplete tasks for different work, stop and ask the user
before writing — never silently overwrite an incomplete plan. If it has
incomplete tasks for the same work, treat it as a plan pickup (below).

### Cross-Session Plan Pickup

When a plan already exists for the same slug with incomplete tasks for the
same work: read it, identify the first incomplete task, resume from there.
Do not start over. Note the resumed run in the Decision log. This is what
makes long-running research sessions possible without context overflow.

## Step 2: Scale

Make the scale decision before assigning owners. The full framework —
decision flow, anti-patterns, and recording convention — is in
`references/scale-decision-framework.md`.

Use direct search for:

- Single fact or narrow question, including "what is X" explainers
- Work you can answer with 3–10 tool calls

For "what is X" explainer topics, do NOT spawn researcher subagents unless the
user explicitly asks for comprehensive coverage. Do not inflate a simple
explainer into a multi-agent survey.

Use subagents only when decomposition clearly helps:

- Direct comparison of 2–3 items: 2 `researcher` subagents
- Broad survey or multi-faceted question: 3–4 `researcher` subagents
- Complex multi-domain research: 4–6 `researcher` subagents

### Parallel Fan-Out (T2)

Run independent skills simultaneously and merge when both complete (e.g. gap
analysis + evidence ranking, or researcher subagents on different topics). Do
**not** parallelize sequential dependencies, shared state, or budget-bound work.

## Step 3: Gather Evidence

Full recipes, the increment checklist, the evidence table format, and the
source-quality tiers are in `references/evidence-gathering.md`. Read it before
gathering. Three things stay inline because they gate the step:

- Complete the increment checklist there (≥3 distinct queries, ≥5 sources
  evaluated, ≥2 tiers) before moving to Step 4. Unchecked boxes mean keep
  searching, not drafting.
- A `repo` claim about the artifact under study needs a `path:line` anchor that
  resolves on disk. Never assert what a codebase does, lacks, or needs without
  opening it.
- Route question types to their authoritative sources via
  `references/source-routing-table.md`; do not search every question the same way.

## Step 4: Draft

Write the brief yourself — do not delegate synthesis. Save to
`outputs/.drafts/<slug>-draft.md`. The full drafting contract, the two
mandatory sections, the problem-anchor record rules, and the pre-citation sweep
are in `references/draft-and-anchor.md`.

Three things stay inline because they are load-bearing:

- Every finding carries an ID, a `type`, and a **changes** line naming its
  landing site: `change`, `measure`, `defer`, `product-decision`, or
  `background`. A finding with no landing site must say which it is.
- `## What we did not find` and `## Impact vs. evidence` are mandatory.
  Silence reads as "no problems exist"; an unsupported priority ranking is a
  guess wearing a table.
- The `vitruvius-problem-anchor.v1` record is **mandatory even when the
  validator is not installed** — keep it and mark validation `BLOCKED`, never
  drop it. Repair a failed record by fixing the claim or the anchor, never by
  deleting the finding.

## Step 5: Verify (Blind Verifier)

After the cited brief exists, run the **Blind Verifier** as a subagent with
FRESH context. Mandatory for all non-trivial research. The canonical definition
is `agents/verifier.md` — dispatch it with that file's content as the prompt.
The verifier receives the research question, the gathered evidence (with source
locations), and the claimed conclusion.

It does **NOT** receive your reasoning chain — that separation is the point.
It must have NO write/edit capability: the verifier reports, never repairs.
It returns PASS / PARTIAL / BLOCKED with an evidence trail and default-FAIL
posture.

If the verifier returns BLOCKED, fix the fatal issues and re-run. If PARTIAL,
note the qualifications in Open Questions. Do not run the verifier and any
reviewer in the same parallel subagent call — verify first, then review.

### Conditional Escalation (A4 — from src-03 L4 pattern)

Verification escalates based on **claim criticality** and **verifier disagreement**.
Keep the flat agent structure — escalation is conditional, not hierarchical.
Full rules, arbiter independence requirements, and disagreement documentation:
`references/verification-escalation.md`.

## Step 6: Review

After the verifier passes, do a final self-review: all PARTIAL qualifications
noted in Open Questions, all FATAL issues fixed, provenance sidecar complete.
Use the FATAL/MAJOR/MINOR classification from
`references/reviewer-severity-levels.md` for every finding.

## Step 6.5: Post-Edit Verification Audit (MANDATORY)

After the verifier passes and before delivery, run an adversarial citation audit.
THIS STEP IS MANDATORY — do not skip.

1. **Scan every numeric claim** — does it map to a source with section + line?
2. **Scan every standard citation** — does the section actually say what's claimed?
3. **Remove or downgrade unsupported claims** — if a claim can't be traced, find a source or remove it
4. **Verify meaning, not just topic overlap** — citation valid only if source supports the specific number/quote/conclusion
5. **Refuse fake certainty** — never use "verified"/"confirmed" unless evidence exists
6. **If evidence is paywalled**, mark `blocked` — never guess at contents. See
   `references/blocked-access-policy.md` for the full rules.

Use `references/verifier-citation-rules.md` for citation requirements (no orphan
citations, no orphan sources) and `references/result-provenance-audit.md` for
the quantitative claim scan (scores, benchmarks, figures, claims of gain).

**Quality Gate (mandatory before delivering):**
1. **Claim coverage** — ≥80% of claims are `verified` or `partial`. If < 80%, re-search unverified claims.
2. **Line pinning** — ≥80% of findings are line-pinned to specific §/line. If < 80%, re-read sources.
3. **No fabrication** — zero claims marked `verified` without direct source read. If any found, downgrade to `unverified`.
4. **Provenance complete** — provenance sidecar lists all sources consulted, accepted, and rejected. If incomplete, update.

**Retry logic:** If quality gate fails, fix the specific failures and re-run the audit. If it fails again, deliver with `Verification: PARTIAL` and list all unresolved issues in the provenance sidecar.

The goal: every claim in the final output traces to a checkable source. If
verification could not be completed, set `Verification: BLOCKED` in the
provenance sidecar and list the missing checks.

The final candidate is `outputs/.drafts/<slug>-revised.md` if it exists,
otherwise `outputs/.drafts/<slug>-cited.md`.

## Step 7: Deliver

### GOAL-CHECK gate (mandatory before copying to `outputs/`)

Dispatch the `goal-checker` role (`agents/goal-checker.md`) with: the original
research question verbatim plus its frozen requirements IDs/manifest, the final candidate path (+ SHA-256 + byte count),
the provenance sidecar path, the plan path, and the problem-anchor record path
so it can confirm the report is about the artifact it claims to study. In
`--quick` mode, run the tri-axis check inline in the same format, and write the
[machine contract](references/goal-check-contract.md) record beside the candidate.
Validate it with `vitruvius-goal-check <record>` (or
`node scripts/goal-check-contract.mjs <record>` in a checkout). **The record is
mandatory even when the validator is not installed** — keep it and mark its
validation `BLOCKED`. Only a valid `DONE` and promotable record permits
delivery.

Default NOT-DONE: every ask re-derived from the original question must be
delivered (`scope=pass prompt=pass flaws=0`, non-empty `ran=`). Any NOT-DONE
goes back to the responsible step to repair the named items only — retain all
accepted evidence and verifier results; do not redo the run. A second
NOT-DONE on the same axis: deliver honestly with the unmet asks listed, never
silently. Record in the provenance notes:

```
GOAL-CHECK: E2E: scope=<pass|gap> prompt=<pass|gap> flaws=<n> ran=<phrase>
```

Copy the final candidate to `outputs/<slug>.md` (or `papers/<slug>.md` for
paper-style artifacts). Write provenance next to it as `<slug>.provenance.md`:
```markdown
# Provenance: [topic]
- **Final artifact:** `[slug].md`
- **Final SHA-256:** `<64 lowercase hex characters>`
- **Final bytes:** `<positive integer>`
- **Date:** [date]
- **Rounds:** [number of research rounds]
- **Sources consulted:** [count and/or list]
- **Sources accepted:** [count and/or list]
- **Sources rejected:** [dead, unverifiable, or removed]
- **Verification:** [verified / partial / blocked / failed]
- **Claims verified:** [count]
- **Claims partial:** [count — directionally correct but need qualification]
- **Claims blocked:** [count — source unreachable or unverifiable]
- **Claims unverified:** [count — default, not yet checked]
- **Plan:** outputs/.plans/<slug>.md
- **GOAL-CHECK:** E2E: scope=<pass|gap> prompt=<pass|gap> flaws=<n> ran=<phrase>
```
Generate a ledger entry (JSON) and log it:

```json
{
  "skill": "engineering-research",
  "topic": "<slug>",
  "discipline": "<discipline>",
  "status": "completed",
  "verdict": "<verified/partial/blocked/failed>",
  "sources_consulted": <count>,
  "claims_verified": <count>,
  "claims_blocked": <count>
}
```

Pipe the entry through the logger; `run.v1` adds the stable `run_id` and UTC `timestamp`:

```bash
echo '<ledger_json>' | node <engineering-research-skill-root>/scripts/log-run.mjs
```

The skill-local wrapper is self-contained and defaults `.runs/` to the active project working directory; a repository checkout may use the compatibility command `node scripts/log-run.mjs`, which preserves the checkout-local default unless an override is supplied. Set `VITRUVIUS_PROJECT_ROOT` when the active project is not the command's working directory. Concurrent writes wait briefly for a ledger lock; an interrupted process leaves the lock in place and later writes fail closed until an operator verifies it is safe to remove `.log-run.lock`.

### Q1 evidence ledger

After `log-run.mjs` returns a `run_id`, record the run's source, search, and claim mappings as one `evidence.v1` JSON document. The exact fields, local-only boundary, completion semantics, and fail-closed rules are in `references/evidence-ledger.md`.

```bash
printf '%s\n' '<evidence_json>' | node <engineering-research-skill-root>/scripts/record-evidence.mjs --run-id <run_id>
node scripts/validate-evidence.mjs <project-root>/.runs/<run_id>.evidence.json
```

The writer requires the existing L1 entry, stores `<project-root>/.runs/<run_id>.evidence.json` atomically, refuses overwrites, and shares the `.log-run.lock` with L1. The repository compatibility commands are `scripts/record-evidence.mjs` and `scripts/validate-evidence.mjs`.

### Verification Labels (F2 — Vitruvius Provenance)

Full label definitions and when to use each: `references/verification-labels.md`.

Before responding, verify on disk that all required artifacts exist. If
verification could not be completed, set the appropriate label and list the
missing checks. Final response should be brief: link the final file, the
provenance file, and any blocked/unverified checks.

## Evidence Quality

Score all evidence using the tier system defined in
`references/evidence-quality-tiers.md`. Every critical claim must trace to
Tier 1 (authoritative) or Tier 2 (reliable) sources. Tier 3 supports but
does not standalone critical claims. Tier 4 is rejected as primary evidence.

Mark each claim's verification status honestly: `verified`, `partial`,
`blocked`, `unverified`, `inferred`, or `failed`. Never claim `verified`
unless the source was read directly and the claim traces to a specific location.

## Scope and Boundaries

- This skill produces research — it does NOT produce final designs, construction documents, or implementation guidance.
- **Research-only, not for final engineering sign-off.** Outputs are for exploration, comparison, and evidence gathering. Licensed engineers must review and approve any design based on this research.
- Fail-closed: if evidence is insufficient, mark claims `blocked` rather than guessing.
