# Vitruvius agent roles

This directory holds the canonical role definitions — the source of truth for
how each research role behaves (tool bounds, dispatch contracts, and report
shapes). Host adapters point at these files; the definitions are not copied.

The harness distribution (host packages, the install contract, and the
installer) lives in [`installer/`](../installer/README.md). `skills/` is the
harness-agnostic core.

| Path | What it is |
| --- | --- |
| `agents/researcher.md` | Evidence gathering |
| `agents/writer.md` | Synthesis |
| `agents/verifier.md` | Citations + source verification (read-only) |
| `agents/reviewer.md` | Adversarial review, reports only (read-only) |
| `agents/arbiter.md` | Adjudicates verifier disagreement (no re-research) |
| `agents/goal-checker.md` | Independent end-of-run completion check (default NOT-DONE) |
| `agents/habit.md` | Durable research-preference extraction (read-only) |

Run `node installer/install.mjs --target . --all` to project the host adapters
that reference these roles into a project.
