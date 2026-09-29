import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { checkSuiteFloor } from "../../scripts/steal-selfcheck.mjs";

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

console.log(
  "PASS: the suite-floor claim is read in any emphasis, the other counter is not " +
    "misattributed, and history is not read as a present-tense claim",
);
