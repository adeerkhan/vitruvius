/**
 * command-contract.mjs — Single source of truth for all Vitruvius commands.
 *
 * This contract defines all skills/commands in one place.
 * Adapter files for each host are generated from this contract.
 *
 * To regenerate adapters:
 *   node scripts/generate-adapters.mjs
 */

export const commands = [
  {
    name: "vitruvius",
    description: "Engineering research agent — dispatch to discipline or workflow skill",
    argumentHint: "<discipline or research question>",
    category: "core",
  },
  {
    name: "mechanical",
    description: "Mechanical engineering research — design, thermal, fluids, materials, manufacturing",
    argumentHint: "<research question> [--deep | --quick]",
    category: "discipline",
  },
  {
    name: "software",
    description: "Software engineering research — architecture, frameworks, protocols, security",
    argumentHint: "<research question> [--deep | --quick]",
    category: "discipline",
  },
  {
    name: "civil",
    description: "Civil/structural engineering research — buildings, bridges, steel, concrete, loads",
    argumentHint: "<research question> [--deep | --quick]",
    category: "discipline",
  },
  {
    name: "electrical",
    description: "Electrical/electronics research — power, electronics, controls, EMC",
    argumentHint: "<research question> [--deep | --quick]",
    category: "discipline",
  },
  {
    name: "architectural",
    description: "Architectural research — building science, facades, codes, performance",
    argumentHint: "<research question> [--deep | --quick]",
    category: "discipline",
  },
  {
    name: "gap-analysis",
    description: "Identify research gaps via scholarly triangulation (OpenAlex, arXiv, web)",
    argumentHint: "<discipline> <sub-topic> [--deep | --quick]",
    category: "workflow",
  },
  {
    name: "evidence-ranking",
    description: "Rank and score engineering evidence by quality using tier system",
    argumentHint: "<research question or evidence list>",
    category: "workflow",
  },
  {
    name: "verifier",
    description: "Verify a claim or calculation against authoritative sources",
    argumentHint: "<claim or calculation> [--direct | --blind]",
    category: "workflow",
  },
  {
    name: "design-alternatives",
    description: "Generate and compare 3+ engineering approaches with scored trade-off matrices",
    argumentHint: "<problem statement with constraints>",
    category: "workflow",
  },
  {
    name: "fmea-brainstorm",
    description: "FMEA-style failure mode brainstorming with S/O/D ratings and RPN ranking",
    argumentHint: "<system or component description>",
    category: "workflow",
  },
  {
    name: "compare",
    description: "Source/standard/design comparison matrix",
    argumentHint: "<items to compare>",
    category: "workflow",
  },
  {
    name: "review",
    description: "Severity-graded adversarial review of an artifact",
    argumentHint: "<artifact to review>",
    category: "workflow",
  },
  {
    name: "audit",
    description: "Claim-vs-implementation mismatch audit (paper-vs-code, spec-vs-design)",
    argumentHint: "<item to audit>",
    category: "workflow",
  },
  {
    name: "summarize",
    description: "Faithful structured digest of a standard, spec, or paper",
    argumentHint: "<document to summarize>",
    category: "workflow",
  },
  {
    name: "eli5",
    description: "Plain-language engineering explanation",
    argumentHint: "<engineering topic>",
    category: "workflow",
  },
  {
    name: "artifact-reading",
    description: "Anchored extraction from PDFs, drawings, specs",
    argumentHint: "<file to read>",
    category: "workflow",
  },
  {
    name: "scholarly-research",
    description: "Academic literature evidence layer (OpenAlex, arXiv, Semantic Scholar); synthesis goes to engineering-research",
    argumentHint: "<topic or paper identifier>",
    category: "workflow",
  },
  {
    name: "standards-lookup",
    description: "Engineering standards lookup (AISC, ACI, ASCE, IEEE, Eurocode)",
    argumentHint: "<standard> <section or topic>",
    category: "workflow",
  },
  {
    name: "habit",
    description: "Capture durable research preferences from a run (read-only, review-gated)",
    argumentHint: "[--scope <discipline>] [--window <n>]",
    category: "workflow",
  },
  {
    name: "vitruvius-help",
    description: "Quick-reference card for all Vitruvius commands and the shared research method",
    argumentHint: "[no arguments]",
    category: "workflow",
  },
  {
    name: "proposal",
    description: "Generate targeted Ph.D./Masters research proposals with gap analysis + verification",
    argumentHint: "--posting <path-or-url> --cv <path> [--statement <path>] [--sample <path>]",
    category: "application",
  },
];

export const categories = {
  core: { label: "Core", description: "Entry point commands" },
  discipline: { label: "Disciplines", description: "Domain-specific research skills" },
  workflow: { label: "Workflows", description: "Named engineering research jobs" },
  application: { label: "Applications", description: "End-to-end workflows for specific tasks" },
};

export const hosts = [
  { id: "opencode", dir: ".opencode/command", ext: "md" },
  { id: "cursor", dir: ".cursor/commands", ext: "md" },
  { id: "claude", dir: ".claude/commands", ext: "md" },
  { id: "codex", dir: ".codex/commands", ext: "md" },
  { id: "commandcode", dir: ".commandcode/mods", ext: "ts" },
];

/**
 * Hosts that load a free-standing ruleset rather than slash commands. All three
 * read the same file; it is generated from `references/host-rules.md` so the
 * copies cannot drift apart silently.
 */
export const rulesetHosts = [
  { id: "clinerules", file: ".clinerules/vitruvius.md" },
  { id: "qoder", file: ".qoder/rules/vitruvius.md" },
  { id: "windsurf", file: ".windsurf/rules/vitruvius.md" },
];
