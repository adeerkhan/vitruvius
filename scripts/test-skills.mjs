/**
 * test-skills.mjs — Structural test harness for Vitruvius skills.
 *
 * Validates skill structure WITHOUT API calls. Checks:
 * - Frontmatter has allowed-tools (for skills that write files)
 * - Artifact contract mentioned (outputs/.plans/ etc.)
 * - Slug derivation rule present
 * - No hardcoded personal paths
 * - References resolve to real files
 * - outputs/ in .gitignore
 *
 * Usage: node scripts/test-skills.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const SKILLS_DIR = join(REPO_ROOT, "skills");

// Skills that MUST declare allowed-tools (they write files)
const FILE_WRITING_SKILLS = new Set([
	"engineering-research",
	"civil",
	"mechanical",
	"electrical",
	"software",
	"architectural",
	"compare",
	"review",
	"audit",
	"verify",
	"summarize",
]);

// Artifact contract paths that must be mentioned
const ARTIFACT_PATHS = [
	"outputs/.plans/",
	"outputs/.drafts/",
	"outputs/<slug>.md",
	".provenance.md",
];

const SLUG_PATTERN = /slug|lowercase.*hyphen|hyphenat/;

function readYamlFrontmatter(text) {
	if (!text.startsWith("---\n")) return null;
	const end = text.indexOf("\n---", 3);
	if (end === -1) return null;
	return text.slice(4, end);
}

function parseFrontmatter(frontmatter) {
	const entries = {};
	for (const line of frontmatter.split("\n")) {
		const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
		if (match) entries[match[1]] = match[2].trim();
	}
	return entries;
}

function checkSkill(skillDir) {
	const problems = [];
	const skillName = relative(SKILLS_DIR, skillDir);
	const skillMdPath = join(skillDir, "SKILL.md");

	if (!existsSync(skillMdPath)) {
		return [`${skillName}: SKILL.md missing`];
	}

	const text = readFileSync(skillMdPath, "utf-8");
	const frontmatter = readYamlFrontmatter(text);

	if (!frontmatter) {
		return [`${skillName}: no frontmatter`];
	}

	const fm = parseFrontmatter(frontmatter);

	// Check allowed-tools for file-writing skills
	if (FILE_WRITING_SKILLS.has(skillName)) {
		if (!fm["allowed-tools"]) {
			problems.push(`${skillName}: missing allowed-tools (writes files)`);
		} else {
			const tools = fm["allowed-tools"].split(/\s+/);
			if (!tools.includes("Write") && !tools.includes("Edit")) {
				problems.push(`${skillName}: allowed-tools missing Write/Edit`);
			}
		}
	}

	// Check artifact contract mentioned
	if (FILE_WRITING_SKILLS.has(skillName) && skillName !== "engineering-research") {
		const hasArtifactRef = ARTIFACT_PATHS.some(p => text.includes(p)) || text.includes("artifact contract");
		if (!hasArtifactRef) {
			problems.push(`${skillName}: artifact contract not mentioned`);
		}
	}

	// Check slug derivation rule
	if (skillName === "engineering-research") {
		if (!SLUG_PATTERN.test(text)) {
			problems.push(`${skillName}: slug derivation rule not documented`);
		}
	}

	// Check for personal paths
	const personalPathMatch = text.match(/\/Users\/[^\/]+/);
	if (personalPathMatch) {
		problems.push(`${skillName}: contains personal path (${personalPathMatch[0]})`);
	}

	// Check references resolve
	const refPattern = /`((?:references|assets|scripts)\/[\w.\-/]+)`/g;
	let match;
	while ((match = refPattern.exec(text)) !== null) {
		const refPath = join(skillDir, match[1]);
		if (!existsSync(refPath)) {
			problems.push(`${skillName}: broken reference (${match[1]})`);
		}
	}

	return problems;
}

function checkGitignore() {
	const gitignorePath = join(REPO_ROOT, ".gitignore");
	if (!existsSync(gitignorePath)) {
		return [".gitignore missing"];
	}
	const content = readFileSync(gitignorePath, "utf-8");
	if (!content.includes("outputs/")) {
		return [".gitignore missing outputs/"];
	}
	return [];
}

// Run checks
const skillDirs = readdirSync(SKILLS_DIR)
	.filter(name => statSync(join(SKILLS_DIR, name)).isDirectory())
	.map(name => join(SKILLS_DIR, name));

let totalProblems = 0;
const results = [];

for (const dir of skillDirs) {
	const problems = checkSkill(dir);
	if (problems.length > 0) {
		results.push({ skill: relative(SKILLS_DIR, dir), problems });
		totalProblems += problems.length;
	}
}

const gitignoreProblems = checkGitignore();
if (gitignoreProblems.length > 0) {
	results.push({ skill: ".gitignore", problems: gitignoreProblems });
	totalProblems += gitignoreProblems.length;
}

// Output
if (totalProblems === 0) {
	console.log(`PASS: ${skillDirs.length}/${skillDirs.length} skills structurally valid`);
	console.log("  - All file-writing skills declare allowed-tools");
	console.log("  - All skills reference artifact contract");
	console.log("  - Slug derivation rule documented");
	console.log("  - No personal paths detected");
	console.log("  - All references resolve");
	console.log("  - outputs/ gitignored");
	process.exit(0);
}

console.error(`FAIL: ${totalProblems} problem(s) across ${results.length} skill(s):\n`);
for (const { skill, problems } of results) {
	for (const p of problems) {
		console.error(`  ${p}`);
	}
}
process.exit(1);
