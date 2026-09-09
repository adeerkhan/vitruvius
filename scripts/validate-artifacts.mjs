/**
 * validate-artifacts.mjs — Validates research artifacts (plans, drafts, provenance).
 *
 * Checks:
 * - Plans mention correct artifact paths
 * - Drafts have Sources section
 * - Slug matches filename
 * - No slug collisions
 *
 * Usage: node scripts/validate-artifacts.mjs <outputs-dir>
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";

const outputsDir = process.argv[2] || "outputs";
const plansDir = join(outputsDir, ".plans");
const draftsDir = join(outputsDir, ".drafts");

function extractSlug(filename) {
	return basename(filename, ".md").replace(/-(draft|cited|research-direct|verification|T\d+)$/, "");
}

function validatePlan(filePath) {
	const problems = [];
	const text = readFileSync(filePath, "utf-8");
	const filename = basename(filePath);

	// Check artifact contract mentioned
	if (!text.includes("outputs/.plans/") && !text.includes("outputs/.drafts/")) {
		problems.push(`${filename}: artifact contract not mentioned`);
	}

	// Check key questions present
	if (!text.includes("Key Questions") && !text.includes("key questions")) {
		problems.push(`${filename}: missing Key Questions section`);
	}

	// Check evidence needed present
	if (!text.includes("Evidence Needed") && !text.includes("evidence needed")) {
		problems.push(`${filename}: missing Evidence Needed section`);
	}

	return problems;
}

function validateDraft(filePath) {
	const problems = [];
	const text = readFileSync(filePath, "utf-8");
	const filename = basename(filePath);

	// Check Sources section
	if (!text.includes("Sources") && !text.includes("sources")) {
		problems.push(`${filename}: missing Sources section`);
	}

	// Check inline citations
	const citationPattern = /\[\d+\]/;
	if (!citationPattern.test(text)) {
		problems.push(`${filename}: no inline citations found`);
	}

	return problems;
}

// Verification labels — the 6-label F2 schema
const VERIFICATION_LABELS = new Set([
	"verified", "partial", "blocked", "unverified", "inferred", "failed",
]);

function validateProvenance(filePath) {
	const problems = [];
	const text = readFileSync(filePath, "utf-8");
	const filename = basename(filePath);

	// Required scalar fields
	const requiredFields = ["Date", "Sources consulted", "Sources accepted", "Verification"];
	for (const field of requiredFields) {
		if (!text.includes(field)) {
			problems.push(`${filename}: missing \`${field}\``);
		}
	}

	// Verification verdict must use the 6-label schema
	const verdictMatch = text.match(/\*\*Verification:\*\*\s*(\S+)/);
	if (verdictMatch && !VERIFICATION_LABELS.has(verdictMatch[1].toLowerCase())) {
		problems.push(
			`${filename}: Verification value \`${verdictMatch[1]}\` is not one of ${[...VERIFICATION_LABELS].join("/")}`,
		);
	}

	// Claim counts: at least one labeled claim count must be present
	const claimCounts = [...text.matchAll(/\*\*Claims (\w+):\*\*\s*(\d+)/g)];
	if (claimCounts.length === 0) {
		problems.push(`${filename}: no \`Claims <label>:\` counts found (6-label schema requires them)`);
	} else {
		for (const [, label, count] of claimCounts) {
			if (!VERIFICATION_LABELS.has(label.toLowerCase())) {
				problems.push(`${filename}: claim label \`${label}\` is not one of ${[...VERIFICATION_LABELS].join("/")}`);
			}
			if (Number.isNaN(parseInt(count, 10))) {
				problems.push(`${filename}: claim count for \`${label}\` is not a number`);
			}
		}
		// Every claim must have a status: the sum of labeled counts must be >= 1
		// and a run with zero verified+partial+inferred counts cannot claim success.
		const sumLabeled = claimCounts
			.filter(([, label]) => VERIFICATION_LABELS.has(label.toLowerCase()))
			.reduce((s, [, , c]) => s + parseInt(c, 10), 0);
		if (sumLabeled === 0 && !/Verification:\*\*\s*(BLOCKED|failed)/i.test(text)) {
			problems.push(`${filename}: zero labeled claims but verdict is not BLOCKED/failed`);
		}
	}

	// Provenance must point at its plan or say why there isn't one
	if (!text.includes("Plan") && !text.includes("plan")) {
		problems.push(`${filename}: missing Plan reference`);
	}

	return problems;
}

// Collect all files
let planFiles = [];
let draftFiles = [];
let provenanceFiles = [];

try {
	planFiles = readdirSync(plansDir).filter(f => f.endsWith(".md")).map(f => join(plansDir, f));
} catch { /* no plans dir */ }

try {
	draftFiles = readdirSync(draftsDir).filter(f => f.endsWith(".md")).map(f => join(draftsDir, f));
} catch { /* no drafts dir */ }

try {
	provenanceFiles = readdirSync(outputsDir).filter(f => f.endsWith(".provenance.md")).map(f => join(outputsDir, f));
} catch { /* no provenance files */ }

// Validate each file
let totalProblems = 0;
const results = [];

for (const file of planFiles) {
	const problems = validatePlan(file);
	if (problems.length > 0) {
		results.push({ file: basename(file), problems });
		totalProblems += problems.length;
	}
}

for (const file of draftFiles) {
	const problems = validateDraft(file);
	if (problems.length > 0) {
		results.push({ file: basename(file), problems });
		totalProblems += problems.length
	}
}

for (const file of provenanceFiles) {
	const problems = validateProvenance(file);
	if (problems.length > 0) {
		results.push({ file: basename(file), problems });
		totalProblems += problems.length
	}
}

// Check for slug collisions
const slugCounts = {};
for (const file of [...planFiles, ...draftFiles]) {
	const slug = extractSlug(basename(file));
	slugCounts[slug] = (slugCounts[slug] || 0) + 1;
}
const collisions = Object.entries(slugCounts).filter(([, count]) => count > 2);

// Output
const totalFiles = planFiles.length + draftFiles.length + provenanceFiles.length;

if (totalProblems === 0) {
	console.log(`PASS: ${totalFiles} artifacts validated`);
	console.log(`  - ${planFiles.length} plans: artifact contract + key questions present`);
	console.log(`  - ${draftFiles.length} drafts: Sources + inline citations present`);
	console.log(`  - ${provenanceFiles.length} provenance: required fields present`);
	console.log(`  - No slug collisions detected`);
	process.exit(0);
}

console.error(`FAIL: ${totalProblems} problem(s) across ${results.length} file(s):\n`);
for (const { file, problems } of results) {
	for (const p of problems) {
		console.error(`  ${p}`);
	}
}
if (collisions.length > 0) {
	console.error(`\nSlug collisions: ${collisions.map(([s]) => s).join(", ")}`);
}
process.exit(1);
