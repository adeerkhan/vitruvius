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
  version: "0.2.6"

---

# Engineering Research

Run the Vitruvius research loop for an engineering question or artifact.
The discipline skill that dispatched here adds the evidence landscape and
verification criteria; this skill is the method itself. It applies to all five
disciplines unchanged.

## Invocation Flags

```
/engineering-research <question> [--deep | --quick]
```

- **`--deep`**: Force multi-agent mode. Spawns researcher subagents regardless of query complexity. Uses parallel verification lanes for all claims. Use when the user wants comprehensive coverage or the topic is safety-critical.
- **`--quick`**: Force direct search mode. No subagents, no parallel verification. Lead agent searches and synthesizes alone. Use for simple lookups or when token cost matters.
- **No flag**: Auto-scale based on query complexity (default behavior — see Step 2 Scale).

Discipline skills pass these flags through to this method.

## Tool Discipline (Read First)

- Use only tool names visible in the current tool set. If a tool returns "not
  found", do not retry the same invalid call — map to a canonical visible tool
  or record the capability as blocked.
- Prefer official standards portals, code body text, primary vendor
  documentation, and primary data over secondary summaries.
- When a source is paywalled or unreachable, cite it from search metadata and
  mark full-text access as `blocked` instead of guessing at its contents. See
  `references/blocked-access-policy.md` for the full rules.
- To ask the user a question, write plain chat text and wait. Do not invent
  tool names for asking questions.

This is an execution request, not a request to explain the workflow. Execute
it. Do not answer by describing the protocol. Your first actions should be
tool calls that create the plan artifact.

## Context Management

Write research notes to disk after each search batch (extract findings to
`outputs/.drafts/<slug>-research-<scope>.md`, don't accumulate in working
memory). Bounded searches: 3–5 queries per phase, then extract to disk and
re-search; 3 failed queries = mark `blocked`. Re-read plans and notes after
interruption. Full practice: `references/context-management.md`.

## Required Artifacts

Derive a short **slug** from the topic: lowercase, hyphenated, no filler
words, at most 5 words (e.g. `steel-brace-connection`). Every run must leave
files on disk:

- `outputs/.plans/<slug>.md`
- `outputs/.drafts/<slug>-draft.md`
- `outputs/.drafts/<slug>-cited.md`
- `outputs/<slug>.md` or `papers/<slug>.md`
- `outputs/<slug>-problem-anchor.json` (beside the candidate, not in a drafts dir)
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

### Input Gate (all must hold before proceeding)

1. The request is a research question, artifact review, or verification task —
   not routine coding, a direct design request, or an inline calculation the
   user wants performed.
2. The question is stated specifically enough to derive a slug and evidence
   needs. If it is too vague, ask ONE clarifying question, then proceed.
3. The user's jurisdiction/edition context is known or the run will mark
   edition-sensitive claims `partial`.
4. File writes are available OR the File Write Fallback below is acceptable.

If any gate fails, resolve it before writing the plan. Do not silently
degrade — note the gate resolution in the plan's Decision log.

### Problem anchor (freeze before searching)

Before any search, name what the report is *about*, not just what it will look
up, and keep it stable for the run: the **artifacts under study** with the commit
that pins them, the **2-5 decisions** the reader will make with this report, and
the **non-goals** (usually product policy and jurisdiction choice). A run with
no artifact is a literature review; say so rather than implying a codebase was
read. Research that cannot name its decisions is scope drift.

These become the `artifacts` and `decisions` of the machine record in
`references/problem-anchor-contract.md`, written beside the candidate and
validated with `vitruvius-problem-anchor`. Anchors resolve against real bytes,
so a `repo` claim that does not match the snapshot fails closed before review.

Create `outputs/.plans/<slug>.md` immediately. The plan must include:

- Key questions
- Problem anchor: artifacts under study (+ commit), decisions to inform, non-goals
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

### Parallel Fan-Out (T2)

Run independent skills simultaneously and merge when both complete — for
example gap analysis with evidence ranking, several researcher subagents on
different topics, or discipline skills on different domains. Gaps then inform
evidence priorities. Do **not** parallelize sequential dependencies (the
verifier needs the evidence first), skills that share state or context, or work
constrained by the token budget.

## Step 3: Gather Evidence

### Increment Checklist (complete before moving to Step 4)

- [ ] At least 3 distinct search queries run
- [ ] At least 5 sources found and evaluated
- [ ] At least 2 source tiers represented (Tier 1-2 preferred)
- [ ] All numeric claims have units and sign conventions
- [ ] All standard citations include section + edition
- [ ] No sources appear AI-generated or undated
- [ ] Search terms recorded in research notes

If any checkbox is unchecked, continue searching before drafting.

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
  Researcher subagents are dispatched from the canonical role definition in
  `agents/researcher.md`; they write findings to their output file and return
  a one-line summary.
- Keep tool-call JSON small and valid; do not place multi-paragraph
  instructions inside the `subagent` JSON.
- Always set `failFast: false`.
- Do not name exact tool commands in subagent tasks unless those tool names
  are visible in the current tool set. Prefer broad guidance: "use standards
  search and web search".
- Prefer file-based handoffs: the researcher writes findings to its output
  file and returns a one-line summary; the lead reads the file.

Evidence-gathering rules (researcher role): the six integrity commandments in
`AGENTS.md` are non-negotiable here. In brief — never fabricate a source, never
claim something exists without checking it, never describe a source you have
not read, give a checkable locator for every entry, read before you summarize,
and mark status honestly.

Source quality: **prefer** official standards bodies, code text, primary vendor
documentation, datasheets, peer-reviewed engineering literature, and reputable
government/industry sources. **Accept with caveats** well-cited secondary
sources and established trade publications. **Deprioritize** undated blog posts,
content aggregators, primary-less forum posts, and SEO listicles. **Reject**
anything with no author and no date, or that appears AI-generated with no
primary backing.

Evidence table format — assign each source a stable numeric ID for downstream
traceability:

| # | Source | Reference (std+sec / URL / path) | Key claim | Type | Status |
|---|--------|----------------------------------|-----------|------|--------|
| 1 | ASME B31.3 | §304.1.2 | min wall thickness formula | code | verified |
| 2 | this repo | `packages/solver/src/x.ts:42` | treemap fills the host exactly | repo | verified |

`Type` is `code`, `standard`, `paper`, `vendor`, or `repo`. A `repo` row is a
claim about the artifact under study, so it must carry a `path:line` anchor
that resolves on disk. Never assert what a codebase does, lacks, or needs
without opening it — the most expensive research failure is a confident finding
about code nobody read. Full anchor rules: `references/problem-anchor-contract.md`.

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

Every finding carries an ID, a `type`, and a **changes** line naming its landing
site: `change`, `measure`, `defer`, `product-decision`, or `background`. This is
what separates an engineering report from a survey. A finding with no landing
site is either background or a product decision, and must say which. A finding
that recommends building something must first show it is absent — with an
anchor, not an assertion.

Two sections are mandatory, not optional:

- **`## What we did not find`** — what you searched for, did not find, and the
  boundary of the search. Silence reads as "no problems exist"; this section
  makes the gap itself evidence.
- **`## Impact vs. evidence`** — for each recommendation, the evidence behind
  it and the cost of being wrong. An unsupported priority ranking is a guess
  wearing a table.

Then write the `vitruvius-problem-anchor.v1` record beside the candidate from
`references/problem-anchor-contract.md` and run `vitruvius-problem-anchor
<record>` (or `node scripts/problem-anchor-contract.mjs <record>` in a
checkout). It must pass before the brief moves to verification: every decision
reached a position, every `repo` anchor resolves to a non-blank line on disk,
and the candidate actually cites them.

`verified` also requires the entailment proxy: the anchored line must carry the
claim's quoted spans, identifiers, and measures. A paraphrase is `partial`;
attribution and negative claims stay with the verifier.

Repair a failed record by fixing the claim or the anchor — never by deleting
the finding.

Before citation, sweep the draft: every critical claim, number, figure, or
table must map to a source reference, research note, raw artifact path, or
calculation. Remove or downgrade unsupported claims. Mark inferences as
inferences. **A numeric claim without a unit, sign convention, and source is
not a claim — it is noise.** Flag it.

## Step 5: Verify (Blind Verifier)

After the cited brief exists, run the **Blind Verifier** as a subagent with
FRESH context. This is mandatory for all non-trivial research. The role's
canonical definition is `agents/verifier.md` — dispatch it with that file's
content as the subagent prompt. The verifier receives:
- The research question
- The gathered evidence (with source locations)
- The claimed conclusion

It does **NOT** receive your reasoning chain — that separation is the point.
It must have NO write/edit capability: the verifier reports, it never repairs.
It returns PASS / PARTIAL / BLOCKED with an evidence trail and default-FAIL
posture (it actively looks for flaws).

If the verifier returns BLOCKED, fix the fatal issues and re-run. If PARTIAL,
note the qualifications in Open Questions. Do not run the verifier and any
reviewer in the same parallel subagent call — verify first, then review.

### Conditional Escalation (A4 — from Autoprompt L4 pattern)

Verification escalates based on **claim criticality** and **verifier disagreement**.
Keep the flat agent structure — escalation is conditional, not hierarchical.

#### Escalation Rules

| Scenario | Action | Agents |
|----------|--------|--------|
| Routine claim (informational) | Single verifier | 1 |
| Critical claim (safety, code-backed, structural) | Parallel verify | 2 |
| Verifiers disagree (different verdicts) | Escalate to arbiter | 3 |
| All three disagree | BLOCKED, document disagreement | — |

#### When to Use 2 or 3 Verifiers

Use 2 verifiers when `--deep` is set, when the claim involves life-safety
(structural, fire, electrical, pressure vessels), when a specific code provision
is the sole basis, when a numerical result governs a design decision, or when
the claim spans multiple engineering fields. Escalate to 3 when the first two
return different verdicts, when a safety-critical claim carries high stakes of
being wrong, or when the evidence is ambiguous or conflicting.

#### Arbiter and independence

The arbiter is dispatched from `agents/arbiter.md` with the original question,
the evidence, the two prior verdicts and their evidence trails, and the
instruction: "Two verifiers disagree. Review both trails and render a majority
verdict." It does NOT re-research — it adjudicates between the two existing
verdicts. Majority wins; all three disagree returns BLOCKED with documentation.

#### Documenting Disagreement and Independence

On disagreement the provenance sidecar records one `## Verifier Disagreement` block:
each verdict and reason, the arbiter's, and the resolution. No recorded
resolution means an open finding, not a closed one.

Every verifier/reviewer MUST be a fresh subagent instance; no agent reviews
work it authored; concurrent verifiers share no verdict channel; negative
verdicts loop back to the lead agent, never sideways. For routine
(informational, non-safety) claims a single verifier is sufficient.

## Step 6: Review

After the verifier passes, do a final self-review: check that all PARTIAL
qualifications are noted in Open Questions, all FATAL issues are fixed, and
the provenance sidecar is complete.

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

**Quality Gate (mandatory before delivering):**
1. **Claim coverage** — ≥80% of claims are `verified` or `partial`. If < 80%, re-search unverified claims.
2. **Line pinning** — ≥80% of findings are line-pinned to specific §/line. If < 80%, re-read sources.
3. **No fabrication** — zero claims marked `verified` without direct source read. If any found, downgrade to `unverified`.
4. **Provenance complete** — provenance sidecar lists all sources consulted, accepted, and rejected. If incomplete, update.

**Retry logic:** If quality gate fails, fix the specific failures and re-run the audit. If it fails again, deliver with `Verification: PARTIAL` and list all unresolved issues in the provenance sidecar.

This is the Feynman post-edit verification pattern. The goal: every claim in the
final output traces to a checkable source. If verification could not be completed,
set `Verification: BLOCKED` in the provenance sidecar and list the missing checks.

The final candidate is `outputs/.drafts/<slug>-revised.md` if it exists,
otherwise `outputs/.drafts/<slug>-cited.md`.

## Step 7: Deliver

### GOAL-CHECK gate (mandatory before copying to `outputs/`)

Dispatch the `goal-checker` role (`agents/goal-checker.md`) with: the original
research question verbatim plus its frozen requirements IDs/manifest, the final candidate path (+ SHA-256 + byte count),
the provenance sidecar path, the plan path, and the problem-anchor record path
so it can confirm the report is about the artifact it claims to study. In
`--quick` mode, run the tri-axis check inline in the same format, write the [machine contract](references/goal-check-contract.md) record beside the candidate, and validate it with `vitruvius-goal-check <record>` (or `node scripts/goal-check-contract.mjs <record>` in a checkout); only a valid `DONE` and promotable record permits delivery.

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

| Label | Meaning | When to use |
|-------|---------|-------------|
| **verified** | Source read directly, claim traces to specific §/line | Every load-bearing claim must reach this |
| **partial** | Directionally correct but needs qualification (edition, jurisdiction, condition) | Source supports general direction but not exact number/scope |
| **blocked** | Source unreachable (paywall, dead link) or unverifiable | Never guess at contents — cite from metadata |
| **unverified** | Default state — claim not yet checked | Every claim starts here; sweep at delivery |
| **inferred** | Logical deduction from **read** sources with a stated derivation trace | Mark explicitly as inference, not fact. `inferred` REQUIRES a derivation: which read sources + what reasoning. A value recalled from memory or training — however "typical" — is never `inferred`; it is `unverified` (or omitted). Industry-typical numeric ranges without a cited source are `unverified` |
| **failed** | Source contradicts the claim | Fix the claim or find better source |

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
