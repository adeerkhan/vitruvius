# Post Angles

Pick exactly one angle per post or thread. Each angle names the evidence the
claim ledger must contain before the angle is allowed.

| Angle | The post says | Evidence required in the ledger |
|-------|---------------|---------------------------------|
| **Result-first** | "[Method] reaches [number] on [task], vs [baseline]." | The number, units, baseline, and the table or figure it comes from, all `verified`. |
| **Counterintuitive finding** | "Expected [A]; the paper finds [B]." | The expectation is stated in the paper or a cited prior work, and the contradicting result is `verified`. Without that source, the surprise is the author's opinion and must be framed as one. |
| **Builder's takeaway** | "If you build [X], this changes [decision]." | The result plus a stated, specific decision it bears on. Mark the inference as `inferred` with its derivation; never present it as the authors' recommendation unless they make it. |
| **Plain-language explainer** | "Here is how [mechanism] works, without the jargon." | The mechanism as the source describes it (`/eli5` shape). The one lossy analogy is flagged as lossy. |
| **"What the paper doesn't say"** | "The result holds for [conditions]; not shown for [others]." | The paper's actual scope (datasets, sizes, settings) read from the methods and limitations. Silence is reported as "not reported", never as "fails". |
| **Replication or extension (yours)** | "I ran [X] on [Y]; here is what happened." | Your own run: what was run, with what code and commit, and the result. Label it your work and keep it separate from the authors' claims. |
| **Open question** | "[Result] raises [question]." | The result `verified`; the question is explicitly the user's, not a finding. |

## Choosing

- Prefer the angle the evidence supports most strongly, not the one with the
  most dramatic wording.
- If the best evidence is a negative or mixed result, say so; a precise "it
  works under these conditions" post is a good post.
- If no angle's required evidence is `verified` or `partial`, do not draft. Return
  the blocked claims and what would unblock them.
