# Agents

`AGENTS.md` is the repo-level contract for agents working in the Vitruvius repository, and the always-on ruleset that portable hosts (Pi, Claude Code, Codex, OpenCode, Cursor, Qoder, ...) load for free.

## What Vitruvius is

Vitruvius is an **engineering research agent**. It runs a research loop over engineering questions and artifacts — **discover → read → synthesize → verify → review** — with auditable provenance throughout.

The disciplines are: mechanical, software, civil, electrical, and architectural.

It is **not** an engineering coach. No persona lectures, no generic "discipline stance", no adjacent tooling lanes (CAD/BIM/unit conversion are out of scope unless they serve an active research run).

## Feature scope (F1 — Feature-scope discipline)

Vitruvius must stay lean. It is a research agent for engineering, not a bundle of adjacent engineering productivity workflows.

### What belongs (core research jobs)

Every new skill, command, or capability must fight for its life before implementation. Keep or add something only when it directly improves at least one core research job:

- **Discovering** engineering knowledge: standards, code provisions, handbooks, vendor docs, datasheets, prior designs, repos, or prior art
- **Reading**, extracting, and understanding engineering documents, drawings, specs, or code
- **Ranking** evidence, methods, or design alternatives
- **Verifying** claims and numbers against sources, standards, models, or experiments
- **Synthesizing** engineering research into auditable artifacts
- **Improving** provenance, verification, or reliability of the research loop

### What does NOT belong (reject by default)

- CAD/BIM tooling (modeling, drafting, rendering)
- Unit conversion or general calculation engines
- Project management, funding, sales, admin
- Generic writing (marketing, documentation not tied to research output)
- Coaching or persona lectures ("explain like I'm 5" is fine for engineering; life coaching is not)
- Adjacent product lanes unless explicitly scoped as support for a specific active research run

When in doubt, reject. A capability can always be added later when a real research need emerges.

### How to evaluate a new skill proposal

1. Which core research job does it improve?
2. Can an existing skill already do this with a parameter change?
3. Does it serve all five disciplines, or is it domain-specific? (Both are fine — but know which.)
4. What is the maintenance cost? (References, scripts, and frontmatter add long-term burden.)
5. Can it be tested? (If you can't write a test for it, it shouldn't ship.)

If the answer to (1) is vague or (2) is "yes", reject the proposal.

## Research subagents

Vitruvius ships research roles (as subagents when the host supports them, otherwise performed by the lead agent):

- `researcher` - evidence gathering
- `writer` - synthesis
- `verifier` - citations + source verification (read-only: no Write/Edit — a judge, not a fixer)
- `reviewer` - adversarial review (read-only: reports findings, never repairs)
- `arbiter` - adjudicates verifier disagreement (no re-research)
- `goal-checker` - independent end-of-run completion check (default NOT-DONE; re-derives every ask from the original question, not the plan)

The source of truth for their behavior is the canonical role definitions in `agents/` (`agents/researcher.md`, `agents/verifier.md`, `agents/reviewer.md`, `agents/arbiter.md`, `agents/writer.md`) and `skills/engineering-research/SKILL.md`. Do not duplicate those prompts in this file. OpenCode host adapters live in `.opencode/agent/` as thin copies.

## Integrity commandments (apply to every agent, every run)

1. **Never fabricate a source.** Every named standard, code, provision, product, material, project, or dataset must have a verifiable reference. If you cannot find one, do not mention it.
2. **Never claim something exists without checking.** Before citing a standard, code section, vendor doc, or repo, verify it exists. If a search returns zero results, it does not exist — do not invent it.
3. **Never extrapolate details you haven't read.** If you have not fetched and inspected a source, you may note its existence but must not describe its contents, numbers, or claims.
4. **A reference or it didn't happen.** Every claim in an output must trace to a checkable source: standard + section, URL, artifact path, or calculation.
5. **Read before you summarize.** Do not infer a code provision, a spec value, or a material property from a title, a snippet, or memory when a direct read is possible.
6. **Mark status honestly.** Distinguish `verified`, `inferred`, `blocked`, and `unverified`. Never smooth over missing checks.

## Provenance and verification

- Every research output must include a `.provenance.md` sidecar.
- Provenance sidecars record source accounting and verification status.
- If a workflow uses the words `verified`, `confirmed`, or `checked`, the underlying artifact must record what was actually checked and how.
- For quantitative or code-backed outputs, keep raw artifact paths, scripts, calculations, or logs that support the final claim. Do not rely on polished summaries alone.
- Never claim a fix or a check landed unless an explicit on-disk verification (read, grep, diff) proves it.
- If verification could not be completed, mark the output `Verification: BLOCKED` or `PASS WITH NOTES` and list the missing checks.

## Skill frontmatter rules (S9 — AGENTS.md rigor)

Every skill's `SKILL.md` frontmatter MUST conform to the structural contract enforced by `scripts/validate-contract.mjs`:

- **Allowed fields:** `name`, `description`, `license`, `compatibility`, `allowed-tools`, `argument-hint`, `metadata`. Anything else goes under `metadata`.
- **Required fields:** `name`, `description`, `metadata.version`.
- **Version bump discipline (N7):** any behavioral change to a skill MUST bump its `metadata.version` in the same change.
- **Name matches directory:** The `name` field must equal the skill's directory name (e.g., `skills/gap-analysis/SKILL.md` has `name: gap-analysis`).
- **allowed-tools format:** Space-separated string, no commas or arrays (e.g., `allowed-tools: Write Edit Bash`).
- **Length limit:** SKILL.md must be ≤ 500 lines.
- **No stray tests:** Tests belong in `tests/<skill-name>/`, not inside the skill directory.
- **Local links resolve:** Any `references/`, `assets/`, `scripts/`, or `agents/` path referenced in the skill must exist on disk.
- **Skill references resolve:** Every `/skill-name` mentioned in a SKILL.md must be an actual skill in `skills/` (validated).

### Validation steps

Before committing a new skill or capability:

1. Run `npm run test:contract` — all skills must pass the structural contract.
2. Run `npm run test:gap` (or equivalent for the new skill) — skill-specific tests must pass.
3. Verify the skill appears in the README "What each skill does" section.
4. Verify the skill links to `references/evidence-quality-tiers.md` if it produces research output.
5. Verify S7 boundary language is present ("research-only, not for final engineering sign-off").

### Update discipline

When modifying an existing skill:

1. Update the skill's SKILL.md — do not duplicate its content in AGENTS.md.
2. Update the README "What each skill does" section if behavior changes significantly.
3. Add or update tests in `tests/<skill-name>/` for new logic.
4. Run the full test suite (`npm test`) before committing.

## Artifact conventions

- Derive a short **slug** from the topic: lowercase, hyphenated, no filler words, at most 5 words (e.g. `steel-brace-connection`). Every file in a run uses that slug as a prefix.
- Plan: `outputs/.plans/<slug>.md`
- Intermediate research: `<slug>-research-<scope>.md`
- Draft: `outputs/.drafts/<slug>-draft.md`
- Cited brief: `outputs/.drafts/<slug>-cited.md`
- Verification: `<slug>-verification.md`
- Final output: `outputs/<slug>.md` or `papers/<slug>.md`
- Provenance: `<slug>.provenance.md` (next to the final output)

Never use generic names like `research.md`, `draft.md`, or `brief.md`. Concurrent runs must not collide.

## Delegation rules

- The lead agent plans, delegates, synthesizes, and delivers.
- Use subagents when work is meaningfully decomposable; do not spawn them for trivial work.
- Prefer file-based handoffs over dumping large intermediate results back into parent context.
- The lead agent is responsible for reconciling task completion. Subagents may not silently skip assigned tasks.
- For critical claims, require at least one adversarial verification pass after synthesis. Fix fatal issues before delivery or surface them explicitly.

## Tool discipline

- Use only tool names visible in the current tool set. If a tool returns "not found", do not retry the same invalid call — map to a canonical visible tool or record the capability as blocked.
- Prefer official standards portals, code body text, primary vendor documentation, and primary data over secondary summaries.
- When a source is paywalled or unreachable, cite it from search metadata and mark full-text access as blocked instead of guessing at its contents.
