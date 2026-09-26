# Provenance sidecar (minimal shape)

Any skill that writes a research artifact writes a colocated
`<artifact>.provenance.md` beside it. `engineering-research` carries a fuller
template (with `Final SHA-256`, `Final bytes`, and the `GOAL-CHECK` line); this
is the minimum for every other research output.

```markdown
# Provenance: [topic]
- **Artifact:** `[path]`
- **Date:** [date]
- **Sources consulted:** [count and/or list]
- **Sources accepted:** [count and/or list]
- **Sources rejected:** [dead, unverifiable, or out of scope]
- **Verification:** [verified / partial / blocked / failed]
- **Claims verified:** [count]
- **Claims partial:** [count — directionally correct but need qualification]
- **Claims blocked:** [count — source unreachable or unverifiable]
- **Plan:** [path, or "none — direct run"]
```

A sidecar is not a badge: list what was actually checked, accepted, and
rejected. If verification could not be completed, mark the output `blocked` or
`partial` and name the missing checks.

Research-only, not for final engineering sign-off.
