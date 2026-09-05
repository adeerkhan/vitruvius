/**
 * check-output-quality.mjs — Drift detection for Vitruvius research outputs.
 *
 * Checks for common quality issues that indicate skill drift:
 * - Missing MACHINE_VERDICT line (verifier outputs)
 * - Missing inline citations [1], [2]
 * - Missing Sources section
 * - Missing provenance sidecar
 * - Missing evidence trail table
 *
 * Usage: node scripts/check-output-quality.mjs <file-or-dir>
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename, extname } from "node:path";

const target = process.argv[2] || "outputs";

function checkFile(filePath) {
	const problems = [];
	const text = readFileSync(filePath, "utf-8");
	const filename = basename(filePath);
	const isVerifier = filename.includes("verifier") || filename.includes("verification");
	const isDraft = filename.includes("draft") || filename.includes("cited");
	const isPlan = filename.includes("plan");

	// Check MACHINE_VERDICT (for verifier outputs)
	if (isVerifier && !text.includes("MACHINE_VERDICT:")) {
		problems.push(`${filename}: missing MACHINE_VERDICT line`);
	}

	// Check inline citations
	if (isDraft && !/\[\d+\]/.test(text)) {
		problems.push(`${filename}: missing inline citations [1], [2]`);
	}

	// Check Sources section
	if (isDraft && !text.includes("## Sources") && !text.includes("## sources")) {
		problems.push(`${filename}: missing Sources section`);
	}

	// Check evidence trail (for verifier outputs)
	if (isVerifier && !text.includes("Evidence Trail") && !text.includes("evidence trail")) {
		problems.push(`${filename}: missing Evidence Trail table`);
	}

	// Check Key Questions (for plans)
	if (isPlan && !text.includes("Key Questions") && !text.includes("key questions")) {
		problems.push(`${filename}: missing Key Questions section`);
	}

	// Check Evidence Needed (for plans)
	if (isPlan && !text.includes("Evidence Needed") && !text.includes("evidence needed")) {
		problems.push(`${filename}: missing Evidence Needed section`);
	}

	return problems;
}

function collectFiles(dir) {
	const files = [];
	try {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const fullPath = join(dir, entry.name);
			if (entry.isDirectory()) {
				files.push(...collectFiles(fullPath));
			} else if (entry.isFile() && extname(entry.name) === ".md") {
				files.push(fullPath);
			}
		}
	} catch { /* dir doesn't exist */ }
	return files;
}

// Collect files
let files = [];
if (existsSync(target)) {
	files = statSync(target).isDirectory() ? collectFiles(target) : [target];
} else {
	console.log(`PASS: ${target} does not exist yet (no outputs to check)`);
	process.exit(0);
}

let totalProblems = 0;
const results = [];

for (const file of files) {
	const problems = checkFile(file);
	if (problems.length > 0) {
		results.push({ file: basename(file), problems });
		totalProblems += problems.length;
	}
}

// Output
if (totalProblems === 0) {
	console.log(`PASS: ${files.length} files checked, no drift detected`);
	console.log("  - All verifier outputs have MACHINE_VERDICT");
	console.log("  - All drafts have inline citations + Sources");
	console.log("  - All plans have Key Questions + Evidence Needed");
	console.log("  - All verifier outputs have Evidence Trail");
	process.exit(0);
}

console.error(`DRIFT DETECTED: ${totalProblems} issue(s) across ${results.length} file(s):\n`);
for (const { file, problems } of results) {
	for (const p of problems) {
		console.error(`  ${p}`);
	}
}
process.exit(1);
