# Test 4 Report — Design-Alternatives Skill: AM-to-Wrought Ti-6Al-4V Joining

**Test:** Test 4 of the Vitryus multi-feature integration test
**Simulated invocation:** `/design-alternatives "joining method for AM Ti-6Al-4V to wrought Ti-6Al-4V in aerospace structures"`
**Date:** 2026-09-05
**Working directory:** `C:\Users\adeer\.config\openchamber\chats\2026-09-05\session-f537712c-dd2c-4360-a63e-ab8337914e21`

---

## Skill routing

The user-supplied invocation `/design-alternatives` does not correspond to a skill registered in the OpenChamber skill catalogue (`skill` tool returned "Skill not found"). The closest functionally equivalent skill is `compare`, which produces a source-grounded comparison matrix with weighted criteria and recommendations with trade-offs. This test followed the user's hard spec (5 alternatives max, 6 weighted criteria, S7 boundary language) and used `compare`'s method for the comparison-matrix structure and provenance.

---

## Step 1 — Constraints parsed

| Type | Constraint |
|---|---|
| Hard | Aerospace jurisdiction (FAA / EASA) |
| Hard | Ti-6Al-4V to Ti-6Al-4V (same alloy) |
| Hard | AM-side build bonded to wrought-side parent |
| Soft | Minimum weight |
| Soft | Acceptable cost |
| Soft | Reasonable inspectability (NDE-friendly defect set) |
| Soft | High fatigue performance |
| Eval criteria | Fatigue, joint efficiency, inspectability, manufacturing complexity, cost, code acceptance |

Recorded in `outputs/.plans/joining-am-to-wrought-ti6al4v.md`.

---

## Step 2 — Alternatives generated

Eight candidates were considered; **four** were carried into the comparison matrix after reasoning about exclusions:

| # | Name | Class | Carried? | Reason |
|---|---|---|---|---|
| 1 | Linear friction welding (LFW) | Solid-state | ✅ | Aero-engine blisk pedigree; preserves AM microstructure |
| 2 | Friction stir welding (FSW) | Solid-state | ✅ | Aerospace FSW practice exists (D17.3); tool for Ti maturing |
| 3 | Laser beam welding (LBW) + HIP | Fusion + post-weld HIP | ✅ | Most FAA-credible AM-to-wrought path |
| 4 | Diffusion bonding / DB-SPF | Solid-state | ✅ | Used in Airbus / military airframes; superior fatigue |
| 5 | Electron beam welding (EBW) | Vacuum fusion | ❌ | Vacuum chamber size limit; X-ray shielding; AM-side porosity worsens keyhole |
| 6 | Adhesive bonding (FM300/FM73) | Adhesive | ❌ | Not FAA-allowed primary; creep above ~100 °C disqualifies hot zones |
| 7 | Mechanical fastening (Hi-Lok, lockbolts) | Mechanical | ❌ | Different design philosophy; not a "welding" comparison |
| 8 | Brazing | Brazing | ❌ | Joint efficiency < 50 % UTS for Ti brazes; not FAA primary |

**Count:** 4 alternatives carried into matrix (within 3–5 spec).

Each alternative documented with: approach (process description), governing standards (EN ISO 15620, AWS D17.1/D17.3, AMS, ASTM F31xx, MIL-STD), key advantages, key limitations, AM-specific notes.

Real authoritative grounding from:
- TWI Global, "Friction Stir Welding — Job Knowledge" (confirmed AWS D17.3/D17.3M:2021 = aerospace FSW Al standard; ISO 25239:2020 for FSW Al)
- Wikipedia, "Friction welding," "Friction stir welding," "Diffusion bonding," "Superplastic forming," "Laser beam welding," "Electron-beam welding"
- McAndrew et al. (2018), "A literature review of Ti-6Al-4V linear friction welding," *Progress in Materials Science* 92:225–257 (cited from the Wikipedia FSW article's reference trail)

Search engines (Google, Bing, DuckDuckGo) all returned heavily polluted / blocked results in this session for narrow standards queries (e.g., exact AMS numbers, specific AWS section text). This is documented in the analysis file (Section 9) and limited confidence to the descriptive level for those standards.

---

## Step 3 — Comparison matrix (with weights)

Six criteria, total weight = 1.00:

| Criterion | Weight |
|---|---|
| Fatigue performance | 0.25 |
| Joint efficiency | 0.20 |
| Inspectability | 0.15 |
| Manufacturing complexity | 0.10 |
| Cost | 0.15 |
| Code acceptance | 0.15 |
| **Total** | **1.00** |

Weighted totals:

| Process | Total |
|---|---|
| LFW | 4.20 |
| FSW | 3.15 |
| LBW + HIP | **4.40** |
| DB / DB-SPF | 3.80 |

---

## Step 4 — Recommendation

**Presented as trade-offs, NOT a single "answer."** Section 8 of the analysis gives:

- **Best overall (weighted):** LBW + HIP (4.40)
- **Best for highest fatigue / mechanical performance:** LFW (4.20) or DB (3.80)
- **Best for cost + schedule + geometry flexibility:** LBW (same as overall)
- **Avoid unless specific reasons:** FSW (kissing-bond NDE blindness; D17.3 is Al-focused); DB for simple butt joints; LFW if joint geometry is non-rectangular
- **Four key trade-offs** the design authority must weigh, including: code path vs. performance, inspectability, AM-side surface prep, HIP availability

No single "winner" was declared. Multiple recommendations identified by priority.

---

## S7 boundary language

Present in the analysis file at:
- Top of document (status line)
- Section 9, "Boundary and Confidence"

Exact language used:

> **S7 boundary — research-only, not for final engineering sign-off.**

And in Section 9:

> **S7 boundary — research-only, not for final engineering sign-off.**

---

## Test self-check

| Check | Required | Present? | Location |
|---|---|---|---|
| Constraints extracted from problem statement | Yes | ✅ | Step 1 above + analysis Section 1 |
| 3–5 alternatives generated | 3–5 | ✅ (4) | Step 2 above + analysis Section 3–6 |
| For each: approach, standards, advantages, limitations | Yes | ✅ | analysis Sections 3, 4, 5, 6 |
| Real standards referenced | Yes | ✅ | Sources 1, 3, 4, 5, 10, 11, 12 (EN ISO 15620, AWS D17.1/D17.3, AMS, ASTM F31xx, MIL-STD) |
| Comparison matrix 1–5 with weights | Yes | ✅ | Section 7 of analysis |
| Explicit weights summing to 1.00 | Yes | ✅ | 0.25+0.20+0.15+0.10+0.15+0.15 = 1.00 |
| Trade-offs presented (not single answer) | Yes | ✅ | Section 8 of analysis |
| S7 boundary language present | Yes | ✅ | Top + Section 9 of analysis |
| Inline summary in response | Yes | ✅ | (delivered in chat reply) |
| Full analysis at outputs/design-alternatives/... | Yes | ✅ | `outputs/design-alternatives/joining-am-to-wrought-ti6al4v.md` |
| Test report at outputs/test-4-... | Yes | ✅ | This file |

---

## Known limitations (acknowledged)

1. **Search engine blockage.** Google, Bing, DuckDuckGo all returned polluted/blocked results in this session for narrow technical queries. The analysis relies on TWI Global, Wikipedia, and the McAndrew 2018 *Progress in Materials Science* literature review as the highest-quality primary sources that could be retrieved. Standards (AMS, AWS, MIL-STD, ASTM F31xx) are referenced by acronym but not retrieved end-to-end — this is called out in the analysis Section 9.
2. **Joint efficiency / fatigue numbers** are order-of-magnitude from literature reviews, not from a single primary test report. Confidence flagged accordingly.
3. **AWS D17.3 vs D17.1 distinction.** The user prompt mentioned "AWS D17.1 for aerospace fusion welding" — confirmed correct (D17.1 = fusion). D17.3 = FSW of *Al* for aerospace — explicitly NOT applicable to Ti and this distinction is documented in the analysis to avoid an upstream common error.
4. **Skill routing.** No `design-alternatives` skill exists; `compare` was used as the closest functional match. This is documented at the top of this report.

---

## Outputs

| File | Purpose |
|---|---|
| `outputs/design-alternatives/joining-am-to-wrought-ti6al4v.md` | Full analysis (problem restatement, 4 alternatives, comparison matrix, recommendation with trade-offs, sources, S7 boundary) |
| `outputs/test-4-design-alternatives-report.md` | This test report |
| `outputs/.plans/joining-am-to-wrought-ti6al4v.md` | Plan artifact recorded before research |

---

**Status:** Test 4 complete. All spec items met.