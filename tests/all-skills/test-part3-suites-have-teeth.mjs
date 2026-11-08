import { runMutationHarness } from "../_support/mutation-harness.mjs";

// Mutation harness: prove each of the four Part 3 suites can actually fail.
// A behavioural suite that cannot fail is decoration, so each case below
// weakens one real rule and asserts the corresponding suite goes red.
//
// The mutation runs against a throwaway COPY of the repository (see
// tests/_support/mutation-harness.mjs), so the tracked tree is never touched:
// there is no restore step to get wrong, and an uncommitted edit to a mutated
// file no longer fails the harness by design.

const CASES = [
  {
    name: "compare: direct-source-reading rule removed",
    file: "skills/compare/SKILL.md",
    find: /Read each source\s+directly before describing it/,
    replace: "Describe each source from its abstract",
    test: "tests/compare/test-compare.mjs",
  },
  {
    name: "summarize: never-fill-gap-from-memory removed",
    file: "skills/summarize/SKILL.md",
    find: /and never fill the gap\s+from memory or another source/,
    replace: "and infer the gap from memory",
    test: "tests/summarize/test-summarize.mjs",
  },
  {
    name: "audit: read-both-sides rule removed",
    file: "skills/audit/SKILL.md",
    find: /Read both sides directly/,
    replace: "Read the claim side only",
    test: "tests/audit/test-audit.mjs",
  },
  {
    name: "standards-lookup: mandatory-language convention stripped from a card",
    file: "skills/standards-lookup/references/aci-350.md",
    find: /## Mandatory-language conventions[\s\S]*?never cite commentary as a requirement/,
    replace: "## Notes",
    test: "tests/standards-lookup/test-standards-lookup.mjs",
  },
];

const report = runMutationHarness({
  label: "Part 3 behavioural suites (compare, summarize, audit, standards-lookup)",
  cases: CASES.map((c) => ({
    name: c.name,
    file: c.file,
    test: c.test,
    mutate: (original) => original.replace(c.find, c.replace),
  })),
});

process.exit(report.ok ? 0 : 1);
