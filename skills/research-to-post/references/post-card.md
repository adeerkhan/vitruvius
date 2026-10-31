# Post Card

The card is a simple copy-first page: the 2–3 posts, a Copy button on each, a
Copy all posts button, and the source link. No ledger, no verification section,
no media.

## Input JSON

Save it to `outputs/.drafts/<slug>-post-card.json`.

```json
{
  "slug": "softmax-hooks",
  "title": "Are we getting better at softmax?",
  "source": {
    "citation": "Barron et al., A Fix for Softmax and Cross-Entropy, arXiv:2610.31642v3",
    "url": "https://arxiv.org/abs/2610.31642v3"
  },
  "posts": [
    "Are we getting better at softmax yet? A new paper says the version in your framework is quietly broken — and it may explain those AdamW loss spikes.",
    "The usual fix hides the overflow, not the bug. Above a certain confidence, the target gradient goes to zero while every other gradient stays alive. The math stops adding up.",
    "The fix is not another surrogate loss. It rewrites softmax and cross-entropy in log space. Test accuracy on a toy task: 94.3% → 100%. Paper: https://arxiv.org/abs/2610.31642v3"
  ],
  "limit": 280
}
```

## Rules the renderer enforces

- 2 or 3 posts. A 4+ post thread is refused.
- Each post fits the character limit (default 280).
- The first post has no link.
- The last post contains `source.url`.
- `slug` is lowercase-hyphen-separated.

## CLI

```bash
node skills/research-to-post/scripts/render-post-card.mjs --input <json> --output <html>
node skills/research-to-post/scripts/render-post-card.mjs --input <json> --check
```

`--check` validates only. The card has Copy, Copy all posts, and nothing else.
