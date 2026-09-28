import { strict as assert } from "node:assert";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const skillsDir = join(repoRoot, "skills");
const HEADER_PREFIX = "<!-- VITRUVIUS-COMPILED-SKILL:BEGIN v1 sha256=";
const HEADER_SUFFIX = " -->";

function computeHash(skillBody) {
  return createHash("sha256").update(skillBody, "utf8").digest("hex");
}

// The header must sit immediately after the `---`-delimited frontmatter, not on
// line 1: a line-1 comment breaks frontmatter parsing for every skill.
const FRONTMATTER_END = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;

function extractHeader(line) {
  if (!line.startsWith(HEADER_PREFIX) || !line.trimEnd().endsWith(HEADER_SUFFIX)) {
    return null;
  }
  const hash = line.slice(HEADER_PREFIX.length, line.trimEnd().length - HEADER_SUFFIX.length);
  return { hash, headerLine: line };
}

function splitSkill(content) {
  const match = content.match(FRONTMATTER_END);
  const rest = match ? content.slice(match[0].length) : content;
  const newline = rest.indexOf("\n");
  const firstLine = newline === -1 ? rest : rest.slice(0, newline);
  const header = extractHeader(firstLine);
  return { header, body: header ? rest.slice(newline + 1) : rest };
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

// --- Every skill has a content-addressed header ---

const skills = getSkillDirs();
assert.ok(skills.length >= 25, `expected at least 25 skills, found ${skills.length}`);

let verified = 0;
for (const skill of skills) {
  const content = readFileSync(skill.path, "utf8");
  const { header, body } = splitSkill(content);

  assert.ok(header, `${skill.name}: SKILL.md must have a content-addressed header after its frontmatter`);

  const actualHash = computeHash(body);

  assert.strictEqual(actualHash, header.hash, `${skill.name}: hash must match skill body`);
  verified++;
}

// --- The reference file exists and documents the pattern ---

const reference = readFileSync(join(repoRoot, "references", "skill-payload-manifest.md"), "utf8");
assert.match(reference, /## Header Format/, "reference must document the header format");
assert.match(reference, /## Computing the Hash/, "reference must document how to compute the hash");
assert.match(reference, /## Verifying the Hash/, "reference must document how to verify the hash");

// --- The script exists ---

assert.ok(existsSync(join(repoRoot, "scripts", "skill-payload-manifest.mjs")), "skill-payload-manifest.mjs must exist");

console.log(`PASS: ${verified} skills have content-addressed headers that match their payloads`);
