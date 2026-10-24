---
name: scholarly-research
description: >
  Find and verify scholarly and academic sources for an engineering research
  question. Use when the research needs papers, journal articles, preprints,
  conference proceedings, prior art, or citation data — or when the user names
  a paper, arXiv id, DOI, or asks "what does the literature say". Provides
  keyless REST recipes (OpenAlex, Semantic Scholar, arXiv, alphaXiv fast
  search) and host-tool guidance. Crossref, Unpaywall and OpenCitations then
  resolve a known DOI's metadata, licensed full text, and citation edges. Do NOT use for standards/code research that
  has no scholarly layer.
argument-hint: "<topic or paper identifier>"
allowed-tools: Write Edit Bash Read
license: MIT
metadata:
  version: "0.4.6"

---
<!-- VITRUVIUS-COMPILED-SKILL:BEGIN v1 sha256=dd29a4d4103469bf070821f9e76f0fa1c69d6df11ec11c5bbeb6a1c313620a00 -->

# Scholarly Research

Find academic sources and verify them. This skill layers free, keyless
scholarly indexes first, then the host's own web/browser tools — and never
depends on scraping a site that blocks agents.

## Input Gate

Before searching, name the question, the artifact/scope (or say it is a
literature review), the jurisdiction/edition, and the effort budget (user-set or
thorough). Ask ONE clarifying question if the ask is too vague, then proceed.
See `references/input-gate.md`.

## Rules (read first)

- **This skill produces evidence, not a report.** You find, read, and record
  sources. Synthesis, recommendations, and the final deliverable belong to
  `engineering-research`. If the user invoked you directly and wants a report,
  say so and hand back the evidence set with a pointer to that skill — do not
  improvise a deliverable, because an unbounded report is how a literature
  review ends up answering a question nobody asked.
- **Every source must answer a named question.** Before searching, write down
  the specific question each query is trying to answer, and tag every source
  with the question it resolves and its relation to it: `supports`,
  `challenges`, or `contextual`. A source that answers no named question is
  dropped, however interesting it is.
- **Never assert facts about a local codebase or artifact.** You have no
  mandate to read the user's repository, and this skill does not grant one. If
  the question depends on what their code does, hand that to
  `engineering-research`, which carries the `repo`-anchored evidence contract.
- **Effort is user-controlled, and the default is thorough.** If the user sets
  a turn or token budget, honor it and record it in the evidence set. If not,
  keep searching while new sources that answer a named question are still
  turning up. Do not impose a fixed internal query cap: change terms and
  indexes before you mark a question `blocked`, and say which indexes you used.
- Tool names are literal and host-dependent. Use ONLY tools visible in the
  current session: a web search may be `web_search`, `search`, or `browser`;
  fetching may be `fetch`, `fetch_content`, or a shell `curl`. Never call a
  tool name you cannot see. If a needed capability is missing, degrade
  gracefully and record it as `blocked`.
- Prefer structured scholarly APIs over scraping search engines. **Google
  Scholar has no official API, blocks automated browsers with captchas, and
  its scrapers violate its ToS — do not scrape it.** Use OpenAlex or Semantic
  Scholar citation counts instead, and say which source the count came from.
- **A fallback never erases the failure, and an empty answer is not a failure.**
  If an index rate-limits, times out, or returns 5xx, record that search as
  `status: partial` with the reason in `notes`, *then* use the next index; if no
  index answers, name the one that did not respond. Semantic Scholar's shared
  pool times out regularly; when you fall back to OpenAlex, the timeout has to
  survive as a record. A search that silently disappears leaves a hole in the
  evidence set that no reader can see, and the coverage count quietly lies.
- **An index that missed is a different state from an index that was down.**
  A query that ran and returned zero results is a definitive negative: record it
  explicitly as a zero-result search with the exact query, so the reader can see
  the question was covered and the answer was empty. Do not file it as `partial`.
  "The index was unavailable" and "the index found nothing" are different
  evidence, and a reader who cannot tell them apart cannot tell a covered
  question from an uncovered one.
- Never invent a citation. Every claim maps to a fetched source: DOI, arXiv
  id, or URL you actually retrieved.
- When a source is paywalled or unreachable, cite from search metadata and
  mark full-text access as `blocked`. See `references/blocked-access-policy.md`
  for the full rules.

## Discovery layers (in priority order)

### 1. OpenAlex — primary, keyless

REST JSON, ~250M works, citation counts, open-access full-text links. No key
needed for casual use.

```
GET https://api.openalex.org/works?search=<urlencoded terms>&per-page=20&select=id,display_name,publication_year,publication_date,cited_by_count,doi,open_access,best_oa_location,authorships
```

- Sort by citations: add `&sort=cited_by_count:desc`.
- Filter by year / open access: `&filter=publication_year:2019-2024,open_access.is_oa:true`.
- Single work by DOI: `GET https://api.openalex.org/works/doi:10.1109/xxx`.
- `best_oa_location.pdf_url` gives a full-text PDF when open access.

**Search filter rule:** For narrow engineering topics, use `title_and_abstract.search` instead of `fulltext.search` (default). Full-text search returns too many off-topic results for niche queries. Use `fulltext.search` only for broad surveys where precision is less critical.

### 2. Semantic Scholar — enrichment, keyless

```
GET https://api.semanticscholar.org/graph/v1/paper/search?query=<terms>&limit=20&fields=title,year,abstract,externalIds,openAccessPdf,citationCount
```

- Single paper: `GET /graph/v1/paper/DOI:10.xxxx?fields=...` or
  `/graph/v1/paper/arXiv:1706.03762?fields=...`.
- Citations: `GET /graph/v1/paper/{id}/citations?fields=title,year`.
- Shared pool is rate-limited; if it times out, fall back to OpenAlex.

### 3. arXiv API — best at resolving an id, not at topics

Atom XML, keyless. **Reach for this to resolve a preprint id you already have,
not to discover by topic.** The API is lexical and ranks concept queries poorly,
so a topic query here returns off-topic work you then have to filter by hand,
and the cost is paid in screening rather than in results. Find the work with
OpenAlex or Semantic Scholar, then come here for the id and the version.

Topic search here is still legitimate for a narrow, preprint-shaped question
("what preprints since 2025 touch X"), where the corpus itself is the filter.
Treat its output as candidates, not as findings.

```
GET https://export.arxiv.org/api/query?id_list=<comma-separated ids>&max_results=<n>
GET https://export.arxiv.org/api/query?search_query=all:<topic>&max_results=20   # candidates only
```

- **Serialise.** One request per 3 seconds. Parallel lookups get 429; retry a
  429 once after the same wait rather than tightening the request.
- Budget ~25s per request. A timeout is a `partial` search recorded as such, not
  a gap you fall back through.
- **Keep the version suffix.** Record and cite `arXiv:1706.03762v5`, not
  `arXiv:1706.03762`. An unversioned id resolves to the newest revision, so a
  citation can change under a reader who checks it later; the `vN` is what makes
  the source reproducible.
- `max_results` caps at 100 for an id lookup; batch the ids rather than looping.
- **Two recovery routes when a lookup misses.** OpenAlex indexes new arXiv
  preprints days late, so a known-DOI lookup can 404 for a preprint that
  exists: strip the `10.48550/arXiv.` prefix, resolve the bare id on the arXiv
  API, and record that OpenAlex was the miss. And when an id lookup times out
  or keeps answering 429/5xx past its one retry, the same ids resolve through
  Semantic Scholar's `arXiv:<id>` route — record both attempts and say which
  index produced the metadata you cite. A recovery route never erases the
  failure it recovered from: the miss and the substitution both stay in the
  evidence set.

### 4. alphaXiv fast search — keyless arXiv discovery

```
GET https://api.alphaxiv.org/search/v2/paper/fast?q=<query>&includePrivate=false
```

Returns JSON with `title`, `link`, `paperId`, `snippet`. For paper Q&A over
full text (answer_pdf_queries, discover_papers), the user needs an alphaXiv
account: connect `https://api.alphaxiv.org/mcp/v1` as an MCP server with
`Authorization: Bearer <key>`, or use the `alpha` CLI (`alpha login`, then
`alpha search|get|ask`) when available.

### 5. Host web / browser tools

When the host exposes a web search or browser tool, use it for non-academic
sources (vendor docs, standards bodies, news, blogs), for conceptual or very
recent work the keyword indexes miss, and to confirm recency — not as the
primary paper index. Do not point a browser at scholar.google.com.

### 6. Crossref — the metadata of record

Layers 6–8 are **resolution and enrichment**, not discovery: they answer a
question *about a work you already have a DOI for*, so they are reached for after
layers 1–4 have identified a candidate, never instead of them.

```
GET https://api.crossref.org/works/<doi>
GET https://api.crossref.org/works?query.bibliographic=<terms>&rows=5&select=DOI,title,issued
```

- **Use it to settle metadata disputes.** Crossref is the DOI registrar, so
  `title`, `issued`, `container-title`, `is-referenced-by-count` and the
  `reference` array are the record of authority. When OpenAlex and Semantic
  Scholar disagree on a year or a title, Crossref breaks the tie — and you say
  it did.
- `query.bibliographic` is the right query when the user hands you a reference
  string with no DOI: it matches the citation as printed.
- Send `mailto=<a real address>` in the `User-Agent` so you land in the polite
  pool. A bare `curl` is rate-limited harder. No key.
- No relevance ordering: it knows what is cited, not what is good. Do not use it
  to rank discovery results.
- The `reference` array is included in the work record, which is often the
  cheapest way to get a work's reference list.

### 7. Unpaywall — lawful open-access resolution

```
GET https://api.unpaywall.org/v2/<doi>?email=<a real address>
```

- **Use it before downloading anything.** `is_oa` and
  `best_oa_location.*` answer "is there a free, licensed copy, and where", which
  is the question `scripts/extract-pdf.mjs` needs answered before it fetches.
- The `email` parameter is a **contact address, not a credential** — no signup
  and no key. Unpaywall rejects a placeholder address with
  `422 "Please use your own email address"`, so ask the user for an address or
  use the project's and record which was used.
- **`is_oa: true` does not promise a PDF.** A green OA record can return
  `best_oa_location.url_for_pdf: null`; fall back to the landing-page URL, and
  read the full text through the page-anchored reader rather than scraping.
- **Run the resolver this skill ships** — `scripts/resolve-oa.mjs` (in a
  repository checkout, `skills/scholarly-research/scripts/resolve-oa.mjs`) —
  rather than transcribing the response by hand. It carries the failure policy
  below and prints the record as JSON.
- `is_oa: false` is a paywall finding for the evidence ledger — cite from
  metadata and mark full-text access `blocked`. Do not retry the publisher.
- A resolution that could not be made — no contact address, network failure,
  non-200, or the 422 above — is a **failed search**, recorded as such. Only
  `is_oa: false` is a paywall finding. Collapsing the two turns "the API was
  unreachable" into "there is no free copy", which is how an evidence ledger
  quietly lies; the CLI reports both as `ok: false` and `ok: true`
  respectively, so read the field.

### 8. OpenCitations (COCI) — the open citation graph

```
GET https://api.opencitations.net/index/v1/references/<doi>
GET https://api.opencitations.net/index/v1/citations/<doi>
```

- **Use it for citation edges by DOI.** `references` is the work's reference
  list; `citations` is who cites it. Both return an array of `oci`,
  `citing`, `cited`, `creation`, `timespan` records — no key, no quota key.
- Prefer `references`: for a heavily cited work the `citations` payload can run
  to tens of megabytes, so cap the request (`curl --max-time`) and treat a
  truncated read as `status: partial`, never as an empty result.
- The historic `opencitations.net/index/coci/api/v1/...` host 301-redirects to
  `api.opencitations.net/index/v1/...`; use the resolved host directly.
- COCI covers DOI-based works and misses preprints and proceedings without a
  registered DOI. Treat a gap here as **unverified coverage**, not as "nothing
  cites it" — say which index you checked.

## What each index is actually good for

Stated so the routing table below has a reason behind it. An index that answers
a question badly is worse than one that refuses it, because a bad answer reads
like a good one.

| Index | Use it for | Do not use it for |
|---|---|---|
| OpenAlex | topic discovery, citation counts, open-access full-text links, DOI → id | paywalled full text |
| Semantic Scholar | relevance ranking, citation graph, `externalIds` crosswalk between DOI and arXiv | bulk paging — the shared pool is rate-limited and times out |
| arXiv | **resolving a known preprint id**, reading a specific version | topic discovery as a primary route — lexical, poorly ranked (see layer 3) |
| alphaXiv | fast keyword discovery inside arXiv, paper Q&A over full text | primary citation metadata |
| Host web / browser | vendor docs, standards bodies, recent news, code at source | the primary paper index |
| Crossref | metadata of record for a DOI, a reference-list fetch, a printed-citation lookup | discovery ranking |
| Unpaywall | answering "is there a licensed free copy, and where" before a download | discovery, or proving a work exists |
| OpenCitations | open citation edges (`references`, `citations`) by DOI | citation *counts*, or works with no DOI |

Where two indexes disagree, that disagreement is a finding: record both, mark
the claim `ambiguous`, and say which index produced which number. Never average
two citation counts or quietly keep the higher one.

## Routing modes

Pick the mode from the need; do not default every question to keyword search.
(src-05 source-routing transfer, mapped to the keyless indexes above and the
host's own tools.)

| Need | Mode | Start | Then |
|---|---|---|---|
| Map a field | `discover` | OpenAlex `title_and_abstract.search` | `&sort=cited_by_count:desc`; 2–4 reworded queries |
| One known paper | `known-id` | OpenAlex `/works/doi:<doi>` or arXiv id | Semantic Scholar `/paper/DOI:...` for citation count |
| Seminal / adjacent work | `citation-graph` | OpenAlex `cited_by_api_url` / `referenced_works` | Semantic Scholar `citations` / `references` |
| Conceptual or very recent work keywords miss | `semantic` | host web/browser search | Semantic Scholar relevance sort |
| Full text behind a claim | `full-text` | `best_oa_location.pdf_url` / arXiv HTML or PDF | the page-anchored reader below |
| Working code / prior art | `code-prior-art` | host web/GitHub search | read the repo at source (`path:line`) |

- Run 2–4 reworded queries per question (synonyms, the method's name, the
  problem's name) and merge; never trust one query's ranking — seminal work can
  appear under only one phrasing or sort order.
- **Record the exact endpoint for every search** — the full URL with its query
  parameters, not the name of the index. It is the only thing that makes a search
  reproducible and lets a re-run match what you actually did. Put it in the
  search record's `notes`.
- `code-prior-art` is a first-class mode, not a fallback: the decisive lead is
  often a working implementation that four paper searches miss. A repository is
  a lead, not a citation — verify any claim about it at source (`path:line`) and
  mark it `repo` (see `engineering-research`).
- A mode that returns nothing is recorded as negative coverage, with the mode
  and the exact terms used.

## Source identity (exact-first)

Before a source enters the evidence set, canonicalize its identifier and check
it against the set: DOI lowercase `10.xxxx/...`; arXiv id `arxiv:XXXX.XXXXX`; a
URL stripped of scheme/host case, tracking query parameters, fragment, and a
trailing slash. If it is already present, merge it — record the surviving ID,
the `merge_rule`, and a `discard_reason` on the duplicate (see the
`engineering-research` `evidence.v1` ledger). Do not present one work twice as
two sources, and do not let a semantic near-duplicate proposal delete a source;
it is advisory.

### arXiv ids carry a version, and two shapes

`2401.12345v2` is `2401.12345` at version 2, and older papers use a legacy
`archive/NNNNNNN` form (`hep-th/9901001`). Two rules follow:

- **Canonicalize to the bare id**, keep the highest version you actually read,
  and put that version in `notes`. Keying the evidence set on the versioned
  string makes `2401.12345v1` and `2401.12345v2` two sources for one work, which
  inflates the source count and makes the set look better corroborated than it
  is.
- **A disagreement between versions is a finding, not a merge.** If v1 and v2
  differ on a claim you rely on, record that claim `ambiguous`, name both
  versions, and do not settle it by silently preferring the newer one.

## Full text and verification

- Fetch full text from the OpenAlex `best_oa_location.pdf_url`, the arXiv
  PDF/HTML, or the publisher page. Prefer HTML/XML abstracts over parsing PDFs
  when the claim only needs the abstract.
- For each key claim record: title, authors, year, venue, DOI / arXiv id, and
  the URL actually fetched.
- If a full text is paywalled, cite it from metadata and mark full-text access
  as `blocked`. Never guess at its contents.
- **Name the access route you actually used.** Record `pdf-parse` only when the
  PDF extractor ran and its output is on disk; otherwise record `html`,
  `abstract`, or `metadata`. Never label a source "full text read" when only an
  abstract, an HTML page, or a model summary was seen.

### Reading open-access PDFs (page-anchored)

When a claim needs more than the abstract and only a PDF is available, extract
the text with the shared reader instead of trusting a host PDF preview:

```bash
node scripts/extract-pdf.mjs <pdf-path-or-url> --json --delete
```

In a copied-skill install, run
`node <scholarly-research-skill-root>/scripts/extract-pdf.mjs`. The reader
returns `{ source, url, sha256, pages, text, warnings, deleted }`, with page
boundaries stamped as `[[page N]]` so every extracted claim can be anchored to
a page. It wraps the optional `pdf-parse` dependency; if it reports
`pdf-parse is not installed`, install it (`npm install pdf-parse`, or
`npm install` in a checkout) and retry — do not substitute a model summary for
PDF text.

`--delete` removes the binary **only after a usable extraction**. A scanned PDF
with no text layer is never deleted: its text comes back empty with a warning
because there is no OCR here. Record that source's full text as `blocked`.

After extraction, write the text to `outputs/.drafts/<slug>-pdf-<n>.md` with a
header carrying the source URL, retrieval date, page count, and `sha256`, then
the extracted text with its `[[page N]]` markers. That file is the artifact of
record; the deleted binary is replaced by its link and hash, so a reader can
re-fetch and re-hash to confirm the same bytes. Never keep a claim that rests
only on a link you did not extract or read.

## Systematic-review coverage

When the user asks for a systematic, scoping, or exhaustive review, the counts
are part of the answer, not decoration. Record them at each stage so a reader can
tell "we looked" from "we looked everywhere" (method from `src-07`,
`literature-review`):

| Stage | What to record |
|---|---|
| Identification | queries and indexes used, and the number of records each returned |
| Screening | how many records were excluded, and on what stated criterion |
| Included | the sources that survive into the evidence table |

Two distinctions that keep the numbers honest:

- **Records vs studies.** A DOI, an arXiv id, and a preprint of the same work are
  three records and one study. Deduplicate on the work (see Source identity),
  and state which count you are reporting.
- **Removed is not the same as not found.** An excluded record is a decision you
  can defend; a search that returned nothing is negative coverage. Never fold one
  into the other — an inflated "included" count is the cheapest way to make a
  review look more systematic than it was.

PRISMA is the accounting frame, not a compliance claim: this is engineering
evidence, not a health-science review, so adopt the flow and say that the counts
describe this run rather than certifying a standard.

## Output

Write findings as an evidence table with stable numeric IDs (see the
`engineering-research` method) and end with a numbered Sources section where
every entry is a DOI, arXiv id, or verified URL.

Add a `Question` column to the table so each row names the question it
resolves, and close with two required sections:

- **`## What the literature does not settle`** — the questions searched for
  where the literature is silent, contested, or jurisdiction-specific. A
  literature review with no such section reads as "the field agrees", which is
  the most expensive false impression research can produce. This is the
  scholarly half of the negative coverage the `engineering-research` problem
  anchor records on the report side.
- **`## Handback`** — what `engineering-research` must decide, and which
  questions this evidence set cannot answer. Product policy, jurisdiction
  choice, and anything about the user's own code belong there, not in a
  finding.
- For a systematic review, add **`## Search coverage`** — identification,
  screening, and included counts as above, with the record-vs-study basis
  stated. Without it the reader has to take your thoroughness on trust.

## Scope and Boundaries

- This skill finds and verifies academic sources — it does NOT produce final designs, implementation guidance, or the final research deliverable.
- **Research-only, not for final engineering sign-off.** Outputs support engineering research but must be reviewed by a licensed engineer for any design application.
- Evidence quality: see `references/evidence-quality-tiers.md`.
