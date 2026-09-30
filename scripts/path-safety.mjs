/**
 * path-safety.mjs — one definition of "is this path safe to read or write?".
 *
 * Why this exists: `isSafeRelativePath` was written five times and `isInside`
 * four times across the contract scripts. Four of the `isSafeRelativePath`
 * bodies were behaviourally identical and three of the `isInside` bodies were,
 * which is a security control with four independent definitions. When it
 * drifts, one copy gets the fix and the others keep the bug.
 *
 * The fifth copy — in skills/engineering-research/scripts/evidence-ledger.mjs —
 * is deliberately NOT imported from here. A skill ships as a self-contained
 * directory so a copied skill keeps working when installed alone, and no script
 * under skills/ imports from scripts/ anywhere in this repo. That one stays
 * local; this module covers the repo-level contracts that ship together.
 *
 * Semantics are the STRICTEST of the originals (field-pilot + goal-check, which
 * were already identical):
 *   - rejects non-strings and empty/whitespace-only strings;
 *   - rejects absolute paths, and drive-letter/colon forms;
 *   - rejects any backslash, so a Windows separator cannot smuggle a `..`
 *     past a check that only splits on `/`;
 *   - rejects empty, `.` and `..` segments.
 *
 * Two call sites previously accepted a `.` segment (eval-contract rejected only
 * `..`; fixed-case rejected `..` and empty). Tightening those two is intended:
 * a leading `./` is already handled by path.resolve, so nothing legitimate
 * loses, and the alternative is four subtly different answers to "is this safe".
 */

import { isAbsolute, relative, resolve, sep } from "node:path";

/**
 * Whether `value` is a non-empty string with non-whitespace content.
 *
 * Two names existed for this (isText, isNonEmptyString) with the same body.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * Whether `value` is a relative path that stays inside its root.
 *
 * The check is on the SEGMENTS, not on a substring test for "..", so
 * `a/../b` is rejected (a `..` segment) while `ab..cd` is accepted (a filename
 * that merely contains dots).
 *
 * There are two distinct rules in the originals and this module had to
 * separate them, because conflating them silently WEAKENED one call site:
 *
 *   - `rejectBackslash: false` (default) normalises `\` to `/` and then
 *     validates the segments. Safe against traversal either way, and it is
 *     what field-pilot, goal-check, eval-contract and fixed-case did.
 *   - `rejectBackslash: true` refuses any backslash at all. problem-anchor
 *     required this, because it also promises its callers that anchors are
 *     written with `/` separators — a promise normalisation cannot keep. The
 *     first attempt at this module omitted the option and let
 *     `solver\squarify.ts` through, which its own suite caught.
 *
 * @param {unknown} value
 * @param {{ prefix?: string, rejectBackslash?: boolean }} [opts] `prefix`
 *   requires the path to start with `prefix` followed by a separator, for
 *   contracts that scope artifacts to one subdirectory.
 * @returns {boolean}
 */
export function isSafeRelativePath(value, opts = {}) {
  if (!isNonEmptyString(value) || isAbsolute(value)) return false;
  if (opts.rejectBackslash && String(value).includes("\\")) return false;

  const normalized = String(value).replaceAll("\\", "/");
  if (normalized.startsWith("/") || normalized.includes(":")) return false;
  if (opts.prefix && !normalized.startsWith(`${opts.prefix}/`)) return false;

  return normalized.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

/**
 * Whether `candidate` resolves inside `root`.
 *
 * `root` itself counts as inside unless `allowRoot` is false. One original
 * (fixed-case) excluded it, which made that script reject a path pointing at
 * the root directory; the option preserves that call site's behaviour rather
 * than silently changing it.
 *
 * @param {string} root
 * @param {string} candidate
 * @param {{ allowRoot?: boolean }} [opts]
 * @returns {boolean}
 */
export function isInside(root, candidate, opts = {}) {
  const from = relative(root, candidate);
  if (from === "") return opts.allowRoot !== false;
  return !isAbsolute(from) && from !== ".." && !from.startsWith(`..${sep}`);
}

/**
 * Whether a resolved file path really lives under `root`, following symlinks.
 *
 * Distinct from {@link isInside} in the way that matters: a path can be
 * lexically inside the root and still point outside it through a symlink. Use
 * this before reading a file named by a ledger or a manifest. This is the
 * check `isSafeRepoFile` in evidence-ledger.mjs already performs, kept here so
 * the repo-level contracts can use the same one.
 *
 * @param {string} root
 * @param {string} value relative path as written
 * @param {(p: string) => boolean} lstat
 * @param {(p: string) => string} realpath
 * @param {string} pathModuleResolve
 * @param {string} pathModuleIsAbsolute
 * @returns {boolean}
 */
export function isRealPathInside(root, value, lstat, realpath, pathModuleResolve, pathModuleIsAbsolute) {
  try {
    const rootReal = realpath(root);
    const candidate = pathModuleResolve(root, value);
    if (!lstat(candidate).isFile()) return false;
    const actual = realpath(candidate);
    if (canonicalPath(actual) !== canonicalPath(pathModuleResolve(rootReal, value))) return false;
    const fromRoot = relative(rootReal, actual);
    return !pathModuleIsAbsolute(fromRoot) && fromRoot !== ".." && !fromRoot.startsWith(`..${sep}`);
  } catch {
    return false;
  }
}

/**
 * Lower-cased, native-separator path, so two spellings of one path compare equal.
 *
 * @param {string} p
 * @returns {string}
 */
export function canonicalPath(p) {
  const normalized = resolve(p).replaceAll("/", sep);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}
