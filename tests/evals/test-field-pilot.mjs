import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validateFieldPilot } from "../../scripts/field-pilot-contract.mjs";

const root = mkdtempSync(join(tmpdir(), "vitruvius-field-pilot-"));

function write(relativePath, text) {
  const path = join(root, relativePath);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, text);
  return path;
}

function artifact(relativePath) {
  const bytes = readFileSync(join(root, relativePath));
  return { path: relativePath, sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length };
}

function provenance(goalLine) {
  const final = artifact("final.md");
  return `# Provenance\n\n- **Final artifact:** \`final.md\`\n- **Final SHA-256:** \`${final.sha256}\`\n- **Final bytes:** ${final.bytes}\n- **GOAL-CHECK:** ${goalLine}\n`;
}

function validPilot() {
  const finalText = "# Final\n\nThe requested brief is delivered.\nThe requested answer is delivered.\n";
  write("plan.md", "# Plan\n\nAnswer the request.\n");
  write("final.md", finalText);
  write("final.provenance.md", provenance("E2E: scope=pass prompt=pass flaws=0 ran=Opened final artifact and checked the requested answer"));
  write("source.md", "# Source\n\nA primary source snapshot.\n");
  write("verifier.md", "# Verification\n\n## Verdict: PASS\n\nMACHINE_VERDICT: PASS | FLAW: none | CONFIDENCE: 0.9 | CHECKS_PASSED: 8/8 | LINE_PINNED: 1/1\n\n## Evidence Trail (Line-Pinned)\n| Claim | Evidence |\n");
  const question = "What does the source support?";
  const requirements = [{ id: "A1", text: "Answer the request" }];
  write("goal-requirements.json", `${JSON.stringify({ schema: "vitruvius-goal-requirements.v1", question_sha256: createHash("sha256").update(question).digest("hex"), requirements, scope: [{ id: "S1", text: "Deliver the requested brief" }] }, null, 2)}\n`);
  const goal = {
    schema: "vitruvius-goal-check.v1",
    question,
    requirements,
    requirements_manifest: artifact("goal-requirements.json"),
    final: artifact("final.md"),
    provenance_path: "final.provenance.md",
    plan_path: "plan.md",
    scope: [{ id: "S1", item: "Deliver the requested brief", status: "pass", evidence: "The requested brief is delivered." }],
    prompt: [{ id: "A1", item: "Answer the request", status: "pass", evidence: "The requested answer is delivered." }],
    findings: [],
    ran: "Opened final artifact and checked the requested answer",
    verdict: "DONE",
    report: "## Goal Check: DONE\n\nE2E: scope=pass prompt=pass flaws=0 ran=Opened final artifact and checked the requested answer\n",
  };
  write("goal-check.json", `${JSON.stringify(goal, null, 2)}\n`);
  return {
    schema: "vitruvius-field-pilot.v1",
    pilot_id: "v1-contract-fixture",
    question: "What does the source support?",
    observed_on: "2026-09-25",
    host: "test-host",
    model: "test-model",
    session_id: "test-session",
    sources: [{ id: "SRC-001", kind: "synthetic", locator: "source.md", status: "read", accessed_on: "2026-09-25", artifact: artifact("source.md"), blocked_reason: null, unblock_path: null }],
    plan: artifact("plan.md"),
    final: artifact("final.md"),
    provenance: artifact("final.provenance.md"),
    verifier: artifact("verifier.md"),
    goal_check: artifact("goal-check.json"),
    metrics: { wall_time_minutes: 1, wall_time_status: "available", cost_usd: null, cost_status: "unavailable", user_corrections: 0, decision_outcome: "unknown", notes: "Synthetic contract fixture; not a research result." },
    completion: "complete",
  };
}

try {
  const valid = validateFieldPilot(validPilot(), { repoRoot: root });
  assert.equal(valid.valid, true, valid.errors.join("\n"));
  assert.equal(valid.sourceCount, 1);

  const missingId = validPilot();
  delete missingId.pilot_id;
  const missingIdReport = validateFieldPilot(missingId, { repoRoot: root });
  assert.equal(missingIdReport.valid, false);
  assert.match(missingIdReport.errors.join("\n"), /pilot_id must be a lowercase hyphenated slug/i);

  const missingSource = validPilot();
  missingSource.sources[0].artifact = null;
  const missingReport = validateFieldPilot(missingSource, { repoRoot: root });
  assert.equal(missingReport.valid, false);
  assert.match(missingReport.errors.join("\n"), /read source.*artifact/i);

  const blockedButComplete = validPilot();
  blockedButComplete.sources[0] = { ...blockedButComplete.sources[0], status: "blocked", artifact: null, blocked_reason: "The source was not accessible.", unblock_path: "Request access from the publisher." };
  const blockedReport = validateFieldPilot(blockedButComplete, { repoRoot: root });
  assert.equal(blockedReport.valid, false);
  assert.match(blockedReport.errors.join("\n"), /complete.*blocked source/i);

  const staleFinal = validPilot();
  staleFinal.final.sha256 = "0".repeat(64);
  const staleReport = validateFieldPilot(staleFinal, { repoRoot: root });
  assert.equal(staleReport.valid, false);
  assert.match(staleReport.errors.join("\n"), /final.*hash mismatch/i);

  const badCost = validPilot();
  badCost.metrics.cost_status = "available";
  const costReport = validateFieldPilot(badCost, { repoRoot: root });
  assert.equal(costReport.valid, false);
  assert.match(costReport.errors.join("\n"), /cost_usd null.*unavailable/i);

  const impossibleDate = validPilot();
  impossibleDate.sources[0].accessed_on = "2026-02-30";
  const dateReport = validateFieldPilot(impossibleDate, { repoRoot: root });
  assert.equal(dateReport.valid, false);
  assert.match(dateReport.errors.join("\n"), /real ISO date/i);

  const badGoal = validPilot();
  const goalPath = join(root, "goal-check.json");
  const goal = JSON.parse(readFileSync(goalPath, "utf8"));
  goal.verdict = "NOT-DONE";
  write("goal-check.json", `${JSON.stringify(goal, null, 2)}\n`);
  badGoal.goal_check = artifact("goal-check.json");
  const goalReport = validateFieldPilot(badGoal, { repoRoot: root });
  assert.equal(goalReport.valid, false);
  assert.match(goalReport.errors.join("\n"), /goal.check.*not-done|goal_check.*not-done|promotable/i);

  const identityMismatch = validPilot();
  const identityGoal = JSON.parse(readFileSync(join(root, "goal-check.json"), "utf8"));
  identityGoal.question = "A different question.";
  write("goal-check.json", `${JSON.stringify(identityGoal, null, 2)}\n`);
  identityMismatch.goal_check = artifact("goal-check.json");
  const identityReport = validateFieldPilot(identityMismatch, { repoRoot: root });
  assert.equal(identityReport.valid, false);
  assert.match(identityReport.errors.join("\n"), /question does not match pilot question/i);

  const alias = validPilot();
  alias.plan.path = "FINAL.md";
  const aliasReport = validateFieldPilot(alias, { repoRoot: root });
  assert.equal(aliasReport.valid, false);
  assert.match(aliasReport.errors.join("\n"), /physically distinct|does not match pilot artifact|could not be read|hash mismatch/i);

  const invalidVerifier = validPilot();
  write("verifier.md", "# Verification\n\nMACHINE_VERDICT: PASS\n");
  invalidVerifier.verifier = artifact("verifier.md");
  const verifierReport = validateFieldPilot(invalidVerifier, { repoRoot: root });
  assert.equal(verifierReport.valid, false);
  assert.match(verifierReport.errors.join("\n"), /strict MACHINE_VERDICT|Verdict header/i);

  const looseVerifier = validPilot();
  write("verifier.md", "# Verification\n\n## Verdict: PASS\n\nMACHINE_VERDICT: PASS | FLAW: omission | CONFIDENCE: 0.1 | CHECKS_PASSED: 1/8 | LINE_PINNED: 0/0\n\n## Evidence Trail (Line-Pinned)\n| Claim | Evidence |\n");
  looseVerifier.verifier = artifact("verifier.md");
  const looseReport = validateFieldPilot(looseVerifier, { repoRoot: root });
  assert.equal(looseReport.valid, false);
  assert.match(looseReport.errors.join("\n"), /canonical verifier grammar/i);

  const duplicateVerifier = validPilot();
  write("verifier.md", "# Verification\n\n## Verdict: PASS\n\nMACHINE_VERDICT: PASS | FLAW: none | CONFIDENCE: 0.9 | CHECKS_PASSED: 8/8 | LINE_PINNED: 1/1\nMACHINE_VERDICT: PASS | FLAW: none | CONFIDENCE: 0.9 | CHECKS_PASSED: 8/8 | LINE_PINNED: 1/1\n\n## Evidence Trail (Line-Pinned)\n| Claim | Evidence |\n");
  duplicateVerifier.verifier = artifact("verifier.md");
  const duplicateVerifierReport = validateFieldPilot(duplicateVerifier, { repoRoot: root });
  assert.equal(duplicateVerifierReport.valid, false);
  assert.match(duplicateVerifierReport.errors.join("\n"), /exactly one strict MACHINE_VERDICT/i);

  const blockedVerifier = validPilot();
  write("verifier.md", "# Verification\n\n## Verdict: BLOCKED\n\nMACHINE_VERDICT: BLOCKED | FLAW: calculation_error | CONFIDENCE: 0.9 | CHECKS_PASSED: 7/8 | LINE_PINNED: 1/1\n\n## Evidence Trail (Line-Pinned)\n| Claim | Evidence |\n");
  blockedVerifier.verifier = artifact("verifier.md");
  const blockedVerifierReport = validateFieldPilot(blockedVerifier, { repoRoot: root });
  assert.equal(blockedVerifierReport.valid, false);
  assert.match(blockedVerifierReport.errors.join("\n"), /complete pilot requires verifier verdict PASS/i);

  const partial = validPilot();
  const partialGoal = JSON.parse(readFileSync(join(root, "goal-check.json"), "utf8"));
  partialGoal.prompt[0] = { id: "A1", item: "Answer the request", status: "gap", required_fix: "Add the missing answer." };
  partialGoal.verdict = "NOT-DONE";
  partialGoal.report = "## Goal Check: NOT-DONE\n\nE2E: scope=pass prompt=gap flaws=0 ran=Opened final artifact and checked the requested answer\n";
  write("goal-check.json", `${JSON.stringify(partialGoal, null, 2)}\n`);
  write("final.provenance.md", provenance("E2E: scope=pass prompt=gap flaws=0 ran=Opened final artifact and checked the requested answer"));
  partial.goal_check = artifact("goal-check.json");
  partial.provenance = artifact("final.provenance.md");
  partial.completion = "partial";
  const partialValid = validateFieldPilot(partial, { repoRoot: root });
  assert.equal(partialValid.valid, true, partialValid.errors.join("\n"));

  const blocked = validPilot();
  blocked.sources[0] = { ...blocked.sources[0], status: "blocked", artifact: null, blocked_reason: "The source was not accessible.", unblock_path: "Request access from the publisher." };
  blocked.completion = "blocked";
  const blockedValid = validateFieldPilot(blocked, { repoRoot: root });
  assert.equal(blockedValid.valid, true, blockedValid.errors.join("\\n"));

  console.log("PASS: field-pilot contract binds sources, artifacts, GOAL-CHECK, and honest outcome metrics");
} finally {
  rmSync(root, { recursive: true, force: true });
}
