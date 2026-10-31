---
name: research-to-post
description: >
  Turn a read-and-verified research source — a paper, preprint, repo, standard,
  or the user's own result — into a short public post or thread (X/Twitter
  style) whose every number and claim traces to the source, plus a self-contained
  HTML post card with the most relevant source figure or a chart built from the
  claim ledger. Use when the user asks to "write a post/thread about this paper",
  "share this research on X", "promote my paper", or wants a tweet or thread
  that explains a finding accurately and engagingly. Drafts for the human to
  publish; never posts, never scrapes, never overclaims.
argument-hint: "<paper link, DOI, repo, or idea> [--format single|thread|figure] [--voice <path>] [--metrics <csv>] [--media auto|figure|chart|video]"
allowed-tools: Write Edit Bash Read
license: MIT
metadata:
  version: "0.2.1"

---
<!-- VITRUVIUS-COMPILED-SKILL:BEGIN v1 sha256=9d23284a4a76a639bab2115114e2045b224fee3c81bbe35a172971af3b563a71 -->

# Research to Post

Turn a research source into a post people want to read and can trust. Accuracy
is the constraint; engagement is the craft inside it. A post that overclaims
the paper fails, however well it performs.

This skill produces a **draft for the human to publish**, plus a **post card**
HTML file that previews the post and its media. It never posts, never calls a
social-media API, and never scrapes any platform. It does not promise virality:
reach is a distribution outcome, not a property the skill can verify.

## Input Gate

Before searching or drafting, state: the source (paper/DOI/arXiv ID, repo plus
commit, standard, or "own idea — no source"), the format (`single`, `thread`
of 4-7 posts, or `figure` post), the audience (default: engineers and
researchers in the paper's field), the media preference, and the effort budget
(user-set or thorough). Ask ONE clarifying question if the source or goal is
too vague, then proceed. See `references/input-gate.md`.

A run with no source is an opinion post: say so, make no factual claims beyond
what the user supplies and you can cite, and frame the post as a view or a
question.

## Workflow

Follow the artifact contract: save the working draft to
`outputs/<slug>-post.md`, the post-card input to
`outputs/.drafts/<slug>-post-card.json`, the rendered card to
`outputs/<slug>-post.html`, and a provenance sidecar to
`outputs/<slug>-post.provenance.md`.

1. **Read the source itself.** Read the full text, the results tables, and the
   limitations section — not the abstract, a listing page, or a social post
   about the paper. For long or dense sources run `/summarize`; for figures and
   tables run `/artifact-reading`. A paper you could not open is `blocked`:
   cite it from metadata and make no claim about its contents.
2. **Build the claim ledger.** List every claim the post could make as a row:
   `#`, claim, number and units, baseline or comparison, source location
   (section, table, figure, page), and a label from
   `skills/engineering-research/references/verification-labels.md`. Only
   `verified` and `partial` claims may appear as fact; a `partial` claim carries
   its qualifier in the post text. Everything else is cut or rewritten as an
   explicit question or opinion. Rank sources with
   `references/evidence-quality-tiers.md`.
3. **Pick one angle.** Choose from `references/post-angles.md` and say why it
   fits this source. One post argues one thing.
4. **Choose the media before writing the hook.** Read
   `references/post-card.md`. Pick the visual that carries the same claim as
   the hook, in this order: the source's own key figure (if its license is
   checked), a chart built only from ledger numbers, a text card of the verified
   claim, or a short video storyboard. Never use unrelated stock imagery, an
   AI-generated chart, or someone else's figure without credit and a license
   check. The media brief states what it shows, why it fits this angle, its
   aspect ratio, and its alt text.
5. **Draft.** Write three hook variants, then the body:
   - `single`: one post, one claim, one number.
   - `thread`: 4-7 posts — hook, result with its number, how it works in plain
     words, the limitation, the so-what for the reader, then the source link.
   - `figure`: one post built around one figure, with alt text that states what
     the figure shows.
   Keep each post within the platform limit for the user's account (default 280
   characters). Write a first post with no link; place the source link in the
   last post or a reply. Tag each sentence with its ledger row (`[C3]`) in the
   working draft and strip the tags in the "ready to paste" version.
   Use `references/post-hooks.md` for hook shapes.
6. **Match the voice.** With `--voice <path>` (five or more of the user's own
   posts or paragraphs), match cadence and diction, never content. Without it,
   write plain and direct. Never imitate a named third party.
7. **Self-review** against `references/post-checklist.md`: strength of claim
   equals strength of evidence ("shows" vs "suggests" follows the paper's own
   hedges), the number appears with units and its baseline, the main limitation
   is stated, and no hype word is unearned.
8. **Verify.** Re-read the final text against the claim ledger: every number,
   comparison, and superlative in the post must map to a `verified` or
   `partial` row. Where the host supports subagents, hand the final text and the
   ledger to `/verifier` for an independent pass; otherwise the lead agent does
   it and records that it did. Fix `failed` rows before delivery.
9. **Render the post card.** Build the JSON described in
   `references/post-card.md` and run:

   ```bash
   # From a Vitruvius checkout. From an installed bundle, run the same script
   # under the installed research-to-post/ directory.
   node skills/research-to-post/scripts/render-post-card.mjs \
     --input outputs/.drafts/<slug>-post-card.json \
     --output outputs/<slug>-post.html
   ```

   The script fails closed: a used claim that is not `verified` or `partial`, a
   chart value that does not match its ledger row, an unlicensed figure, an
   over-limit post, or verification counts that disagree with the ledger all
   stop the render. Fix the input, do not relax the check. Run `--check` to
   validate without writing the card.
10. **Deliver.** Write the files and give the user the "ready to paste" text,
    the figure or video recommendation, the post-card path, and the one-line
    list of anything `blocked` or `partial`.

## Optional: learn from the user's own results

With `--metrics <csv>` (the user's own past posts and their numbers), read the
file and report which angles and hook shapes did better for this account.
State the sample size; below 20 posts, report the pattern as an observation and
make no claim that it is real. The user supplies the file — do not fetch
analytics or other accounts' data. These are descriptive patterns for this
account, not a causal model and not a virality guarantee.

## Hard Boundaries

- **No scraping, no automation of a platform.** Do not fetch, scrape, or
  bulk-collect posts from any social platform. Pattern guidance comes from
  `references/post-hooks.md` and from examples the user pastes in.
- **No invention.** No fabricated results, quotes, endorsements, testimonials,
  or reactions; no attributing a view to the authors that the paper does not
  state.
- **No engagement bait.** No fake urgency, curiosity gaps the thread does not
  close, tagging people for reach, or "you're doing X wrong" framing the source
  does not support.
- **Figures and data have owners.** Reuse a figure only with credit and after
  the user checks its license; otherwise describe it or recommend recreating
  it. State the source in the post.
- **No unrelated or synthetic evidence imagery.** A chart, diagram, or video
  frame must depict ledger data or the source's own figure. Stock photos and
  generated visuals may illustrate a mechanism only when labelled as
  illustration, never as a result.
- **Separate the authors' result from the user's.** A replication, extension, or
  critique is labelled as the user's own work, with what was actually run.

## Common Rationalizations

| Excuse | Counter-argument |
|--------|------------------|
| "The abstract has the headline number; no need to open the table." | Abstracts round, cherry-pick, and sometimes disagree with the tables. Read the table or mark the number `unverified`. |
| "A slightly stronger hook is fine; the thread clarifies." | Most readers see only the hook. A hook that overclaims is the post. |
| "Everyone knows this result; I can cite it from memory." | Memory is not a citation. Find the source and read it, or cut the claim. |
| "The paper is paywalled, but the summary I saw says so." | A summary is not the source. Mark it `blocked` and make no claim about its contents. |
| "Hype is what gets reach." | Readers in this field check the paper. One caught overclaim costs more reach than any hook gains. |
| "It's just a tweet; provenance is overkill." | Provenance is how the user answers "where does that number come from?" in the replies. The sidecar is mandatory. |
| "A quick chart from the numbers I remember is close enough." | The chart is a claim. Every plotted value must match a `verified` or `partial` ledger row, or the render stops. |
| "The figure is probably CC BY; I'll credit it later." | A license you did not check is not a license. The card refuses to embed an unchecked figure. |
| "The HTML card is extra; the Markdown is enough." | The card is the delivery surface: post text, media, alt text, ledger, and verification in one file the user can inspect before posting. |
| "This hook will go viral." | Virality is not measurable here. The skill optimizes clarity and shareability; it cannot promise distribution. |

## Output

`outputs/<slug>-post.md` containing: the claim ledger table, three hook
variants with the recommended one marked, the media brief, the thread or post
text with claim tags, the "ready to paste" version, and figure and alt-text
notes. `outputs/<slug>-post.html` is the rendered post card.
`outputs/<slug>-post.provenance.md` follows `references/provenance-sidecar.md`
and lists sources consulted, accepted, and rejected, plus counts of claims
verified, partial, and blocked, and the checklist result.

## Scope and Boundaries

- This skill disseminates research that has already been read and verified; it
  is not a general marketing or social-media tool.
- It is not `/summarize --format post`: a summary reproduces a document, while a
  post chooses one angle, one hook, one media object, and a claim ledger that
  every sentence must survive. `/eli5` explains a mechanism; it does not make a
  publication decision or check a license.
- It drafts and previews; it does not post, schedule, or measure live analytics.
- **Research-only, not for final engineering sign-off.** A post is a summary of a
  source, not a design, specification, or compliance statement.
