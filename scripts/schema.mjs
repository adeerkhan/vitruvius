// schema.mjs — the one definition of the exact-key membership check.
//
// Seven contract validators each carried a local exactKeys. Four were
// byte-identical, two differed only in whether missing keys were also
// required, and one had already diverged — problem-anchor grew an optional-key
// list the others never got. A validation rule with seven definitions is a rule
// where a fix lands in one copy, so the two behaviours that are actually
// distinct get one name each:
//
//   hasOnlyKeys — unknown fields are errors; returns false only when the value
//                 is not an object. `requireAll` additionally reports missing
//                 keys (verdict-gate's policy) without stopping validation.
//   exactKeys   — unknown fields AND missing keys are failures; `optional`
//                 exempts keys from the required check (problem-anchor's
//                 policy). Returns false on either.

/**
 * @param {unknown} value
 * @param {readonly string[]} allowed
 * @param {string} label
 * @param {string[]} errors
 * @param {{ requireAll?: boolean }} [options]
 * @returns {boolean} false only when the value is not a plain object
 */
export function hasOnlyKeys(value, allowed, label, errors, { requireAll = false } = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${label} must be an object`);
    return false;
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) errors.push(`${label} has unknown field: ${key}`);
  }
  if (requireAll) {
    for (const key of allowed) {
      if (!(key in value)) errors.push(`${label} is missing field: ${key}`);
    }
  }
  return true;
}

/**
 * @param {unknown} value
 * @param {readonly string[]} allowed
 * @param {string} label
 * @param {string[]} errors
 * @param {readonly string[]} [optional] keys exempt from the required check
 * @returns {boolean} false when the value is not a plain object, or a key is
 *   unknown, or a required key is missing
 */
export function exactKeys(value, allowed, label, errors, optional = []) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${label} must be an object`);
    return false;
  }
  let ok = true;
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      errors.push(`${label}.${key} is not allowed`);
      ok = false;
    }
  }
  for (const key of allowed) {
    if (optional.includes(key)) continue;
    if (Object.prototype.hasOwnProperty.call(value, key)) continue;
    errors.push(`${label} is missing ${key}`);
    ok = false;
  }
  return ok;
}
