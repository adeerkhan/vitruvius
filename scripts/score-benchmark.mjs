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
 *   MACHINE_VERDICT: <verdict> | FLAW: <flaw> | CONFIDENCE: <n> | CHECKS_PASSED: <n>/8 | LINE_PINNED: <n>/<n>
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const VERDICT_PATTERN = /^MACHINE_VERDICT:\s*(PASS|PARTIAL|BLOCKED)\s*\|\s*FLAW:\s*(\S+)\s*\|\s*CONFIDENCE:\s*([\d.]+)\s*\|\s*CHECKS_PASSED:\s*(\d+)\/8\s*\|\s*LINE_PINNED:\s*(\d+)\/(\d+)/i;

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
		console.error('  cases-dir:   directory containing benchmark case files (default: <repo>/tasks/benchmark/cases)');
		console.error('               If cases-dir contains discipline subdirectories, all are scored.');
		process.exit(1);
	}

	const resultsDir = args[0];

	// Support both single discipline dir and parent with discipline subdirs
	let casesDirs = [];
	if (args[1]) {
		const specifiedDir = args[1];
		if (!existsSync(specifiedDir)) {
			console.error(`Cases directory not found: ${specifiedDir}`);
			process.exit(1);
		}
		// Check if it has discipline subdirectories
		const subdirs = readdirSync(specifiedDir).filter(d => {
			try { return statSync(join(specifiedDir, d)).isDirectory(); } catch { return false; }
		});
		if (subdirs.length > 0) {
			casesDirs = subdirs.map(d => join(specifiedDir, d));
		} else {
			casesDirs = [specifiedDir];
		}
	} else {
		// Default: scan all discipline directories under tasks/benchmark/cases
		const defaultCasesDir = join(process.cwd(), 'tasks', 'benchmark', 'cases');
		if (existsSync(defaultCasesDir)) {
			casesDirs = readdirSync(defaultCasesDir)
				.filter(d => {
					try { return statSync(join(defaultCasesDir, d)).isDirectory(); } catch { return false; }
				})
				.map(d => join(defaultCasesDir, d));
		}
	}

	if (casesDirs.length === 0) {
		console.error('No benchmark case directories found.');
		console.error('Run from repo root or specify cases-dir explicitly.');
		process.exit(1);
	}

	if (!existsSync(resultsDir)) {
		console.error(`Results directory not found: ${resultsDir}`);
		process.exit(1);
	}

	console.log(`\nBenchmark Results — ${new Date().toISOString().split('T')[0]}`);
	console.log('='.repeat(60));

	const allResults = [];
	const disciplineStats = new Map();

	for (const casesDir of casesDirs) {
		const disciplineName = basename(casesDir);
		const caseFiles = readdirSync(casesDir)
			.filter(f => f.endsWith('.md'))
			.sort();

		if (caseFiles.length === 0) continue;

		console.log(`\n  ${disciplineName} (${caseFiles.length} cases):`);
		console.log('  ' + '-'.repeat(56));

		const disciplineResults = [];
		for (const caseFile of caseFiles) {
			const fullPath = join(casesDir, caseFile);
			const result = scoreCase(fullPath, resultsDir);
			if (result) {
				disciplineResults.push(result);
				allResults.push(result);
			}
		}

		// Per-discipline summary
		if (disciplineResults.length > 0) {
			const dCorrect = disciplineResults.filter(r => r.correct).length;
			const dFalseApprovals = disciplineResults.filter(r => r.falseApproval).length;
			const dAvgChecks = disciplineResults.reduce((s, r) => s + r.machineVerdict.checksPassed, 0) / disciplineResults.length;
			console.log(`    Correct: ${dCorrect}/${disciplineResults.length} | False approvals: ${dFalseApprovals} | Avg checks: ${dAvgChecks.toFixed(1)}/8`);
			disciplineStats.set(disciplineName, { total: disciplineResults.length, correct: dCorrect, falseApprovals: dFalseApprovals });
		}

		// Per-case results
		for (const r of disciplineResults) {
			const status = r.correct ? '✓ CORRECT' : r.falseApproval ? '✗ FALSE APPROVAL' : r.falseBlock ? '✗ FALSE BLOCK' : '✗ WRONG VERDICT';
			const detail = `expected=${r.groundTruth.verdict} got=${r.machineVerdict.verdict}`;
			const flaw = r.groundTruth.verdict !== 'PASS' ? ` flaw=${r.machineVerdict.flaw}` : '';
			const confidence = ` conf=${r.machineVerdict.confidence.toFixed(2)}`;
			const checks = ` checks=${r.machineVerdict.checksPassed}/8`;
			const linePinned = ` pinned=${r.machineVerdict.linePinnedNum}/${r.machineVerdict.linePinnedDen}`;
			console.log(`    ${r.caseName}: ${status} (${detail}${flaw}${confidence}${checks}${linePinned})`);
		}
	}

	if (allResults.length === 0) {
		console.error('\nNo results to score.');
		process.exit(1);
	}

	// Overall summary statistics
	const total = allResults.length;
	const correct = allResults.filter(r => r.correct).length;
	const falseApprovals = allResults.filter(r => r.falseApproval).length;
	const falseBlocks = allResults.filter(r => r.falseBlock).length;
	const conservativeOvercalls = allResults.filter(r => r.conservativeOvercall).length;
	const avgConfidence = allResults.reduce((sum, r) => sum + r.machineVerdict.confidence, 0) / total;
	const avgChecksPassed = allResults.reduce((sum, r) => sum + r.machineVerdict.checksPassed, 0) / total;
	const totalLinePinned = allResults.reduce((sum, r) => sum + r.machineVerdict.linePinnedNum, 0);
	const totalFindings = allResults.reduce((sum, r) => sum + r.machineVerdict.linePinnedDen, 0);

	// Entailment tracking
	const entailmentCases = allResults.filter(r => r.groundTruth.flaw === 'entailment_failure');
	const entailmentCorrect = entailmentCases.filter(r => r.correct).length;

	console.log('\nOverall Summary:');
	console.log('='.repeat(60));
	console.log(`  Cases scored:        ${total}`);
	console.log(`  Correct verdicts:    ${correct}/${total} (${(correct/total*100).toFixed(1)}%)`);
	console.log(`  False approvals:     ${falseApprovals}/${total} (${(falseApprovals/total*100).toFixed(1)}%)`);
	console.log(`  False blocks:        ${falseBlocks}/${total} (${(falseBlocks/total*100).toFixed(1)}%)`);
	console.log(`  Conservative over:   ${conservativeOvercalls}/${total}`);
	console.log(`  Avg confidence:      ${avgConfidence.toFixed(2)}`);
	console.log(`  Avg checks passed:   ${avgChecksPassed.toFixed(1)}/8`);
	console.log(`  Line-pinned ratio:   ${totalLinePinned}/${totalFindings}`);

	if (entailmentCases.length > 0) {
		console.log(`\n  Entailment check (8th): ${entailmentCorrect}/${entailmentCases.length} correct`);
	}

	console.log('\nPer-Discipline Breakdown:');
	console.log('-'.repeat(60));
	for (const [name, stats] of disciplineStats) {
		console.log(`  ${name.padEnd(15)} ${stats.correct}/${stats.total} correct, ${stats.falseApprovals} false approvals`);
	}

	// Exit with error if any false approvals
	process.exit(falseApprovals > 0 ? 1 : 0);
}

import { dirname } from 'node:path';
main();
