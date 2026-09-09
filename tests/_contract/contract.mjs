/**
 * tests/_contract/contract.mjs — Shared test utilities for Vitruvius skills.
 *
 * Adapted from scientific-agent-skills' skill_contract pattern.
 * Provides common assertions for frontmatter, structure, and methodology.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { readYamlFrontmatter, parseFrontmatter } from "../../scripts/yaml-frontmatter.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const SKILLS_DIR = join(REPO_ROOT, "skills");

export function readSkillMd(skillName) {
  const path = join(SKILLS_DIR, skillName, "SKILL.md");
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

export function readFrontmatter(skillName) {
  const text = readSkillMd(skillName);
  if (!text) return null;
  const raw = readYamlFrontmatter(text);
  if (raw === null) return null;
  const parsed = parseFrontmatter(raw);
  for (const k of Object.keys(parsed)) {
    parsed[k] = parsed[k].replace(/^["']|["']$/g, "");
  }
  return parsed;
}

export function check(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    return true;
  } else {
    console.error(`  FAIL: ${message}`);
    return false;
  }
}

export function hasFrontmatter(skillName) {
  const fm = readFrontmatter(skillName);
  return check(fm !== null, `${skillName}: has frontmatter`);
}

export function hasRequiredFields(skillName) {
  const fm = readFrontmatter(skillName);
  if (!fm) return false;
  let ok = true;
  ok = check(fm.name === skillName, `${skillName}: name matches directory`) && ok;
  ok = check(fm.description, `${skillName}: has description`) && ok;
  return ok;
}

export function hasSection(skillName, heading) {
  const text = readSkillMd(skillName);
  if (!text) return false;
  const pattern = new RegExp(`^##\\s+${heading}`, "m");
  return check(pattern.test(text), `${skillName}: has "## ${heading}" section`);
}

export function hasMethodologyPhases(skillName, count) {
  const text = readSkillMd(skillName);
  if (!text) return false;
  const phases = text.match(/###\s+Step\s+\d+|###\s+Phase\s+\d+|\d+\.\s+\*\*/g);
  return check(
    phases && phases.length >= count,
    `${skillName}: has ${count}+ methodology phases (found ${phases ? phases.length : 0})`,
  );
}

export function hasS7Boundary(skillName) {
  const text = readSkillMd(skillName);
  if (!text) return false;
  return check(
    text.includes("research-only") || text.includes("not for final engineering"),
    `${skillName}: has S7 boundary language`,
  );
}

export function lineCountUnder(skillName, max) {
  const text = readSkillMd(skillName);
  if (!text) return false;
  const lines = text.split("\n").length;
  return check(lines <= max, `${skillName}: ${lines} lines (limit ${max})`);
}

export function allSkillNames() {
  return readdirSync(SKILLS_DIR).filter((name) => {
    try {
      return statSync(join(SKILLS_DIR, name, "SKILL.md")).isFile();
    } catch {
      return false;
    }
  });
}
