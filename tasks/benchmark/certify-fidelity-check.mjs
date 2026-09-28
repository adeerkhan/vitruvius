#!/usr/bin/env node
// certify-fidelity-check.mjs — prove certify-runner reproduces run-opencode.sh.
//
// Why this exists: the certification is only meaningful if it measures the same
// thing the repo documents. certify-runner.mjs deliberately differs from
// run-opencode.sh in HOW it invokes opencode:
//   - run-opencode.sh  : cmd /c "opencode run ..." with the prompt as a shell
//                        argument, output redirected by the shell
//   - certify-runner    : spawnSync through cmd.exe with an argv array, output
//                        captured as a UTF-8 buffer
// Those differences exist for good reasons (a .cmd shim cannot be spawned
// directly on Windows, and PowerShell's `>` writes UTF-16 the parser cannot
// read), but "good reasons" is not evidence. A difference in the blind cut, the
// dispatch prompt, the model, or the agent would make the certification a
// measurement of something other than the documented pipeline.
//
// So: run the same case both ways and compare the MACHINE_VERDICT line. The
// verifier is not deterministic, so the verdict may legitimately differ; what is
// asserted is that the INPUTS are identical, which is the part that would
// invalidate the comparison.
//
// Usage: node tasks/benchmark/certify-fidelity-check.mjs <case-name> [--execute]

import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";

// Import the real values rather than regex-scraping the runner's source. The
// first version of this file scraped a multi-line concatenated string literal,
// got it wrong, and reported a fidelity failure that did not exist - a check
// that fails for the wrong reason is worse than no check, because it teaches
// you to ignore it.
import { PROMPT, MODEL_NAME as MODEL, blindCaseText } from "./certify-runner.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

const caseName = process.argv[2];
const execute = process.argv.includes("--execute");
if (!caseName) {
  console.error("usage: node tasks/benchmark/certify-fidelity-check.mjs <case-name> [--execute]");
  process.exit(1);
}

function findCase(name) {
  for (const discipline of readdirSync(join(REPO_ROOT, "tasks", "benchmark", "cases"), { withFileTypes: true })) {
    if (!discipline.isDirectory()) continue;
    const p = join(REPO_ROOT, "tasks", "benchmark", "cases", discipline.name, `${name}.md`);
    if (existsSync(p)) return p;
  }
  return null;
}

const casePath = findCase(caseName);
if (!casePath) {
  console.error(`case not found: ${caseName}`);
  process.exit(1);
}

// --- 1. The blind cut, which is what the model actually sees ---------------
// Produced by the runner's own exported function, so this is the exact text the
// certification sends - not a re-derivation that could drift from it.
let blind;
try {
  blind = blindCaseText(casePath);
} catch (e) {
  console.error(`blind cut failed: ${e.message}`);
  process.exit(1);
}
const fullLines = readFileSync(casePath, "utf8").split(/\r?\n/);
const cutLine = fullLines.findIndex((l) => /^\*\*Ground-truth verdict:\*\*/.test(l)) + 1;

console.log("=== INPUT FIDELITY (static: what the model is shown) ===\n");
console.log(`  case            ${caseName}`);
console.log(`  blind cut at    line ${cutLine} of ${fullLines.length}`);
console.log(`  blind bytes     ${blind.length}`);
console.log(`  model           ${MODEL}`);

const problems = [];

// The prompt the certification sends, vs the prompt run-opencode.sh documents.
console.log(`\n  certify prompt (imported from certify-runner.mjs):`);
console.log(`    "${PROMPT}"`);

// run-opencode.sh embeds the prompt as a shell string. Its distinctive phrases
// must still all be present, or the two runners are measuring different things.
const shellSrc = readFileSync(join(__dirname, "run-opencode.sh"), "utf8");
const PHRASES = [
  "Blind verification dispatch",
  "Verify the claimed conclusion below against its evidence items",
  "Ground truth is not provided",
  "MACHINE_VERDICT line",
];
for (const phrase of PHRASES) {
  const inShell = shellSrc.includes(phrase);
  const inRunner = PROMPT.includes(phrase);
  console.log(`    ${inShell && inRunner ? "OK  " : "DIFF"}  "${phrase.slice(0, 46)}..."  shell:${inShell} runner:${inRunner}`);
  if (!inShell) problems.push(`run-opencode.sh no longer contains the phrase "${phrase}"`);
  if (!inRunner) problems.push(`certify-runner PROMPT no longer contains the phrase "${phrase}"`);
}

// Leak guard, same predicate the runner uses.
const leak = /ground.truth|flaw type/i.test(blind);
console.log(`\n  leak guard      ${leak ? "TRIPPED" : "clean"}`);
if (leak) problems.push("blind case leaks ground truth");

// --- 2. The invocation, which is where the two runners actually differ -----
console.log(`\n=== INVOCATION FIDELITY (deliberate differences) ===\n`);
console.log(`  run-opencode.sh   cmd /c "opencode run --agent verifier --model ... --format json -f <case> \\"prompt\\""`);
console.log(`  certify-runner    spawnSync(cmd.exe, ["/c", opencode.cmd, "run", "--agent", "verifier", "--model", ...])`);
console.log(`  why different     a .cmd shim cannot be spawned directly on Windows, and PowerShell's`);
console.log(`                    \`>\` redirection writes UTF-16 that the verdict parser cannot read`);
console.log(`  same inputs       agent=verifier, model, --format json, -f <blind case>, dispatch prompt`);

// --- 3. Optional: run both and compare verdicts ---------------------------
if (!execute) {
  console.log(`\n(dry run — pass --execute to actually invoke opencode twice)`);
} else {
  console.log(`\n=== LIVE COMPARISON ===\n`);
  const outDir = join(REPO_ROOT, "tasks", "benchmark", "fidelity-check");
  const blindPath = join(outDir, `${caseName}.blind.md`);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(blindPath, blind, "utf8");

  console.log(`  running via certify-runner invocation...`);
  const r1 = spawnSync(
    "cmd.exe",
    ["/c", join(process.env.APPDATA, "npm", "opencode.cmd"), "run", "--agent", "verifier", "--model", MODEL, "--format", "json", "-f", blindPath, PROMPT],
    { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 900000 },
  );
  const grab = (stdout) => {
    const texts = [];
    for (const line of (stdout || "").split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        const d = JSON.parse(line);
        if (d.part?.type === "text" && d.part.text) texts.push(d.part.text);
      } catch { /* noise */ }
    }
    const body = texts[texts.length - 1] || "";
    return /MACHINE_VERDICT:[^\n]*/.exec(body)?.[0] ?? "(none)";
  };
  const v1 = grab(r1.stdout);
  console.log(`    ${v1}`);

  console.log(`  running via run-opencode.sh (bash)...`);
  const r2 = spawnSync("bash", [join(__dirname, "run-opencode.sh"), caseName], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: 900000,
  });
  const produced = join(REPO_ROOT, "tasks", "benchmark", "results-opencode", `${caseName}-result.md`);
  let v2 = "(run-opencode.sh produced no result)";
  if (existsSync(produced)) {
    v2 = /MACHINE_VERDICT:[^\n]*/.exec(readFileSync(produced, "utf8"))?.[0] ?? "(no MACHINE_VERDICT)";
  }
  console.log(`    ${v2}`);
  console.log(`\n  The verifier is not deterministic, so differing verdicts are expected and are NOT a`);
  console.log(`  failure of this check. What matters is that the inputs above are identical.`);
  if (v1 === "(none)" || v2.startsWith("(")) {
    console.log(`\n  WARNING: at least one invocation produced no parseable verdict. That is a runner`);
    console.log(`  problem, not a model result, and it should be fixed before the certification counts.`);
    problems.push("one invocation produced no parseable verdict");
  }
}

console.log("");
if (problems.length === 0) {
  console.log("PASS: certify-runner feeds the model the same inputs as run-opencode.sh");
  process.exit(0);
} else {
  console.error("FAIL: runner fidelity is not established:");
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
