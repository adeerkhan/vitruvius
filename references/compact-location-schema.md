# Compact Location Schema

A minimal location schema for citing code and document locations. Stolen from
Semble's chunk location format.

## Format

```
file:line
file:line-line
```

## Rules

1. **File path** is relative to the repository root.
2. **Line** is 1-based.
3. **Range** is inclusive (`10-20` means lines 10 through 20).
4. **No scheme prefix** — not `file:`, not `Path:`. Just `path:line`.

## Examples

```
skills/engineering-research/SKILL.md:10
skills/engineering-research/SKILL.md:10-20
scripts/validate-contract.mjs:42
references/plan-state.md:15-30
```

## When to Use

Use the compact schema when:
- Citing a specific location in a file (problem-anchor, evidence ledger)
- Referencing a range of lines in a source document
- Recording search results from the retrieval bridge

Do NOT use for:
- URLs (use the full URL)
- Section references (use `document.md#section-name`)
- Standard citations (use `standard §section.edition`)

## Integration

The compact schema is the default location format for:
- `references/problem-anchor-contract.md` — `repo` claims use `path:line`
- `references/evidence-ledger.md` — source locators use `file:line`
- `scripts/retrieval-bridge.mjs` — search results use `file:line`
