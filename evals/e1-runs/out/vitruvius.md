# Bridge Deck Fatigue Cracking — Discipline Routing

**Route it to `/vitruvius:civil` (civil / structural engineering).**

Fatigue cracking in a bridge deck is a structural-limit-state problem defined by a structure, a load spectrum, and a connection detail — not a general materials question. The governing evidence sits in the civil landscape: AASHTO LRFD Bridge Design Specifications Section 6 (steel fatigue, Fatigue I/II load combinations, detail categories) and Section 5 (concrete deck cracking and reinforcement detailing); AASHTO LRFD Section 3 for the live-load model that produces the truck-load cycles; and state DOT bridge inspection manuals (NBI element-level condition data) plus FHWA fatigue and fracture guidance for welded details.

What the civil run should establish:

- **Failure mode and location** — transverse deck cracking, fatigue of welded shear connectors or diaphragm connections, or distortion-induced cracking at web gaps. Each has a different governing provision and inspection signature.
- **The detail category and stress range** — AASHTO fatigue detail category (A through E′) with its constant-amplitude fatigue limit and the applicable resistance equation.
- **The actual cycle count** — average daily truck traffic, lane distribution, and the design life the deck was detailed for, versus the traffic it now carries.
- **Whether the crack is load-driven or restrained-volume-change driven** — a concrete deck cracking from shrinkage/thermal restraint is a different problem from one cracking from cyclic truck loading, and Section 5 detailing provisions, not Section 6 fatigue, govern the former.

**When mechanical enters.** Only as a narrow supporting input: S-N curve data, fracture-mechanics crack-growth assessment (Paris law), or weld metallurgy and residual-stress questions. That is a hand-off, not the lead discipline — mechanical does not own bridge load models, AASHTO fatigue provisions, or inspection practice.

**One caution.** Defer root-cause calls until the crack pattern, detail drawings, and traffic data are in hand. A visual crack alone does not select a mechanism, and a fatigue verdict without the detail category and measured or estimated stress range is unsupported.

Research only — not for final engineering sign-off. A licensed bridge engineer must review any repair or retrofit decision.
