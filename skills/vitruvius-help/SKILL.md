---
name: vitruvius-help
description: >
  Quick-reference card for all Vitruvius commands, disciplines, and the shared
  research method. One-shot display, not a persistent mode. Trigger:
  /vitruvius-help, "vitruvius help", "what vitruvius commands", "how do I use
  vitruvius".
---

# Vitruvius Help

Display this reference card when invoked. One-shot; do not persist anything.

## What Vitruvius is

An engineering research agent: discover → read → synthesize → verify → review,
with auditable provenance.

## Commands

| Command | What it does |
|---------|--------------|
| `/vitruvius <discipline or question>` | Smart dispatcher — routes to discipline or skill automatically. |
| `/vitruvius:civil <question>` | Civil / structural engineering research (buildings, bridges, steel, concrete, geotech). |
| `/vitruvius:mechanical <question>` | Mechanical engineering research (design, thermal, fluids, materials). |
| `/vitruvius:software <question>` | Software engineering research (architecture, frameworks, security). |
| `/vitruvius:electrical <question>` | Electrical / electronics research (power, controls, EMC). |
| `/vitruvius:architectural <question>` | Architectural research (building science, facades, codes). |
| `/vitruvius:verifier <claim>` | Blind Verifier — independent subagent checks claim vs evidence. |
| `/vitruvius:verify <claim>` | Verify a claim/calculation against authoritative sources. |
| `/vitruvius:compare <items>` | Source/standard/design comparison matrix. |
| `/vitruvius:review <artifact>` | Severity-graded artifact review. |
| `/vitruvius:audit <target>` | Claim-vs-implementation mismatch audit. |
| `/vitruvius:summarize <doc>` | Faithful structured document digest. |
| `/vitruvius:eli5 <topic>` | Plain-language engineering explanation. |
| `/vitruvius:artifact-reading <doc>` | Anchored document reading + extraction. |
| `/vitruvius:scholarly-research <topic>` | Academic literature discovery (OpenAlex, arXiv, etc.). |
| `/vitruvius:standards-lookup <standard>` | Engineering standards (AISC, ACI, ASCE, IEEE, Eurocode). |
| `/vitruvius:help` | This reference card. |

## The shared research method

Every discipline skill runs the same loop (`/skill:engineering-research`):

1. **Plan** — write `outputs/.plans/<slug>.md`, get user confirmation.
2. **Scale** — direct search for narrow questions; researcher subagents only
   when decomposition clearly helps.
3. **Gather evidence** — multiple query angles, primary sources first, an
   evidence table with stable numeric IDs.
4. **Draft** — synthesize yourself, no invented sources or numbers.
5. **Cite** — inline citations; verify every reference means what it claims.
6. **Review** — adversarial verification pass; fix FATAL issues.
7. **Deliver** — final file plus `.provenance.md` sidecar.

Four research roles: `researcher` (gather), `writer` (synthesize), `verifier`
(cite + verify), `reviewer` (critique). Subagents when the host supports them,
otherwise the lead agent performs all four.

## Non-negotiables

- Never fabricate a source. A reference or it didn't happen.
- Every output has a `.provenance.md` sidecar recording sources and
  verification status.
- Mark status honestly: `verified`, `inferred`, `blocked`, `unverified`.
- A numeric claim without a unit, sign convention, and source is noise — flag
  it.

## Deactivate / stop

Say "stop vitruvius" or "normal mode" to stop an active research run. The
skills remain available to invoke on demand.

## Scope and Boundaries

- Vitruvius produces research — it does NOT produce final designs, construction documents, or implementation guidance.
- **Research-only, not for final engineering sign-off.** Licensed engineers must review and approve any design based on this research.
