import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { scoreMajority } from "../../scripts/benchmark-scoring.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CLI = join(root, "scripts", "majority-benchmark.mjs");
const temp = mkdtempSync(join(tmpdir(), "vitruvius-majority-"));
const casesDir = join(temp, "cases");

function writeCase(name, verdict, flaw) {
  const path = join(casesDir, `${name}.md`);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, `# Case ${name}\n\n**Ground-truth verdict:** ${verdict}\n**Flaw type:** ${flaw}\n`);
}

function writeResult(runDir, name, verdict, flaw) {
  const path = join(runDir, `${name}-result.md`);
  mkdirSync(join(path, ".."), { recursive: true });
  const checks = verdict === "PASS" ? "8/8" : "4/8";
  writeFileSync(path, `## Verdict: ${verdict}\n\nMACHINE_VERDICT: ${verdict} | FLAW: ${flaw} | CONFIDENCE: 0.9 | CHECKS_PASSED: ${checks} | LINE_PINNED: 3/3\n`);
}

try {
  writeCase("a-unanimous", "PASS", "none");
  writeCase("b-majority", "PARTIAL", "omission");
  writeCase("c-split", "BLOCKED", "omission");
  writeCase("d-false-approval", "BLOCKED", "omission");

  const runs = [join(temp, "run1"), join(temp, "run2"), join(temp, "run3")];
  const plan = {
    "a-unanimous": ["PASS", "PASS", "PASS"],
    "b-majority": ["PARTIAL", "PARTIAL", "BLOCKED"],
    "c-split": ["PASS", "BLOCKED", "PARTIAL"],
    "d-false-approval": ["PASS", "PASS", "BLOCKED"],
  };
  const flawFor = { PASS: "none", PARTIAL: "omission", BLOCKED: "omission" };
  for (const [name, verdicts] of Object.entries(plan)) {
    verdicts.forEach((verdict, index) => writeResult(runs[index], name, verdict, flawFor[verdict]));
  }

  const report = scoreMajority({ casesDir, runDirs: runs });
  assert.deepEqual(report.errors, []);
  assert.equal(report.summary.cases, 4);
  assert.equal(report.summary.unanimous, 1);
  assert.equal(report.summary.majorityOnly, 2);
  assert.equal(report.summary.split, 1);
  assert.equal(report.summary.majorityCorrect, 2);
  assert.equal(report.summary.majorityFalseApprovals, 1);
  assert.equal(report.summary.majorityFalseBlocks, 0);
  assert.equal(report.summary.perRun[0].falseApprovals, 2);
  assert.equal(report.summary.perRun[2].correct, 2);
  assert.equal(report.cases.find((item) => item.caseName === "c-split").status, "SPLIT");

  // CLI --json round-trips; --strict-quality fails on the majority false approval.
  const json = spawnSync(process.execPath, [CLI, ...runs, "--cases", casesDir, "--json"], { encoding: "utf8" });
  assert.equal(json.status, 0, json.stderr);
  assert.equal(JSON.parse(json.stdout).summary.majorityFalseApprovals, 1);
  const strict = spawnSync(process.execPath, [CLI, ...runs, "--cases", casesDir, "--strict-quality"], { encoding: "utf8" });
  assert.equal(strict.status, 1);
  assert.match(strict.stderr, /Strict majority gate failed/);

  // A run missing a case is an integrity error, not a silent majority.
  const broken = join(temp, "run-broken");
  for (const name of Object.keys(plan)) writeResult(broken, name, "PASS", "none");
  rmSync(join(broken, "a-unanimous-result.md"), { force: true });
  const brokenReport = scoreMajority({ casesDir, runDirs: [runs[0], broken] });
  assert.ok(
    brokenReport.errors.some((error) => /MISSING RESULT|a-unanimous/.test(error)),
    brokenReport.errors.join("\n"),
  );

  console.log("PASS: majority benchmark aggregates runs, reports variance, and gates false approvals");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
