#!/usr/bin/env node
// skill-payload-manifest.mjs — compute and verify content-addressed hashes
// for all installed skill payloads (SKILL.md files).
//
// Usage:
//   node scripts/skill-payload-manifest.mjs --verify   check all skills
//   node scripts/skill-payload-manifest.mjs --update   recompute and write headers

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = join(repoRoot, "skills");
const HEADER_PREFIX = "<!-- VITRUVIUS-COMPILED-SKILL:BEGIN v1 sha256=";
const HEADER_SUFFIX = " -->";

function computeHash(skillBody) {
  return createHash("sha256").update(skillBody, "utf8").digest("hex");
}

function extractHeader(content) {
  const firstLine = content.split("\n")[0];
  if (!firstLine.startsWith(HEADER_PREFIX) || !firstLine.trimEnd().endsWith(HEADER_SUFFIX)) {
    return null;
  }
  const hash = firstLine.slice(HEADER_PREFIX.length, firstLine.trimEnd().length - HEADER_SUFFIX.length);
  return { hash, headerLine: firstLine };
}

function getSkillDirs() {
  const dirs = [];
  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const skillFile = join(skillsDir, entry.name, "SKILL.md");
      if (existsSync(skillFile)) {
        dirs.push({ name: entry.name, path: skillFile });
      }
    }
  }
  return dirs;
}

function verify() {
  const skills = getSkillDirs();
  let pass = 0;
  let fail = 0;

  for (const skill of skills) {
    const content = readFileSync(skill.path, "utf8");
    const header = extractHeader(content);

    if (!header) {
      console.log(`FAIL: ${skill.name} — missing or malformed header`);
      fail++;
      continue;
    }

    const body = content.slice(content.indexOf("\n") + 1);
    const actualHash = computeHash(body);

    if (actualHash === header.hash) {
      pass++;
    } else {
      console.log(`FAIL: ${skill.name} — hash mismatch (expected ${header.hash.slice(0, 12)}…, got ${actualHash.slice(0, 12)}…)`);
      fail++;
    }
  }

  console.log(`\n${pass} pass, ${fail} fail, ${pass + fail} total`);
  if (fail > 0) process.exit(1);
}

function update() {
  const skills = getSkillDirs();
  let updated = 0;

  for (const skill of skills) {
    const content = readFileSync(skill.path, "utf8");
    const header = extractHeader(content);

    let body;
    if (header) {
      body = content.slice(content.indexOf("\n") + 1);
    } else {
      body = content;
    }

    const hash = computeHash(body);
    const newHeader = `${HEADER_PREFIX}${hash}${HEADER_SUFFIX}`;
    // Insert header after frontmatter closing --- if present, otherwise at top
    // The frontmatter starts with ---\n and ends with \n---\n
    // We need to find the closing --- (the second one)
    const firstFm = body.indexOf("---\n");
    let insertPos;
    if (firstFm !== -1) {
      const secondFm = body.indexOf("\n---\n", firstFm + 1);
      if (secondFm !== -1) {
        insertPos = secondFm + 5; // after the closing ---\n
      } else {
        insertPos = firstFm + 4; // only one --- found, insert after it
      }
    } else {
      insertPos = 0; // no frontmatter, insert at top
    }
    const newContent = body.slice(0, insertPos) + newHeader + "\n" + body.slice(insertPos);

    writeFileSync(skill.path, newContent, "utf8");
    updated++;
  }

  console.log(`Updated ${updated} skill headers`);
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
