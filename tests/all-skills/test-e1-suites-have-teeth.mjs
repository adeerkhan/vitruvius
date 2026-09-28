import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Mutation harness for the eleven E1 behavioural suites added 2026-09-28.
//
// A behavioural suite that cannot fail is decoration. These eleven assert rules
// by matching prose in a SKILL.md, which is exactly the kind of assertion that
// silently stops asserting anything: the file is reworded, the regex no longer
// matches, and the suite goes green without ever checking the thing it claims
// to check.
//
// So each case below weakens ONE real rule in the target skill and asserts that
// its specific suite goes red. The rule that is weakened is named per case, so
// a reader can see what was proved rather than trusting a count.
//
// This mirrors tests/all-skills/test-part3-suites-have-teeth.mjs, which covers
// the four earlier suites. Same invariants, and the same one that bit this repo
// before: a mutation which silently fails to land is a HARNESS BUG and fails the
// run, never a pass.

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * find  — a regex matching the exact prose in the SKILL.md
 * replace — what it becomes when the rule is gutted
 */
const CASES = [
  // --- Thin discipline dispatchers ----------------------------------------
  {
    skill: "civil",
    // Weaken the whole bullet, because the suite's regex is whitespace-insensitive
    // and only needs the words to survive. Gutting the parenthetical alone left
    // "every load must state its basis" plus "combination" in the next clause,
    // which the regex still matched — the mutation landed but the rule did not.
    rule: "every load must state its basis and combination",
    find: /every load must state its basis \(ASCE 7 chapter, code section\)\s*\n\s*and combination; units and direction must be explicit\./,
    replace: "state loads as convenient.",
  },
  {
    skill: "civil",
    rule: "material properties trace to a named grade and governing spec",
    find: /trace to a named grade \+ governing spec \(e\.g\. Gr\.\s*\n?\s*50 per ASTM A992, f'c per ACI 318\)/,
    replace: "trace to a named material",
  },
  {
    skill: "electrical",
    rule: "SI prefix traps (mA vs A, nF vs uF)",
    find: /\(mA vs A, nF vs uF\)/,
    replace: "(use consistent units)",
  },
  {
    skill: "electrical",
    rule: "a part number without a datasheet read is inferred, not verified",
    find: /a part number\s+without a datasheet read is `inferred`, not `verified`/,
    replace: "a part number is fine as stated",
  },
  {
    skill: "mechanical",
    rule: "handbooks are secondary, used only when a primary read is impossible",
    find: /use only when a direct primary read is possible/i,
    replace: "use freely",
  },
  {
    skill: "mechanical",
    // An earlier version replaced "not assumed." alone. The suite does not assert
    // that fragment, so the mutation landed and nothing went red — a case where
    // "the harness ran" was not the same as "the rule was weakened". Weaken the
    // whole clause the rule depends on.
    rule: "design factor must be stated and traced to code or practice",
    find: /design factor \/ factor of safety must be stated and traced\s*\n\s*to code or practice \(e\.g\. ASME BPVC design factor\), not assumed\./,
    replace: "use a sensible design factor.",
  },
  {
    skill: "architectural",
    rule: "an assembly traces to a named system and evaluation report",
    find: /must trace to a\s+named system \+ evaluation report or manufacturer data/i,
    replace: "describes the assembly as described",
  },
  {
    skill: "architectural",
    rule: "performance values trace to a named test method",
    find: /must\s+trace to a named standard\/test method/i,
    replace: "are given as performance values",
  },
  {
    skill: "software",
    rule: "a repo existing does not mean the feature exists",
    find: /A repo exists ≠ a feature exists/i,
    replace: "A repo existing suggests the feature exists",
  },
  {
    skill: "software",
    rule: "unversioned claims are inferred",
    find: /Unversioned claims are `inferred`/i,
    replace: "Unversioned claims are fine",
  },

  // --- Skills with real distinctive content -------------------------------
  {
    skill: "peer-review",
    rule: "never soften a FATAL to MAJOR to avoid being harsh",
    find: /Never soften a FATAL to MAJOR to avoid being harsh/i,
    replace: "Soften severity where it seems fair.",
  },
  {
    skill: "peer-review",
    rule: "a missing check must never read as a pass",
    find: /Never let a missing check read as a\s+pass/i,
    replace: "Treat unchecked items as passing.",
  },
  {
    skill: "artifact-reading",
    rule: "never fill a gap you could not read",
    find: /Never fill a gap you could not read/i,
    replace: "Fill any gap you could not read.",
  },
  {
    skill: "artifact-reading",
    rule: "never strip the location when handing findings to synthesis",
    find: /Never strip the location when handing\s+findings to synthesis/i,
    replace: "Hand findings over without locations.",
  },
  {
    skill: "artifact-reading",
    rule: "vision output must not silently enter the binder",
    find: /must not silently feed vision output into the\s+binder/i,
    replace: "may feed vision output into the binder",
  },

  // --- The distinction-pinning suites --------------------------------------
  {
    skill: "review",
    rule: "vague praise is forbidden",
    find: /Do not praise vaguely/i,
    replace: "Praise what works.",
  },
  {
    skill: "review",
    rule: "predicting approval is forbidden",
    find: /Do not predict ["“]approval["”]/i,
    replace: "Say whether it will pass.",
  },
  {
    skill: "eli5",
    rule: "accuracy is never traded for simplicity",
    find: /Never trade accuracy\s+for simplicity on anything that affects safety or a design decision/i,
    replace: "Simplify freely when it helps understanding.",
  },
  {
    skill: "eli5",
    rule: "a lossy analogy must be declared lossy",
    find: /When an analogy\s+is lossy — when it would mislead an engineer — say so in one line/i,
    replace: "Use analogies freely.",
  },
  {
    skill: "vitruvius",
    rule: "ask which discipline when none is named",
    find: /If the user names no discipline, ask which discipline the question belongs to\s+before starting/i,
    replace: "If the user names no discipline, pick the closest one and start.",
  },
  {
    skill: "vitruvius",
    rule: "all seven canonical roles are named",
    find: /`researcher`, `writer`, `verifier`, `reviewer`, `arbiter`, `goal-checker`, and `habit`/i,
    replace: "`researcher`, `writer`, `verifier`",
  },
  {
    skill: "vitruvius-help",
    rule: "the card is one-shot and persists nothing",
    find: /One-shot; do not persist anything/i,
    replace: "Persistent mode.",
  },
  {
    skill: "vitruvius-help",
    rule: "the numeric-claim rule is stated",
    find: /A numeric claim without a unit, sign convention, and source is noise/i,
    replace: "Numbers are fine as written.",
  },
];

let allDetected = true;
const notDetected = [];
const brokenHarness = [];
const touchedFiles = new Set();

for (const c of CASES) {
  const file = join("skills", c.skill, "SKILL.md");
  const test = join("tests", c.skill, `test-${c.skill}.mjs`);
  const original = readFileSync(file, "utf8");
  const mutated = original.replace(c.find, c.replace);
  touchedFiles.add(file);

  // A mutation that does not land is a broken harness, not a pass. This exact
  // failure mode made a mutation harness report success while asserting nothing.
  if (mutated === original) {
    console.log(`  BROKEN HARNESS: ${c.skill} — "${c.rule}" did not match anything in ${file}`);
    allDetected = false;
    brokenHarness.push(`${c.skill}: ${c.rule}`);
    continue;
  }

  let status;
  let output = "";
  try {
    writeFileSync(file, mutated, "utf8");
    const run = spawnSync("node", [test], { encoding: "utf8", cwd: REPO_ROOT });
    status = run.status;
    output = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  } finally {
    // Restore even if the child is killed or this run is interrupted. An
    // earlier version restored only on the success path and could leave a
    // checked-in SKILL.md gutted, which then failed the payload manifest on
    // the NEXT run with no obvious cause.
    writeFileSync(file, original, "utf8");
  }

  if (status === 0) {
    console.log(`  NOT DETECTED: ${c.skill} — "${c.rule}" removed, suite still passed`);
    allDetected = false;
    notDetected.push(`${c.skill}: ${c.rule}`);
  } else {
    // Name the assertion that caught it, so the proof is legible rather than a
    // bare "detected".
    const caught = /AssertionError.*?: (.*)/.exec(output);
    console.log(`  detected: ${c.skill} — "${c.rule}"`);
    if (caught) console.log(`             caught by: ${caught[1].slice(0, 100)}`);
  }
}

// The harness must leave the tree byte-identical to what git has checked in.
// Compared against git, not an in-memory copy, because the copy is what we just
// wrote — comparing it to itself would pass vacuously.
const g = spawnSync("git", ["status", "--porcelain", "--", ...[...touchedFiles]], {
  encoding: "utf8",
  cwd: REPO_ROOT,
});
const dirty = (g.stdout ?? "").trim();
if (dirty.length > 0) {
  console.log(`\n  DIRTY AFTER RESTORE — the harness must leave the tree clean:\n${dirty}`);
  allDetected = false;
} else {
  console.log("  tree clean after all mutations restored");
}

console.log(
  allDetected
    ? `\nPASS: all ${CASES.length} E1 behavioural assertions fail when their rule is removed ` +
        `(${new Set(CASES.map((c) => c.skill)).size} suites), and the tree is left clean`
    : "\nFAIL: at least one assertion is vacuous, the harness is broken, or the tree was left dirty" +
        (notDetected.length ? `\n  vacuous: ${notDetected.join("; ")}` : "") +
        (brokenHarness.length ? `\n  broken harness: ${brokenHarness.join("; ")}` : ""),
);
process.exit(allDetected ? 0 : 1);
