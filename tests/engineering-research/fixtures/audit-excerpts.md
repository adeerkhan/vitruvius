# Verbatim excerpts from a real engineering-research deliverable

Source: `Floorplanner_Research_Architecture_Audit_2026.docx` (2026-09-09), a
"Research & Architecture Audit" of a floorplan solver. Reproduced verbatim for
the regression fixture described in `README.md` in this directory. Do not edit
to make a test pass; if the contract stops catching these defects, the contract
is wrong.

---

## 5. Geometry is missing the "usable room" test

A rectangle of 12 m² can still be a terrible bedroom. The current geometry
terms — aspect ratio, width, depth, area — are useful, but they are proxies for
usability. Architectural space is occupied by objects and movement.

Recent computational furniture work treats walls, doors, windows, circulation
zones and furniture footprints as constrained spatial elements and evaluates
ergonomic clearances, opening conflicts, daylight and privacy. [14]
Accessibility guidance similarly makes clear that accessible residential routes
require continuous clear width and appropriate turning spaces, rather than mere
topological connectivity. [15,16]

Recommended addition: RoomProfile.usabilityProfile, not hard-coded furniture per
room.

| Field | Purpose |
| --- | --- |
| anchorPatterns | Bed against wall, sofa facing view, WC against service wall, kitchen working triangle |
| requiredClearances | Circulation and maintenance bands around anchors |
| openingExclusions | No furniture footprint may block door swing/window zone |
| turningRequirement | Optional turning envelope for accessible units |
| occupancyMode | standard \| accessible \| senior \| family \| hotel |
| furnitureFitScore | Fast discrete feasibility score, not a full interior-design solver |

This should start as a cheap evaluator/repair operator. You can use a tiny grid
inside each room or a small set of canonical furniture templates. Do not
generate every chair and table. The key is to detect obviously unusable rooms
before they reach the top of the Pareto set.

## 6. Performance is not actually part of the current apartment search

The architecture mentions privacy, service-zone clustering and structural grid
alignment, but environmental performance is not yet represented with comparable
strength. This is a major missed opportunity given the research direction and
the existing Honeybee/Ladybug expertise in the surrounding stack.

A 2025 study on AI-generated residential floorplans explicitly identifies the
problem: many AI outputs are images without geometry/property data needed for
physical performance analysis. It then combines generation with a daylight
predictor to accelerate evaluation. [8] Another 2026 study reports one-step
low-energy residential generation using a learned energy predictor and a large
low-energy floorplan dataset. [17] Public-housing research also shows that
optimizing floorplan configuration for natural ventilation, noise and daylight
can materially improve indoor environmental quality. [18]

The right architecture is a tiered evaluator:

| Tier | Cost | Use |
| --- | --- | --- |
| Tier 0: geometry proxies | ~microseconds | façade length, room depth, orientation, obstruction |
| Tier 1: surrogate predictors | milliseconds | daylight, EUI, ventilation, noise/view proxy |
| Tier 2: simulation | seconds/minutes | Radiance/EnergyPlus/CFD for finalists only |
| Tier 3: human review | interactive | architect chooses among Pareto solutions |

Honeybee can already support physical simulation; the missing architectural
abstraction is the evaluation interface and caching strategy, not a new
simulator. The Honeybee tooling exposes simulation of models in EnergyPlus and
daylight-control workflows based on sensor grids. [19,20]

Important: do not put full simulations inside simulated annealing. Use cheap
proxies during search, then batch simulation only on a small finalist set. Your
deterministic seeds and provenance make this especially suitable for
surrogate-model training later.

## 15. Prioritized roadmap — what I would implement

| Priority | Change | Impact | Cost | Why now |
| --- | --- | --- | --- | --- |
| P0 | SpatialNetwork + weighted circulation quality | Very high | Medium | Immediately fixes the biggest blind spot in "walkable but bad" layouts |
| P0 | Opening potential during search | Very high | Medium | Stops exterior/adjacency scoring from ignoring usable windows/doors |
| P0 | Room usability evaluator (furniture/clearance archetypes) | Very high | Medium | Catches architecturally unusable rooms that geometry score misses |
| P1 | Typology profiles for building constants | High | Low | Turns heuristics into reusable building types |
| P1 | Wet-stack/service graph | High | Medium | Makes apartment aggregation genuinely building-aware |
| P1 | Code-profile egress graph | High | Medium | Separates unit walkability from building life-safety |
| P1 | Privacy: entry sightline + visual graph | High | Medium | Makes privacy score architecturally meaningful |
| P2 | Fast daylight/view/ventilation surrogates | Very high | High | Connects directly to performance-conditioned generation |
| P2 | Structural intent model + stacked grid | High | Medium | Prevents aesthetically good but constructively awkward plans |
| P2 | Architectural diversity signature | Medium | Low | Makes solution sets meaningfully different |
| P3 | Learned proposal model / LLM intent compiler | High | High | Leverage after the deterministic evaluator stack is mature |
| P3 | Non-rectangular room geometry | Medium | High | Only after rectangle limitations become the dominant bottleneck |

## 18. Bottom line

You are not missing another floorplan algorithm. You are missing a richer
representation of what a floorplan *means*. The existing solver is already
capable of being the geometry/optimization kernel. The next leap is to turn it
into an architectural reasoning stack around that kernel.

The highest-leverage sequence is: weighted spatial circulation → opening
potential → room usability → typology profiles → services/egress → visual
privacy → fast environmental surrogates → structural intent → learned
intent/proposal generation. This sequence improves real architectural quality
while preserving the deterministic core.
