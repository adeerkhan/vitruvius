# Hook Shapes

A hook makes someone stop and ask a question. It does not explain the paper. It
opens a gap the source can close.

## Lenses

A lens is the angle you choose before writing. Offer 2–3, each tied to a line in
the source:

- the surprising result,
- the cost or trade-off,
- the "everyone assumes X" contradiction,
- the builder's takeaway,
- the question the source answers.

The user picks one, or says "no real connection" and you write a question or
opinion post instead. Do not write before the lens is chosen.

## The 2–3 post shape

- **Post 1 — the question or surprise.** No link. Do not resolve it.
- **Post 2 — the twist.** The cost, the contradiction, the "wait, why?", or the
  part nobody mentions.
- **Post 3 — the link plus a closing hook.** If you write 2 posts, the link goes
  in post 2.

## Shapes that work

| Shape | Example pattern |
|-------|-----------------|
| The question | "Are we getting better at [thing] yet? A new paper says [surprise]." |
| The contradiction | "Everyone assumes [X]. This paper says [Y] — and shows why." |
| The quiet bug | "The version of [thing] in your stack may be quietly wrong." |
| The before/after | "[Old number] to [new number]. Same task. One change." |
| The "fix is not what you think" | "The fix is not a bigger model. It is [small change]." |
| The cost | "The result is better. The catch is [cost]." |
| The question the paper answers | "Why does [weird thing] happen? This paper has an answer." |

## Emojis

- 🌐 next to a repo or link in the last post.
- 📰 for a research paper.
- Other emojis are optional: at most one per post, only when it fits the tone.
- No emoji spam, and never an emoji instead of a word.

## Rules

- One idea per post.
- Short sentences. Read it aloud. If it sounds like a paper abstract, rewrite it.
- No equations. No "we propose a novel framework." No "state-of-the-art" unless
  the source says it and it matters.
- Use a concrete number if it is surprising. Say what it is compared to.
- No link in post 1. The link belongs in the last post.
- No fake urgency, no "you're doing X wrong" the source does not support.
- 2–3 posts. Never more.

## A good test

Would a smart friend who is not in this field understand post 1 and want to
click? If not, simplify it. Would an expert in the field wince at an overclaim?
If so, cut it.

## Example shape (softmax paper)

1. "Are we getting better at softmax yet? A new paper says the version in your
   framework is quietly broken — and it may explain those AdamW loss spikes."
2. "The usual fix hides the overflow, not the bug. Above a certain confidence,
   the target gradient goes to zero while every other gradient stays alive. The
   math stops adding up."
3. "The fix is not another surrogate loss. It rewrites softmax and
   cross-entropy in log space. Test accuracy on a toy task: 94.3% → 100%.
   Paper: [link]"

Three hooks. The link carries the details.
