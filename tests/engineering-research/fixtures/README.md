# Real-artifact regression fixture

## What this is

`audit-excerpts.md` is a **verbatim excerpt** of a real engineering-research
deliverable that motivated the `vitruvius-problem-anchor.v1` contract. Nothing
in it is paraphrased or invented. The source is
`C:\Users\adeer\github\floorplanner\Floorplanner_Research_Architecture_Audit_2026.docx`,
a 322-paragraph "Research & Architecture Audit" of a floorplan solver, produced
2026-09-09.

## Why it is kept

`test-problem-anchor.mjs` mostly exercises the validator against synthetic
fixtures. Synthetic fixtures only prove the validator does what its author
thought. This one pins the failure mode that actually occurred, so a future
refactor cannot quietly stop catching it.

## What was actually wrong with it

Four defects, all verified against the floorplanner repository at commit
`1acba4d`, not against the document's own claims:

1. **Zero repository anchors.** 322 paragraphs, and not one
   `packages/…`, `apps/…`, `.ts:line`, commit hash, or test name anywhere. A
   `git grep` for `packages/|apps/|\.ts:|commit|Treemap|UnitsStrategy` over the
   full extracted text returns nothing.
2. **Recommended a module that already existed.** §5 proposes
   `RoomProfile.usabilityProfile` with `anchorPatterns` / `requiredClearances` /
   `furnitureFitScore`. The repository already has
   `packages/solver/src/furniture/Furniture.ts` — a deterministic furniture
   kernel with a per-kind `CLEARANCE` table — plus `usableWallM` per room kind
   in `packages/solver/src/model/RoomProfile.ts:20,29-45`, wired into
   `packages/solver/src/geometry/RoomGeometryEval.ts`, and covered by
   `tests/furniture.test.ts`.
3. **Asserted a dependency that does not exist.** §6 claims "the existing
   Honeybee/Ladybug expertise in the surrounding stack" and builds a
   three-tier simulation plan on it. `git grep -il` for
   `honeybee|ladybug|radiance|energyplus` across every tracked file returns
   **zero** hits, and `package.json` runtime dependencies are `zustand` only.
4. **Graded impact with no ground.** §15 scores twelve changes
   "Very high / Medium" impact and cost, with no measurement, no file, and no
   test behind any row.

## What it got *right*

The citations are sound. Eight DOIs were resolved through CrossRef and every
title, venue, year, volume, and page matched: `10.3390/buildings15101674`,
`10.1016/j.buildenv.2026.114680`, `10.1016/j.scs.2026.107134`,
`10.26599/CVM.2025.9450484`, `10.1016/j.buildenv.2025.113054`,
`10.1016/j.buildenv.2024.112444`, `10.1080/17452007.2023.2203372`,
`10.3390/buildings13061387`. The CVPR 2026 markup-representation paper resolves
at the CVF open-access repository with the exact authors and pages 39262–39271.

**That is the whole point of the contract.** This document passes every
citation check Vitruvius had before the problem anchor existed. It was well
sourced and still useless, because it was about a literature rather than about
the code it was commissioned to review.

## Which excerpt is which

| Excerpt | Lines | Defect it carries |
|---------|-------|-------------------|
| §5 "Geometry is missing the usable room test" | 9 | recommends an existing module |
| §6 "Performance is not part of the search" | 10 | asserts a nonexistent dependency |
| §15 "Prioritized roadmap" | 26 | impact grades with no ground |
| §18 "Bottom line" | 5 | confident architectural verdict, no anchors |

## The honest limit

`test-problem-anchor.mjs` also keeps a **negative control**: a claim that a
module is *absent*, anchored to the file that proves it is *present*. That
record **passes**. The contract proves a claim points at real bytes; it does not
read the claim and compare it to the bytes. That residual is assigned to the
verifier and the goal-checker in `agents/goal-checker.md`, and is stated in
`AGENTS.md`, `README.md`, and the contract reference. Defects 1, 3, and 4 are
caught mechanically. Defect 2 is caught only when the author is forced to open
the file and notice what is in it.
