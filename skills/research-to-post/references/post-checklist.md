# Post Checklist

Run before delivery. Any "no" is fixed or the post is held; record the result
in the provenance sidecar.

## Shape (blocking)

- [ ] The thread has 2 or 3 posts. Not 1, not 4+.
- [ ] Every post is a hook: it opens a gap and does not resolve the whole
      result.
- [ ] Post 1 is the strongest hook and contains no link.
- [ ] The last post contains the source link.
- [ ] Each post fits the character limit of the user's account.
- [ ] Three hook variants are written; the recommended one is marked.

## Accuracy (blocking)

- [ ] Every number in the posts appears in the claim ledger with units and a
      source location.
- [ ] Every ledger row used as fact is `verified` or `partial`; `partial` rows
      carry their qualifier in the text.
- [ ] The baseline or comparison is stated wherever a number is given.
- [ ] The verb matches the source's own strength ("shows", "suggests", "finds").
- [ ] The limitation or scope condition is in the source or the posts.
- [ ] Nothing is attributed to the authors that the source does not state.
- [ ] No fabricated quote, result, endorsement, or reaction.
- [ ] Anything from a `blocked` source is described only by its metadata.

## Media (blocking)

- [ ] The visual is the source's own figure, screenshot, GIF, or video, not a
      stock photo or a generated data visual.
- [ ] The visual carries the same claim as the hook, with the same number and
      baseline.
- [ ] `alt` states what the visual shows, including the number and baseline.
- [ ] `credit` names the author, figure, repo, or project page.
- [ ] `license` is the actual license and `licenseChecked` is `true`; if the
      license is unclear, the media is not used.
- [ ] Local media lives under `outputs/`; remote media links its original.
- [ ] If the source has no usable media, a chart from the ledger or a text card
      is used instead.

## Card and delivery

- [ ] `outputs/<slug>-post.md` and `outputs/<slug>-post.provenance.md` exist.
- [ ] `outputs/<slug>-post.html` exists and the renderer passed without
      relaxing a check.
- [ ] The card shows the posts first, with Copy and Copy all posts buttons.
- [ ] The card links the source, the project page, and the repository when they
      exist.
- [ ] The card opens or embeds every media item.
- [ ] The user receives the "ready to paste" posts and the list of anything
      `blocked` or `partial`.
- [ ] The draft is for the user to publish; nothing was posted or scraped from
      X.
