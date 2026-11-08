import { strict as assert } from "node:assert";

import { exactKeys, hasOnlyKeys } from "../../scripts/schema.mjs";

// Pins the two policies the seven former copies disagreed on. A contract
// validator that silently stops requiring a field, or starts rejecting an
// optional one, is the divergence this module exists to prevent — so each
// message and return value below is asserted, not just the pass/fail.

// --- hasOnlyKeys: unknown fields are errors; validation continues --------
{
  const errors = [];
  assert.equal(hasOnlyKeys({ a: 1 }, ["a", "b"], "record", errors), true, "a clean object passes");
  assert.deepEqual(errors, []);

  errors.length = 0;
  assert.equal(
    hasOnlyKeys({ a: 1, bogus: 2 }, ["a", "b"], "record", errors),
    true,
    "an unknown field is collected but does not stop the caller's validation",
  );
  assert.deepEqual(errors, ["record has unknown field: bogus"]);

  errors.length = 0;
  assert.equal(hasOnlyKeys(null, ["a"], "record", errors), false, "null is not an object");
  assert.deepEqual(errors, ["record must be an object"]);
  errors.length = 0;
  assert.equal(hasOnlyKeys([], ["a"], "record", errors), false, "an array is not an object");
  assert.equal(hasOnlyKeys("x", ["a"], "record", errors), false, "a string is not an object");
}

// --- hasOnlyKeys requireAll: missing keys are reported, not fatal -------
{
  const errors = [];
  assert.equal(
    hasOnlyKeys({ a: 1 }, ["a", "b"], "record", errors, { requireAll: true }),
    true,
    "requireAll still returns true so the caller collects every error",
  );
  assert.deepEqual(errors, ["record is missing field: b"]);
}

// --- exactKeys: unknown OR missing is a failure -------------------------
{
  const errors = [];
  assert.equal(exactKeys({ a: 1, b: 2 }, ["a", "b"], "record", errors), true);
  assert.deepEqual(errors, []);

  errors.length = 0;
  assert.equal(exactKeys({ a: 1, b: 2, bogus: 3 }, ["a", "b"], "record", errors), false);
  assert.deepEqual(errors, ["record.bogus is not allowed"]);

  errors.length = 0;
  assert.equal(exactKeys({ a: 1 }, ["a", "b"], "record", errors), false);
  assert.deepEqual(errors, ["record is missing b"]);

  errors.length = 0;
  assert.equal(
    exactKeys({ a: 1 }, ["a", "b"], "record", errors, ["b"]),
    true,
    "an optional key is exempt from the required check",
  );
  assert.deepEqual(errors, []);

  errors.length = 0;
  assert.equal(exactKeys(undefined, ["a"], "record", errors), false);
  assert.deepEqual(errors, ["record must be an object"]);
}

console.log("PASS: exact-key policies preserved — unknown, required, optional, and non-object messages");
