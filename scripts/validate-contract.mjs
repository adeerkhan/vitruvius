import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { readYamlFrontmatter, parseFrontmatterEntries } from "./yaml-frontmatter.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const SKILLS_DIR = join(REPO_ROOT, "skills");

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
const PERSONAL_PATH = /\/mnt\/[a-z]\/Users|home|Users\/(?![<\$<]|\$\{?)([\w.-]+)\//g;

const IMPERSONAL_ACCOUNTS = new Set([
  "user", "username", "you", "me", "youruser", "your-user", "name", "runner",
]);

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
  for (const [key, value] of entries) {
    if (key === "description" || key === "compatibility") continue; // free text
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
  const fmText = readFileSync(join(skill, "SKILL.md"), "utf-8").split("\n---", 2)[0];
  const versionMatch = fmText.match(/^\s+version:\s*[\"']?([\w.-]+)/m);
  if (!versionMatch) {
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

const CHECKS = {
  frontmatter: frontmatterProblems,
  skill_md_length: lengthProblems,
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
