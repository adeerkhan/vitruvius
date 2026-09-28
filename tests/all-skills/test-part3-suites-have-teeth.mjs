import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

// Mutation harness: prove each of the four Part 3 suites can actually fail.
// A behavioural suite that cannot fail is decoration, so each case below
// weakens one real rule and asserts the corresponding suite goes red.

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

let allDetected = true;

for (const c of CASES) {
  const original = readFileSync(c.file, "utf8");
  const mutated = original.replace(c.find, c.replace);

  if (mutated === original) {
    console.log(`  BROKEN HARNESS: ${c.name} — the pattern did not match, nothing was mutated`);
    allDetected = false;
    continue;
  }

  writeFileSync(c.file, mutated, "utf8");
  const run = spawnSync("node", [c.test], { encoding: "utf8" });
  writeFileSync(c.file, original, "utf8");

  if (run.status === 0) {
    console.log(`  NOT DETECTED: ${c.name} — suite still passed`);
    allDetected = false;
  } else {
    console.log(`  detected: ${c.name}`);
  }
}

console.log(
  allDetected
    ? "\nPASS: all four behavioural suites fail when their rule is removed"
    : "\nFAIL: at least one suite is vacuous — it passed with its rule deleted",
);
process.exit(allDetected ? 0 : 1);
