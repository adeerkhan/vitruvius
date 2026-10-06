/**
 * contract.mjs — Single source of truth for Vitruvius host commands and install
 * targets.
 *
 * This contract defines every slash command and where each host installs its
 * files. `installer/render.mjs` renders the generated adapters from it and
 * `installer/install.mjs` drives both the render and the authored-file copy.
 *
 * Install every host into a project:
 *   node installer/install.mjs --target . --all
 */

export const commands = [
  {
    name: "vitruvius",
    description: "Engineering research agent — dispatch to discipline or workflow skill",
    argumentHint: "<discipline or research question>",
    category: "core",
  },
  {
    name: "engineering-research",
    description: "Shared research method — discover, read, synthesize, verify, review",
    argumentHint: "<research question or artifact to review> [--deep | --quick] [--turns N | --budget N]",
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
    name: "hypothesis-generation",
    description: "Generate and freeze rival engineering hypotheses with dated evidence boundaries",
    argumentHint: "<engineering observation>",
    category: "workflow",
  },
  {
    name: "peer-review",
    description: "Adversarial peer review of an engineering artifact with severity-graded findings",
    argumentHint: "<artifact to review>",
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

/**
 * Host install contract. Each host names what Vitruvius writes into a target
 * project and where. Nothing here is committed: `installer/install.mjs`
 * renders the generated parts from `commands` plus `references/host-rules.md`
 * and copies the authored parts (`copy`, repo-relative source -> target path)
 * from `installer/hosts/<host>/`.
 *
 * Keeping generated output out of the repository is why the host packages hold
 * only the handful of files a human actually writes.
 */
export const hosts = [
  {
    id: "opencode",
    description: "OpenCode plugin, subagent role adapters, and slash commands",
    commands: { dir: ".opencode/command", ext: "md" },
    roles: { dir: ".opencode/agent" },
    copy: [{ from: "installer/hosts/opencode/plugins", to: ".opencode/plugins" }],
  },
  {
    id: "claude",
    description: "Claude Code slash commands and plugin manifest",
    commands: { dir: ".claude/commands", ext: "md" },
    copy: [{ from: "installer/hosts/claude/plugin.json", to: ".claude-plugin/plugin.json" }],
  },
  {
    id: "codex",
    description: "Codex slash commands",
    commands: { dir: ".codex/commands", ext: "md" },
  },
  {
    id: "cursor",
    description: "Cursor slash commands and always-on ruleset",
    commands: { dir: ".cursor/commands", ext: "md" },
    copy: [{ from: "installer/hosts/cursor/rules/vitruvius.mdc", to: ".cursor/rules/vitruvius.mdc" }],
  },
  {
    id: "commandcode",
    description: "Command Code mod",
    mod: { file: ".commandcode/mods/vitruvius.ts" },
  },
  {
    id: "clinerules",
    description: "Cline always-on ruleset",
    ruleset: { file: ".clinerules/vitruvius.md" },
  },
  {
    id: "qoder",
    description: "Qoder ruleset and plugin manifest",
    ruleset: { file: ".qoder/rules/vitruvius.md" },
    copy: [{ from: "installer/hosts/qoder/plugin.json", to: ".qoder-plugin/plugin.json" }],
  },
  {
    id: "windsurf",
    description: "Windsurf always-on ruleset",
    ruleset: { file: ".windsurf/rules/vitruvius.md" },
  },
];
