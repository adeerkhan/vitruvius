/**
 * Line-ending regression.
 *
 * A CRLF checkout made five skills invisible: `startsWith("---\n")` is false
 * for `---\r\n`, so `readYamlFrontmatter` returned null, `validate-contract`
 * reported "no --- delimited frontmatter", and the routing eval silently
 * dropped the skill from its index. The measured rank-1 therefore depended on
 * the developer's git settings rather than on the skills.
 *
 * Every parser that touches frontmatter must be line-ending independent, and
 * .gitattributes must keep the working tree on LF in the first place.
 */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readSkillDescription, readYamlFrontmatter, parseFrontmatter, normalizeNewlines } from "../../scripts/yaml-frontmatter.mjs";

const root = join(fileURLToPath(new URL("../..", import.meta.url)));

const toCrlf = (text) => text.replace(/\r?\n/g, "\r\n");
const toLf = (text) => text.replace(/\r\n/g, "\n");

// --- the shared parser -----------------------------------------------------
const lfSkill = toLf(
  readFileSync(join(root, "skills", "verifier", "SKILL.md"), "utf8"),
);
const crlfSkill = toCrlf(lfSkill);

assert.notEqual(readYamlFrontmatter(lfSkill), null, "LF frontmatter parses");
assert.notEqual(readYamlFrontmatter(crlfSkill), null, "CRLF frontmatter must parse too");
assert.equal(readYamlFrontmatter(crlfSkill), readYamlFrontmatter(lfSkill), "both line endings yield the same block");

assert.equal(readSkillDescription(lfSkill), readSkillDescription(crlfSkill), "description is line-ending independent");
assert.ok(readSkillDescription(crlfSkill).length > 40, "a CRLF skill still yields a usable description");

const lfEntries = parseFrontmatter("name: x\nversion: \"1\"");
const crlfEntries = parseFrontmatter("name: x\r\nversion: \"1\"");
assert.deepEqual(crlfEntries, lfEntries, "entry parsing is line-ending independent");
assert.equal(normalizeNewlines("a\r\nb\rc"), "a\nb\nc", "lone CR is normalized too");

// --- every skill must parse under both line endings -------------------------
const skillDirs = readdirSync(join(root, "skills"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
assert.ok(skillDirs.length >= 20, `expected the full skill set, got ${skillDirs.length}`);

for (const name of skillDirs) {
  const raw = readFileSync(join(root, "skills", name, "SKILL.md"), "utf8");
  const lfDesc = readSkillDescription(toLf(raw));
  const crlfDesc = readSkillDescription(toCrlf(raw));
  assert.ok(lfDesc.length > 40, `${name} has no description in the index`);
  assert.equal(crlfDesc, lfDesc, `${name} description changes under CRLF`);
}

// --- the tree must be pinned to LF in the first place ----------------------
const attributes = readFileSync(join(root, ".gitattributes"), "utf8");
assert.match(attributes, /^\* text=auto eol=lf$/m, ".gitattributes must normalize text to LF");

// --- and the checkout must actually obey that policy -----------------------
// The policy above is not self-enforcing: a working tree materialized before
// .gitattributes existed keeps its CRLF copies, and the parser checks are
// tolerant of CRLF, so the suite stays green while every consumer that compares
// raw bytes sees different content. Observed 2026-10: fourteen tracked files
// had a CRLF working copy with an LF index. Assert the working tree directly so
// the stale checkout fails here instead of silently.
let crlfWorkingCopies = [];
try {
  const eol = execFileSync("git", ["ls-files", "--eol"], { cwd: root, encoding: "utf8" });
  crlfWorkingCopies = eol
    .split("\n")
    .filter((line) => /\bw\/(crlf|mixed)\b/.test(line))
    .map((line) => line.split("\t").pop())
    .filter(Boolean);
} catch {
  // Not a git checkout (e.g. a source export); there is no working tree to check.
}
assert.deepEqual(
  crlfWorkingCopies,
  [],
  "tracked text files have a CRLF (or mixed) working copy despite eol=lf — re-materialize them with\n" +
    "  git ls-files -z | xargs -0 rm -f && git checkout -- .\n" +
    `offending files:\n  ${crlfWorkingCopies.join("\n  ")}`,
);

// --- no other parser may match a literal \n against raw file text -----------
const suspicious = [];
for (const rel of [
  "scripts/validate-contract.mjs",
  "scripts/security-scan.mjs",
  "tests/routing/eval-routing.mjs",
  "tests/validate-contract/test-contract.mjs",
  "tests/gap-analysis/test-gap-analysis.mjs",
  "tests/habit/test-habit.mjs",
  "tests/adapters/test-adapters.mjs",
  "tests/all-skills/test-all-skills.mjs",
  "tests/agents/test-agents.mjs",
  "tests/proposal/test-proposal.mjs",
  "tests/design-alternatives/test-design-alternatives.mjs",
  "tests/fmea-brainstorm/test-fmea-brainstorm.mjs",
  "tests/evidence-ranking/test-evidence-ranking.mjs",
  "tests/verifier/test-verifier.mjs",
  "tests/engineering-research/test-evidence-example.mjs",
]) {
  const text = readFileSync(join(root, rel), "utf8");
  // a frontmatter delimiter written as a literal LF rather than a tolerant match
  for (const match of text.matchAll(/(?:startsWith\(|match\(|\^)\s*["'`]\^?---\\n/g)) {
    suspicious.push(`${rel}: ${match[0].trim()}`);
  }
  for (const match of text.matchAll(/indexOf\(\s*["'`]\\n---/g)) {
    suspicious.push(`${rel}: ${match[0]}`);
  }
}
assert.deepEqual(suspicious, [], `LF-only frontmatter parsing found:\n  ${suspicious.join("\n  ")}`);

console.log(
  `PASS: frontmatter parsing is line-ending independent across ${skillDirs.length} skills, and no parser matches a literal LF against raw text`,
);
