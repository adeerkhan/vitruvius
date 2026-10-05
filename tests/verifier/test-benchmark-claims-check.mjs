import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeDurable, installRestoreGuard } from "../_support/file-mutation.mjs";

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
  { label: "accuracy", field: "accuracy", file: "README.md", value: truth.accuracy + 5 },
  { label: "falseApprovals", field: "falseApprovals", file: "README.md", value: truth.falseApprovals + 1 },
  { label: "falseBlocks", field: "falseBlocks", file: "README.md", value: truth.falseBlocks + 1 },
  { label: "conservativeOvercalls", field: "conservativeOvercalls", file: "README.md", value: truth.conservativeOvercalls + 1 },
  { label: "falseApprovals (VITRUVIUS)", field: "falseApprovals", file: "notes/VITRUVIUS.md", value: truth.falseApprovals + 1 },
  { label: "counts stripped", field: null, file: "notes/VITRUVIUS.md", strip: true },
];

// Snapshot the pristine documents once, before any mutation, so a failed
// restore of one case cannot poison the next case's starting text — and restore
// them all on exit (and Ctrl-C) so a Windows lock cannot leave a mangled doc.
const touchedFiles = [...new Set(MUTATIONS.map((m) => m.file))];
const snapshots = new Map(touchedFiles.map((f) => [join(repoRoot, f), readFileSync(join(repoRoot, f), "utf8")]));
installRestoreGuard(snapshots, { label: "document" });

/**
 * Rebuild the canonical claim and record where each captured group lands IN
 * THE REBUILT STRING. The joiners (" false approval", " false blocks", ...) are
 * inserted between groups, so a group's offset is its position in the rebuilt
 * string, never the sum of the preceding group lengths — summing them lands the
 * swap inside the wrong token and corrupts the claim instead of moving one
 * figure. That defect shipped once: two of four README cases changed no figure.
 */
function rebuildClaim(hit) {
  let rebuilt = "";
  const at = {};
  const group = (g) => {
    at[g] = [rebuilt.length, rebuilt.length + hit[g].length];
    rebuilt += hit[g];
  };
  group(1); rebuilt += "%";
  group(2);
  group(3); rebuilt += " false approval";
  group(4);
  group(5); rebuilt += " false blocks";
  group(6);
  group(7); rebuilt += " conservative overcall";
  return { rebuilt, at };
}

function claimFigure(match, field) {
  const raw = match[FIELDS[field]];
  return field === "accuracy" ? Number(raw) : toNumber(raw);
}

function countClaims(text) {
  return [...text.matchAll(new RegExp(CLAIM_PARTS.source, "gi"))].length;
}

for (const m of MUTATIONS) {
  const path = join(repoRoot, m.file);
  const original = snapshots.get(path);

  const hit = CLAIM_PARTS.exec(original);
  assert.ok(hit, `${m.file} must publish a four-figure adversarial claim; the test's pattern no longer matches it`);

  const { rebuilt, at } = rebuildClaim(hit);

  let mutated;
  if (m.strip) {
    mutated = original.replace(rebuilt, `${hit[1]}% correct verdicts`);
  } else {
    const [s, e] = at[FIELDS[m.field]];
    mutated = original.replace(rebuilt, rebuilt.slice(0, s) + String(m.value) + rebuilt.slice(e));
  }

  if (mutated === original) {
    assert.fail(`mutation "${m.label}" did not change ${m.file}; the test pattern and the document have diverged`);
  }

  // Fidelity: the mutation must move exactly the intended figure and leave the
  // claim parseable. A mutation that merely breaks the claim's syntax still
  // makes the gate fail, but proves nothing about single-figure drift — which is
  // precisely what this test claims to prove.
  if (m.strip) {
    assert.ok(
      countClaims(mutated) < countClaims(original),
      `mutation "${m.label}" must remove a published claim from ${m.file}`,
    );
  } else {
    const after = CLAIM_PARTS.exec(mutated);
    assert.ok(after, `mutation "${m.label}" must leave a parseable claim in ${m.file}`);
    const drifted = Object.keys(truth).filter((field) => claimFigure(after, field) !== truth[field]);
    assert.deepEqual(
      drifted,
      [m.field],
      `mutation "${m.label}" must drift exactly ${m.field} in ${m.file}; drifted [${drifted.join(", ")}]`,
    );
  }

  let result;
  try {
    writeDurable(path, mutated);
    result = run();
  } finally {
    writeDurable(path, original);
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

// Every mutated document must be byte-identical to its pristine snapshot. The
// final run above already implies agreement; this states the restore itself.
for (const [file, pristine] of snapshots) {
  assert.strictEqual(readFileSync(file, "utf8"), pristine, `${file} must be restored after the mutations`);
}

console.log(
  "\nPASS: benchmark-claims gate passes on agreeing docs and fails on every single-figure drift, " +
    "without confusing the pressure or routing measurements for the benchmark",
);
