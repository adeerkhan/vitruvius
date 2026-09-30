# Source Routing Table

Map information needs to preferred sources. Do not search the same way for
every question — different question types have different authoritative sources.

## Engineering Discipline Routing

| Need | Use first | Then |
|------|-----------|------|
| Code provisions, design rules | Official code body text (AISC, ACI, ASCE, NFPA, IBC, Eurocode) | Code commentary from issuing body |
| Material properties | Primary vendor datasheet or test report | ASTM/AISI/SAE standard |
| Product specs, parameters | Manufacturer official page or catalog | Distributor datasheet (verify against manufacturer) |
| Prior art, existing designs | USPTO/Espacenet patent search | Google Patents, vendor white papers |
| Failure analysis, forensic studies | NTSB/CSB investigation reports | Peer-reviewed forensic engineering literature |
| Geotech, soil parameters | Geotechnical investigation report for the site | USGS regional maps, state geotech databases |
| Loads, environmental data | ASCE 7 (wind, seismic, snow) | Local jurisdiction amendments |
| Accessibility, egress | IBC, ADA Standards, NFPA 101 | Local building code amendments |
| Electrical, power | IEEE standards, NEC, manufacturer application notes | Utility interconnection requirements |
| Software, frameworks | Official docs, GitHub repo README | Peer-reviewed papers, established blog posts |

## Scholarly Literature Routing

| Need | Use first | Then |
|------|-----------|------|
| General engineering papers | OpenAlex (keyless REST) | Semantic Scholar, arXiv |
| Citation graph, seminal work | OpenAlex citations/references | Semantic Scholar citation counts |
| Recent preprints | arXiv, alphaXiv fast search | Conference proceedings |
| Biomedical, life sciences | PubMed, Europe PMC | Semantic Scholar |
| Known paper ID | arXiv for arXiv IDs, Crossref for DOIs | Fetch full text from publisher |
| Standards research | ISO, IEC, ASTM, IEEE portals | National adoptions (BSI, DIN, JIS) |

## Web, Docs, Repos, Grey Literature

| Need | Use first | Then |
|------|-----------|------|
| Web search | `websearch` tool | `webfetch` on best results |
| Official docs | Manufacturer/standards body portal | Established technical blogs |
| GitHub repos | GitHub search | README, issues, PRs |
| Grey literature | Google Scholar | Technical reports, theses |

## Search Strategy

1. **Start wide.** Begin with short, broad queries to map the landscape. Use 2-4 varied-angle queries simultaneously — never one query at a time when exploring.
2. **Evaluate availability.** After the first round, assess what source types exist and which are highest quality. Adjust strategy accordingly.
3. **Progressively narrow.** Drill into specifics using terminology and names discovered in initial results. Refine queries, don't repeat them.
4. **Cross-source.** When the topic spans current reality and academic literature, use both web search and scholarly discovery layers.
5. **Run 2-4 reworded queries** for each question (synonyms, the method's name, the problem's name) and merge the results. Do not trust one query's ranking.

## Source Quality

- **Prefer:** official standards bodies, code text, primary vendor documentation, datasheets, peer-reviewed engineering literature, reputable government/industry sources
- **Accept with caveats:** well-cited secondary sources, established trade publications
- **Deprioritize:** undated blog posts, content aggregators, forum posts, SEO listicles
- **Reject:** anything with no author and no date, or that appears AI-generated with no primary backing

When initial results skew toward low-quality sources, re-search with domain
filters targeting authoritative domains.
