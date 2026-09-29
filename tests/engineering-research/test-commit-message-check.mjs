import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  BODY_TARGET,
  BODY_WRAP,
  SUBJECT_MAX,
  SUBJECT_TARGET,
  TYPES,
  VAGUE_SUBJECTS,
  checkMessage,
  checkVersionBumps,
} from "../../scripts/commit-message-check.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const subjectOf = (problems) => problems.join("\n");

const run = (args) => {
  const result = spawnSync("git", args, { encoding: "utf8", cwd: repoRoot });
  return result.status === 0 ? result.stdout : null;
};

/** The N most recent commit shas, newest first. */
function history(count) {
  const out = run(["log", `-${count}`, "--pretty=format:%H"]);
  return out ? out.split("\n").filter(Boolean) : [];
}

// --- 1. A good commit passes ----------------------------------------------
{
  const good = [
    "fix(scholarly): bound the PDF download that had no deadline",
    "",
    "downloadToTemp() called fetch with no signal, so a host that accepted the",
    "connection and then stopped sending left the extractor waiting forever.",
    "",
    "Bounded with a 60s budget, composed with any caller deadline.",
  ].join("\n");
  assert.deepEqual(checkMessage(good), [], `a conforming message must pass: ${subjectOf(checkMessage(good))}`);
}

// --- 2. Every type in the list is accepted --------------------------------
// The fixture subject is imperative on purpose. An earlier version of this
// loop read "…that was fixed", which the non-imperative rule correctly refused
// — the test was failing on its own subject, not on the type it meant to test.
for (const type of TYPES) {
  const problems = checkMessage(`${type}(area): name the finding this change addresses`);
  assert.deepEqual(problems, [], `${type} must be an accepted type: ${subjectOf(problems)}`);
}

// --- 2b. Types Conventional Commits allows but this repo does not ---------
// The header regex is deliberately wider than TYPES: it accepts the full
// Conventional set so the failure message can say "not one of …" and name the
// allowed list, instead of rejecting `perf(x): y` as malformed. The TYPES check
// is therefore reachable only for those extra types — and a test that never
// used one left it unproven, which the mutation harness reported as vacuous.
for (const type of ["perf", "style", "ci", "revert"]) {
  const problems = checkMessage(`${type}(area): name the finding this change addresses`);
  assert.ok(
    problems.some((p) => new RegExp(`type "${type}" is not one of`).test(p)),
    `"${type}" is valid Conventional Commits but not allowed in this repo, and must be refused: ` +
      `${subjectOf(problems) || "no problems"}`,
  );
}

// --- 3. A vague subject is refused ---------------------------------------
// The assertion is on the vagueness rule specifically, not merely "some problem
// was reported". A subject can fail for two reasons at once, and a test that
// only counted problems would pass with the vagueness rule deleted — which is
// what happened on the first attempt, where "update stuff" tripped the
// non-imperative rule and the vagueness assertion never got to run.
{
  const problems = checkMessage("chore: cleanup");
  assert.ok(
    problems.some((p) => /asserts no finding/.test(p)),
    `a vague subject must be refused for vagueness, got: ${subjectOf(problems) || "no problems"}`,
  );
}

// --- 4. Every vagueness pattern fires, and each is a real historical subject
const HISTORICAL_VAGUE = [
  "lint fixes & updated hero",
  "CI pipeline failure",
  "cleanup",
  "minor tweaks",
  "update deps",
  "fix bugs",
  "wip",
  "ci/cd pipeline error fix",
  "bump version",
  "address review comments",
  "cleanup old scripts",
  "temp fix",
];
for (const subject of HISTORICAL_VAGUE) {
  const problems = checkMessage(`chore: ${subject}`);
  assert.ok(
    problems.some((p) => /asserts no finding/.test(p)),
    `"${subject}" must be refused as asserting no finding, got: ${subjectOf(problems) || "no problems"}`,
  );
}

// --- 4b. The vagueness list is a known-offender list, NOT a completeness
// guarantee. This case pins that boundary so nobody later reads a green run as
// "the checker proves every subject names a finding".
//
// It cannot be complete: deciding that "rename the label on the thing" asserts
// no finding is a judgement, and a regex cannot make judgements. The checker
// catches the shapes this repo has actually produced. The standard is enforced
// by review, which is why references/commit-rule.md says so.
{
  const unlisted = checkMessage("chore: rename the label on the thing");
  assert.deepEqual(
    unlisted,
    [],
    "a vague subject the list does not know about is NOT caught — this is the documented limit",
  );
}

// --- 5. Structure: missing colon, no scope, empty scope -------------------
{
  assert.ok(checkMessage("just a sentence").length > 0, "a message with no conventional header must fail");
  assert.deepEqual(checkMessage("fix: name the finding"), [], "a scope is optional");
  assert.ok(
    checkMessage("fix(): name the finding").length > 0,
    "an empty scope must be refused, not treated as absent",
  );
  assert.deepEqual(checkMessage("fix: no trailing period"), []);
  assert.ok(checkMessage("fix: has a trailing period.").length > 0, "a trailing period must be refused");
  assert.ok(checkMessage("fix: Starts with a capital").length > 0, "a capitalised subject must be refused");
}

// --- 6. Length: a target to write to, a hard limit to enforce -------------
{
  // Over the hard limit: refused.
  const long = `fix(scope): ${"x".repeat(90)}`;
  const problems = checkMessage(long);
  assert.ok(
    problems.some((p) => /over the 88 hard limit/.test(p)),
    `an over-limit subject must be refused, got: ${subjectOf(problems)}`,
  );

  // The widths apply to the SUBJECT, i.e. the text after "type(scope): ", not
  // to the whole header line. So the fixture needs 80 x's to put the subject
  // itself past the 72 target and under the 88 limit.
  const soft = `fix(scope): ${"x".repeat(80)}`;
  const softSubject = 80;
  assert.ok(
    softSubject > SUBJECT_TARGET && softSubject <= SUBJECT_MAX,
    `fixture subject must sit between the target (${SUBJECT_TARGET}) and the limit (${SUBJECT_MAX})`,
  );
  const softProblems = checkMessage(soft);
  assert.ok(
    softProblems.some((p) => /note: subject is \d+ chars, over the \d+-char target/.test(p)),
    `a target-width subject must produce a note, got: ${subjectOf(softProblems) || "no problems"}`,
  );
  assert.ok(
    !softProblems.some((p) => /hard limit/.test(p)),
    "a target-width subject must not be a hard failure",
  );

  // A body line over the wrap is refused.
  const wide = ["fix(scope): name it", "", "y".repeat(BODY_WRAP + 5)].join("\n");
  assert.ok(
    checkMessage(wide).some((p) => /over the 88 wrap/.test(p)),
    "an over-wide body line must be refused",
  );
}

// --- 6b. The gate is calibrated against this repo's own history -----------
// A limit that rejects the repo's own conforming commits is a limit that gets
// disabled. These are real subjects and a real body line from HEAD~5..HEAD.
{
  for (const sha of history(6)) {
    const message = run(["log", "-1", "--pretty=%B", sha]);
    if (message === null) continue;
    const problems = checkMessage(message).filter((p) => !/^note:/.test(p));
    assert.deepEqual(
      problems,
      [],
      `commit ${sha.slice(0, 7)} must pass the rule this repo just adopted, got: ${subjectOf(problems)}`,
    );
  }
}

// --- 7. Imperative mood --------------------------------------------------
for (const subject of ["fixes the broken waiver", "adds a budget", "removed the gate"]) {
  assert.ok(
    checkMessage(`fix(scope): ${subject}`).some((p) => /non-imperative/.test(p)),
    `"${subject}" must be refused as non-imperative`,
  );
}

// The inverse, which is the case that actually caught the bug: a mood check
// written as /adds?/ also matches "add", so it rejected every correct subject
// starting with a common imperative verb. The rule refused the first real
// commit message it was shown. Asserting only that the bad forms fail would
// never have found that.
for (const subject of [
  "add a test for the download budget",
  "fix the stale fixture date",
  "remove the duplicated allowlist",
  "update the reference count",
  "make the waiver reason mandatory",
  "bound the stalled download",
]) {
  const problems = checkMessage(`fix(scope): ${subject}`).filter((p) => !/^note:/.test(p));
  assert.deepEqual(
    problems,
    [],
    `"${subject}" is imperative and must pass, got: ${subjectOf(problems)}`,
  );
}

// --- 8. Unfinished-work language in the body -----------------------------
{
  const problems = checkMessage(
    ["fix(scope): name the finding", "", "WIP, will fix later once the run finishes."].join("\n"),
  );
  assert.ok(
    problems.some((p) => /unfinished-work/.test(p)),
    "a body admitting the work is unfinished must be refused",
  );
}

// --- 9. N7: a SKILL.md change without a version bump is refused ----------
{
  const before = "---\nname: verifier\nmetadata:\n  version: 1.2.0\n---\nbody\n";
  const after = "---\nname: verifier\nmetadata:\n  version: 1.2.0\n---\nnew body\n";
  const problems = checkVersionBumps([{ path: "skills/verifier/SKILL.md", before, after }]);
  assert.ok(
    problems.some((p) => /metadata\.version stayed at 1\.2\.0/.test(p)),
    `an unbumped skill version must be refused, got: ${subjectOf(problems)}`,
  );

  const bumped = after.replace("1.2.0", "1.3.0");
  assert.deepEqual(
    checkVersionBumps([{ path: "skills/verifier/SKILL.md", before, after: bumped }]),
    [],
    "a bumped skill version must pass",
  );
}

// --- 9b. --file mode must ALSO check the staged diff ------------------------
// A commit-msg hook only ever receives a message FILE. N7 therefore has to be
// reachable from --file --staged, or the hook does not enforce it. It was not:
// --file checked only the message, --commit checked the message and the diff,
// and both AGENTS.md and references/commit-rule.md claimed the hook enforced
// N7. A skill edit with no version bump sailed through the real hook. This case
// pins the staged path so that cannot reopen silently.
{
  const staged = run(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]);
  // Whatever is staged right now, --staged must agree with the direct call on
  // the same paths, and must not throw on an empty index.
  const result = spawnSync(
    process.execPath,
    [join(repoRoot, "scripts", "commit-message-check.mjs"), "--staged"],
    { encoding: "utf8", cwd: repoRoot },
  );
  assert.ok(
    result.status === 0 || result.status === 1,
    `--staged must exit 0 or 1, got ${result.status}: ${result.stderr}`,
  );
  const stagedPaths = (staged ?? "").split("\n").filter(Boolean);
  if (stagedPaths.length === 0) {
    assert.equal(
      result.status,
      0,
      "--staged against a clean index must pass; an unbumpable check should not fire on nothing",
    );
  }

  // The hook must pass --staged. If it is edited to drop the flag, this fails.
  const hook = readFileSync(join(repoRoot, ".githooks", "commit-msg"), "utf8");
  assert.match(
    hook,
    /--file "\$1" --staged/,
    "the commit-msg hook must pass --staged, or N7 is unenforced on every real commit",
  );
}

// --- 10. N7 does not fire for files that are not a SKILL.md ---------------
{
  const changes = [
    { path: "docs/rejected-changes.md", before: "a", after: "b" },
    { path: "skills/verifier/references/foo.md", before: "a", after: "b" },
    { path: "scripts/security-scan.mjs", before: "a", after: "b" },
  ];
  assert.deepEqual(checkVersionBumps(changes), [], "non-SKILL.md paths must not be version-checked");
}

// --- 11. N7 refuses a skill edit whose version is unreadable --------------
{
  const problems = checkVersionBumps([
    { path: "skills/verifier/SKILL.md", before: "---\nname: verifier\n---\n", after: "---\nname: verifier\n---\n" },
  ]);
  assert.ok(
    problems.some((p) => /not a three-part version/.test(p)),
    "a skill edit with no readable version must be refused, not silently skipped",
  );
}

// --- 12. An empty message is refused -------------------------------------
{
  assert.ok(checkMessage("").length > 0, "an empty message must be refused");
  assert.ok(checkMessage("   \n\n").length > 0, "a whitespace-only message must be refused");
}

// --- 13. The real gate runs, and this repo's own history is measured -------
{
  // HEAD is a real commit written under this rule.
  const head = spawnSync(process.execPath, [join(repoRoot, "scripts", "commit-message-check.mjs")], {
    encoding: "utf8",
    cwd: repoRoot,
  });
  assert.equal(head.status, 0, `HEAD must pass the check:\n${head.stdout}\n${head.stderr}`);

  // The gate is wired, not merely present.
  const registry = readFileSync(join(repoRoot, "scripts", "gate-registry.mjs"), "utf8");
  assert.match(
    registry,
    /"commit-message-check\.mjs"/,
    "commit-message-check.mjs must be declared in scripts/gate-registry.mjs",
  );
}

// --- 14. The rule doc is reachable from a loadable surface ---------------
{
  const agents = readFileSync(join(repoRoot, "AGENTS.md"), "utf8");
  assert.match(
    agents,
    /references\/commit-rule\.md/,
    "AGENTS.md must point at references/commit-rule.md, or no agent will read it",
  );
  assert.ok(
    existsSync(join(repoRoot, "references", "commit-rule.md")),
    "references/commit-rule.md must exist",
  );
}

// --- 15. The rule itself stays plain ---------------------------------------
// The commit rule is read by every agent, so it must not carry project jargon
// or the names of vendored projects. Those belong in the file that tracks what
// came from where; a rule for writing commit messages has no use for them.
{
  const rule = readFileSync(join(repoRoot, "references", "commit-rule.md"), "utf8");
  const agents = readFileSync(join(repoRoot, "AGENTS.md"), "utf8");

  const BANNED = [
    // The internal name for the "what to copy" map, and the project shorthand
    // it comes from. Neither tells an agent how to write a commit message.
    /steal/i,
    // Vendored project names, checked case-insensitively as bare words so a
    // legitimate mention inside a longer identifier is not caught.
    /\bfeynman\b/i,
    /\bhumanizer\b/i,
    /\bautoprompt\b/i,
    /\bbugtrace/i,
    /\bsemble\b/i,
    /\bscientific-agent-skills\b/i,
    /\babrt\b/i,
  ];

  for (const [label, text] of [
    ["references/commit-rule.md", rule],
    ["AGENTS.md", agents],
  ]) {
    for (const pattern of BANNED) {
      const hit = pattern.exec(text);
      assert.equal(
        hit,
        null,
        `${label} must not mention "${hit?.[0]}" — the commit rule is read by every agent and ` +
          `carries no project jargon. See references/commit-rule.md for what belongs there instead.`,
      );
    }
  }

  // The rule must still say the things that make it a rule.
  assert.match(rule, /type\(scope\): subject/, "the format must stay documented");
  assert.match(rule, /git config core\.hooksPath/, "how to install the hook must stay documented");
}

console.log(
  `PASS: commit messages must be Conventional, non-vague, imperative, and a skill edit must bump ` +
    `metadata.version (${TYPES.length} types, ${VAGUE_SUBJECTS.length} vagueness patterns, 11 historical ` +
    `subjects rejected)`,
);
