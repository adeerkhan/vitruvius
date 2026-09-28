import { strict as assert } from "node:assert";
import { readFileSync, existsSync, readdirSync } from "node:fs";
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

// scripts/run-isolated-tests.mjs must exist
assert.ok(
  existsSync(join(repoRoot, "scripts", "run-isolated-tests.mjs")),
  "scripts/run-isolated-tests.mjs must exist",
);

console.log(`PASS: skill-requirements.toml defines requirements for ${skillNames.length} skills`);
