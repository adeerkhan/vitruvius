import { strict as assert } from "node:assert";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { disciplines } from "../../scripts/discipline-payloads.mjs";
import { computeHash, splitSkill } from "../../scripts/skill-hash.mjs";

// The five discipline skills are generated from scripts/discipline-payloads.mjs
// by scripts/generate-discipline-skills.mjs. This suite proves the generated tree
// is byte-stable, that the payload data is real, that the shared wrapper is
// actually present in each output, and — the point of the harness — that a
// hand-edited generated skill is caught rather than silently accepted.
//
// A mutation that does not land is a BROKEN HARNESS failure, never a pass.

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const generator = join(root, "scripts", "generate-discipline-skills.mjs");
const skillsDir = join(root, "skills");

const check = () => spawnSync(process.execPath, [generator, "--check"], { cwd: root, encoding: "utf8" });

// 1. The checked-in tree matches the generator.
const clean = check();
assert.equal(clean.status, 0, `clean discipline tree must pass --check: ${clean.stderr}`);
assert.match(clean.stdout, /up to date/);

// 2. The payload data covers all five disciplines with real content.
assert.equal(disciplines.length, 5, "there must be exactly five discipline payloads");
assert.deepEqual(
  disciplines.map((d) => d.name).sort(),
  ["architectural", "civil", "electrical", "mechanical", "software"],
  "the five discipline payloads must be exactly the routed disciplines",
);
for (const d of disciplines) {
  assert.ok(typeof d.title === "string" && d.title.length > 0, `${d.name}.title must be a non-empty string`);
  for (const key of ["description", "evidence", "verification", "deliverable", "gap"]) {
    assert.ok(Array.isArray(d[key]) && d[key].length > 0, `${d.name}.${key} must be a non-empty array`);
  }
  assert.ok(d.version && d.scopeNot, `${d.name} must carry a version and scopeNot`);
}

// 3. Every generated file is content-addressed and carries the shared wrapper.
const WRAPPER = [
  "Activate the `/skill:engineering-research` method and run it with this",
  "## Evidence landscape",
  "## Verification criteria",
  "## Deliverable shape",
  "## Invocation Flags",
  "## Gap Detection",
  "## Scope and Boundaries",
  "**Research-only, not for final engineering sign-off.**",
];
for (const d of disciplines) {
  const file = join(skillsDir, d.name, "SKILL.md");
  const content = readFileSync(file, "utf8");
  const { header, body } = splitSkill(content);
  assert.ok(header, `${d.name}: generated SKILL.md must carry a content-addressed header`);
  assert.equal(header, computeHash(body), `${d.name}: header must match the body hash`);
  for (const marker of WRAPPER) {
    assert.ok(body.includes(marker), `${d.name}: generated body is missing shared wrapper text: ${marker}`);
  }
}

// 4. Teeth: a hand-edit to a generated skill must fail --check.
const target = join(skillsDir, "mechanical", "SKILL.md");
const original = readFileSync(target, "utf8");
try {
  writeFileSync(target, original.replace("ASME (BPVC, B31 piping)", "steam stuff"), "utf8");
  const drifted = check();
  assert.notEqual(drifted.status, 0, "--check must fail when a generated discipline skill is hand-edited");
  assert.match(
    `${drifted.stdout}\n${drifted.stderr}`,
    /mechanical[\\/]SKILL\.md/,
    "--check must name the drifted file",
  );
} finally {
  writeFileSync(target, original, "utf8");
}

console.log(
  "PASS: discipline generator — five payloads, byte-stable output, shared wrapper present, " +
    "and a hand-edit is caught by --check",
);
