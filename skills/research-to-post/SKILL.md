---
name: research-to-post
description: >
  Turn a read-and-verified source — a PDF, arXiv/DOI paper, GitHub repo, or
  project page — into 2-3 short X/Twitter hook posts that make the reader want
  the source, plus a copy-first HTML card that shows the source's own figures,
  screenshots, GIFs, or video. Use when the user asks to "write a post/thread
  about this paper", "share this research on X", "promote my paper", or wants a
  short hook thread from a GitHub repo. Drafts for the human to publish; never
  posts, never scrapes X, never overclaims.
argument-hint: "<pdf, arXiv/DOI, GitHub repo, or project page> [--format single|thread|figure] [--voice <path>] [--metrics <csv>] [--media source|chart|text]"
allowed-tools: Write Edit Bash Read
license: MIT
metadata:
  version: "0.3.0"

---
<!-- VITRUVIUS-COMPILED-SKILL:BEGIN v1 sha256=6d5294ac58880039a81125dcb08a97f855efe7fc2be35c1b672b67e829719dfe -->

# Research to Post

Turn a source into **2–3 hook posts** and a **copy-first HTML card** that shows
the source's own media. The reader should want to click the source, not finish
the argument in the thread.

This skill produces a **draft for the human to publish**. It never posts, never
calls a social-media API, and never scrapes X. Reading the source's own paper,
GitHub repo, or project page is allowed and expected.

## Input Gate

Before searching or drafting, state: the source (PDF path/URL, arXiv/DOI,
GitHub repo, project page, or "own idea — no source"), the format (`single` = 1
post, `thread` = 2–3 posts, `figure` = 1 post), the audience (default:
engineers/researchers in the source's field), the media preference, and the
effort budget. Ask ONE clarifying question if the source or goal is too vague,
then proceed.

A run with no source is an opinion post: say so, make no factual claims beyond
what the user supplies and you can cite, and frame it as a view or question.

## Workflow

Follow the artifact contract: save the working draft to
`outputs/<slug>-post.md`, the card input to
`outputs/.drafts/<slug>-post-card.json`, the rendered card to
`outputs/<slug>-post.html`, the source notes to
`outputs/.drafts/<slug>-source.md`, media to `outputs/<slug>-media-<n>.png` (or
`.mp4`/`.webm` for video), and a provenance sidecar to `outputs/<slug>-post.provenance.md`.

1. **Convert and explore the source.** Do not read the abstract and call it
   done. See `references/source-media.md` for the exact commands.
   - **PDF:** convert to Markdown first. Run `pdftotext -layout` for the text
     and `pdfimages -png -p` for the figures. Write
     `outputs/.drafts/<slug>-source.md` with `## Page N` headings and an image
     list. Read that Markdown and open the extracted figures. For a dense
     document, use `/summarize` or `/artifact-reading`, but still open the
     source.
   - **GitHub:** read the README and the docs. List the repo tree and find
     `assets/`, `site/`, `docs/`, screenshots, GIFs, and videos. Follow the
     project page if the README links one.
   - **Project page:** fetch it and collect `og:image`, `<img>`, `<video>`, and
     `<source>` media. The README often hides the best demo.
   - A source you could not open is `blocked`: cite it from metadata and make no
     claim about its contents.
2. **Build the claim ledger.** List every claim the posts could make: `#`,
   claim, number and units, baseline, source location, and a label from
   `skills/engineering-research/references/verification-labels.md`. Only
   `verified` and `partial` claims may appear as fact; a `partial` claim carries
   its qualifier. Rank sources with `references/evidence-quality-tiers.md`.
3. **Pick one angle.** Choose from `references/post-angles.md` and say why it
   fits. One thread argues one thing.
4. **Collect the source's media.** Prefer the source's own figure, screenshot,
   GIF, or video over a generated chart. Download the chosen media to
   `outputs/<slug>-media-<n>.png` (or `.mp4`/`.webm` for video); record `alt`,
   `caption`, `credit`,
   `license`, `licenseChecked`, and `sourceUrl`. If the source has no usable
   media, use a chart built only from ledger numbers or a text card. See
   `references/post-card.md`.
5. **Draft 2–3 hook posts.** This is not a summary thread.
   - `single`: one post, one hook.
   - `thread`: 2–3 posts. Post 1 is the strongest hook and has no link. Post 2
     is the second hook (mechanism, contradiction, or implication). Post 3 is
     the last hook plus the source link. A 2-post thread puts the link in post 2.
   - `figure`: one post built around the source's figure, with alt text.
   Each post is a hook: a surprising fact, a concrete number, a contradiction,
   or a question the source answers. Do not explain the whole paper. Cut
   anything that resolves the hook; the link carries the rest. Keep each post
   within the platform limit (default 280 characters). Tag each sentence with
   its ledger row (`[C3]`) in the working draft and strip the tags in the
   "ready to paste" version. Use `references/post-hooks.md` for shapes.
6. **Match the voice.** With `--voice <path>` (five or more of the user's own
   posts), match cadence and diction, never content. Without it, write plain and
   direct. Never imitate a named third party.
7. **Self-review** against `references/post-checklist.md`: each post is a hook,
   the count is 2–3, the last post has the link, the number has units and a
   baseline, the limitation is in the source or the post, and the media carries
   the same claim as the hook.
8. **Verify.** Re-read the posts against the ledger: every number, comparison,
   and superlative must map to a `verified` or `partial` row. Where the host
   supports subagents, hand the posts and ledger to `/verifier`; otherwise do it
   yourself and record that you did. Fix `failed` rows before delivery.
9. **Render the card.** Build the JSON in `references/post-card.md` and run:

   ```bash
   # From a Vitruvius checkout. From an installed bundle, run the same script
   # under the installed research-to-post/ directory.
   node skills/research-to-post/scripts/render-post-card.mjs \
     --input outputs/.drafts/<slug>-post-card.json \
     --output outputs/<slug>-post.html
   ```

   The card puts the posts first, with a Copy button on each and a Copy all
   posts button. It links the source, the project page, and the repository,
   shows the media gallery, and keeps the ledger and verification in collapsed
   sections. The renderer fails closed on a 4+ post thread, an unverified claim
   used as fact, an unchecked media license, an over-limit post, a missing
   source link in the last post, and verification counts that disagree with the
   ledger. Run `--check` to validate without writing the card.
10. **Deliver.** Write the files and give the user the 2–3 "ready to paste"
    posts, the media files, the card path, and anything `blocked` or `partial`.

## Optional: learn from the user's own results

With `--metrics <csv>` (the user's own past posts and their numbers), report
which angles and hook shapes did better for this account. State the sample
size; below 20 posts, report the pattern as an observation and make no claim
that it is real. The user supplies the file — do not fetch analytics or other
accounts' data. These are descriptive patterns, not a causal model and not a
virality guarantee.

## Hard Boundaries

- **No scraping, no automation of X.** Do not fetch, scrape, or bulk-collect
  posts from X or any social platform. Reading the source's paper, GitHub repo,
  project page, or linked demo is not platform scraping.
- **No invention.** No fabricated results, quotes, endorsements, testimonials,
  or reactions; no attributing a view the source does not state.
- **No engagement bait.** No fake urgency, curiosity gaps the source does not
  close, tagging people for reach, or "you're doing X wrong" framing the source
  does not support.
- **Media has an owner.** Use the source's own figure, screenshot, GIF, or video
  only with credit and a checked license. If the license is unclear, do not use
  it; use a chart from the ledger or a text card instead.
- **No unrelated or synthetic evidence imagery.** A stock photo or generated
  image may illustrate a mechanism only when labelled as illustration, never as
  a result or a measurement.
- **Separate the authors' result from the user's.** A replication, extension, or
  critique is labelled as the user's own work, with what was actually run.

## Common Rationalizations

| Excuse | Counter-argument |
|--------|------------------|
| "The paper needs 7 posts to explain." | It needs 2–3 hooks. The link carries the explanation; a thread that resolves everything gives the reader no reason to click. |
| "A chart is safer than the paper's figure." | The source's own figure is the most relevant visual and the one the reader will recognise. Use it first, with credit and a license check. |
| "The README has no media, so there is none." | Check the project page, `site/`, `assets/`, `docs/`, and the repo tree. The best demo is often a screenshot or GIF outside the README. |
| "The license is probably fine." | A license you did not check is not a license. Use a chart or text card instead. |
| "The first post can carry the link." | The first post earns the click; the last post gives the link. A link in the hook reads as an ad. |
| "A summary paragraph is a hook." | A hook opens a gap; a summary closes it. Cut the resolution. |
| "The abstract has the headline number." | Abstracts round and cherry-pick. Read the table or mark the number `unverified`. |
| "Everyone knows this result; I can cite it from memory." | Memory is not a citation. Find the source and read it, or cut the claim. |
| "The HTML card is extra." | The card is the delivery surface: posts, copy buttons, source links, and the source's media in one file. |

## Output

`outputs/<slug>-post.md` containing: the claim ledger, three hook variants with
the recommended one marked, the media brief, the 2–3 posts with claim tags, and
the ready-to-paste version. `outputs/<slug>-post.html` is the copy-first card.
`outputs/<slug>-post.provenance.md` follows
`references/provenance-sidecar.md` and lists sources consulted, accepted, and
rejected, plus counts of claims verified, partial, and blocked. Media files live
at `outputs/<slug>-media-<n>.png` (or `.mp4`/`.webm` for video); source notes at
`outputs/.drafts/<slug>-source.md`.

## Scope and Boundaries

- This skill disseminates research that has already been read and verified; it
  is not a general marketing or social-media tool.
- It is not `/summarize --format post`: a summary reproduces a document, while
  this skill chooses one angle, one hook set, and the source's own media. `/eli5`
  explains a mechanism; it does not make a publication or licensing decision.
- It drafts and previews; it does not post, schedule, or measure live analytics.
- **Research-only, not for final engineering sign-off.** A post is a summary of a
  source, not a design, specification, or compliance statement.
