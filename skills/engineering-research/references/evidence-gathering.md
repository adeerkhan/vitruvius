# Evidence Gathering

Detail for Step 3 of `engineering-research`. The step itself stays short in the
skill; this file holds the recipes it points to. Nothing here is optional — the
gates, prohibitions, and required records are the method's integrity floor, and
they are preserved verbatim in meaning from the skill body.

## Increment Checklist (complete before moving to Step 4)

- [ ] ≥3 distinct search queries run; ≥5 sources found and evaluated; ≥2 source tiers represented
- [ ] Numeric claims carry units + sign convention; standard citations carry section + edition
- [ ] No AI-generated or undated sources; search terms recorded in research notes

If any checkbox is unchecked, continue searching before drafting.

## Routing and hygiene

Route information needs to preferred sources using
`references/source-routing-table.md`. Do not search the same way for every
question — different question types have different authoritative sources.

Follow `references/context-hygiene-rules.md` for all evidence gathering: write
findings to disk progressively, extract and discard immediately, triage by
title/snippet first, and return one-line summaries to the parent.

## If direct search was chosen

- Skip researcher spawning entirely.
- Search and fetch sources yourself.
- Use multiple search terms/angles before drafting. Minimum: 3 distinct
  queries for direct-mode research.
- When the question is scholarly (papers, prior art, standards research), use
  the `/skill:scholarly-research` discovery layers: OpenAlex first (keyless
  REST), then Semantic Scholar / arXiv / alphaXiv fast search, and the host's
  own web or browser tools when visible.
- Record the exact search terms used and write notes to
  `outputs/.drafts/<slug>-research-direct.md`.
- Continue to synthesis.

## If subagents were chosen

- Write a per-researcher brief first (e.g. `outputs/.plans/<slug>-T1.md`).
  Researcher subagents are dispatched from `agents/researcher.md`; they write
  findings to their output file and return a one-line summary.
- Keep tool-call JSON small and valid; no multi-paragraph instructions in the
  `subagent` JSON.
- Always set `failFast: false`.
- Do not name exact tool commands in subagent tasks unless those tool names
  are visible in the current tool set. Prefer broad guidance: "use standards
  search and web search".
- Prefer file-based handoffs: the researcher writes findings to its output file
  and returns a one-line summary; the lead reads the file.

## Evidence-gathering rules (researcher role)

The six integrity commandments in `AGENTS.md` are non-negotiable. In brief —
never fabricate a source, never claim something exists without checking it,
never describe a source you have not read, give a checkable locator for every
entry, read before you summarize, and mark status honestly.

## Source quality

**Prefer** standards bodies, code text, primary vendor docs, datasheets,
peer-reviewed literature, reputable government/industry sources. **Accept with
caveats** well-cited secondary sources and trade publications. **Deprioritize**
undated blog posts, aggregators, primary-less forum posts, SEO listicles.
**Reject** anything with no author and no date, or that appears AI-generated
with no primary backing.

Full tier definitions: `references/evidence-quality-tiers.md`.

## Evidence table format

Assign each source a stable numeric ID for downstream traceability:

| # | Source | Reference (std+sec / URL / path) | Key claim | Type | Status |
|---|--------|----------------------------------|-----------|------|--------|
| 1 | ASME B31.3 | §304.1.2 | min wall thickness formula | code | verified |
| 2 | this repo | `packages/solver/src/x.ts:42` | treemap fills the host exactly | repo | verified |

`Type` is `code`, `standard`, `paper`, `vendor`, or `repo`. A `repo` row is a
claim about the artifact under study, so it must carry a `path:line` anchor that
resolves on disk. Never assert what a codebase does, lacks, or needs without
opening it — the most expensive research failure is a confident finding about
code nobody read. Anchor rules: `references/problem-anchor-contract.md`; format:
`references/compact-location-schema.md`.

Write findings with inline source references `[1]`, `[2]`. Label inferences as
inferences in the prose. End with a numbered Sources section matching the table.
