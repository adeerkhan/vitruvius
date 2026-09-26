/**
 * Negative fixtures for the skill-anatomy checks (SA1).
 *
 * The real-repo run proves the current tree conforms; these fixtures prove the
 * layout and description-trigger rules can actually fail, so a green run is
 * meaningful. VITRUVIUS_SKILLS_DIR points the validator at a temp tree.
 */
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const validator = join(root, "scripts", "validate-contract.mjs");
const temp = mkdtempSync(join(tmpdir(), "vitruvius-anatomy-"));
const skills = join(temp, "skills");

function write(relativePath, text) {
  const path = join(skills, relativePath);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, text);
}

function run() {
  return spawnSync(process.execPath, [validator], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, VITRUVIUS_SKILLS_DIR: skills },
  });
}

function skill(name, description, extra = "") {
  return `---\nname: ${name}\ndescription: >\n  ${description}\nlicense: MIT\nmetadata:\n  version: "0.1.0"\n---\n\n# ${name}\n\nResearch-only, not for final engineering sign-off.\n${extra}`;
}

try {
  // A conformant fixture passes.
  write("good-skill/SKILL.md", skill("good-skill", "Use when a fixture needs a valid skill."));
  write("good-skill/references/kebab-case.md", "# ok\n");
  const clean = run();
  assert.equal(clean.status, 0, clean.stderr);

  // A negation-only description has no positive trigger.
  write("bad-trigger/SKILL.md", skill("bad-trigger", "Do not use when the task is trivial."));
  const badTrigger = run();
  assert.notEqual(badTrigger.status, 0);
  assert.match(badTrigger.stderr, /\[description_trigger\].*bad-trigger/);
  rmSync(join(skills, "bad-trigger"), { recursive: true, force: true });

  // An empty supporting directory is noise.
  mkdirSync(join(skills, "good-skill", "assets"), { recursive: true });
  const emptyDir = run();
  assert.notEqual(emptyDir.status, 0);
  assert.match(emptyDir.stderr, /\[skill_layout\].*empty directory/);
  rmSync(join(skills, "good-skill", "assets"), { recursive: true, force: true });

  // A non-kebab supporting filename is refused.
  write("good-skill/references/BadName.md", "# bad\n");
  const badName = run();
  assert.notEqual(badName.status, 0);
  assert.match(badName.stderr, /\[skill_layout\].*lowercase-hyphen-separated/);
  rmSync(join(skills, "good-skill", "references", "BadName.md"), { force: true });

  assert.equal(run().status, 0, "fixture returns to conformant after cleanup");

  console.log("PASS: skill-anatomy layout and description-trigger checks fail on bad fixtures");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
