# Contributing to Vitruvius

Vitruvius is a portable engineering research agent — a collection of Agent Skills, host plugins, and a Command Code mod. This guide is for humans and agents contributing skills, prompts, docs, plugin code, or workflow behavior to the repository.

## Quick Links

- GitHub: https://github.com/adeerkhan/vitruvius
- Repo agent contract: [AGENTS.md](AGENTS.md)
- Implementation plan: [IMPLEMENTATION.md](IMPLEMENTATION.md)
- Issues: https://github.com/adeerkhan/vitruvius/issues

## What Goes Where

- Always-on agent ruleset: `AGENTS.md`
- Skills (the core): `skills/<name>/SKILL.md`
- Shared research method: `skills/engineering-research/SKILL.md`
- Discipline lenses: `skills/{mechanical,software,civil,electrical,architectural}/SKILL.md`
- OpenCode plugin + commands: `.opencode/plugins/`, `.opencode/command/`
- Command Code mod: `.commandcode/mods/vitruvius.ts`
- Package metadata: `package.json`
- Install docs: `README.md`
- Generated research artifacts (do not commit): `outputs/`, `papers/`

If you change how a discipline behaves, edit that discipline's `SKILL.md` lens. If you change the shared research method, edit `skills/engineering-research/SKILL.md` and its agent definitions. Do not duplicate method behavior in `AGENTS.md`.

## Before You Open a PR

1. Start from the latest `main`.
2. Make your change.
3. Run the required checks before asking for review:

```bash
npm test
```

`npm test` runs `scripts/validate-skills.mjs`, which checks that every skill is a directory with a `SKILL.md` carrying YAML frontmatter (`name` matching the folder, plus `description`).

4. If you changed a skill body, verify it loads in a real host. Command Code, for example:

```bash
command-code -p "Name the available skills." --skill ./skills --no-skills --skip-onboarding
```

5. Keep the PR focused. Do not mix unrelated cleanup with the real change.
6. Update `README.md` when the user-facing install surface changes, and `IMPLEMENTATION.md` when the structure or roadmap changes.

## Contribution Rules

- Bugs, docs fixes, new discipline skills, and focused workflow improvements are good PRs.
- New skills and capabilities must serve a core research job (see the feature scope in `AGENTS.md`). Reject adjacent product lanes by default.
- Large feature changes should start with an issue or a concrete implementation discussion before code lands.
- Avoid refactor-only PRs unless they unblock a real fix or are requested by a maintainer.
- Do not add bundled skills or docs whose primary purpose is to market, endorse, or funnel users toward a third-party product or service.
- Keep the repo self-contained: do not reference private or upstream research projects by name in shipped docs.

## Repo-Specific Checks

### Skill changes

- New research workflows live in `skills/<name>/SKILL.md`.
- Keep skill files concise and declarative. The shared method lives once in `engineering-research`; a discipline skill is a thin lens over it.
- Every skill folder name must match the `name` in its frontmatter (lowercase, hyphens).
- Every research output a skill mandates must carry a `.provenance.md` sidecar.
- If a skill names research sources (standards bodies, paper indexes, search tools), prefer neutral, tool-agnostic wording and mark paywalled or blocked access honestly.

### Research-source guidance

Vitruvius research may draw on paper and scholar indexes where they serve the question:

- Prefer primary sources (standards bodies, code text, official vendor docs) first.
- Paper indexes and scholarly search (AlphaXiv-style paper Q&A, Google Scholar) are acceptable discovery layers — but a claim is only `verified` when the underlying source has been read directly.
- When a full text is paywalled or unreachable, cite it from search metadata and mark full-text access as `blocked`. Never guess at contents.

## AI-Assisted Contributions

AI-assisted PRs are fine. The contributor is still responsible for the diff.

- Understand the change you are submitting.
- Run the local checks yourself instead of assuming generated code is correct.
- Include enough context in the PR description for a reviewer to understand the change quickly.
- If an agent updated skills or prompts, verify the instructions match the actual repo behavior.

## Review Expectations

- Explain what changed and why.
- Call out tradeoffs, follow-up work, and anything intentionally not handled.
- Resolve review comments you addressed before requesting review again.

## Good First Areas

- New discipline depth: evidence landscapes, verification criteria, deliverable shapes
- Docs clarity and install-path coverage
- New host adapters (Claude Code, Codex, Cursor, Qoder)
- Packaging and release hygiene
- Validator and test coverage
