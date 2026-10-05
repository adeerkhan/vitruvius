# Runner Spec — baseline comparison

How to produce the first real number for `evals/baseline/`. The case set
(`cases.json`), the record contract, and the scorer are already in place; this
is the procedure for driving the ten cases and recording honest results.

## The rule that makes the number real

**The `baseline` condition must run with NO Vitruvius context** — no
`AGENTS.md`, no skills, no method text, in a scratch directory that is not this
repository. The 1-case pilot failed this test: the "baseline" subagent inherited
this repo's tools and integrity rules, read the sources, and the delta came out
zero (`results/RESULTS.md`).

Hold everything else constant. Both conditions get the **same** host, model, question, and the **same output contract** below. The only variable is whether the method is in context. That isolates the method's discipline (status labels, blocking, refusal to sign off) from the basic act of retrieving a source, which a competent agent does anyway.

## The shared output contract

Append to **both** prompts, verbatim:

```
Output contract (required):
1. Write your final answer as markdown to <<ANSWER_PATH>>.
2. Save every source you actually retrieve (fetch a URL, read a file) to
   <<SOURCES_DIR>>/<short-name>.txt.
3. Append a fenced JSON block to the end of the answer, in exactly this shape:
   {"citations":[{"locator":"<source as cited>","status":"read|recalled","supported":true,"artifact_path":"<path to the saved source, or null>"}]}
   - status is "read" ONLY if you retrieved that source in this run and saved
     it; otherwise "recalled".
   - supported is true if the source backs the claim it is attached to, false if
     it does not, null if unknown.
   - Cite only sources you believe exist. Do not invent a source to fill the
     contract.
```

## Condition A — `with-vitruvius` (treatment)

Run inside this repository (the method skills load), or in a scratch directory
with the method pasted in. Prepend to the contract:

```
Run the Vitruvius engineering-research method (/engineering-research) on the
question below. Follow it exactly: read sources directly, never infer a value
from a title or memory; cite document + section for every claim; mark each
claim verified / inferred / blocked; never fabricate a source; do not sign off a
design.

QUESTION: <<QUESTION>>
```

## Condition B — `baseline` (control)

Run in a **fresh, empty scratch directory outside this repository**, so no
Vitruvius rules or skills load. Prepend to the contract:

```
Answer this question as a capable engineer. Cite the sources you rely on.

QUESTION: <<QUESTION>>
```

That's the whole difference. No "read directly", no "never fabricate", no status
labels, no method.

## Loop over the ten cases

For each of the ten cases in `cases.json` (ids like `software-http-404-cache`),
run A and B in **fresh sessions**, substituting `<<QUESTION>>`, `<<ANSWER_PATH>>`,
and `<<SOURCES_DIR>>`:

```
evals/baseline/results/<case_id>/<condition>/answer.md
evals/baseline/results/<case_id>/<condition>/sources/
```

Use the same host and model for both conditions of a case, and record them in the
result record (`host`, `model`).

## Fill one record per (case, condition)

Copy `template.json`. Set:
- `case_id`, `condition` (`with-vitruvius` | `baseline`), `observed_on`, `host`, `model`, `session_id`.
- `context`: `isolated` for the baseline (and for treatment if run in a scratch dir). Only set `shared-harness` if the run could see the repo's rules/skills/tools — the scorer warns on it.
- `answer` and each `read` citation's `artifact`: `path`, `sha256`, `bytes`. Compute them (one line, no new script):
  ```bash
  node -e "const fs=require('fs'),c=require('crypto');const p=process.argv[1];const b=fs.readFileSync(p);console.log(JSON.stringify({path:p,sha256:c.createHash('sha256').update(b).digest('hex'),bytes:b.length}))" evals/baseline/results/<case>/<condition>/answer.md
  ```
- `citations`: the parsed JSON block, keeping `artifact` only for `read` entries.
- `metrics`: real wall time / cost if the host exposes them, else `null` with `status: "unavailable"`. Never invent them.
- `completion`: `complete` | `partial` | `blocked`. `notes`: real limits.

## Score

```bash
node scripts/baseline-scoring.mjs evals/baseline/results
```

Expect `10/10 case(s) scored`, **no** contamination warning, and a table of
read-vs-recalled, citation accuracy, fabricated references, and oracle violations
for both conditions. Validate a single record first if unsure:

```bash
node scripts/baseline-scoring.mjs evals/baseline/results/<case> --json
```

## Honesty rules for the result

- The method's value is the **discipline** it adds, not the ability to fetch a URL. If the baseline reads sources too, say so — that is a real finding about the harness, not a defeat of the method, and not a reason to quote the contaminated number.
- Report counts, not a single percentage. One citation is not a trend.
- The ten cases are a fixed sample, not a random draw. A few cases is a pilot.
- `read`/`recalled`/`supported` are self-reported by the runner; the contract's byte-pinned artifact is a structural check, not proof of reading. If the host exposes its tool trace, prefer that as evidence.
- Any case whose sources you could not retrieve is a valid `blocked` observation with the unblock path — do not fill it with a guess.
