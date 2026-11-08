# Software landscape: Vitruvius architecture options

**Scope substitution.** The request named no system, artifact, or decision, so the input gate failed. I treated this repository as the artifact: `adeerkhan/vitruvius` at commit `600b764` (8 Nov 2026), v0.5.1.

**Codebase claims (read on disk):**

| # | Claim | Anchor | Status |
|---|---|---|---|
| 1 | Skills are Markdown contracts — 27 of them — with no runtime engine loading them. | `skills/*/SKILL.md` | verified |
| 2 | The installer renders host adapters from canonical sources; derived files are not committed. | `installer/render.mjs:4-13` | verified |
| 3 | The OpenCode plugin is metadata only (9 lines), so gates are not enforced in the model loop. | `installer/hosts/opencode/plugins/vitruvius.mjs:1-9` | verified |
| 4 | 52 Node ESM scripts (Node ≥20, one optional dependency, `pdf-parse`) carry the validators; `npm test` chains them. | `package.json:22-27,66-67` | verified |
| 5 | No outcome evidence exists yet: the E1 model-run manifest records zero runs. | `evals/e1-runs/manifest.json:10` | verified |

**Options and trade-offs:**

- **A. Portable skill bundle (status quo).** Widest host reach — opencode, claude, codex, cursor, qoder, windsurf and others (`installer/contract.mjs:197-237`) — at the lowest token cost. Weakest enforcement: a model can skip gates.
- **B. Single-source rendering (current direction).** Canonical `agents/*.md` and contract mean adapters cannot drift; cost is a `--check` gate and duplicated installed trees.
- **C. Runtime-enforced layer** (tool or MCP) for problem-anchor, goal-check, and provenance. Fail-closed and deterministic; costs Node-process portability, latency, and host integration work.
- **D. Hosted verification service.** Central policy and telemetry; worse offline use and a harder trust/provenance story.

**Recommendation (inferred, not measured).** Keep A+B for distribution and add C as an opt-in. Evidence that would change it: measured rates of skipped gates in blind runs once runs exist, and whether target hosts can register tools.

**Not checked.** No external host docs, benchmarks, or prior systems were read here; the prior-art comparison is `inferred`. Every claim above is pinned only to the cited lines.

*Research only — not for final engineering sign-off.*
