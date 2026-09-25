/**
 * Command Code mod — auto-generated from scripts/command-contract.mjs
 * Do not edit directly. Run: node scripts/generate-adapters.mjs
 */

export const commands = [
  {
    name: "vitruvius",
    description: "Engineering research agent — dispatch to discipline or workflow skill",
    argumentHint: "<discipline or research question>",
  },

  {
    name: "mechanical",
    description: "Mechanical engineering research — design, thermal, fluids, materials, manufacturing",
    argumentHint: "<research question> [--deep | --quick]",
  },

  {
    name: "software",
    description: "Software engineering research — architecture, frameworks, protocols, security",
    argumentHint: "<research question> [--deep | --quick]",
  },

  {
    name: "civil",
    description: "Civil/structural engineering research — buildings, bridges, steel, concrete, loads",
    argumentHint: "<research question> [--deep | --quick]",
  },

  {
    name: "electrical",
    description: "Electrical/electronics research — power, electronics, controls, EMC",
    argumentHint: "<research question> [--deep | --quick]",
  },

  {
    name: "architectural",
    description: "Architectural research — building science, facades, codes, performance",
    argumentHint: "<research question> [--deep | --quick]",
  },

  {
    name: "gap-analysis",
    description: "Identify research gaps via scholarly triangulation (OpenAlex, arXiv, web)",
    argumentHint: "<discipline> <sub-topic> [--deep | --quick]",
  },

  {
    name: "evidence-ranking",
    description: "Rank and score engineering evidence by quality using tier system",
    argumentHint: "<research question or evidence list>",
  },

  {
    name: "verifier",
    description: "Verify a claim or calculation against authoritative sources",
    argumentHint: "<claim or calculation> [--direct | --blind]",
  },

  {
    name: "design-alternatives",
    description: "Generate and compare 3+ engineering approaches with scored trade-off matrices",
    argumentHint: "<problem statement with constraints>",
  },

  {
    name: "fmea-brainstorm",
    description: "FMEA-style failure mode brainstorming with S/O/D ratings and RPN ranking",
    argumentHint: "<system or component description>",
  },

  {
    name: "compare",
    description: "Source/standard/design comparison matrix",
    argumentHint: "<items to compare>",
  },

  {
    name: "review",
    description: "Severity-graded adversarial review of an artifact",
    argumentHint: "<artifact to review>",
  },

  {
    name: "audit",
    description: "Claim-vs-implementation mismatch audit (paper-vs-code, spec-vs-design)",
    argumentHint: "<item to audit>",
  },

  {
    name: "summarize",
    description: "Faithful structured digest of a standard, spec, or paper",
    argumentHint: "<document to summarize>",
  },

  {
    name: "eli5",
    description: "Plain-language engineering explanation",
    argumentHint: "<engineering topic>",
  },

  {
    name: "artifact-reading",
    description: "Anchored extraction from PDFs, drawings, specs",
    argumentHint: "<file to read>",
  },

  {
    name: "scholarly-research",
    description: "Academic literature evidence layer (OpenAlex, arXiv, Semantic Scholar); synthesis goes to engineering-research",
    argumentHint: "<topic or paper identifier>",
  },

  {
    name: "standards-lookup",
    description: "Engineering standards lookup (AISC, ACI, ASCE, IEEE, Eurocode)",
    argumentHint: "<standard> <section or topic>",
  },

  {
    name: "habit",
    description: "Capture durable research preferences from a run (read-only, review-gated)",
    argumentHint: "[--scope <discipline>] [--window <n>]",
  },

  {
    name: "proposal",
    description: "Generate targeted Ph.D./Masters research proposals with gap analysis + verification",
    argumentHint: "--posting <path-or-url> --cv <path> [--statement <path>] [--sample <path>]",
  },
];
