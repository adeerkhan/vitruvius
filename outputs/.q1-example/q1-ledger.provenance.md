# Provenance: Q1 evidence-ledger example

- **Date:** 2026-09-25
- **Run ID:** `d79a8dcd-7f81-464a-b970-cea45e091fc3`
- **L1 entry:** `outputs/.q1-example/runs/2026-09-25.jsonl` SHA-256 `573be434a1f0441e7c1f958ca26fe445d0e689d1e1dc094631ce10bcab1234fb` (306 bytes)
- **Evidence ledger:** `outputs/.q1-example/runs/d79a8dcd-7f81-464a-b970-cea45e091fc3.evidence.json` SHA-256 `51af3c943533c7d1bcf97f086009d744565e363949d6632ab0343def78f755b9` (3967 bytes)
- **Subagent:** fresh general session `ses_f2814ebedffeu1PAFC9QxCGz8x`; this is unverified process metadata, not an independently authenticated identity. The initial draft was rejected after missing support locators, then corrected in the same session and revalidated.
- **Sources consulted:** `tests/engineering-research/fixtures/q1/requirement.md` (230 bytes), `tests/engineering-research/fixtures/q1/challenge.md` (226 bytes), and `tests/engineering-research/fixtures/q1/search-boundary.md` (334 bytes). Their SHA-256 values are recorded in the evidence ledger.
- **Sources accepted:** all three local synthetic fixtures; no web or external source.
- **Raw subagent draft:** `outputs/.q1-example/agent-evidence.json` SHA-256 `c2424828660d098220baef23640f8b9a9eeb461e9ced0a2cd33e1c9020b0968b` (3895 bytes).
- **Verification:** `PASS` — `node scripts/validate-evidence.mjs outputs/.q1-example/runs/d79a8dcd-7f81-464a-b970-cea45e091fc3.evidence.json` returned `PASS: evidence.v1 valid (3 sources, 1 searches, 2 claims; completion=partial)`.
- **Completion:** `partial` — the local comparison is verified, while real-world compliance remains explicitly unresolved and ambiguous.
- **Claim counts:** verified 1; partial 1; blocked 0; unverified 0; inferred 0; failed 0.
- **Plan:** none — fixed Q1 fixture example; the L1 run was created before the evidence ledger.
- **Limitations:** synthetic local fixtures only; L1 has no partial-claim counter, so the unresolved claim is carried by the evidence ledger, completion field, and this sidecar. This is not model-quality, cost, novelty, or real-world engineering certification.
