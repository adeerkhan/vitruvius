import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readYamlFrontmatter, parseFrontmatterEntries, parseFrontmatterObject, readSkillDescription } from "./yaml-frontmatter.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(__dirname, "..");
// Tests point this at a fixture tree to prove a check can fail.
const SKILLS_DIR = process.env.VITRUVIUS_SKILLS_DIR
  ? resolve(REPO_ROOT, process.env.VITRUVIUS_SKILLS_DIR)
  : join(REPO_ROOT, "skills");

const MAX_SKILL_MD_LINES = 500;
const ALLOWED_FRONTMATTER_FIELDS = new Set([
  "name",
  "description",
  "license",
  "compatibility",
  "allowed-tools",
  "argument-hint",
  "metadata",
]);

const INLINE_PATH = /`((?:assets|references|scripts|agents)\/[\w.\-/]+)`/g;
const MARKDOWN_LINK = /\]\(((?:assets|references|scripts|agents)\/[\w.\-/]+)\)/g;
// A skill mention: `/name` preceded by start/whitespace/backtick/bullet —
// not a file-path segment (`./posting.pdf`, `/tmp/x`), not a URL path
// (`/graph/v1/...` — followed by another `/`), not `§/line` shorthand.
const SKILL_MENTION = /(?<=^|\s|`|[*\[(])\/([a-z][a-z0-9-]{2,})\b(?!\/)/g;
const SKILL_MENTION_ALLOWED_PREFIX = new Set(["skill"]);
const URL_SPAN = /https?:\/\/\S+/g;

// Skills that write files must declare allowed-tools and name the artifact
// contract; the slug rule and the personal-path ban are repo-wide. Ported from
// the retired test-skills.mjs so one validator owns structural shape.
const FILE_WRITING_SKILLS = new Set([
  "engineering-research", "civil", "mechanical", "electrical", "software",
  "architectural", "scholarly-research", "gap-analysis", "evidence-ranking",
  "design-alternatives", "fmea-brainstorm", "hypothesis-generation",
  "peer-review", "compare", "review", "audit", "summarize", "proposal", "habit",
]);
const ARTIFACT_PATHS = ["outputs/.plans/", "outputs/.drafts/", "outputs/<slug>.md", ".provenance.md"];
const SLUG_PATTERN = /slug|lowercase.*hyphen|hyphenat/;
const PERSONAL_PATH = /\/Users\/[^/]+/;

function allSkillNames() {
  const names = new Set();
  for (const entry of readdirSync(SKILLS_DIR)) {
    const skillMd = join(SKILLS_DIR, entry, "SKILL.md");
    try {
      if (statSync(skillMd).isFile()) names.add(entry);
    } catch {
      // not a skill dir
    }
  }
  return names;
}

// ---------------------------------------------------------------------------
// Checks. Each returns string[] problems (empty = conforms).
// ---------------------------------------------------------------------------

function frontmatterProblems(skill) {
  const problems = [];
  const skillMdPath = join(skill, "SKILL.md");
  let text;
  try {
    text = readFileSync(skillMdPath, "utf-8");
  } catch {
    return [`${relative(SKILLS_DIR, skill)}: no SKILL.md`];
  }

  const frontmatter = readYamlFrontmatter(text);
  if (frontmatter === null) {
    return [`${relative(SKILLS_DIR, skill)}: SKILL.md has no --- delimited frontmatter`];
  }

  const entries = parseFrontmatterEntries(frontmatter);
  const keys = entries.map(([k]) => k);

  // Values must be single clean tokens; a value containing a colon means two
  // keys were merged onto one line (e.g. "license: MITmetadata:"), which the
  // line-based parser silently swallows.
  for (const [key, value, isBlock] of entries) {
    if (key === "description" || key === "compatibility" || isBlock) continue; // free text
    if (value.includes(":") || /^\s/.test(value)) {
      problems.push(
        `${relative(SKILLS_DIR, skill)}: frontmatter key \`${key}\` has a malformed value \`${value}\` — likely two keys merged onto one line`,
      );
    }
  }

  for (const key of keys) {
    if (!ALLOWED_FRONTMATTER_FIELDS.has(key)) {
      problems.push(
        `${relative(SKILLS_DIR, skill)}: top-level frontmatter key \`${key}\` is not allowed — move it under metadata`,
      );
    }
  }
  for (const required of ["name", "description"]) {
    if (!keys.includes(required)) {
      problems.push(`${relative(SKILLS_DIR, skill)}: frontmatter missing \`${required}\``);
    }
  }

  const values = Object.fromEntries(entries);
  const name = (values.name || "").replace(/^["']|["']$/g, "");
  if (name && name !== relative(SKILLS_DIR, skill)) {
    problems.push(
      `${relative(SKILLS_DIR, skill)}: frontmatter name \`${name}\` must match directory name`,
    );
  }

  if (values["allowed-tools"] && /[,[]/.test(values["allowed-tools"])) {
    problems.push(
      `${relative(SKILLS_DIR, skill)}: allowed-tools must be a space-separated string`,
    );
  }

  // metadata.version is required (bump-on-change discipline lives in AGENTS.md)
  const object = frontmatter === null ? null : parseFrontmatterObject(frontmatter);
  const version = object && typeof object.metadata === "object" ? object.metadata.version : undefined;
  if (typeof version !== "string" || version.trim() === "") {
    problems.push(
      `${relative(SKILLS_DIR, skill)}: frontmatter missing \`metadata.version\` (expected a nested \`version:\` under \`metadata:\`)`,
    );
  }

  return problems;
}

function lengthProblems(skill) {
  try {
    const lines = readFileSync(join(skill, "SKILL.md"), "utf-8").split("\n").length;
    if (lines > MAX_SKILL_MD_LINES) {
      return [
        `${relative(SKILLS_DIR, skill)}: SKILL.md is ${lines} lines, over the ${MAX_SKILL_MD_LINES}-line limit`,
      ];
    }
  } catch {
    // frontmatterProblems already reports missing file
  }
  return [];
}

function strayTestProblems(skill) {
  const problems = [];
  try {
    const entries = readdirSync(skill, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name === "tests") {
        problems.push(`${relative(SKILLS_DIR, skill)}: ships tests/ — tests belong in tests/<name>/`);
      }
      if (entry.isFile() && entry.name.startsWith("test_") && entry.name.endsWith(".py")) {
        problems.push(
          `${relative(SKILLS_DIR, skill)}: ships ${entry.name} — tests belong in tests/<name>/`,
        );
      }
    }
  } catch {
    // ignore
  }
  return problems;
}

function linkProblems(skill) {
  const problems = [];
  const docs = [join(skill, "SKILL.md")];
  const refsDir = join(skill, "references");
  try {
    for (const f of readdirSync(refsDir)) {
      if (f.endsWith(".md")) docs.push(join(refsDir, f));
    }
  } catch {
    // no references dir
  }

  for (const doc of docs) {
    let text;
    try {
      text = readFileSync(doc, "utf-8");
    } catch {
      continue;
    }
    const docName = relative(skill, doc);
    for (const [i, line] of text.split("\n").entries()) {
      const found = new Set();
      for (const m of line.matchAll(INLINE_PATH)) found.add(m[1]);
      for (const m of line.matchAll(MARKDOWN_LINK)) found.add(m[1]);
      for (const rel of found) {
        const inSkill = statSync(join(skill, rel), { throwIfNoEntry: false });
        const inRoot = statSync(join(REPO_ROOT, rel), { throwIfNoEntry: false });
        if (!inSkill && !inRoot) {
          problems.push(
            `${relative(SKILLS_DIR, skill)}: ${docName}:${i + 1} references \`${rel}\`, which does not exist`,
          );
        }
      }
    }
  }
  return problems;
}

function skillMentionProblems(skill, knownSkills) {
  const problems = [];
  const skillName = relative(SKILLS_DIR, skill);
  let text;
  try {
    text = readFileSync(join(skill, "SKILL.md"), "utf-8");
  } catch {
    return problems;
  }
  // Strip inline code spans — `/verifier` inside backticks is what we want,
  // but fenced blocks may contain shell paths like /usr/bin. Strip fences,
  // keep inline code (that's where invocations live).
  const noFences = text.replace(/```[\s\S]*?```/g, "");
  for (const [i, rawLine] of noFences.split("\n").entries()) {
    const line = rawLine.replace(URL_SPAN, "");
    for (const m of line.matchAll(SKILL_MENTION)) {
      const name = m[1];
      if (knownSkills.has(name)) continue;
      if (SKILL_MENTION_ALLOWED_PREFIX.has(name)) continue;
      problems.push(
        `${skillName}: SKILL.md:${i + 1} mentions \`/${name}\`, which is not a skill in skills/`,
      );
    }
  }
  return problems;
}

const skillDirs = [...allSkillNames()].map((n) => join(SKILLS_DIR, n));
const knownSkills = new Set(skillDirs.map((s) => relative(SKILLS_DIR, s)));

// A directory with no regular file at any depth is noise (skill-anatomy
// "Supporting Files" transfer from ref/agent-skills).
function isEffectivelyEmpty(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return true;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!isEffectivelyEmpty(join(dir, entry.name))) return false;
    } else {
      return false;
    }
  }
  return true;
}

// Supporting .md files are lowercase-hyphen-separated (skill-anatomy "Naming
// Conventions"). Layout violations, so they fail rather than warn.
function skillLayoutProblems(skill) {
  const problems = [];
  const name = relative(SKILLS_DIR, skill);
  const walk = (dir, relBase) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (isEffectivelyEmpty(abs)) problems.push(`${name}: empty directory \`${rel}/\``);
        else walk(abs, rel);
      } else if (
        entry.name.endsWith(".md") &&
        entry.name !== "SKILL.md" &&
        !/^[a-z0-9]+(-[a-z0-9]+)*\.md$/.test(entry.name)
      ) {
        problems.push(`${name}: supporting file \`${rel}\` is not lowercase-hyphen-separated`);
      }
    }
  };
  walk(skill, "");
  return problems;
}

// Description needs a positive trigger. Strip *every* negated clause before
// testing, so two "Do not use when" clauses cannot leave a stray positive
// match behind (ref/agent-skills skill-lint.js, commit fc3026e).
const DESCRIPTION_TRIGGER = /\buse (?:this )?(?:when|before|after|during)\b|\buse (?:for|to)\b/i;
const DESCRIPTION_TRIGGER_NEGATE_ALL =
  /\b(?:do not|don't|never)\s+use (?:this )?(?:when|before|after|during|for|to)\b/gi;

function descriptionTriggerProblems(skill) {
  const name = relative(SKILLS_DIR, skill);
  let text;
  try {
    text = readFileSync(join(skill, "SKILL.md"), "utf-8");
  } catch {
    return [];
  }
  const description = readSkillDescription(text);
  if (!description) return [`${name}: SKILL.md has no description`];
  const hasTrigger = DESCRIPTION_TRIGGER.test(description);
  const onlyNegated =
    hasTrigger && !description.replace(DESCRIPTION_TRIGGER_NEGATE_ALL, "").match(DESCRIPTION_TRIGGER);
  if (!hasTrigger || onlyNegated) {
    return [
      `${name}: description has no positive "use when/for" trigger after negated clauses are stripped`,
    ];
  }
  return [];
}

// Writer contract: file-writing skills declare tools and the artifact contract;
// engineering-research documents slug derivation; no skill carries a personal
// path. Ported from the retired test-skills.mjs.
function writerContractProblems(skill) {
  const name = relative(SKILLS_DIR, skill);
  let text;
  try {
    text = readFileSync(join(skill, "SKILL.md"), "utf-8");
  } catch {
    return [];
  }
  const problems = [];
  if (FILE_WRITING_SKILLS.has(name)) {
    const frontmatter = readYamlFrontmatter(text);
    const values = frontmatter === null ? {} : Object.fromEntries(parseFrontmatterEntries(frontmatter));
    const tools = (values["allowed-tools"] ?? "").split(/\s+/).filter(Boolean);
    if (tools.length === 0) problems.push(`${name}: missing allowed-tools (writes files)`);
    else if (!tools.includes("Write") && !tools.includes("Edit")) {
      problems.push(`${name}: allowed-tools missing Write/Edit`);
    }
    if (name !== "engineering-research") {
      const hasArtifact = ARTIFACT_PATHS.some((token) => text.includes(token)) || text.includes("artifact contract");
      if (!hasArtifact) problems.push(`${name}: artifact contract not mentioned`);
    }
  }
  if (name === "engineering-research" && !SLUG_PATTERN.test(text)) {
    problems.push(`${name}: slug derivation rule not documented`);
  }
  const personal = text.match(PERSONAL_PATH);
  if (personal) problems.push(`${name}: contains personal path (${personal[0]})`);
  return problems;
}

const CHECKS = {
  frontmatter: frontmatterProblems,
  skill_md_length: lengthProblems,
  skill_layout: skillLayoutProblems,
  description_trigger: descriptionTriggerProblems,
  writer_contract: writerContractProblems,
  no_tests_under_skills: strayTestProblems,
  local_links_resolve: linkProblems,
  skill_references_resolve: (skill) => skillMentionProblems(skill, knownSkills),
};

let totalProblems = 0;
const bySkill = {};

for (const skill of skillDirs) {
  const skillName = relative(SKILLS_DIR, skill);
  for (const [rule, check] of Object.entries(CHECKS)) {
    const problems = check(skill);
    if (problems.length > 0) {
      bySkill[skillName] = bySkill[skillName] || {};
      bySkill[skillName][rule] = problems;
      totalProblems += problems.length;
    }
  }
}

// Also validate package.json contract
let pkg;
try {
  pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf-8"));
} catch {
  console.error("FAIL: package.json missing or invalid");
  process.exit(1);
}
for (const required of ["name", "version", "description", "license"]) {
  if (!pkg[required]) {
    console.error(`FAIL: package.json missing \`${required}\``);
    process.exit(1);
  }
}

// Plugin manifest version must match package.json (single release version;
// skill-level versions are per-skill metadata, per AGENTS.md N7)
const manifestPath = join(REPO_ROOT, ".claude-plugin", "plugin.json");
if (existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    if (manifest.version !== pkg.version) {
      console.error(
        `FAIL: .claude-plugin/plugin.json version ${manifest.version} does not match package.json version ${pkg.version} — bump both together`,
      );
      process.exit(1);
    }
  } catch {
    console.error("FAIL: .claude-plugin/plugin.json invalid JSON");
    process.exit(1);
  }
}

// The artifact contract assumes outputs/ is never committed.
let gitignoreOk = true;
try {
  if (!readFileSync(join(REPO_ROOT, ".gitignore"), "utf-8").includes("outputs/")) gitignoreOk = false;
} catch {
  gitignoreOk = false;
}
if (!gitignoreOk) {
  console.error("FAIL: .gitignore must ignore outputs/");
  process.exit(1);
}

if (totalProblems === 0) {
  console.log(`PASS: ${skillDirs.length} skills conform to the structural contract.`);
  process.exit(0);
}

console.error(`FAIL: ${totalProblems} structural problem(s) across ${Object.keys(bySkill).length} skill(s):\n`);
for (const [skill, rules] of Object.entries(bySkill)) {
  for (const [rule, problems] of Object.entries(rules)) {
    for (const p of problems) {
      console.error(`  [${rule}] ${p}`);
    }
  }
}
process.exit(1);
