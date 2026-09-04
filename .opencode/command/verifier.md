---
description: Blind Verifier — independent subagent that checks a claim against evidence without seeing the author's reasoning. Usage: /verifier <claim>
---

Run the Blind Verifier skill on the $ARGUMENTS claim: activate
`/skill:verifier`. The verifier receives the question, gathered evidence
(with source locations), and claimed conclusion — but NOT the reasoning
chain. It runs 7 adversarial checks (code applicability, units/signs,
omitted cases, missing factors, calculation integrity, source-to-claim
fidelity, conflicts) and returns PASS / PARTIAL / BLOCKED with evidence
trail. Default-FAIL: PASS must be earned. BLOCKED is a legitimate outcome.
