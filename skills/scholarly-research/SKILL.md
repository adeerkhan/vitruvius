---
name: scholarly-research
description: >
  Find and verify scholarly and academic sources for an engineering research
  question. Use when the research needs papers, journal articles, preprints,
  conference proceedings, prior art, or citation data — or when the user names
  a paper, arXiv id, DOI, or asks "what does the literature say". Provides
  keyless REST recipes (OpenAlex, Semantic Scholar, arXiv, alphaXiv fast
  search) and host-tool guidance. Do NOT use for standards/code research that
  has no scholarly layer.
argument-hint: "<topic or paper identifier>"
allowed-tools: Write Edit Bash Read
license: MIT
metadata:
  version: "0.1.5"

---

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

### 3. arXiv API — preprints (CS, physics, quantitative fields)

Atom XML, keyless. ~1 request per 3 seconds.

```
GET https://export.arxiv.org/api/query?search_query=all:<topic>&max_results=20
```

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
sources (vendor docs, standards bodies, news, blogs) and to confirm recency —
not as the primary paper index. Do not point a browser at scholar.google.com.

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

## Scope and Boundaries

- This skill finds and verifies academic sources — it does NOT produce final designs, implementation guidance, or the final research deliverable.
- **Research-only, not for final engineering sign-off.** Outputs support engineering research but must be reviewed by a licensed engineer for any design application.
- Evidence quality: see `references/evidence-quality-tiers.md`.
