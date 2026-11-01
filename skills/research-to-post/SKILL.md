---
name: research-to-post
description: >
  Turn a paper, PDF, arXiv/DOI, GitHub repo, or project page into 2-3 short,
  catchy X/Twitter hook posts in plain language, plus a simple copy-first HTML
  card. Use when the user wants a creative post about a paper or repo, not a
  technical summary. No claim ledger, no verification section; one best source image.
  Drafts for the human to publish; never posts and never scrapes X.
argument-hint: "<pdf, arXiv/DOI, GitHub repo, or project page> [--voice <path>]"
allowed-tools: Write Edit Bash Read
license: MIT
metadata:
  version: "0.6.0"

---
<!-- VITRUVIUS-COMPILED-SKILL:BEGIN v1 sha256=01d7593b4a329eb1d46dbdab9297bc3c1b4b67d31e8070ea1d800ad7a55ac396 -->

# Research to Post

Turn a source into **2–3 short, catchy hooks** that make someone want to click
the source. Plain language. No jargon dump. No claim ledger. No verification
section. One best source image, not a gallery.

This skill produces a **draft for the human to publish**. It never posts, never
calls a social-media API, and never scrapes X.

## Input Gate

Before writing, state: the source (PDF path/URL, arXiv/DOI, GitHub repo, project
page, or "own idea"), the audience (curious engineers, not specialists), and the
voice (default: plain and direct). Ask for the user's own reaction in one line.
If they have none, say so and continue. Ask ONE clarifying question only if the
source is too vague, then proceed.

## Workflow

Save the draft to `outputs/<slug>-post.md` and the card to
`outputs/<slug>-post.html`.

1. **Read the source.** Do not guess from the title.
   - **PDF:** convert to Markdown first with `pdftotext -layout`; see
     `references/source-reading.md`. Read the Markdown, especially the intro,
     the result, and the conclusion.
   - **GitHub:** read the README and the docs. Follow the project page if the
     README links one.
   - **Project page:** read it for the plain-language explanation and the demo.
   A source you cannot open is `blocked`: say so and do not invent its contents.
   Then pick **one** image that carries the hook. For a PDF, extract the figures
   with `pdfimages -png -p` (see `references/source-reading.md`), open them, and
   copy the best one to `outputs/<slug>-media.png`. For a repo or project page,
   use the workflow screenshot, GIF, or video. Record `alt`, `caption`,
   `credit`, `license`, and `licenseChecked: true`. If the source has no usable
   image, omit it; the card is text-only.
2. **Find the one surprising idea.** Not the whole paper. One of:
   - a question the paper answers,
   - a thing everyone assumes that the paper contradicts,
   - a number that sounds wrong until you see why,
   - a before/after,
   - "the fix is not what you think."
   If you cannot state it in one sentence, you have not found it yet.
3. **Pick a lens before writing.** Offer 2–3 candidate angles, each with the
   source line it comes from. The user picks one, or says "no real connection"
   and you write a question/opinion post instead. Record the chosen lens in the
   markdown. Do not write the posts yet. The lens is one bounded call or one
   user choice; it is not a separate app and it is not Jev.
4. **Write 2–3 hooks in plain language.** Use the user's own thought and the
   chosen lens.
   - Post 1: the question or surprise. No link.
   - Post 2: the twist, the cost, or the "wait, why?"
   - Post 3: the source link plus a closing hook. If you write 2 posts, the link
     goes in post 2.
   Short sentences. No equations. No "we propose a novel framework." No
   "state-of-the-art" unless the source says it and it matters. Use the words a
   smart friend would use at lunch.
   Use `references/post-hooks.md` for shapes.
5. **Keep the pieces separate.** In the markdown, keep the source, the user's
   thought, the chosen lens, the model draft, and the final wording as separate
   sections. The card shows only the posts, the one image, and the source link.
6. **Make it creative, not technical.** A good hook can be a question, a
   contradiction, a small story, or a "what if" question. See
   `references/post-hooks.md` for examples. The reader should feel curious, not
   lectured.
7. **Self-check** against `references/post-checklist.md`: 2–3 posts, plain
   language, each post a hook, first post has no link, last post has the source
   link, the chosen lens is recorded, the user's thought is quoted not
   paraphrased, no ledger, no verification, one best image if the source has
   one.
8. **Render the card.** Build the simple JSON in `references/post-card.md` and
   run:

   ```bash
   node skills/research-to-post/scripts/render-post-card.mjs \
     --input outputs/.drafts/<slug>-post-card.json \
     --output outputs/<slug>-post.html
   ```

   The card shows the posts first, with a Copy button on each and a Copy all
   posts button, then the one best source image, then the source link. Nothing
   else.
9. **Deliver.** Give the user the 2–3 ready-to-paste posts, the card path, and
   the source link.

## Hard Boundaries

- **No posting, no scraping X.** The draft is for the human.
- **No invention.** Do not make up a result, a quote, or a reaction.
- **No jargon dump.** If a sentence needs a glossary, rewrite it.
- **No 4+ post threads.** Two or three hooks, then stop.
- **No claim ledger and no verification section.** By design. The source link is
  the provenance. **One best image, not a gallery.**
- **No engagement bait.** No fake urgency, no "you're doing X wrong" the source
  does not support.

## Common Rationalizations

| Excuse | Counter-argument |
|--------|------------------|
| "The paper needs 7 posts to explain." | It needs 2–3 hooks. The link carries the explanation. |
| "A claim ledger makes it credible." | The source link makes it checkable. The ledger is extra work the user did not ask for. |
| "More images would make this land." | One source image is enough. A gallery is clutter. |
| "Technical detail shows expertise." | Plain language travels. Jargon is a door closed. |
| "The first post can carry the link." | The first post earns the click; the last post gives the link. |
| "A summary paragraph is a hook." | A hook opens a gap; a summary closes it. Cut the resolution. |
| "The model can pick the angle and write in one pass." | Decide the lens first. A writer that ranks its own angle is the failure x-brief avoids. |
| "The user's thought can be paraphrased into the draft." | Quote it, or leave it out. Never rewrite the user's words as if they were the model's. |

## Output

`outputs/<slug>-post.md` with the source, the user's thought (quoted), the chosen
lens, the 2–3 posts, and the source link. `outputs/<slug>-post.html` is the
simple copy-first card. No sidecar, no ledger, no verification. The image lives
at `outputs/<slug>-media.png`.

## Scope and Boundaries

- This skill is creative dissemination of a source the user already chose, not a
  general marketing tool.
- It does not verify claims. It reads the source, writes hooks, and links it.
- It drafts and previews; it does not post, schedule, or measure analytics.
- **Research-only, not for final engineering sign-off.** A post is a hook, not a
  design or a compliance statement.
