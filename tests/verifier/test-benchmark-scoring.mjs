import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { scoreBenchmark } from "../../scripts/benchmark-scoring.mjs";

function makeCase(name, verdict, flaw = "none") {
  return `# ${name}\n\n## Research Question\n\nDoes the claim follow?\n\n## Evidence Items\n\n- E1: stated fixture evidence\n\n## Claimed Conclusion\n\nThe fixture conclusion follows.\n\n**Ground-truth verdict:** ${verdict}\n**Flaw type:** ${flaw}\n`;
}

function makeResult(verdict, flaw = "none") {
  return `MACHINE_VERDICT: ${verdict} | FLAW: ${flaw} | CONFIDENCE: 0.90 | CHECKS_PASSED: 8/8 | LINE_PINNED: 1/1\n`;
}

const tempRoots = [];

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "vitruvius-benchmark-"));
  tempRoots.push(root);
  const casesDir = join(root, "cases", "software");
  const resultsDir = join(root, "results");
  mkdirSync(casesDir, { recursive: true });
  mkdirSync(resultsDir, { recursive: true });
  return { root, casesDir, resultsDir };
}

{
  const { casesDir, resultsDir } = fixture();
  writeFileSync(join(casesDir, "pass-01.md"), makeCase("pass-01", "PASS"));
  writeFileSync(join(resultsDir, "pass-01-result.md"), makeResult("PASS"));

  const report = scoreBenchmark({ casesDir: join(casesDir, ".."), resultsDir });
  assert.equal(report.errors.length, 0);
  assert.equal(report.summary.total, 1);
  assert.equal(report.summary.scored, 1);
  assert.equal(report.summary.correct, 1);
  assert.equal(report.summary.falseApprovals, 0);
  assert.equal(report.summary.falseBlocks, 0);
}

{
  const { casesDir, resultsDir } = fixture();
  writeFileSync(join(casesDir, "partial-01.md"), makeCase("partial-01", "PARTIAL", "omission"));
  writeFileSync(join(resultsDir, "partial-01-result.md"), makeResult("PASS"));

  const report = scoreBenchmark({ casesDir: join(casesDir, ".."), resultsDir });
  assert.equal(report.errors.length, 0);
  assert.equal(report.summary.falseApprovals, 1);
  assert.equal(report.results[0].status, "FALSE APPROVAL");
}

{
  const { casesDir, resultsDir } = fixture();
  writeFileSync(join(casesDir, "pass-01.md"), makeCase("pass-01", "PASS"));
  writeFileSync(join(resultsDir, "pass-01-result.md"), makeResult("BLOCKED", "omission"));

  const report = scoreBenchmark({ casesDir: join(casesDir, ".."), resultsDir });
  assert.equal(report.errors.length, 0);
  assert.equal(report.summary.falseBlocks, 1);
  assert.equal(report.results[0].status, "FALSE BLOCK");
}

{
  const { casesDir, resultsDir } = fixture();
  writeFileSync(join(casesDir, "partial-01.md"), makeCase("partial-01", "PARTIAL", "omission"));
  writeFileSync(join(resultsDir, "partial-01-result.md"), makeResult("BLOCKED", "omission"));

  const report = scoreBenchmark({ casesDir: join(casesDir, ".."), resultsDir });
  assert.equal(report.errors.length, 0);
  assert.equal(report.summary.conservativeOvercalls, 1);
  assert.equal(report.results[0].status, "CONSERVATIVE OVERCALL");
}

{
  const { casesDir, resultsDir } = fixture();
  writeFileSync(join(casesDir, "missing-01.md"), makeCase("missing-01", "PASS"));

  const report = scoreBenchmark({ casesDir: join(casesDir, ".."), resultsDir });
  assert.equal(report.summary.scored, 0);
  assert.match(report.errors.join("\n"), /MISSING.*missing-01-result\.md/);
}

{
  const { casesDir, resultsDir } = fixture();
  writeFileSync(join(casesDir, "duplicate-01.md"), makeCase("duplicate-01", "PASS"));
  writeFileSync(
    join(resultsDir, "duplicate-01-result.md"),
    `${makeResult("PASS")}${makeResult("PASS")}`,
  );

  const report = scoreBenchmark({ casesDir: join(casesDir, ".."), resultsDir });
  assert.match(report.errors.join("\n"), /DUPLICATE.*duplicate-01/);
  assert.equal(report.summary.scored, 0);
}

{
  const { casesDir, resultsDir } = fixture();
  writeFileSync(join(casesDir, "pass-01.md"), makeCase("pass-01", "PASS"));
  writeFileSync(join(resultsDir, "unknown-01-result.md"), makeResult("PASS"));

  const report = scoreBenchmark({ casesDir: join(casesDir, ".."), resultsDir });
  assert.match(report.errors.join("\n"), /MISSING.*pass-01-result\.md/);
  assert.match(report.errors.join("\n"), /UNKNOWN.*unknown-01-result\.md/);
}

{
  const { casesDir, resultsDir } = fixture();
  const parentCasesDir = join(casesDir, "..");
  writeFileSync(join(casesDir, "one.md"), makeCase("one", "PASS"));
  writeFileSync(join(casesDir, "two.md"), makeCase("two", "PASS"));
  writeFileSync(join(resultsDir, "one-result.md"), makeResult("PASS"));

  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const cli = join(repoRoot, "scripts", "score-benchmark.mjs");
  const result = spawnSync(process.execPath, [cli, resultsDir, parentCasesDir], {
    encoding: "utf-8",
  });
  assert.notEqual(result.status, 0, "CLI must fail when one expected result is missing");
  assert.match(`${result.stdout}\n${result.stderr}`, /MISSING.*two-result\.md/);
}

{
  const { casesDir, resultsDir } = fixture();
  writeFileSync(join(casesDir, "malformed-01.md"), makeCase("malformed-01", "PASS"));
  writeFileSync(
    join(resultsDir, "malformed-01-result.md"),
    "MACHINE_VERDICT: PASS | FLAW: none | CONFIDENCE: 9.5 | CHECKS_PASSED: 99/8 | LINE_PINNED: 9/1 trailing garbage\n",
  );

  const report = scoreBenchmark({ casesDir: join(casesDir, ".."), resultsDir });
  assert.match(report.errors.join("\\n"), /MALFORMED VERDICT: malformed-01/);
  assert.equal(report.summary.scored, 0);
}

for (const root of tempRoots) rmSync(root, { recursive: true, force: true });
{
  const { casesDir, resultsDir } = fixture();
  const casePath = join(casesDir, "token-01.md");
  writeFileSync(casePath, makeCase("token-01", "PASS").replace("**Ground-truth verdict:** PASS", "**Ground-truth verdict:** PASSING"));
  writeFileSync(join(resultsDir, "token-01-result.md"), makeResult("PASS"));

  const report = scoreBenchmark({ casesDir: join(casesDir, ".."), resultsDir });
  assert.match(report.errors.join("\\n"), /INVALID GROUND TRUTH: token-01/);
}

{
  const { casesDir, resultsDir } = fixture();
  writeFileSync(join(casesDir, "decorated-01.md"), makeCase("decorated-01", "PASS"));
  writeFileSync(
    join(resultsDir, "decorated-01-result.md"),
    `prefix ${makeResult("PASS")}`,
  );

  const report = scoreBenchmark({ casesDir: join(casesDir, ".."), resultsDir });
  assert.match(report.errors.join("\\n"), /MALFORMED VERDICT: decorated-01/);
}

{
  const { casesDir, resultsDir } = fixture();
  writeFileSync(join(casesDir, "semantic-01.md"), makeCase("semantic-01", "PASS"));
  writeFileSync(
    join(resultsDir, "semantic-01-result.md"),
    "MACHINE_VERDICT: PASS | FLAW: omission | CONFIDENCE: 0.10 | CHECKS_PASSED: 0/8 | LINE_PINNED: 0/1\n",
  );

  const report = scoreBenchmark({ casesDir: join(casesDir, ".."), resultsDir });
  assert.match(report.errors.join("\\n"), /MALFORMED VERDICT: semantic-01/);
}

for (const root of tempRoots) rmSync(root, { recursive: true, force: true });
console.log("PASS: benchmark scoring classification and integrity contracts");
