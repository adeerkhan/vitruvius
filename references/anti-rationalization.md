# Anti-Rationalization Tables

Agents skip mandatory steps by rationalizing. Pair each excuse with a factual
counter-argument. Add a "Common Rationalizations" section to any skill that has
a mandatory gate the agent might try to skip.

## Pattern

| Excuse | Counter-argument |
|--------|------------------|
| "This is just a simple lookup, no need for full verification." | The verifier does not grade intent; it grades the artifact. A skipped gate is a failed gate. |
| "The source is well-known, I don't need to read it." | "Well-known" is a claim about a source. Read it or mark the claim `unverified`. |
| "The user didn't ask for provenance." | Provenance is not optional. Every research output includes a `.provenance.md` sidecar. |
| "I already know the answer from training data." | Training data is not a citation. Mark it `unverified` or find a source. |
| "The blocked source is probably fine to guess at." | A blocked source is a blocked source. Cite from metadata, mark `blocked`, never guess. |
| "This finding is background, not a claim, so it doesn't need an anchor." | If it is in the report, it is a claim. If it has no anchor, remove it. |
| "The verifier passed, so the research is done." | Verifier PASS means the artifact is internally consistent. It does not mean the question was answered — that is GOAL-CHECK's job. |
| "I can skip the plan update — it is just a formality." | The plan is the run's working memory. If it is not updated, the next interruption loses state. |
| "The evidence is sufficient; I do not need negative coverage." | Silence is not evidence. Record what you searched for and did not find. |
| "This is a routine claim, so one verifier is enough." | Routine means informational, not safety-critical. If it is safety-critical, escalate to 2 verifiers per the escalation rules. |

## Usage

Add a "Common Rationalizations" section to any skill that enforces:
- Integrity commandments (never fabricate, never guess at blocked sources)
- Verification gates (verifier, GOAL-CHECK, citation audit)
- Provenance requirements (sidecar, artifact hashes, source accounting)
- Problem anchors (artifacts under study, decisions, non-goals)

The table pairs each excuse with a factual counter-argument the agent can
apply in the moment. It does not add new rules — it makes existing rules
harder to rationalize away.
