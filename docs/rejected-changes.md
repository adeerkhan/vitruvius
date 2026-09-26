# Rejected changes

An append-only ledger of prompt, skill, verifier, and eval changes that were
attempted and rejected on evidence, so the same idea is not re-proposed without
the earlier result. Transfer from `ref/agent-skills/evals/skill-impact.md`.

Add one row per rejected proposal. Never record accepted changes here, and never
rewrite or delete a row — git history is the immutability guarantee, and this
table is the readable index. Search it before proposing a change to an existing
skill (see `CONTRIBUTING.md`).

```bash
node scripts/rejected-change-ledger.mjs validate
node scripts/rejected-change-ledger.mjs append --date 2026-09-26 \
  --artifact verifier --change "raise the false-approval floor to 5%" \
  --evidence "benchmark run 2: 1 false approval, 0 false blocks" \
  --outcome "rejected — weakens the safety gate for one noisy result"
```

| Date | Artifact | Attempted change | Rejection evidence | Outcome |
|---|---|---|---|---|
