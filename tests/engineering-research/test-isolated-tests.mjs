import { strict as assert } from "node:assert";
import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// tests/skill-requirements.toml must exist
const reqPath = join(repoRoot, "tests", "skill-requirements.toml");
assert.ok(existsSync(reqPath), "tests/skill-requirements.toml must exist");

const content = readFileSync(reqPath, "utf8");

// Must have a [skills] section
assert.match(content, /^\[skills\]$/m, "requirements file must have a [skills] section");

// Must define requirements for all 25 skills
const skillsDir = join(repoRoot, "skills");
const skillNames = readdirSync(skillsDir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

for (const name of skillNames) {
  assert.ok(
    content.includes(`${name} =`),
    `requirements file must define requirements for ${name}`,
  );
}

// scripts/run-isolated-tests.mjs must exist AND actually run.
//
// It had a syntax error (`await` inside a non-async function) that made it
// impossible to execute, and this assertion only called existsSync on it — so
// the file was "covered" while never having run once. A registry entry plus an
// existence check is not coverage; this now runs the runner end to end.
const runner = join(repoRoot, "scripts", "run-isolated-tests.mjs");
assert.ok(existsSync(runner), "scripts/run-isolated-tests.mjs must exist");

const syntax = spawnSync("node", ["--check", runner], { encoding: "utf8" });
assert.strictEqual(
  syntax.status,
  0,
  `scripts/run-isolated-tests.mjs must parse; a syntax error means it can never run: ${syntax.stderr}`,
);

const run = spawnSync("node", [runner, "civil"], { encoding: "utf8", cwd: repoRoot });
assert.strictEqual(
  run.status,
  0,
  `the isolated-test runner must actually run a skill's suite; got ${run.status}: ${run.stdout}${run.stderr}`,
);
assert.match(
  `${run.stdout}${run.stderr}`,
  /PASS: test-civil\.mjs|All tests passed/,
  "the runner must report the skill's suite as run and passing, not merely start",
);

// --- A FAILING suite must propagate ----------------------------------------
// Only ever having run a green suite, the runner could be swallowing failures
// and this test would not notice: a runner that ignores the child's exit status
// passes every assertion above. So a deliberately failing fixture skill is run
// through it and the non-zero exit is required.
const failSkill = "__isolated-tests-failure-probe";
const failDir = join(repoRoot, "tests", failSkill);
mkdirSync(failDir, { recursive: true });
try {
  writeFileSync(
    join(failDir, `test-${failSkill}.mjs`),
    'import { strict as assert } from "node:assert";\nassert.strictEqual(1, 2, "deliberate failure probe");\n',
    "utf8",
  );
  const bad = spawnSync("node", [runner, failSkill], { encoding: "utf8", cwd: repoRoot });
  assert.notStrictEqual(
    bad.status,
    0,
    "the runner must exit non-zero when a skill's suite fails; a runner that reports green regardless has measured nothing",
  );
  assert.match(
    `${bad.stdout}${bad.stderr}`,
    /deliberate failure probe/,
    "the runner must surface the failing assertion, so the failure is diagnosable",
  );
} finally {
  rmSync(failDir, { recursive: true, force: true });
}

console.log(`PASS: skill-requirements.toml defines requirements for ${skillNames.length} skills`);
console.log("PASS: run-isolated-tests.mjs parses, runs a suite, and propagates a failure");
