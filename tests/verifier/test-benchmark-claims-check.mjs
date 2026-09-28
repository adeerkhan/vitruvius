import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, copyFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

// benchmark-claims-check.mjs must fail when the docs drift from the scorer, and
// pass when they agree. A check written to be green is worse than no check, so
// this mutates the DOCS (not the scorer) and asserts the gate notices.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = join(repoRoot, "scripts", "benchmark-claims-check.mjs");

function run() {
  const r = spawnSync("node", [script], { encoding: "utf8" });
  return { status: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

// --- Baseline: docs agree with the scorer --------------------------------
const baseline = run();
assert.strictEqual(baseline.status, 0, `baseline must pass; got:\n${baseline.out}`);
assert.match(baseline.out, /20 published figures/, "the check must report how many figures it verified");
assert.match(baseline.out, /claim site\(s\) in 2 document\(s\)/, "both documents must be covered");

// --- Each published figure must be individually load-bearing --------------
// The claim text is identical across README.md and docs/VITRUVIUS.md, so one
// mutation covers both. Each case below moves ONE figure.
const CLAIM_TEXT = /75%[^.]{0,80}?(?:1|one) false approval[^.]{0,80}?(?:0|zero) false blocks?[^.]{0,80}?(?:1|one) conservative overcalls?/i;

const MUTATIONS = [
  {
    name: "accuracy moved to 80%",
    file: "README.md",
    mutate: (t) => t.replace(CLAIM_TEXT, (m) => m.replace("75%", "80%")),
  },
  {
    name: "false approvals understated as 0",
    file: "README.md",
    mutate: (t) => t.replace(CLAIM_TEXT, (m) => m.replace(/(?:1|one) false approval/, "0 false approvals")),
  },
  {
    name: "false blocks overstated as 1",
    file: "README.md",
    mutate: (t) => t.replace(CLAIM_TEXT, (m) => m.replace(/(?:0|zero) false blocks?/, "1 false block")),
  },
  {
    name: "conservative overcall dropped to 0",
    file: "README.md",
    mutate: (t) => t.replace(CLAIM_TEXT, (m) => m.replace(/(?:1|one) conservative overcalls?/, "0 conservative overcalls")),
  },
  {
    name: "counts stripped, leaving a bare accuracy claim",
    file: "docs/VITRUVIUS.md",
    mutate: (t) => t.replace(CLAIM_TEXT, "75% correct verdicts"),
  },
];

const backups = [];
for (const m of MUTATIONS) {
  const path = join(repoRoot, m.file);
  const backup = mkdtempSync(join(tmpdir(), "claims-backup-"));
  backups.push({ path, backup, original: readFileSync(path, "utf8") });
  copyFileSync(path, join(backup, m.file.replace(/[\\/]/g, "_")));

  const original = readFileSync(path, "utf8");
  const mutated = m.mutate(original);
  if (mutated === original) {
    console.log(`  BROKEN MUTATION: ${m.name} — pattern did not match ${m.file}`);
    for (const b of backups) rmSync(b.backup, { recursive: true, force: true });
    assert.fail(`mutation "${m.name}" did not change ${m.file}`);
  }

  let result;
  try {
    writeFileSync(path, mutated, "utf8");
    result = run();
  } finally {
    writeFileSync(path, original, "utf8");
  }

  assert.strictEqual(
    result.status,
    1,
    `the gate must FAIL for: ${m.name}\n${result.out}`,
  );
  assert.match(result.out, new RegExp(m.file.replace(/[./]/g, "\\$&")), `the failure must name ${m.file}`);
  console.log(`  detected: ${m.name}`);
}

for (const b of backups) rmSync(b.backup, { recursive: true, force: true });

// --- The pressure figure must never be read as the adversarial one --------
// README publishes "4/5 held with one false approval" for the pressure suite in
// the same sentence as the adversarial claim. If the check ever confused them it
// would compare 4/5 or that false-approval count against the adversarial
// numbers, so assert the pass still reports the adversarial values.
const final = run();
assert.strictEqual(final.status, 0, `docs must be restored and pass; got:\n${final.out}`);
assert.match(
  final.out,
  /15\/20 = 75%.*1 false approval.*0 false blocks.*1 conservative overcall/,
  "the reported figures must be the adversarial ones, not the pressure suite's",
);

console.log(
  "\nPASS: benchmark-claims gate passes on agreeing docs and fails on every single-figure drift, " +
    "without confusing the pressure or routing measurements for the benchmark",
);
