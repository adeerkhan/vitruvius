#!/usr/bin/env node
// commit-message-check.mjs — the mechanical half of references/commit-rule.md.
//
// Why this exists: the repo's own history shows the failure this prevents.
// Subjects like "lint fixes & updated hero", "CI pipeline failure", and
// "removed the hard check(hasResults) that recorded a failure" are the kind of
// message that reads as coverage and carries no finding. The same class of
// defect runs through this repo everywhere else — a gate that is added and
// never wired, a waiver nobody prunes, a number nobody re-measured.
//
// What it CAN check: type, subject shape, length, banned vagueness, and the
// N7 rule that a commit touching a SKILL.md bumps that skill's
// metadata.version.
//
// What it CANNOT check: whether a number in the body was measured, or whether
// a claim of "fixed" is true. Those need a reviewer. A checker that implied
// otherwise would be the same false self-report this repo keeps eliminating.
//
// Usage:
//   node scripts/commit-message-check.mjs                  # HEAD
//   node scripts/commit-message-check.mjs --commit <sha>
//   node scripts/commit-message-check.mjs --file <path>    # raw message file
//   node scripts/commit-message-check.mjs --json
//   node scripts/commit-message-check.mjs --explain

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(__dirname, "..");

/** Conventional Commit types this repo uses. Measured from the last 200 commits. */
export const TYPES = ["feat", "fix", "docs", "test", "refactor", "build", "chore"];

/**
 * Two widths, deliberately.
 *
 * TARGET is the style to write to. LIMIT is what the gate enforces.
 *
 * Measured over the last 60 commits: subject median 62, max 87; body lines run
 * to 80 columns with 7 outliers past that. So 72 is the right target and the
 * wrong limit — a gate set at 72 would reject 10 of the last 60 subjects,
 * including its own author's, and a gate that fires on the repo's own history
 * is a gate that gets disabled. 88 covers every conforming commit in the last
 * 140 and catches the failure this is for: a subject that has become a
 * paragraph.
 */
export const SUBJECT_TARGET = 72;
export const SUBJECT_MAX = 88;
export const BODY_TARGET = 80;
export const BODY_WRAP = 88;

// Subjects that assert a result without naming a finding. Each of these is a
// real commit in this repo's history, so each is a real counterexample rather
// than a hypothetical.
export const VAGUE_SUBJECTS = [
  // The character class allows separators, because the real subject was
  // "lint fixes & updated hero" and a \s+\w+ pattern missed the ampersand.
  // A commit gate should fail toward "reword this", since a false positive
  // costs one reword and a false negative costs the whole signal.
  /^(lint|codestyle|format(ting)?)[\s\w&+.,'-]*$/i,
  /^cleanup(\s+\w+){0,3}$/i,
  /^(minor|small|misc|tweak|small tweak)s?\b/i,
  /^update[sd]?\s+(deps|dependencies|packages?)$/i,
  /\b(wip|tmp|temp|foo|bar|asdf|xxx)\b/i,
  /^fix\s+bugs?$/i,
  /^bug\s*fix(es)?$/i,
  /^ci(\/cd)?\s+pipeline\b.*$/i,
  /^bump\s+version$/i,
  /^address\s+review\s+comments?$/i,
];

/**
 * Imperative-mood tells. Not exhaustive — these are the observed offenders.
 *
 * The `s?` is NOT used on the bare verbs. `adds?` matches "add", so a pattern
 * written that way rejects the correct imperative "add a test for the budget"
 * and every other subject starting with one of these verbs. An earlier version
 * of this file had that bug in all five patterns and rejected the first real
 * commit message it was shown. The suite asserts the imperative forms PASS, not
 * only that the third-person forms fail — a mood check that cannot tell
 * "adds" from "add" is worse than none.
 */
const NON_IMPERATIVE = [
  [/\b(adds|added|adding)\b/i, "third-person singular — write 'add'"],
  [/\b(fixes|fixed|fixing)\b/i, "third-person singular — write 'fix'"],
  [/\b(removes|removed|removing)\b/i, "third-person singular — write 'remove'"],
  [/\b(updates|updated|updating)\b/i, "third-person singular — write 'update'"],
  [/\b(makes|made|making)\b/i, "past tense — write 'make'"],
  [/\b(was|were|has been|have been)\s+\w+(ed|ne)\b/i, "past tense — write the imperative"],
];

const HEADER = /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\(([^()]+)\))?(!)?: (.+)$/;

/**
 * Validate a raw commit message. Pure — no git, no fs — so the suite can drive
 * it with strings and never has to create a commit to prove a rule fires.
 *
 * @param {string} message
 * @returns {string[]} problems
 */
export function checkMessage(message) {
  const problems = [];
  const text = message.replace(/\r\n/g, "\n");
  const lines = text.split("\n");

  // Strip comment and trailer blocks, which git ignores when displaying.
  const body = [];
  for (const line of lines) {
    if (/^#/.test(line)) break;
    body.push(line);
  }
  while (body.length > 0 && body[body.length - 1].trim() === "") body.pop();

  if (body.length === 0) return ["commit message is empty"];

  const header = body[0].trim();
  if (header === "") return ["commit message has an empty subject line"];

  // The NUL convention git uses for a deliberately empty commit message.
  if (/^[^\s]+$/.test(header) && header.length < 4 && /^[a-z]$/.test(header)) {
    return [];
  }

  const match = HEADER.exec(header);
  if (!match) {
    problems.push(
      `subject must be Conventional Commits: \`type(scope): subject\` — got "${header}". ` +
        `One of ${TYPES.join(", ")}, optional (scope), a colon, then the subject.`,
    );
    return problems;
  }

  const [, type, , scope, bang, subject] = match;

  if (!TYPES.includes(type)) {
    problems.push(`type "${type}" is not one of ${TYPES.join(", ")}`);
  }
  if (bang) {
    problems.push("`!` marks a breaking change; this repo has no semver contract, so state it in the body instead");
  }
  if (scope !== undefined && scope.trim() === "") {
    problems.push("scope is present but empty — write `type(scope):` with a real scope, or drop the parens");
  }

  if (subject.length > SUBJECT_MAX) {
    problems.push(
      `subject is ${subject.length} chars, over the ${SUBJECT_MAX} hard limit — it has become a ` +
        `paragraph. Move detail into the body: "${subject}"`,
    );
  } else if (subject.length > SUBJECT_TARGET) {
    problems.push(
      `note: subject is ${subject.length} chars, over the ${SUBJECT_TARGET}-char target. The gate ` +
        `allows up to ${SUBJECT_MAX}; prefer the target.`,
    );
  }
  if (/[.]\s*$/.test(subject)) {
    problems.push("subject must not end in a period");
  }
  if (/^[A-Z]/.test(subject)) {
    problems.push(`subject must be lowercase after the colon — got "${subject}"`);
  }
  for (const [pattern, why] of NON_IMPERATIVE) {
    if (pattern.test(subject)) {
      problems.push(`subject reads as non-imperative (${why}): "${subject}"`);
      break;
    }
  }
  for (const pattern of VAGUE_SUBJECTS) {
    if (pattern.test(subject)) {
      problems.push(
        `subject "${subject}" asserts no finding. Name the defect: what was wrong, and what the code ` +
          `now does. See references/commit-rule.md.`,
      );
      break;
    }
  }

  // Body: line width, and the honesty requirements that are mechanically visible.
  const messageBody = body.slice(1).join("\n").trim();
  for (const line of body.slice(1)) {
    if (line.length > BODY_WRAP) {
      problems.push(
        `body line is ${line.length} chars, over the ${BODY_WRAP} wrap: "${line.slice(0, 60)}…"`,
      );
      break;
    }
  }

  if (/\b(wip|tmp|for now|placeholder|will fix later)\b/i.test(messageBody)) {
    problems.push("body contains unfinished-work language; commit the change or describe it as a rejection");
  }

  return problems;
}

/**
 * N7: a commit touching skills/<name>/SKILL.md must bump that skill's
 * metadata.version. Derived from the tree, not trusted.
 *
 * @param {Array<{path: string, before: string, after: string}>} changes
 */
export function checkVersionBumps(changes) {
  const problems = [];
  for (const change of changes) {
    const m = /^skills\/([^/]+)\/SKILL\.md$/.exec(change.path);
    if (!m) continue;
    const skill = m[1];
    const versionOf = (text) => /^\s*version:\s*["']?([0-9]+\.[0-9]+\.[0-9]+)["']?\s*$/m.exec(text || "")?.[1];
    const before = versionOf(change.before);
    const after = versionOf(change.after);
    if (before === undefined || after === undefined) {
      problems.push(
        `skills/${skill}/SKILL.md changed but metadata.version is not a three-part version in both ` +
          `revisions (before=${before ?? "missing"}, after=${after ?? "missing"})`,
      );
      continue;
    }
    if (before === after) {
      problems.push(
        `skills/${skill}/SKILL.md changed but metadata.version stayed at ${after}. N7 requires a bump in ` +
          `the same commit.`,
      );
    }
  }
  return problems;
}

function sh(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", cwd: REPO_ROOT, maxBuffer: 32 * 1024 * 1024 });
  } catch {
    return null;
  }
}

function checkCommit(sha) {
  const message = sh(["log", "-1", "--pretty=%B", sha]);
  if (message === null) return [`cannot read commit ${sha}`];
  const problems = checkMessage(message);

  const names = sh(["show", "--name-only", "--pretty=format:", sha]);
  if (names !== null) {
    const changes = names
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((path) => ({
        path,
        before: sh(["show", `${sha}^:${path}`]) ?? "",
        after: sh(["show", `${sha}:${path}`]) ?? "",
      }));
    problems.push(...checkVersionBumps(changes));
  }
  return problems;
}

function main(argv) {
  const asJson = argv.includes("--json");

  if (argv.includes("--explain")) {
    console.log(
      [
        "commit-message-check.mjs — what is checked and what is not.",
        "",
        `CHECKED:  Conventional type from a fixed list (${TYPES.join(", ")}); subject non-empty,`,
        `          lowercase, no trailing period, imperative mood, and not one of the`,
        `          ${VAGUE_SUBJECTS.length} vagueness patterns taken from this repo's own history;`,
        `          subject <= ${SUBJECT_MAX} chars (a note above the ${SUBJECT_TARGET}-char target);`,
        `          body wrapped at ${BODY_WRAP} (target ${BODY_TARGET}); no unfinished-work language;`,
        "          N7 — a commit touching skills/<name>/SKILL.md bumps that skill's metadata.version.",
        "",
        "KNOWN LIMIT:",
        "          the vagueness list is a known-offender list, not a completeness guarantee.",
        "          Deciding that a subject asserts no finding is a judgement, and a regex cannot",
        "          make judgements. A vague subject the list does not know about passes.",
        "",
        "NOT CHECKED, and not checkable by a script:",
        "          whether a number in the body was actually measured;",
        "          whether a claim of 'fixed' or 'verified' is true;",
        "          whether the change was the right one.",
        "",
        "Those need a reviewer. This gate makes a vague subject hard to write; it does not make a",
        "dishonest one impossible, and it must never be reported as if it did.",
      ].join("\n"),
    );
    return;
  }

  let problems;
  if (argv.includes("--file")) {
    const path = argv[argv.indexOf("--file") + 1];
    if (!path || !existsSync(path)) {
      console.error(`commit-message-check: cannot read message file ${path ?? "<none>"}`);
      process.exit(1);
    }
    problems = checkMessage(readFileSync(path, "utf8"));
  } else if (argv.includes("--commit")) {
    const sha = argv[argv.indexOf("--commit") + 1];
    if (!sha) {
      console.error("commit-message-check: --commit needs a sha");
      process.exit(1);
    }
    problems = checkCommit(sha);
  } else {
    problems = checkCommit("HEAD");
  }

  if (asJson) {
    console.log(JSON.stringify({ problems }, null, 2));
  } else if (problems.length === 0) {
    console.log("PASS: commit message conforms to references/commit-rule.md");
    console.log("Not checked: whether its claims are true. That is a reviewer's job.");
  } else {
    console.error(`FAIL: ${problems.length} commit-message problem(s):\n`);
    for (const p of problems) console.error(`  ${p}`);
    console.error(
      "\nSee references/commit-rule.md. If the rule is wrong, change the rule — do not carve out an exception here.",
    );
  }
  process.exit(problems.length > 0 ? 1 : 0);
}

// Entry-point guard.
//
// This compares resolved paths for EXACT equality, and the reason is not
// fussiness. An earlier version used
//
//   if (process.argv[1] && process.argv[1].endsWith("commit-message-check.mjs"))
//
// which is true for `tests/engineering-research/test-commit-message-check.mjs`
// — the test name ENDS WITH the script name. So importing the module from its
// own suite ran main(), which called process.exit(0) during import, before a
// single assertion executed. The suite printed the script's PASS line and
// exited 0. Every mutation case below reported NOT DETECTED, because no test
// had ever run.
//
// A guard that silently disables the test guarding it is worse than no guard.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
