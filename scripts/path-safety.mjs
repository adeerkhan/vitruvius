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

import { lstatSync, realpathSync } from "node:fs";
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
 * @param {(p: string) => boolean} [lstat]
 * @param {(p: string) => string} [realpath]
 * @param {(p: string) => string} [pathModuleResolve]
 * @param {(p: string) => boolean} [pathModuleIsAbsolute]
 * @returns {boolean}
 */
export function isRealPathInside(
  root,
  value,
  lstat = lstatSync,
  realpath = realpathSync,
  pathModuleResolve = resolve,
  pathModuleIsAbsolute = isAbsolute,
) {
  return resolveRealFile(root, value, { lstat, realpath, pathModuleResolve, pathModuleIsAbsolute }).ok;
}

/**
 * The one containment check, with the reason it refused.
 *
 * A boolean cannot distinguish "you tried to leave the root" from "that is not
 * a regular file", and every caller in this repo reported those differently.
 * Returning the reason is what lets them share the decision and still say
 * something true about it.
 *
 * The three refusals, in order:
 *   - `unsafe`        — `value` is not a confined repository-relative path
 *   - `not-a-file`    — the resolved target is absent, or is not a regular file
 *   - `escapes-root`  — the resolved target lies outside `root`
 *
 * `escapes-root` is decided on the RESOLVED target, so a symlink pointing out
 * of the root is refused even though its own path is lexically inside it.
 *
 * @param {string} root
 * @param {string} value relative path as written
 * @param {{ lstat?: (p: string) => boolean, realpath?: (p: string) => string,
 *           pathModuleResolve?: (p: string) => string,
 *           pathModuleIsAbsolute?: (p: string) => boolean }} [deps]
 * @returns {{ ok: true, path: string, resolved: string }
 *          | { ok: false, reason: "unsafe" | "not-a-file" | "escapes-root" }}
 */
export function resolveRealFile(root, value, deps = {}) {
  const lstat = deps.lstat ?? lstatSync;
  const realpath = deps.realpath ?? realpathSync;
  const pathModuleResolve = deps.pathModuleResolve ?? resolve;
  const pathModuleIsAbsolute = deps.pathModuleIsAbsolute ?? isAbsolute;

  if (!isSafeRelativePath(value)) return { ok: false, reason: "unsafe" };

  let actual;
  try {
    // realpath throws on a missing path, so a named file that does not exist
    // is refused rather than invented.
    actual = realpath(pathModuleResolve(root, value));
  } catch {
    return { ok: false, reason: "not-a-file" };
  }

  // Check the RESOLVED target, not the candidate. An lstat on the candidate
  // describes the link, and a symlink is never isFile(), which would refuse
  // every symlink — including one that points at a file inside the root.
  try {
    if (!lstat(actual).isFile()) return { ok: false, reason: "not-a-file" };
  } catch {
    return { ok: false, reason: "not-a-file" };
  }

  // The property is containment of the resolved target, so compare the
  // realpath of both sides. Demanding `actual` equal the lexical path under
  // the root is strictly stronger and refuses a legitimate in-root symlink
  // while adding no containment the relative() test below does not already
  // give — that test is what refuses a link pointing OUT of the root (M3).
  let fromRoot;
  try {
    fromRoot = relative(realpath(root), actual);
  } catch {
    return { ok: false, reason: "escapes-root" };
  }
  if (pathModuleIsAbsolute(fromRoot) || fromRoot === ".." || fromRoot.startsWith(`..${sep}`)) {
    return { ok: false, reason: "escapes-root" };
  }

  return { ok: true, path: pathModuleResolve(root, value), resolved: actual };
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
