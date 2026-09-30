# Rejected changes

An append-only ledger of prompt, skill, verifier, and eval changes that were
attempted and rejected on evidence, so the same idea is not re-proposed without
the earlier result. Transfer From the src-02 evals/skill-impact.md`.

Add one row per rejected proposal. Never record accepted changes here, and never
rewrite or delete a row — git history is the immutability guarantee, and this
table is the readable index. Search it before proposing a change to an existing
skill (see `CONTRIBUTING.md`).

```bash
node scripts/rejected-change-ledger.mjs validate
node scripts/rejected-change-ledger.mjs append --date 2026-09-29 \
  --artifact verifier --change "raise the false-approval floor to 5%" \
  --evidence "benchmark run 2: 1 false approval, 0 false blocks" \
  --outcome "rejected — weakens the safety gate for one noisy result"
```

Rows are ordered newest first, and `validate` refuses an append dated earlier
than the last row. Keep the date in the example current or the very next
append fails on the example rather than on a real rejection.

| Date | Artifact | Attempted change | Rejection evidence | Outcome |
|---|---|---|---|---|
| 2026-09-29 | scholarly-research | add rate-limit pacing and a single-429-retry rule for OpenAlex/Semantic Scholar/Crossref calls (P3, from src-05 extensions/research-tools/science-databases.ts:142) | Read the source: src-05 paces requests because its own extension code issues the HTTP calls and can sleep between them. In Vitruvius no shipped code calls these APIs - the agent issues them with host tools. grep for fetch(/node:https across scripts, skills, agents, tasks returns exactly two hits, both PDF download paths. A pacing rule therefore has no code to pace and cannot be tested. | rejected - no code surface. The agent's host issues the request, so a retry budget is a host capability, not a skill rule. The one existing sentence (SKILL.md:97) already tells the agent to fall back to OpenAlex, which is the achievable half. Revisit if a skill ever gains an HTTP client. |
| 2026-09-29 | repo-root | add a PowerShell installer mirroring the documented npx path (P4, from src-05 scripts/install/install.ps1) | Read src-05 scripts/install/install.ps1:1-40: it resolves a GitHub release tag, downloads a native bundle, and runs version-channel normalisation (latest/stable/edge). Vitruvius has no Bash installer to mirror - a search for install*.sh/setup*.mjs across the repo returns nothing - and installation is a single 'npx skills add adeerkhan/vitruvius' line in README.md:296. There is no bundle, no version channel, and no release asset to download. | rejected - nothing to mirror. A second installer for a one-line npx install duplicates a working path and adds a surface that must be tested per host. |
| 2026-09-29 | repo-root | add a .cursor-plugin manifest so Cursor installs Vitruvius (P6, from src-06 .cursor-plugin/plugin.json) | Read src-06 .cursor-plugin/plugin.json: it is a distribution manifest: name, description, version, author, homepage, repository, license, keywords. AGENTS.md F1 rejects adjacent product lanes - distribution is not discovering, reading, ranking, verifying, or synthesising engineering knowledge. No Cursor user has been named. | rejected by F1 scope. Adding a host manifest is a distribution decision, not a research capability. |
