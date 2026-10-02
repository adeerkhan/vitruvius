import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
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
assert.match(baseline.out, /published figures/, "the check must report how many figures it verified");
assert.match(baseline.out, /claim site\(s\) in 2 document\(s\)/, "both documents must be covered");

// --- Mutations are expressed RELATIVE to the checked-in text --------------
// An earlier version of this test hardcoded "75%" in its mutation patterns.
// When the benchmark legitimately moved to 80%, the patterns silently stopped
// matching and the test died with "pattern did not match" - the same stale-copy
// disease the check exists to catch, reproduced in the check's own test. Every
// value below is read from the documents at run time and moved away from it.
const NUM = "(\\d+|one|zero|two|three|four|five)";
const CLAIM_PARTS = new RegExp(
  `(\\d+(?:\\.\\d+)?)%([^.]{0,80}?)${NUM}\\s+false\\s+approval([^.]{0,80}?)${NUM}\\s+false\\s+blocks?` +
    `([^.]{0,80}?)${NUM}\\s+conservative\\s+overcalls?`,
  "i",
);
// Group order: accuracy, sep1, falseApprovals, sep2, falseBlocks, sep3, overcalls
const FIELDS = { accuracy: 1, falseApprovals: 3, falseBlocks: 5, conservativeOvercalls: 7 };

function toNumber(raw) {
  if (/^\d+$/.test(raw)) return Number(raw);
  return { one: 1, zero: 0, two: 2, three: 3, four: 4, five: 5 }[raw.toLowerCase()] ?? null;
}

const readme = readFileSync(join(repoRoot, "README.md"), "utf8");
const published = CLAIM_PARTS.exec(readme);
assert.ok(published, "README.md must publish a four-figure adversarial claim for this test to mutate it");

// What each mutation starts from, so the test can prove it moved away from truth.
const truth = {
  accuracy: Number(published[1]),
  falseApprovals: toNumber(published[3]),
  falseBlocks: toNumber(published[5]),
  conservativeOvercalls: toNumber(published[7]),
};

const MUTATIONS = [
  { label: "accuracy", field: "accuracy", file: "README.md", value: truth.accuracy + 5, asPercent: true },
  { label: "falseApprovals", field: "falseApprovals", file: "README.md", value: truth.falseApprovals + 1 },
  { label: "falseBlocks", field: "falseBlocks", file: "README.md", value: truth.falseBlocks + 1 },
  { label: "conservativeOvercalls", field: "conservativeOvercalls", file: "README.md", value: truth.conservativeOvercalls + 1 },
  { label: "falseApprovals (VITRUVIUS)", field: "falseApprovals", file: "notes/VITRUVIUS.md", value: truth.falseApprovals + 1 },
  { label: "counts stripped", field: null, file: "notes/VITRUVIUS.md", strip: true },
];

for (const m of MUTATIONS) {
  const path = join(repoRoot, m.file);
  const original = readFileSync(path, "utf8");

  const hit = CLAIM_PARTS.exec(original);
  assert.ok(hit, `${m.file} must publish a four-figure adversarial claim; the test's pattern no longer matches it`);

  const rebuilt =
    `${hit[1]}%${hit[2]}${hit[3]} false approval${hit[4]}${hit[5]} false blocks${hit[6]}${hit[7]} conservative overcall`;

  let mutated;
  if (m.strip) {
    mutated = original.replace(rebuilt, `${hit[1]}% correct verdicts`);
  } else if (m.asPercent) {
    mutated = original.replace(rebuilt, `${m.value}%${rebuilt.slice(hit[1].length + 1)}`);
  } else {
    // Rebuild the claim, swapping the byte range of just this one group.
    const offsets = [];
    let pos = 0;
    for (let g = 1; g <= 7; g++) {
      offsets[g] = [pos, pos + hit[g].length];
      pos += hit[g].length;
    }
    const [s, e] = offsets[FIELDS[m.field]];
    mutated = original.replace(rebuilt, rebuilt.slice(0, s) + String(m.value) + rebuilt.slice(e));
  }

  if (mutated === original) {
    assert.fail(`mutation "${m.label}" did not change ${m.file}; the test pattern and the document have diverged`);
  }

  let result;
  try {
    writeFileSync(path, mutated, "utf8");
    result = run();
  } finally {
    writeFileSync(path, original, "utf8");
  }

  assert.strictEqual(result.status, 1, `the gate must FAIL when ${m.label} drifts in ${m.file}\n${result.out}`);
  assert.match(
    result.out,
    new RegExp(m.file.replace(/[./]/g, "\\$&")),
    `the failure must name ${m.file}`,
  );
  console.log(`  detected: ${m.label} drift in ${m.file}`);
}

// --- The pressure figure must never be read as the adversarial one --------
// README publishes "4/5 held with one false approval" for the pressure suite in
// the same sentence as the adversarial claim. If the check ever confused them it
// would compare 4/5, or that false-approval count, against the adversarial
// numbers. Assert the pass reports the adversarial values, and specifically not
// the pressure framing. Expected values are read from the docs, not hardcoded -
// hardcoding them here is the same stale copy the check exists to catch.
const final = run();
assert.strictEqual(final.status, 0, `docs must be restored and pass; got:\n${final.out}`);
assert.match(
  final.out,
  new RegExp(
    `\\d+/20 = ${truth.accuracy}%.*${truth.falseApprovals} false approval` +
      `.*${truth.falseBlocks} false blocks.*${truth.conservativeOvercalls} conservative overcall`,
  ),
  `the reported figures must be the adversarial ones (${JSON.stringify(truth)}), not the pressure suite's; got: ${final.out}`,
);
assert.doesNotMatch(
  final.out,
  /4\/5/,
  "the pressure suite's 4/5 must never appear in the adversarial verdict report",
);

console.log(
  "\nPASS: benchmark-claims gate passes on agreeing docs and fails on every single-figure drift, " +
    "without confusing the pressure or routing measurements for the benchmark",
);
