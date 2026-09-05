/**
 * score-benchmark.mjs — Scores verifier output against ground truth.
 *
 * Usage:
 *   node scripts/score-benchmark.mjs <results-dir>
 *   node scripts/score-benchmark.mjs --case <case-file> <verifier-output-file>
 *
 * Parses MACHINE_VERDICT lines from verifier output and compares against
 * ground-truth verdicts extracted from benchmark case files.
 *
 * MACHINE_VERDICT format:
 *   MACHINE_VERDICT: <verdict> | FLAW: <flaw> | CONFIDENCE: <n> | CHECKS_PASSED: <n>/7 | LINE_PINNED: <n>/<n>
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const VERDICT_PATTERN = /^MACHINE_VERDICT:\s*(PASS|PARTIAL|BLOCKED)\s*\|\s*FLAW:\s*(\S+)\s*\|\s*CONFIDENCE:\s*([\d.]+)\s*\|\s*CHECKS_PASSED:\s*(\d+)\/7\s*\|\s*LINE_PINNED:\s*(\d+)\/(\d+)/i;

const GROUND_TRUTH_PATTERN = /\*\*Ground-truth verdict:\*\*\s*(PASS|PARTIAL|BLOCKED)/i;
const FLAW_TYPE_PATTERN = /\*\*Flaw type:\*\*\s*(\S+)/i;

function parseMachineVerdict(line) {
	const match = line.match(VERDICT_PATTERN);
	if (!match) return null;
	return {
		verdict: match[1].toUpperCase(),
		flaw: match[2].trim(),
		confidence: parseFloat(match[3]),
		checksPassed: parseInt(match[4], 10),
		linePinnedNum: parseInt(match[5], 10),
		linePinnedDen: parseInt(match[6], 10),
	};
}

function parseGroundTruth(caseFile) {
	const content = readFileSync(caseFile, 'utf-8');
	const verdictMatch = content.match(GROUND_TRUTH_PATTERN);
	const flawMatch = content.match(FLAW_TYPE_PATTERN);
	if (!verdictMatch) return null;
	return {
		verdict: verdictMatch[1].toUpperCase(),
		flaw: flawMatch ? flawMatch[1].trim() : 'none',
	};
}

function scoreCase(caseFile, outputDir) {
	const caseName = basename(caseFile, '.md');
	const groundTruth = parseGroundTruth(caseFile);
	if (!groundTruth) {
		console.error(`  ${caseName}: ERROR — no ground truth found`);
		return null;
	}

	const outputFile = join(outputDir, `${caseName}-result.md`);
	if (!existsSync(outputFile)) {
		console.error(`  ${caseName}: MISSING — no verifier output at ${outputFile}`);
		return null;
	}

	const output = readFileSync(outputFile, 'utf-8');
	const lines = output.split('\n');
	let machineVerdict = null;
	for (const line of lines) {
		const parsed = parseMachineVerdict(line);
		if (parsed) {
			machineVerdict = parsed;
			break;
		}
	}

	if (!machineVerdict) {
		console.error(`  ${caseName}: ERROR — no MACHINE_VERDICT line found`);
		return null;
	}

	const verdictMatch = machineVerdict.verdict === groundTruth.verdict;
	const flawMatch = machineVerdict.flaw.toLowerCase() === groundTruth.flaw.toLowerCase() ||
		(groundTruth.verdict === 'PASS' && machineVerdict.flaw === 'none');

	// False approval: verifier returned PASS on a flawed case
	const falseApproval = groundTruth.verdict !== 'PASS' && machineVerdict.verdict === 'PASS';
	// False block: verifier returned BLOCKED on a sound case
	const falseBlock = groundTruth.verdict === 'PASS' && machineVerdict.verdict === 'BLOCKED';
	// Conservative overcall: verifier returned BLOCKED when PARTIAL expected
	const conservativeOvercall = groundTruth.verdict === 'PARTIAL' && machineVerdict.verdict === 'BLOCKED';

	return {
		caseName,
		groundTruth,
		machineVerdict,
		verdictMatch,
		flawMatch,
		falseApproval,
		falseBlock,
		conservativeOvercall,
		correct: verdictMatch,
	};
}

function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.error('Usage: node scripts/score-benchmark.mjs <results-dir> [cases-dir]');
		console.error('       node scripts/score-benchmark.mjs --case <case-file> <verifier-output-file>');
		console.error('');
		console.error('  results-dir: directory containing verifier output files (*-result.md)');
		console.error('  cases-dir:   directory containing benchmark case files (default: <repo>/tasks/benchmark/cases/civil)');
		process.exit(1);
	}

	// Batch mode — score all cases in a results directory
	const resultsDir = args[0];
	const casesDir = args[1] || join(process.cwd(), 'tasks', 'benchmark', 'cases', 'civil');

	if (!existsSync(casesDir)) {
		console.error(`Cases directory not found: ${casesDir}`);
		console.error('Provide cases-dir as second argument or run from repo root.');
		process.exit(1);
	}

	if (!existsSync(resultsDir)) {
		console.error(`Results directory not found: ${resultsDir}`);
		process.exit(1);
	}

	const caseFiles = readdirSync(casesDir)
		.filter(f => f.endsWith('.md'))
		.sort();

	console.log(`\nBenchmark Results — ${new Date().toISOString().split('T')[0]}`);
	console.log('='.repeat(60));

	const results = [];
	for (const caseFile of caseFiles) {
		const fullPath = join(casesDir, caseFile);
		const result = scoreCase(fullPath, resultsDir);
		if (result) results.push(result);
	}

	if (results.length === 0) {
		console.error('No results to score.');
		process.exit(1);
	}

	// Print per-case results
	console.log('\nPer-Case Results:');
	console.log('-'.repeat(60));
	for (const r of results) {
		const status = r.correct ? '✓ CORRECT' : r.falseApproval ? '✗ FALSE APPROVAL' : r.falseBlock ? '✗ FALSE BLOCK' : '✗ WRONG VERDICT';
		const detail = `expected=${r.groundTruth.verdict} got=${r.machineVerdict.verdict}`;
		const flaw = r.groundTruth.verdict !== 'PASS' ? ` flaw=${r.machineVerdict.flaw}` : '';
		const confidence = ` conf=${r.machineVerdict.confidence.toFixed(2)}`;
		const checks = ` checks=${r.machineVerdict.checksPassed}/7`;
		const linePinned = ` pinned=${r.machineVerdict.linePinnedNum}/${r.machineVerdict.linePinnedDen}`;
		console.log(`  ${r.caseName}: ${status} (${detail}${flaw}${confidence}${checks}${linePinned})`);
	}

	// Summary statistics
	const total = results.length;
	const correct = results.filter(r => r.correct).length;
	const falseApprovals = results.filter(r => r.falseApproval).length;
	const falseBlocks = results.filter(r => r.falseBlock).length;
	const conservativeOvercalls = results.filter(r => r.conservativeOvercall).length;
	const avgConfidence = results.reduce((sum, r) => sum + r.machineVerdict.confidence, 0) / total;
	const avgChecksPassed = results.reduce((sum, r) => sum + r.machineVerdict.checksPassed, 0) / total;
	const totalLinePinned = results.reduce((sum, r) => sum + r.machineVerdict.linePinnedNum, 0);
	const totalFindings = results.reduce((sum, r) => sum + r.machineVerdict.linePinnedDen, 0);

	console.log('\nSummary:');
	console.log('-'.repeat(60));
	console.log(`  Cases scored:        ${total}`);
	console.log(`  Correct verdicts:    ${correct}/${total} (${(correct/total*100).toFixed(1)}%)`);
	console.log(`  False approvals:     ${falseApprovals}/${total} (${(falseApprovals/total*100).toFixed(1)}%)`);
	console.log(`  False blocks:        ${falseBlocks}/${total} (${(falseBlocks/total*100).toFixed(1)}%)`);
	console.log(`  Conservative over:   ${conservativeOvercalls}/${total}`);
	console.log(`  Avg confidence:      ${avgConfidence.toFixed(2)}`);
	console.log(`  Avg checks passed:   ${avgChecksPassed.toFixed(1)}/7`);
	console.log(`  Line-pinned ratio:   ${totalLinePinned}/${totalFindings}`);

	// Exit with error if any false approvals
	process.exit(falseApprovals > 0 ? 1 : 0);
}

import { dirname } from 'node:path';
main();
