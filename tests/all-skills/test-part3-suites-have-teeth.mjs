import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeDurable, installRestoreGuard } from "../_support/file-mutation.mjs";

// Mutation harness: prove each of the four Part 3 suites can actually fail.
// A behavioural suite that cannot fail is decoration, so each case below
// weakens one real rule and asserts the corresponding suite goes red.

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

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

// Snapshot every touched file up front, and restore it on exit (and Ctrl-C):
// an interrupted run must not leave a checked-in SKILL.md mutated, which then
// fails the payload-manifest test on the NEXT run with no obvious cause.
const snapshots = new Map();
for (const c of CASES) {
  const abs = join(REPO_ROOT, c.file);
  if (!snapshots.has(abs)) snapshots.set(abs, readFileSync(abs, "utf8"));
}
installRestoreGuard(snapshots, { label: "skill or reference file" });

let allDetected = true;

for (const c of CASES) {
  const abs = join(REPO_ROOT, c.file);
  const original = snapshots.get(abs);
  const mutated = original.replace(c.find, c.replace);

  if (mutated === original) {
    console.log(`  BROKEN HARNESS: ${c.name} — the pattern did not match, nothing was mutated`);
    allDetected = false;
    continue;
  }

  let status;
  try {
    writeDurable(abs, mutated);
    const run = spawnSync("node", [c.test], { encoding: "utf8", cwd: REPO_ROOT });
    status = run.status;
  } finally {
    writeDurable(abs, original);
  }

  if (status === 0) {
    console.log(`  NOT DETECTED: ${c.name} — suite still passed`);
    allDetected = false;
  } else {
    console.log(`  detected: ${c.name}`);
  }
}

// A mutation harness that leaves the repo dirty is worse than no harness, so
// prove the tree is byte-identical to what git has checked in. Compared against
// git rather than an in-memory copy, because the copy is what we just wrote —
// comparing it to itself would pass vacuously.
const status = spawnSync("git", ["status", "--porcelain", "--", ...CASES.map((c) => c.file)], {
  encoding: "utf8",
  cwd: REPO_ROOT,
});
const dirtyFiles = (status.stdout ?? "").trim();
if (dirtyFiles.length > 0) {
  console.log(`\n  DIRTY AFTER RESTORE — the harness must leave the tree clean:\n${dirtyFiles}`);
  allDetected = false;
} else {
  console.log("  tree clean after all mutations restored");
}

console.log(
  allDetected
    ? "\nPASS: all four behavioural suites fail when their rule is removed, and the tree is left clean"
    : "\nFAIL: at least one suite is vacuous, or the harness left the tree dirty",
);
process.exit(allDetected ? 0 : 1);
