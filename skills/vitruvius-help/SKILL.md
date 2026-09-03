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
| `/vitruvius <discipline or question>` | Entry point / dispatcher. Routes to the matching discipline skill. |
| `/vitruvius-help` | This card. |
| `/mechanical <question>` | Mechanical engineering research (mech design, thermal, fluids, materials, manufacturing). |
| `/software <question>` | Software engineering research (code, system design, technical landscape). |
| `/civil <question>` | Civil / structural engineering research (structures, geotech, transportation, water). |
| `/electrical <question>` | Electrical / electronics engineering research (power, electronics, controls). |
| `/architectural <question>` | Architectural research (buildings, facades, building science). |
| `/skill:scholarly-research <topic>` | Academic literature discovery: OpenAlex, Semantic Scholar, arXiv, alphaXiv. |

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
