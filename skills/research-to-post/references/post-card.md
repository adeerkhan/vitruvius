# Post Card

The card is a simple copy-first page: the 2–3 posts, a Copy button on each, a
Copy all posts button, the source link, and the single best source image. No
ledger, no verification section, no media gallery.
The card does not show the lens or your thought. They stay in the markdown so the
card remains copy-first.

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
  "media": {
    "kind": "image",
    "src": "outputs/softmax-precision-cliff-media.png",
    "alt": "Figure 3: normalized Adam step versus logit margin. The step collapses at the fp32 cliff and the equilibrium sits just above it.",
    "caption": "Figure 3: normalized Adam step vs. logit margin.",
    "credit": "Figure 3, Barron et al., arXiv:2610.31642v3",
    "license": "CC BY 4.0",
    "licenseChecked": true,
    "sourceUrl": "https://arxiv.org/abs/2610.31642v3"
  },
  "limit": 280
}
```

`media` is optional. If the source has no usable image, omit it and the card is
text-only.

## The best media

Use one item, not a gallery:

- the paper's result figure or table the hook comes from,
- the repo/project-page screenshot or GIF of the workflow,
- a short video if the source has one.

`kind` is `image`, `gif`, or `video`. Local `src` must be under `outputs/`
(e.g. `outputs/<slug>-media.png`); remote `src` must be an http(s) URL. Record
`alt`, `caption`, `credit`, `license`, `licenseChecked: true`, and `sourceUrl`.
If the license is unclear, do not use the image.

## Rules the renderer enforces

- 2 or 3 posts. A 4+ post thread is refused.
- Each post fits the character limit (default 280).
- The first post has no link.
- The last post contains `source.url`.
- `slug` is lowercase-hyphen-separated.
- If `media` is present, it needs `src`, `alt`, `credit`, `license`, and
  `licenseChecked: true`.

## CLI

```bash
node skills/research-to-post/scripts/render-post-card.mjs --input <json> --output <html>
node skills/research-to-post/scripts/render-post-card.mjs --input <json> --check
```

`--check` validates only. The card has Copy, Copy all posts, the source link, and
the best image. Nothing else.
