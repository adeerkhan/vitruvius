import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { validateEvalCatalog } from "../../scripts/eval-contract.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const catalog = JSON.parse(readFileSync(join(repoRoot, "evals", "catalog.json"), "utf8"));

function clone() {
  return structuredClone(catalog);
}

function errorsFor(mutator) {
  const value = clone();
  mutator(value);
  return validateEvalCatalog(value, { repoRoot }).errors;
}

const valid = validateEvalCatalog(catalog, { repoRoot });
assert.equal(valid.valid, true, valid.errors.join("\n"));
assert.equal(valid.caseCount, 4);
assert.deepEqual(valid.skills, catalog.priority_skills);

assert.match(
  errorsFor((value) => value.cases.push(structuredClone(value.cases[0]))).join("\n"),
  /duplicate skill case/i,
);
assert.match(
  errorsFor((value) => { value.cases[0].negative.owner = "not-a-skill"; }).join("\n"),
  /unknown negative owner/i,
);
assert.match(
  errorsFor((value) => { value.cases[0].behavior.test = "tests/missing.mjs"; }).join("\n"),
  /behavior test does not exist/i,
);
assert.match(
  errorsFor((value) => { value.cases[0].behavior.expectations[0].marker = "marker-that-does-not-exist"; }).join("\n"),
  /expectation marker not found/i,
);
assert.match(
  errorsFor((value) => { value.cases[0].skill = "unknown-skill"; }).join("\n"),
  /unknown skill/i,
);

console.log("PASS: E1 catalog contract accepts the pilot and refuses malformed cases");
