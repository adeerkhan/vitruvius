#!/usr/bin/env node
// generate-discipline-skills.mjs — generate the five discipline SKILL.md files
// from scripts/discipline-payloads.mjs.
//
// The five discipline skills share a fixed wrapper: the method dispatch, the
// invocation flags, the gap-detection close, and the S7 research-only boundary.
// Only the evidence landscape, verification criteria, deliverable shape, and
// gap lead genuinely differ. Those live in scripts/discipline-payloads.mjs; the
// wrapper lives here. Editing the wrapper once updates all five, so the copies
// cannot drift apart the way five hand-maintained files do.
//
// Usage:
//   node scripts/generate-discipline-skills.mjs           # write
//   node scripts/generate-discipline-skills.mjs --check   # fail on drift
//
// Output:
//   skills/<name>/SKILL.md

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { disciplines } from "./discipline-payloads.mjs";
import { computeHash, makeHeader } from "./skill-hash.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK_MODE = process.argv.includes("--check");
const normalize = (value) => value.replace(/\r\n/g, "\n");
const mismatches = [];

// --- Fixed wrapper, identical for every discipline skill -------------------

const PREAMBLE = [
  "Activate the `/skill:engineering-research` method and run it with this",
  "domain payload. Do not restate the research loop here.",
].join("\n");

const INVOCATION = [
  "## Invocation Flags",
  "",
  "Accept `--deep` and `--quick` flags and pass them through to the",
  "`engineering-research` method. See that skill for flag semantics.",
].join("\n");

const S7_BOUNDARY =
  "- **Research-only, not for final engineering sign-off.** Licensed engineers must review and approve any design based on this research.";

function renderBody(discipline) {
  return [
    "",
    `# ${discipline.title}`,
    "",
    PREAMBLE,
    "",
    "## Evidence landscape",
    "",
    discipline.evidence.join("\n"),
    "",
    "## Verification criteria",
    "",
    discipline.verification.join("\n"),
    "",
    "## Deliverable shape",
    "",
    discipline.deliverable.join("\n"),
    "",
    INVOCATION,
    "",
    "## Gap Detection",
    "",
    discipline.gap.join("\n"),
    "",
    "## Scope and Boundaries",
    "",
    `- This skill produces research — it does NOT produce ${discipline.scopeNot}.`,
    S7_BOUNDARY,
    "",
  ].join("\n");
}

function renderSkill(discipline) {
  const frontmatter = [
    "---",
    `name: ${discipline.name}`,
    "description: >",
    ...discipline.description.map((line) => `  ${line}`),
    'argument-hint: "<research question> [--deep | --quick]"',
    "allowed-tools: Write Edit Bash",
    "license: MIT",
    "metadata:",
    `  version: "${discipline.version}"`,
    "",
    "---",
    "",
  ].join("\n");

  const body = renderBody(discipline);
  return `${frontmatter}${makeHeader(computeHash(body))}\n${body}`;
}

// --- Emit ------------------------------------------------------------------

let generated = 0;
for (const discipline of disciplines) {
  const file = join(REPO_ROOT, "skills", discipline.name, "SKILL.md");
  const content = renderSkill(discipline);

  if (CHECK_MODE) {
    if (!existsSync(file) || normalize(readFileSync(file, "utf8")) !== normalize(content)) {
      mismatches.push(relative(REPO_ROOT, file));
    }
    continue;
  }

  writeFileSync(file, content);
  generated++;
  console.log(`Generated: ${file}`);
}

if (CHECK_MODE) {
  if (mismatches.length > 0) {
    console.error(`FAIL: ${mismatches.length} discipline skill file(s) are out of date:`);
    for (const file of mismatches) console.error(`  ${file}  (run: node scripts/generate-discipline-skills.mjs)`);
    process.exit(1);
  }
  console.log(`PASS: ${disciplines.length} discipline skills are up to date`);
} else {
  console.log(`\nDone: ${generated} discipline skills generated`);
}
