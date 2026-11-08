# Habit candidate — concise evidence tables

**Status: proposed.** Not approved, not active. No file other than this answer was written.

- Present evidence comparisons as concise tables: one row per claim or source, with its anchor and status. — For research outputs and in-chat evidence summaries. Use a table when comparing two or more sources, claims, or design options; each row names its reference (standard + clause, `path:line`, or URL) and carries a per-row status (`verified` / `partial` / `blocked` / `unverified` / `inferred` / `failed`). Keep cells short; a single claim stays prose. [e: u1]

Normalized candidate (lead-owned id `h1`, scope `engineering-research`, status `proposed`):

```json
{"id":"h1","t":"Present evidence comparisons as concise tables: one row per claim or source, with its anchor and status.","d":"Use for two or more sources, claims, or options; name each row's reference (standard+clause, path:line, or URL) and give a per-row status. Keep cells short; a single claim stays prose.","e":["u1"],"scope":"engineering-research","status":"proposed"}
```

**Evidence limit.** The run window here is one user turn, so `u1` is the only evidence. It is an explicit instruction to make this a standing convention, not a task-scoped rule, so it qualifies — but it is a single statement and I did not widen it.

**Not done, and why.** The brief, ledger (`outputs/.habits/<slug>.json`), provenance sidecar, and the `validate` / `approve` / `activate` steps were not run: writes were restricted to this answer file, so there is no ledger to validate and no store to activate.

**To activate after your review:**

```
node scripts/habit-ledger.mjs validate outputs/.habits/concise-evidence-tables.json
node scripts/habit-ledger.mjs approve outputs/.habits/concise-evidence-tables.json --id h1 --by user
node scripts/habit-ledger.mjs activate outputs/.habits/concise-evidence-tables.json --store outputs/.habits/active.json
```

Activation also requires the `.provenance.md` sidecar with `Sources`, `Verification`, and `Approval` sections recording `approvedBy: user`.

**One judgement call.** "Concise" is not quantified, so I read it as one row per item, short cells, no prose paragraphs inside cells. Tell me if you want a hard cap (e.g. at most 6 columns, no cell over 15 words) and I will tighten `d` before approval.

Research-only; not for final engineering sign-off.
