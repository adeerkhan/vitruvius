import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { checkSuiteFloor, hashStatus, findThirdPartyNames } from "../../scripts/steal-selfcheck.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// The suite-floor rule, and the blind spot it closed.
//
// steal-selfcheck.mjs runs in npm test and gates this map's own numbers, but it
// had no test of its own — so nothing proved any of its rules could fail. This
// covers the one that was wrong.
//
// The old rule matched only `suite floor … **N/25**`, bold. docs/STEAL.md had
// two lines reading "suite floor 14/25" unbolded. The real count is 25/25. The
// map was stale in two places, contradicted itself four lines apart, and the
// gate passed, because a claim in plain text is not a claim to that pattern.
//
// These cases are pure and offline. They do not touch docs/STEAL.md; mutating
// the real map to prove a rule would dirty a tracked file to test a function.

const ON_DISK = 25;
const WITH_SUITE = 25;

// --- 1. The exact drift that slipped through is now caught ----------------
// This is the real wording of the two lines, in the real bold/plain mix.
{
  const drift = [
    "- **Q1** ledger is local-only; the suite-coverage *floor* is 14/25 (`scripts/e1-coverage.mjs`).",
    "| E1-full | 25-skill behavioral catalog | 4/25 model-run behavioral; suite floor 14/25 |",
  ].join("\n");
  const problems = checkSuiteFloor(drift, ON_DISK, WITH_SUITE);
  assert.equal(
    problems.length,
    2,
    `both unbolded 14/25 lines must fail, got ${problems.length}: ${problems.join(" | ")}`,
  );
  assert.ok(
    problems.every((p) => /suite floor of 14\/25/.test(p)),
    "the failure must name the wrong number: " + problems.join(" | "),
  );
  assert.ok(
    problems.every((p) => /25 of 25 skills actually have/.test(p)),
    "the failure must name the true number, so a reader need not go and count",
  );
}

// --- 2. The correct map passes -------------------------------------------
{
  const good = [
    "the suite-coverage *floor* is 25/25 and is a gate",
    "| Suite floor — a `tests/<skill>/` directory exists | the script | **25/25**, now a gate |",
  ].join("\n");
  assert.deepEqual(checkSuiteFloor(good, ON_DISK, WITH_SUITE), []);
}

// --- 3. The other counter is not this check's business --------------------
// Two numbers share the /25 denominator. Flagging the model-run catalog as a
// suite claim is a false positive, and the first version of this rule produced
// exactly two. Whoever names a number nearest it owns it.
{
  const bothCounters = [
    "1. **E1 model-run catalog: 4/25.** The suite floor is 25/25 and gated.",
    "| E1-full | 25-skill behavioral catalog | 4/25 model-run behavioral; suite floor 25/25 |",
  ].join("\n");
  assert.deepEqual(
    checkSuiteFloor(bothCounters, ON_DISK, WITH_SUITE),
    [],
    "a correct line carrying both counters must pass",
  );
}

// --- 4. History is not a claim about the present --------------------------
// "floor 10 -> 14/25" records what the floor used to be. Reading it as a
// present-tense claim would red the build over a historical record.
{
  const historical = "| 32 | Behavioral suites for four skills; floor 10 -> 14/25 | this session |";
  assert.deepEqual(checkSuiteFloor(historical, ON_DISK, WITH_SUITE), []);
}

// --- 5. A different denominator is not a skill count ----------------------
{
  const other = "B1 three-run majority scored (16/19 correct, 0 false blocks)";
  assert.deepEqual(checkSuiteFloor(other, ON_DISK, WITH_SUITE), []);
}

// --- 6. A real mismatch is caught even when the map states it confidently -
{
  const drifted = "| 2 | **Suite floor** | **24/25** |";
  const problems = checkSuiteFloor(drifted, ON_DISK, WITH_SUITE);
  assert.equal(problems.length, 1, "a bold wrong floor must fail");
  assert.match(problems[0], /suite floor of 24\/25/);
}

// --- 6b. A bold pair with no adjacent name is still the floor --------------
// The map writes "**25/25** floor" as readily as "the suite floor is 25/25".
// With no word next to the number, the bold emphasis is the only thing that
// says which counter it is, so the bold fallback carries this case on its own.
{
  const bare = "**25/25** floor, now a gate";
  assert.deepEqual(
    checkSuiteFloor(bare, ON_DISK, WITH_SUITE),
    [],
    "a correct bold floor with no adjacent name must pass",
  );
  const bareWrong = "**14/25** floor, now a gate";
  assert.equal(
    checkSuiteFloor(bareWrong, ON_DISK, WITH_SUITE).length,
    1,
    "a wrong bold floor with no adjacent name must fail — bold is the only signal",
  );
}

// --- 6c. A BOLD catalog number is not read as the floor -------------------
// The counterpart to 6b, and the case that separates the two rules. This number
// is bold and unattributed, so without the catalog rule the bold fallback would
// claim it for the suite floor and report a correct map as wrong.
{
  const boldCatalog = "| 1 | **Model-run catalog** | **4/25** |";
  assert.deepEqual(
    checkSuiteFloor(boldCatalog, ON_DISK, WITH_SUITE),
    [],
    "a bold catalog number must not be read as the suite floor",
  );
}

// --- 7. The real map passes, and the real gate is wired -------------------
{
  const map = readFileSync(join(repoRoot, "docs", "STEAL.md"), "utf8");
  assert.deepEqual(
    checkSuiteFloor(map, ON_DISK, WITH_SUITE),
    [],
    "docs/STEAL.md must pass its own floor rule",
  );

  // The real count, read from the tree rather than the constant above, so a
  // skill added or removed cannot leave this test asserting a stale 25.
  const manifest = JSON.parse(readFileSync(join(repoRoot, "skills", "e1-suite-manifest.json"), "utf8"));
  const skills = readdirSync(join(repoRoot, "skills"));
  const realTotal = skills.filter((n) => existsSync(join(repoRoot, "skills", n, "SKILL.md"))).length;
  assert.equal(realTotal, 25, `this test's fixtures assume 25 skills; tree has ${realTotal}`);
  assert.equal(manifest.model_run_recorded, 4, "the model-run catalog moved; update the fixtures in case 3");

  const gate = spawnSync(process.execPath, [join(repoRoot, "scripts", "steal-selfcheck.mjs")], {
    encoding: "utf8",
  });
  assert.equal(gate.status, 0, `the real self-check must pass:\n${gate.stdout}\n${gate.stderr}`);
}

// --- 8. A shallow clone blocks the hash check; it does not fail it ---------
// The bug this closes, from a real CI run. `actions/checkout` defaults to
// fetch-depth 1, so a routine run reported all 38 commit hashes cited in
// docs/STEAL.md as "not in this repository". Every one of them was in it — the
// clone simply could not see them. The check had two outcomes where it needed
// three, and the third ("cannot tell") resolved to the accusation.
//
// The severity is the point: a status map is what a reader trusts when
// deciding what to work on. A check that cries wolf 38 times trains its reader
// to ignore it, and the one real failure it was written to catch goes with it.
{
  const real = sh("git", ["rev-parse", "--short", "HEAD"]);

  // A hash that certainly exists is BLOCKED, not ABSENT, under a shallow clone.
  assert.equal(
    hashStatus(real, true),
    "blocked",
    "a shallow clone must not be able to resolve any hash, not even HEAD's own",
  );

  // And it is still resolvable in a full clone, so the rule is not "always
  // blocked" — that would silently disable the check everywhere.
  assert.equal(
    hashStatus(real, false),
    "present",
    "a real hash must still resolve in a full clone",
  );

  // A genuinely fabricated hash is still caught. The shallow carve-out must not
  // become a hole: `blocked` covers "cannot see", never "does not exist".
  assert.equal(
    hashStatus("0000000000000000000000000000000000000000", false),
    "absent",
    "a fabricated hash must still be reported absent in a full clone",
  );

  // The three outcomes are distinct. This is the invariant the bug collapsed.
  assert.equal(
    new Set([hashStatus(real, true), hashStatus(real, false), hashStatus("0".repeat(40), false)]).size,
    3,
    "blocked, present, and absent must be three distinguishable outcomes",
  );
}

/**
 * Run a git command, returning null on failure. Mirrors the helper the
 * self-check uses; scoped here so this test file does not import internals.
 */
function sh(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8", cwd: repoRoot });
  return r.status === 0 ? r.stdout.trim() : null;
}

// --- 9. Third-party source names stay out of the tracked tree --------------
// The policy: the tracked tree refers to local reference repositories as
// `src-NN`, and the identifier-to-repository mapping lives in ref/SOURCES.md,
// which is gitignored. A name in a tracked file advertises a third-party
// project in a published package and implies a dependency a fresh clone does
// not have.
//
// The risk in any such check is crying wolf. Two words in this repo are BOTH a
// third-party project name and ordinary English or an npm keyword, and a naive
// substring match corrupts real behaviour — it turned "a writing sample for
// humanizer" into "a writing sample for src-06" and would delete an npm
// discovery keyword. So the rule matches credit positions only, and these cases
// pin that, because a check that false-positives on the repo's own vocabulary
// gets deleted and takes the guarantee with it.
{
  // Attribution positions ARE caught, in every shape the tree actually used.
  for (const leak of [
    "Transfer from ref/feynman/scripts/npm-audit.mjs:6 (MIT, `cd72f97`).",
    "// Stolen from Feynman's verifier citation rules.",
    "Deduplicate sources. (feynman result provenance audit)",
    "Transfer from ref/agent-skills/evals/skill-impact.md.",
    "From BugTraceAI-CLI. Proposes merges for semantically similar sources.",
  ]) {
    const hits = findThirdPartyNames(leak, "fixture");
    assert.ok(hits.length > 0, `a credit position must be caught: ${leak}`);
  }

  // The false-positive classes must NOT be caught. These are the exact strings
  // that a blind replace broke.
  assert.deepEqual(
    findThirdPartyNames('writeFileSync(p, "# Voice Sample\\nNo student sample supplied; humanizer must use the neutral baseline.")', "fixture"),
    [],
    "`humanizer` as an ordinary noun is not a source credit — replacing it broke a real feature",
  );
  assert.deepEqual(
    findThirdPartyNames('  "keywords": ["opencode-plugin", "agent-skills", "vitruvius"],', "fixture"),
    [],
    "the `agent-skills` npm keyword is discovery metadata, not an attribution",
  );

  // Clean prose is not a credit, either.
  assert.deepEqual(
    findThirdPartyNames("The src-05 reference contributed the budget shape. The src-06 validator bundles four ideas.", "fixture"),
    [],
    "an already-anonymised identifier must not re-trigger",
  );

  // The message must tell the reader what to do, not just that something is wrong.
  const [msg] = findThirdPartyNames("ref/feynman/scripts/x.mjs", "docs/STEAL.md");
  assert.match(msg, /docs\/STEAL\.md/, "the message must name the file");
  assert.match(msg, /src-NN/, "the message must name the fix, so it is actionable");
}

console.log(
  "PASS: the suite-floor claim is read in any emphasis, the other counter is not " +
    "misattributed, history is not read as a present-tense claim, a shallow clone " +
    "blocks the hash check instead of failing it, and third-party source names are " +
    "caught in credit positions without false-positiving on the repo's own vocabulary",
);
