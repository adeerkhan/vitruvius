# Post Checklist

Run before delivery. Any "no" is fixed or the post is held; record the result
in the provenance sidecar.

## Accuracy (blocking)

- [ ] Every number in the post appears in the claim ledger with units and a
      source location.
- [ ] Every ledger row used as fact is `verified` or `partial`; `partial` rows
      carry their qualifier in the text.
- [ ] The baseline or comparison is stated wherever a number is given.
- [ ] The verb matches the paper's own strength ("shows", "suggests", "finds").
- [ ] The main limitation or scope condition is in the post or thread.
- [ ] Nothing is attributed to the authors that the source does not state.
- [ ] No fabricated quote, result, endorsement, or reaction.
- [ ] Anything from a `blocked` source is described only by its metadata.
- [ ] Every charted value matches a `verified` or `partial` ledger row, including
      the baseline bar.

## Craft

- [ ] The first post makes one claim, with a concrete number or condition, and
      contains no link.
- [ ] The chosen media carries the same claim as the hook, with the same number,
      unit, and baseline.
- [ ] Alt text states what the visual shows, including the number and baseline.
- [ ] A skeptical expert would not ask "compared to what?" or "under what
      conditions?" without finding the answer in the thread.
- [ ] No unearned superlative or hype word (see `post-hooks.md`).
- [ ] Each post adds a new claim from the ledger; none is filler.
- [ ] Each post fits the character limit of the user's account.
- [ ] Voice matches the sample when one was given; otherwise plain and direct.

## Ownership

- [ ] Any figure is credited and its license was flagged for the user to check,
      or the figure is described or recreated instead.
- [ ] The card embeds a figure only after `licenseChecked: true`; no stock photo
      or generated data visual stands in for evidence.
- [ ] The user's own work is labelled as theirs and kept separate from the
      authors' claims.
- [ ] The source link, authors, and venue or version are in the final post.

## Delivery

- [ ] `outputs/<slug>-post.md` and `outputs/<slug>-post.provenance.md` exist.
- [ ] `outputs/<slug>-post.html` exists and the renderer passed without
      relaxing a check.
- [ ] The user receives the "ready to paste" text and the list of anything
      `blocked` or `partial`.
- [ ] The draft is for the user to publish; nothing was posted or scraped.
