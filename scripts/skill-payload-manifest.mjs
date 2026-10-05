#!/usr/bin/env node
// skill-payload-manifest.mjs — compute and verify content-addressed hashes
// for all installed skill payloads (SKILL.md files).
//
// Usage:
//   node scripts/skill-payload-manifest.mjs --verify   check all skills
//   node scripts/skill-payload-manifest.mjs --update   recompute and write headers
//
// The header sits immediately AFTER the `---` frontmatter, never on line 1: a
// leading comment breaks frontmatter parsing for every skill in the repo.
// The hashed body is everything after that header line.
//
// Pattern reference: references/skill-payload-manifest.md
// (header format, hash coverage, what a content address does and does not prove)

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { HEADER_PREFIX, HEADER_SUFFIX, computeHash, splitSkill } from "./skill-hash.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = join(repoRoot, "skills");

function getSkillDirs() {
  const dirs = [];
  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const skillFile = join(skillsDir, entry.name, "SKILL.md");
      if (existsSync(skillFile)) dirs.push({ name: entry.name, path: skillFile });
    }
  }
  return dirs.sort((a, b) => a.name.localeCompare(b.name));
}

function verify() {
  const skills = getSkillDirs();
  let pass = 0;
  let fail = 0;

  for (const skill of skills) {
    const { header, body } = splitSkill(readFileSync(skill.path, "utf8"));
    if (!header) {
      console.log(`FAIL: ${skill.name} — no content-addressed header after frontmatter`);
      fail++;
      continue;
    }
    const actual = computeHash(body);
    if (actual === header) {
      pass++;
    } else {
      console.log(
        `FAIL: ${skill.name} — hash mismatch (header ${header.slice(0, 12)}…, body ${actual.slice(0, 12)}…)`,
      );
      fail++;
    }
  }

  console.log(`\n${pass} pass, ${fail} fail, ${pass + fail} total`);
  if (fail > 0) process.exit(1);
}

function update() {
  const skills = getSkillDirs();
  for (const skill of skills) {
    const { frontmatter, body } = splitSkill(readFileSync(skill.path, "utf8"));
    const header = `${HEADER_PREFIX}${computeHash(body)}${HEADER_SUFFIX}`;
    writeFileSync(skill.path, `${frontmatter}${header}\n${body}`, "utf8");
  }
  console.log(`Updated ${skills.length} skill headers`);
}

const args = process.argv.slice(2);
if (args.includes("--verify")) {
  verify();
} else if (args.includes("--update")) {
  update();
} else {
  console.log("Usage: node scripts/skill-payload-manifest.mjs [--verify | --update]");
  process.exit(1);
}
