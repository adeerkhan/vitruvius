# Provenance — Architectural Deep Dive Tests (Round 2)

**Test Date:** 2026-09-05
**Researcher:** opencode (CLI agent)
**Method:** Vitruvius Engineering-Research (Plan → Gather → Draft → Verify → Deliver)
**Tests:** 3 (Tests 4, 5, 6 — architectural engineering deep dive)

---

## Search Queries Executed

| Test | Query | Results |
|------|-------|---------|
| Test 4 | ASCE 7-22 Chapter 13 nonstructural components seismic bracing MEP | 8 results |
| Test 4 | ASCE 7-22 Chapter 13 prescriptive bracing vs analysis distribution systems | 6 results |
| Test 5 | ASTM E90 STC ASTM E492 IIC measurement IBC IRC minimum requirements | 8 results |
| Test 5 | STC typical values common wall assemblies flanking transmission | 6 results |
| Test 6 | LEED v4.1 Energy Atmosphere prerequisites credits EA Optimize Energy | 8 results |
| Test 6 | ASHRAE 90.1-2019 Energy Cost Budget vs Performance Rating Method | 6 results |

**Total searches:** 6
**Total source pages consulted:** 35+

---

## Source Verification Log

### Test 4 Sources
1. panacheg.com/seismic-anchors/asce-7-22-chapter-13 — PE/SE engineering firm, Chapter 13 guide ✓
2. seblog.strongtie.com — Simpson Strong-Tie engineering blog ✓
3. scribd.com/document/512409110 — ASCE 7-22 text excerpts ✓
4. callout.app/codes/asce-7-22-13-3-1 — Code reference ✓
5. panacheg.com/seismic-bracing-calculations — Bracing calculations guide ✓
6. panacheg.com/blog/seismic-bracing-distribution-systems — Distribution systems guide ✓
7. panacheg.com/blog/importance-factor-ip — Ip factor guide ✓
8. dgs.ca.gov — California DSA IR 16-13 (official) ✓
9. seblog.strongtie.com/2015/08 — Seismic bracing requirements ✓
10. asce.org/publications-and-news — ASCE 7-22 official page ✓

### Test 5 Sources
1. astm.org/e0090-09r16.html — ASTM E90 (official) ✓
2. astm.org/e0492-22.html — ASTM E492-22 (official) ✓
3. acousplan.com/blog/iic-astm-e492 — IIC guide ✓
4. floorexpert.com/knowledge-base/acoustical-data — Acoustic data ✓
5. usmadesupply.com/resources/building-codes-standards/astm-e90 — ASTM E90 guide ✓
6. infinitalab.com/services/astm-e90 — ASTM E90 testing ✓
7. codes.iccsafe.org/content/IRC2015/appendix-k — IRC Appendix K (official) ✓
8. commercial-acoustics.com/sound-advice/ibc-1206 — IBC §1206 guide ✓
9. simulations4all.com — STC calculator ✓

### Test 6 Sources
1. support.usgbc.org/hc/en-us — LEED v4 energy update (official USGBC) ✓
2. usgbc.org/node/12024108 — LEED v4.1 IDC EAc (official USGBC) ✓
3. docs.betterbuilding.io — LEED v4.1 OEP details ✓
4. usgbc.org/leed/v41 — LEED v4.1 overview (official) ✓
5. envigilance.com/energy-monitoring/leed-energy-credits — LEED energy guide ✓
6. energycodes.gov/performance_based_compliance — ECB vs PRM (official DOE) ✓
7. ashrae.org/technical-resources/standards-and-guidelines — ASHRAE 90.1 (official) ✓
8. ashrae.org/news/hvacrindustry/2019-update — 90.1-2019 updates ✓
9. alpinme.com/ashrae-90-1-appendix-g-leed — Appendix G guide ✓
10. leedenergymodel.com/blog — ASHRAE 90.1 & Appendix G ✓

---

## Standards Referenced (Complete List)

| Standard | Edition | Section | Topic |
|----------|---------|---------|-------|
| ASCE/SEI 7-22 | 2022 | Ch. 13, §13.1-13.6, Eq. 13.3-1 | Nonstructural seismic design |
| IBC | 2024 | §1206.2, §1206.3, §1206.4 | Sound transmission |
| IRC | 2021 | Appendix K (AK102-AK103) | Residential sound |
| ASTM E90 | 09(2016) | Test Method | Airborne sound transmission loss |
| ASTM E492 | 2022 | Test Method | Impact sound transmission |
| ASTM E413 | — | Rating Method | STC rating |
| ASTM E989 | — | Rating Method | IIC rating |
| ASTM E336 | — | Test Method | Field airborne measurement |
| ASTM E1007 | — | Test Method | Field impact measurement |
| ASHRAE 90.1 | 2019 | §11, Appendix G | ECB and PRM |
| ASHRAE 90.1 | 2010 | Appendix G | LEED baseline reference |
| LEED v4.1 BD+C | 2024 | EA category | Energy & Atmosphere |
| SMACNA | — | Seismic Restraint Manual | HVAC duct bracing |
| MSS SP-58/SP-127 | — | Pipe hanger standards | Pipe supports |
| NFPA 13 | 2022 | Ch. 18 | Sprinkler seismic bracing |
| FEMA P-784 | — | Ch. 3 | Nonstructural hazards |
| ICC-ES AC156 | — | Test Protocol | Shake table testing |
| DSA IR 16-13 | 2024 | §1-4 | California MEP bracing |

---

## Confidence Assessment

| Test | Confidence | Justification |
|------|------------|---------------|
| Test 4 (Seismic MEP) | High | PE/SE engineering sources cross-referenced; ASCE 7-22 sections confirmed |
| Test 5 (STC/IIC) | High | ASTM and IBC sources verified; assembly values from 4+ independent sources |
| Test 6 (LEED Energy) | High | USGBC official sources; DOE energycodes.gov; ASHRAE documentation |

**Overall Confidence: High**
**Caveat:** All findings from secondary sources. Primary standard text access required for final compliance decisions.
