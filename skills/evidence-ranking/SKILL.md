---
name: evidence-ranking
description: >
  Rank and score engineering evidence by quality using the tier system. Use
  when the user asks to "rank papers", "assess evidence quality", "which source
  is more reliable", or needs transparent evidence scoring for a research
  question. Produces a scored evidence table with tier assignments. Do NOT use
  for final source selection — this skill scores evidence, the human decides.
argument-hint: "<research question or evidence list>"
allowed-tools: Write Edit Bash Read
license: MIT
---

# Evidence Ranking

Score and rank engineering evidence using the tier system from `references/evidence-quality-tiers.md`. This skill provides transparent, auditable evidence scoring — never a black-box "relevance" score.

## Invocation

```
/evidence-ranking <research question>
```

Optionally provide a list of sources to rank. If none provided, use `scholarly-research` to discover sources first, then rank them.

## Methodology

1. **Identify evidence items** — from user input or scholarly-research discovery. Each item needs: title, authors, year, venue, DOI/URL, and a brief summary of the claim it supports.

2. **Score each source on engineering-specific criteria** (from `references/evidence-quality-tiers.md`):

   | Criterion | Weight | What to assess |
   |-----------|--------|----------------|
   | **Source tier** | High | Standard (Tier 1) > peer-reviewed journal (Tier 2) > conference/preprint (Tier 3) > vendor/weak (Tier 4) |
   | **Methodology** | High | Experimental data > validated models > surveys > opinions |
   | **Citation authority** | Medium | Cited by standards, referenced in code commentaries, or high citation count (>50 for engineering) |
   | **Reproducibility** | Medium | Open data, open code, explicit methods enable re-verification |
   | **Recency** | Low | Within 10 years for fast fields (software, AI); 20+ years acceptable for slow fields (structural, geotech) |

3. **Assign tier and confidence**:
   - **Tier 1 (Authoritative):** Score 9-10 — governs engineering practice
   - **Tier 2 (Reliable):** Score 7-8 — solid primary evidence
   - **Tier 3 (Supporting):** Score 4-6 — useful for context, not standalone
   - **Tier 4 (Weak):** Score 1-3 — rejected as primary evidence

4. **Flag conflicts** — when sources disagree, identify the conflict, note which is newer, which is jurisdiction-specific, and what a decision-maker should weigh.

## Output

### Inline Summary (chat response)
- Research question
- Top 3 sources by tier and score
- Conflicts identified (if Any)
- Overall evidence strength for the question

### Full Ranking (saved to disk)

Save to `outputs/evidence-ranking/<slug>.md`:

```markdown
# Evidence Ranking: <research question>

## Question
<restated question>

## Evidence Items

| # | Source | Year | Venue | Tier | Score | Key Claim | Status |
|---|--------|------|-------|------|-------|-----------|--------|
| 1 | [Author](DOI) | 2024 | Journal | 1 | 9 | <claim> | verified |
| 2 | [Author](DOI) | 2023 | Conference | 3 | 5 | <claim> | verified |

## Tier Distribution
- **Tier 1:** <count> sources
- **Tier 2:** <count> sources
- **Tier 3:** <count> sources
- **Tier 4:** <count> sources (rejected as primary)

## Scoring Rationale

### Source 1: [title]
- **Tier:** 1 | **Score:** 9/10
- **Why:** Standard/code provision, cited by [standard], experimental validation
- **Limitations:** <scope, age, jurisdiction>

## Conflicts

### Conflict: <description>
- **Source A** says: <claim> [Tier 1]
- **Source B** says: <claim> [Tier 2]
- **Resolution:** A is newer and cited by standards; B is jurisdiction-limited

## Evidence Strength
- **Overall:** Strong / Moderate / Weak
- **Recommendation:** <what the evidence supports, with qualifications>
```

## Scope and Boundaries

- This skill scores evidence — it does NOT select the "best" source. Human engineering judgment decides.
- **Research-only, not for final engineering sign-off.**
- Never fabricate scores. If a source cannot be assessed, mark it `unverified`.
- Tier 4 sources are flagged as rejected for primary use but may support context.
- Evidence quality: see `references/evidence-quality-tiers.md`.
