import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import { validateFixedCase, validateRunManifest } from "../../scripts/fixed-case.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const suitePath = join(repoRoot, "evals", "cases", "local-evidence-suite.json");
const suiteBytes = readFileSync(suitePath);
const suite = JSON.parse(suiteBytes);
const suiteSha256 = createHash("sha256").update(suiteBytes).digest("hex");

const caseReport = validateFixedCase(suite, { repoRoot });
assert.equal(caseReport.valid, true, caseReport.errors.join("\n"));
assert.equal(caseReport.caseCount, 3);
assert.deepEqual(caseReport.caseIds, ["supported-evidence", "unavailable-source", "conflicting-evidence"]);

const unsafeSuite = structuredClone(suite);
unsafeSuite.cases[0].sources[0].path = "evals/fixtures/c1/supported-evidence/../supported-evidence/requirement.md";
assert.match(
  validateFixedCase(unsafeSuite, { repoRoot }).errors.join("\n"),
  /path must be a regular file|path.*safe/i,
);
const hashMismatchSuite = structuredClone(suite);
hashMismatchSuite.cases[0].fixture_tree_sha256 = "0".repeat(64);
assert.match(
  validateFixedCase(hashMismatchSuite, { repoRoot }).errors.join("\n"),
  /fixture_tree_sha256 does not match/i,
);

const artifactRoot = mkdtempSync(join(tmpdir(), "vitruvius-c1-"));
try {
  const runs = suite.cases.map((fixedCase, index) => {
    const runId = `run-${index + 1}`;
    const runDir = join(artifactRoot, fixedCase.id);
    mkdirSync(runDir);
    const finalPath = join(runDir, fixedCase.required_outputs.final);
    const provenancePath = join(runDir, fixedCase.required_outputs.provenance);
    const sourceList = fixedCase.sources.map((source) => `- ${source.id}: ${source.path}`).join("\n");
    writeFileSync(finalPath, `# ${fixedCase.id}\n\nResearch status: ${fixedCase.expected_status}\n## Sources\n${sourceList}\n`);
    writeFileSync(provenancePath, `# Provenance\n\n- Date: 2026-09-25\n- Sources consulted:\n${sourceList}\n- Sources accepted: local fixtures\n- Verification: ${fixedCase.expected_status}\n- verified: 1\n- partial: 0\n- blocked: 0\n- unverified: 0\n- inferred: 0\n- failed: 0\n- Plan: none\n`);
    const finalBytes = readFileSync(finalPath);
    const provenanceBytes = readFileSync(provenancePath);
    return {
      case_id: fixedCase.id,
      run_id: runId,
      agent: "general",
      fresh: true,
      session_id: `test-session-${index + 1}`,
      model: "test-model",
      cost_usd: null,
      cost_status: "unavailable",
      research_status: fixedCase.expected_status,
      final: {
        path: `${fixedCase.id}/${fixedCase.required_outputs.final}`,
        sha256: createHash("sha256").update(finalBytes).digest("hex"),
        bytes: finalBytes.length,
      },
      provenance: {
        path: `${fixedCase.id}/${fixedCase.required_outputs.provenance}`,
        sha256: createHash("sha256").update(provenanceBytes).digest("hex"),
        bytes: provenanceBytes.length,
      },
      grade: {
        status: "PASS",
        expectations: fixedCase.expectations.map((expectation) => ({
          id: expectation.id,
          passed: true,
          evidence: "observed in the fixture",
        })),
      },
    };
  });

  const manifest = {
    schema: "vitruvius-c1-results.v1",
    suite_id: suite.id,
    suite_path: "evals/cases/local-evidence-suite.json",
    suite_sha256: suiteSha256,
    suite_bytes: suiteBytes.length,
    reviewer_agent: "reviewer",
    reviewer_session_id: "test-reviewer-session",
    runs,
    summary: {
      cases: suite.cases.length,
      passed: suite.cases.length,
      failed: 0,
      review_status: "PASS",
      cost_status: "unavailable",
    },
  };
  const valid = validateRunManifest(manifest, { repoRoot, artifactRoot, casePath: suitePath });
  assert.equal(valid.valid, true, valid.errors.join("\n"));

  const missingGrade = structuredClone(manifest);
  missingGrade.runs[0].grade.expectations.pop();
  assert.match(
    validateRunManifest(missingGrade, { repoRoot, artifactRoot, casePath: suitePath }).errors.join("\n"),
    /expectation grading incomplete/i,
  );

  const badHash = structuredClone(manifest);
  badHash.runs[0].final.sha256 = "0".repeat(64);
  assert.match(
    validateRunManifest(badHash, { repoRoot, artifactRoot, casePath: suitePath }).errors.join("\n"),
    /hash mismatch/i,
  );

  const missingCase = structuredClone(manifest);
  missingCase.runs.pop();
  assert.match(
    validateRunManifest(missingCase, { repoRoot, artifactRoot, casePath: suitePath }).errors.join("\n"),
    /one result for each suite case/i,
  );

  const wrongOutput = structuredClone(manifest);
  wrongOutput.runs[0].final.path = "supported-evidence/supported-evidence.provenance.md";
  assert.match(
    validateRunManifest(wrongOutput, { repoRoot, artifactRoot, casePath: suitePath }).errors.join("\n"),
    /final must use required output name|hash mismatch/i,
  );

  const sharedDirectory = structuredClone(manifest);
  sharedDirectory.runs[0].final.path = "shared/supported-evidence.md";
  assert.match(
    validateRunManifest(sharedDirectory, { repoRoot, artifactRoot, casePath: suitePath }).errors.join("\n"),
    /isolated under runs|file does not exist|confined regular file/i,
  );

  const duplicateSession = structuredClone(manifest);
  duplicateSession.runs[1].session_id = duplicateSession.runs[0].session_id;
  assert.match(
    validateRunManifest(duplicateSession, { repoRoot, artifactRoot, casePath: suitePath }).errors.join("\n"),
    /duplicate subagent session_id|distinct fresh subagent session/i,
  );

  const falsePass = structuredClone(manifest);
  falsePass.runs[0].grade.expectations[0].passed = false;
  assert.match(
    validateRunManifest(falsePass, { repoRoot, artifactRoot, casePath: suitePath }).errors.join("\n"),
    /PASS grade requires every expectation to pass/i,
  );

  const missingReviewer = structuredClone(manifest);
  delete missingReviewer.reviewer_session_id;
  assert.match(
    validateRunManifest(missingReviewer, { repoRoot, artifactRoot, casePath: suitePath }).errors.join("\n"),
    /independent reviewer agent and session/i,
  );

  const summaryMismatch = structuredClone(manifest);
  summaryMismatch.summary.review_status = "BLOCKED";
  assert.match(
    validateRunManifest(summaryMismatch, { repoRoot, artifactRoot, casePath: suitePath }).errors.join("\n"),
    /summary\.review_status must be PASS/i,
  );

  const statusPath = join(artifactRoot, "supported-evidence", "supported-evidence.md");
  const statusText = `${readFileSync(statusPath, "utf8")}\nResearch status: verified / partial\n`;
  writeFileSync(statusPath, statusText);
  const statusManifest = structuredClone(manifest);
  const statusBytes = readFileSync(statusPath);
  statusManifest.runs[0].final.sha256 = createHash("sha256").update(statusBytes).digest("hex");
  statusManifest.runs[0].final.bytes = statusBytes.length;
  assert.match(
    validateRunManifest(statusManifest, { repoRoot, artifactRoot, casePath: suitePath }).errors.join("\n"),
    /status lines must consistently state verified/i,
  );

  const retainedManifest = JSON.parse(readFileSync(join(repoRoot, "evals", "results", "manifest.json"), "utf8"));
  const retained = validateRunManifest(retainedManifest, {
    repoRoot,
    artifactRoot: join(repoRoot, "evals", "results"),
    casePath: join(repoRoot, "evals", "cases", "local-evidence-suite.json"),
  });
  assert.equal(retained.valid, true, retained.errors.join("\\n"));
} finally {
  rmSync(artifactRoot, { recursive: true, force: true });
}

console.log("PASS: C1 fixed-case suite validates isolated run evidence and refuses incomplete records");
