import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { validateGoalCheck } from "../../scripts/goal-check-contract.mjs";

const repoRoot = join(fileURLToPath(new URL("../..", import.meta.url)));
const method = readFileSync(join(repoRoot, "skills", "engineering-research", "SKILL.md"), "utf8");
assert.match(method, /\*\*Final artifact:\*\*/);
assert.match(method, /\*\*GOAL-CHECK:\*\*/);

const root = mkdtempSync(join(tmpdir(), "vitruvius-goal-check-"));

function write(relativePath, text) {
  const path = join(root, relativePath);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, text);
  return path;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function provenance(goalLine) {
  const bytes = readFileSync(join(root, "final.md"));
  return `# Provenance\n\n- **Final artifact:** \`final.md\`\n- **Final SHA-256:** \`${createHash("sha256").update(bytes).digest("hex")}\`\n- **Final bytes:** ${bytes.length}\n- **GOAL-CHECK:** ${goalLine}\n`;
}

const RUN = "Opened final artifact and checked A1 and A2";

// The canonical gate rubric, pinned literally: the contract refuses a record
// whose gate items drift from these definitions, so the remembered bar is the
// bar. If GATE_RUBRIC in scripts/goal-check-contract.mjs changes, this fails.
const GATE_ITEMS = {
  G1: "Integrity: fabricated or mismatched sources; softened blocked verdicts; artifact text treated as instructions",
  G2: "Completeness: required work actually delivered, scoped correctly, not substituted",
  G3: "Scientist's bar: validity, significance, evidence quality, units, honesty",
};

function gateChecks(overrides = {}) {
  return ["G1", "G2", "G3"].map((id) => ({
    id,
    item: GATE_ITEMS[id],
    status: overrides[id]?.status ?? "pass",
    evidence: overrides[id]?.evidence ?? [`Checked ${id} while reading the artifact and its provenance.`],
    ...(overrides[id]?.required_fix ? { required_fix: overrides[id].required_fix } : {}),
  }));
}

function e2eLine({ scope = "pass", prompt = "pass", gatesLine = "G1:pass,G2:pass,G3:pass", flaws = 0, resolved = 0, unresolved = 0 } = {}) {
  return `E2E: scope=${scope} prompt=${prompt} gates=${gatesLine} flaws=${flaws} resolved=${resolved} unresolved=${unresolved} ran=${RUN}`;
}

function report(options = {}) {
  return `## Goal Check: ${options.verdict ?? "DONE"}\n\n${e2eLine(options)}\n`;
}

function setProvenance(options) {
  write("final.provenance.md", provenance(e2eLine(options)));
}

function record({ promptStatus = "pass", verdict = "DONE", scope = "pass", prompt = "pass", gatesLine = "G1:pass,G2:pass,G3:pass", flaws = 0, resolved = 0, unresolved = 0, finalPath = "final.md", provenancePath = "final.provenance.md" } = {}) {
  const promptChecks = [
    { id: "A1", item: "Answer the first ask", status: "pass", evidence: ["A1 is answered."] },
  ];
  if (promptStatus === "pass") {
    promptChecks.push({ id: "A2", item: "Answer the second ask", status: "pass", evidence: ["A2 is answered."] });
  } else {
    promptChecks.push({ id: "A2", item: "Answer the second ask", status: "gap", evidence: ["Searched final.md; A2 is absent."], required_fix: "Add the missing second ask." });
  }
  const question = "Answer A1 and A2.";
  const requirements = [{ id: "A1", text: "Answer the first ask" }, { id: "A2", text: "Answer the second ask" }];
  const manifest = `${JSON.stringify({ schema: "vitruvius-goal-requirements.v1", question_sha256: createHash("sha256").update(question).digest("hex"), requirements, scope: [{ id: "S1", text: "Deliver the requested brief" }] }, null, 2)}\n`;
  write("goal-requirements.json", manifest);
  const manifestBytes = readFileSync(join(root, "goal-requirements.json"));
  return {
    schema: "vitruvius-goal-check.v2",
    question,
    requirements,
    requirements_manifest: { path: "goal-requirements.json", sha256: createHash("sha256").update(manifestBytes).digest("hex"), bytes: manifestBytes.length },
    final: { path: finalPath, sha256: sha256(join(root, finalPath)), bytes: readFileSync(join(root, finalPath)).length },
    provenance_path: provenancePath,
    plan_path: "plan.md",
    attempts: 1,
    gates: gateChecks(),
    scope: [{ id: "S1", item: "Deliver the requested brief", status: scope, ...(scope === "pass" ? { evidence: ["The brief is present."] } : { evidence: ["Searched the final artifact; the brief is absent."], required_fix: "Add the missing scope item." }) }],
    prompt: promptChecks,
    findings: [],
    ran: RUN,
    verdict,
    report: report({ verdict, scope, prompt, gatesLine, flaws, resolved, unresolved }),
  };
}

try {
  write("plan.md", "# Plan\n\nAnswer A1 and A2.\n");
  write("final.md", "# Final\n\nA1 is answered.\nA2 is answered.\nThe brief is present.\n");
  setProvenance();

  const positive = validateGoalCheck(record(), { repoRoot: root });
  assert.equal(positive.valid, true, positive.errors.join("\n"));
  assert.equal(positive.promotable, true);
  assert.equal(positive.verdict, "DONE");
  assert.equal(positive.derived.gates, "G1:pass,G2:pass,G3:pass");
  assert.equal(positive.derived.resolved, 0);
  assert.equal(positive.derived.unresolved, 0);

  const omitted = record({ promptStatus: "gap", verdict: "NOT-DONE", prompt: "gap" });
  setProvenance({ prompt: "gap" });
  const omittedReport = validateGoalCheck(omitted, { repoRoot: root });
  assert.equal(omittedReport.valid, true, omittedReport.errors.join("\n"));
  assert.equal(omittedReport.promotable, false);
  assert.equal(omittedReport.verdict, "NOT-DONE");
  assert.equal(omittedReport.derived.prompt, "gap");

  const repeatedGap = validateGoalCheck(omitted, { repoRoot: root });
  assert.equal(repeatedGap.valid, true, repeatedGap.errors.join("\n"));
  assert.equal(repeatedGap.promotable, false);

  // Phase 4: a gap is a claim too — it must carry the evidence of what was
  // inspected, so an unevidenced gap is refused rather than assumed.
  const gapWithoutEvidence = structuredClone(omitted);
  delete gapWithoutEvidence.prompt[1].evidence;
  const gapWithoutEvidenceReport = validateGoalCheck(gapWithoutEvidence, { repoRoot: root });
  assert.equal(gapWithoutEvidenceReport.valid, false);
  assert.match(gapWithoutEvidenceReport.errors.join("\n"), /prompt\[1\]\.evidence must be a non-empty array/);

  const trueOmission = record();
  trueOmission.prompt.pop();
  const omissionReport = validateGoalCheck(trueOmission, { repoRoot: root });
  assert.equal(omissionReport.valid, false);
  assert.match(omissionReport.errors.join("\n"), /prompt is missing required ask: A2/i);

  const scopeOmission = record();
  scopeOmission.scope.pop();
  const scopeOmissionReport = validateGoalCheck(scopeOmission, { repoRoot: root });
  assert.equal(scopeOmissionReport.valid, false);
  assert.match(scopeOmissionReport.errors.join("\n"), /scope is missing required item: S1/i);

  const falseDone = structuredClone(omitted);
  falseDone.verdict = "DONE";
  falseDone.report = report({ verdict: "DONE", prompt: "pass" });
  const falseDoneReport = validateGoalCheck(falseDone, { repoRoot: root });
  assert.equal(falseDoneReport.valid, false);
  assert.match(falseDoneReport.errors.join("\n"), /verdict must be NOT-DONE|DONE requires all checks pass/i);

  const reportMismatch = structuredClone(omitted);
  reportMismatch.report = report({ verdict: "NOT-DONE", prompt: "pass" });
  const mismatchReport = validateGoalCheck(reportMismatch, { repoRoot: root });
  assert.equal(mismatchReport.valid, false);
  assert.match(mismatchReport.errors.join("\n"), /report E2E prompt does not match derived gate/i);

  // A pass is also a claim: every evidence item must be quotable from the
  // final artifact, not just the first one.
  setProvenance();
  const driftedQuote = record();
  driftedQuote.prompt[0].evidence = ["A1 is answered.", "This quote is not in the artifact."];
  const driftedQuoteReport = validateGoalCheck(driftedQuote, { repoRoot: root });
  assert.equal(driftedQuoteReport.valid, false);
  assert.match(driftedQuoteReport.errors.join("\n"), /prompt\[0\]\.evidence\[1\] is not present in the final artifact/i);

  const staleHash = structuredClone(record());
  staleHash.final.sha256 = "0".repeat(64);
  const staleReport = validateGoalCheck(staleHash, { repoRoot: root });
  assert.equal(staleReport.valid, false);
  assert.match(staleReport.errors.join("\n"), /final hash mismatch/i);

  const traversal = structuredClone(record());
  traversal.plan_path = "../outside.md";
  const traversalReport = validateGoalCheck(traversal, { repoRoot: root });
  assert.equal(traversalReport.valid, false);
  assert.match(traversalReport.errors.join("\n"), /plan_path must be a confined repository-relative regular file/i);

  // An alias of the final artifact used as the plan. What the refusal SAYS
  // depends on the filesystem the suite happens to run on, and the two answers
  // are both correct:
  //   - case-insensitive (win32, default macOS): `FINAL.md` resolves to the
  //     very file named by final, so it is refused as not physically distinct;
  //   - case-sensitive (Linux CI): `FINAL.md` names a file that does not exist,
  //     so it is refused as not a regular file.
  // Asserting one message therefore asserts one platform's filesystem. The
  // refusal itself is the invariant; the reason is derived from the host, so
  // this stays a statement about the contract rather than about the CI runner.
  const alias = record();
  alias.plan_path = "FINAL.md";
  const aliasReport = validateGoalCheck(alias, { repoRoot: root });
  assert.equal(aliasReport.valid, false);
  const aliasReason = existsSync(join(root, "FINAL.md"))
    ? /physically distinct/i
    : /plan_path must be a regular non-symlink file/i;
  assert.match(aliasReport.errors.join("\n"), aliasReason);

  // The containment decision is shared with field-pilot (path-safety.mjs). These
  // three cases pin that both contracts still refuse the same paths AFTER the
  // duplication was removed — a shared module that only one caller honours is
  // the same defect as two inline copies, so the refusal is asserted per contract.
  const escapes = [
    ["../outside.md", /confined repository-relative regular file/i],
    ["final.md/../../outside.md", /confined repository-relative regular file/i],
    ["final.md", /physically distinct/i],
  ];
  for (const [planPath, expected] of escapes) {
    const probe = record();
    probe.plan_path = planPath;
    const report = validateGoalCheck(probe, { repoRoot: root });
    assert.equal(report.valid, false, `plan_path ${planPath} must be refused`);
    assert.match(report.errors.join("\n"), expected, `plan_path ${planPath}`);
  }

  // A directory is named as a bad file, not as an escape: the message has to
  // point an operator at the real problem.
  const directory = record();
  directory.plan_path = ".";
  const directoryReport = validateGoalCheck(directory, { repoRoot: root });
  assert.equal(directoryReport.valid, false);
  assert.match(directoryReport.errors.join("\n"), /confined repository-relative regular file/i);

  const openFinding = record({ verdict: "NOT-DONE", flaws: 1 });
  openFinding.findings = [{ id: "F1", severity: "minor", status: "open", summary: "A minor unresolved issue remains.", evidence: ["The brief is present."], required_fix: "Clarify the caveat." }];
  setProvenance({ flaws: 1 });
  const findingReport = validateGoalCheck(openFinding, { repoRoot: root });
  assert.equal(findingReport.valid, true, findingReport.errors.join("\n"));
  assert.equal(findingReport.promotable, false);
  assert.equal(findingReport.derived.flaws, 1);

  const unevidenced = record();
  unevidenced.findings = [{ id: "F2", severity: "major", status: "wontfix", summary: "Trust me.", evidence: ["not in final"], justification: "No fix." }];
  unevidenced.verdict = "DONE";
  const unevidencedReport = validateGoalCheck(unevidenced, { repoRoot: root });
  assert.equal(unevidencedReport.valid, false);
  assert.match(unevidencedReport.errors.join("\n"), /findings\[0\]\.evidence\[0\] is not present in the final artifact/i);

  // Phase 4: resolved and unresolved findings are counted separately, never
  // averaged — and an evidenced WONTFIX plus a documented BLOCKED stay an
  // honest deliverable (unresolved is visible in the machine line, not fatal).
  const counted = record({ resolved: 1, unresolved: 1 });
  counted.findings = [
    { id: "F3", severity: "minor", status: "wontfix", summary: "Caveat wording is acceptable.", evidence: ["The brief is present."], justification: "The stated limitation is explicit." },
    { id: "F4", severity: "major", status: "blocked", summary: "A registry certificate could not be re-fetched.", evidence: ["A2 is answered."], unblock_path: "Re-run when the registry is reachable." },
  ];
  setProvenance({ resolved: 1, unresolved: 1 });
  const countedReport = validateGoalCheck(counted, { repoRoot: root });
  assert.equal(countedReport.valid, true, countedReport.errors.join("\n"));
  assert.equal(countedReport.promotable, true);
  assert.equal(countedReport.derived.resolved, 1);
  assert.equal(countedReport.derived.unresolved, 1);

  const hiddenCounts = structuredClone(counted);
  hiddenCounts.report = report({ resolved: 1, unresolved: 0 });
  const hiddenCountsReport = validateGoalCheck(hiddenCounts, { repoRoot: root });
  assert.equal(hiddenCountsReport.valid, false);
  assert.match(hiddenCountsReport.errors.join("\n"), /report E2E unresolved does not match derived gate/i);

  // Phase 4: the three gates are independent and non-averaged. Scope and
  // prompt pass, flaws is zero, ran is named — a single G3 gap still forces
  // NOT-DONE and non-promotable, and the machine line carries the gap.
  setProvenance();
  const gateGap = record({ verdict: "NOT-DONE", gatesLine: "G1:pass,G2:pass,G3:gap" });
  gateGap.gates[2] = { id: "G3", item: GATE_ITEMS.G3, status: "gap", evidence: ["Units scan found a psi/ksi mix in the conclusion."], required_fix: "Fix the unit mix before delivery." };
  setProvenance({ gatesLine: "G1:pass,G2:pass,G3:gap" });
  const gateGapReport = validateGoalCheck(gateGap, { repoRoot: root });
  assert.equal(gateGapReport.valid, true, gateGapReport.errors.join("\n"));
  assert.equal(gateGapReport.promotable, false);
  assert.equal(gateGapReport.verdict, "NOT-DONE");
  assert.equal(gateGapReport.derived.gates, "G1:pass,G2:pass,G3:gap");

  // A gate pass with no evidence array is refused: "no evidence" is not a pass.
  setProvenance();
  const gateNoEvidence = record();
  gateNoEvidence.gates[0].evidence = [];
  const gateNoEvidenceReport = validateGoalCheck(gateNoEvidence, { repoRoot: root });
  assert.equal(gateNoEvidenceReport.valid, false);
  assert.match(gateNoEvidenceReport.errors.join("\n"), /gates\[0\]\.evidence must be a non-empty array/i);

  // The rubric is the contract's, not the recorder's: a drifted definition is
  // refused, so a record cannot quietly redefine the bar it was checked against.
  const driftedGate = record();
  driftedGate.gates[1].item = "Completeness: looks fine";
  const driftedGateReport = validateGoalCheck(driftedGate, { repoRoot: root });
  assert.equal(driftedGateReport.valid, false);
  assert.match(driftedGateReport.errors.join("\n"), /gates\[1\]\.item must be the canonical G2 definition from the contract/i);

  const gateNoFix = record();
  gateNoFix.gates[2] = { id: "G3", item: GATE_ITEMS.G3, status: "gap", evidence: ["Units scan found a psi/ksi mix."] };
  const gateNoFixReport = validateGoalCheck(gateNoFix, { repoRoot: root });
  assert.equal(gateNoFixReport.valid, false);
  assert.match(gateNoFixReport.errors.join("\n"), /gates\[2\]\.required_fix must be non-empty for a gap/i);

  const twoGates = record();
  twoGates.gates.pop();
  const twoGatesReport = validateGoalCheck(twoGates, { repoRoot: root });
  assert.equal(twoGatesReport.valid, false);
  assert.match(twoGatesReport.errors.join("\n"), /gates must be an array of exactly the 3 gates/i);

  // The completion loop is bounded: attempts 1-5, and a sixth pass is a
  // no-op, not completion.
  for (const attempts of [0, 6, 2.5]) {
    const badAttempts = record();
    badAttempts.attempts = attempts;
    const badAttemptsReport = validateGoalCheck(badAttempts, { repoRoot: root });
    assert.equal(badAttemptsReport.valid, false, `attempts=${attempts} must be refused`);
    assert.match(badAttemptsReport.errors.join("\n"), /attempts must be an integer between 1 and 5/i, `attempts=${attempts}`);
  }
  const missingAttempts = record();
  delete missingAttempts.attempts;
  const missingAttemptsReport = validateGoalCheck(missingAttempts, { repoRoot: root });
  assert.equal(missingAttemptsReport.valid, false);
  assert.match(missingAttemptsReport.errors.join("\n"), /attempts must be an integer between 1 and 5/i);
  const cappedAttempts = record();
  cappedAttempts.attempts = 5;
  const cappedReport = validateGoalCheck(cappedAttempts, { repoRoot: root });
  assert.equal(cappedReport.valid, true, cappedReport.errors.join("\n"));

  // A v1-format machine line no longer parses: the record carries per-gate
  // statuses and separate resolved/unresolved counts, and a report written
  // against the old rubric is refused rather than half-read.
  const legacyReport = record();
  legacyReport.report = "## Goal Check: DONE\n\nE2E: scope=pass prompt=pass flaws=0 ran=Opened final artifact and checked A1 and A2\n";
  const legacyReportResult = validateGoalCheck(legacyReport, { repoRoot: root });
  assert.equal(legacyReportResult.valid, false);
  assert.match(legacyReportResult.errors.join("\n"), /exactly one E2E machine line/i);

  write("final.provenance.md", provenance("E2E: scope=pass prompt=pass flaws=0 ran=Opened final artifact and checked A1 and A2"));
  const legacyProvenance = validateGoalCheck(record(), { repoRoot: root });
  assert.equal(legacyProvenance.valid, false);
  assert.match(legacyProvenance.errors.join("\n"), /provenance GOAL-CHECK line does not match the derived gate/i);

  setProvenance();
  write("final.provenance.md", `${provenance(e2eLine())}- **GOAL-CHECK:** ${e2eLine({ scope: "gap", prompt: "gap" })}\n`);
  const duplicateProvenance = validateGoalCheck(record(), { repoRoot: root });
  assert.equal(duplicateProvenance.valid, false);
  assert.match(duplicateProvenance.errors.join("\n"), /exactly one GOAL-CHECK line/i);

  write("final.provenance.md", `${provenance(e2eLine())}- **Final artifact:** \`final.md\`\n`);
  const duplicateBinding = validateGoalCheck(record(), { repoRoot: root });
  assert.equal(duplicateBinding.valid, false);
  assert.match(duplicateBinding.errors.join("\n"), /exactly one Final artifact field/i);

  console.log("PASS: goal-check contract enforces three non-averaged gates, non-empty evidence, bounded attempts, and artifact binding");
} finally {
  rmSync(root, { recursive: true, force: true });
}
