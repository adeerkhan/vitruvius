import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

function report({ verdict = "DONE", scope = "pass", prompt = "pass", flaws = 0, ran = "Opened final artifact and checked A1 and A2" } = {}) {
  return `## Goal Check: ${verdict}\n\nE2E: scope=${scope} prompt=${prompt} flaws=${flaws} ran=${ran}\n`;
}

function record({ promptStatus = "pass", verdict = "DONE", scope = "pass", prompt = "pass", flaws = 0, finalPath = "final.md", provenancePath = "final.provenance.md" } = {}) {
  const promptChecks = [
    { id: "A1", item: "Answer the first ask", status: "pass", evidence: "A1 is answered." },
  ];
  if (promptStatus === "pass") {
    promptChecks.push({ id: "A2", item: "Answer the second ask", status: "pass", evidence: "A2 is answered." });
  } else {
    promptChecks.push({ id: "A2", item: "Answer the second ask", status: "gap", required_fix: "Add the missing second ask." });
  }
  const ran = "Opened final artifact and checked A1 and A2";
  const question = "Answer A1 and A2.";
  const requirements = [{ id: "A1", text: "Answer the first ask" }, { id: "A2", text: "Answer the second ask" }];
  const manifest = `${JSON.stringify({ schema: "vitruvius-goal-requirements.v1", question_sha256: createHash("sha256").update(question).digest("hex"), requirements, scope: [{ id: "S1", text: "Deliver the requested brief" }] }, null, 2)}\n`;
  write("goal-requirements.json", manifest);
  const manifestBytes = readFileSync(join(root, "goal-requirements.json"));
  return {
    schema: "vitruvius-goal-check.v1",
    question,
    requirements,
    requirements_manifest: { path: "goal-requirements.json", sha256: createHash("sha256").update(manifestBytes).digest("hex"), bytes: manifestBytes.length },
    final: { path: finalPath, sha256: sha256(join(root, finalPath)), bytes: readFileSync(join(root, finalPath)).length },
    provenance_path: provenancePath,
    plan_path: "plan.md",
    scope: [{ id: "S1", item: "Deliver the requested brief", status: scope, ...(scope === "pass" ? { evidence: "The brief is present." } : { required_fix: "Add the missing scope item." }) }],
    prompt: promptChecks,
    findings: [],
    ran,
    verdict,
    report: report({ verdict, scope, prompt, flaws, ran }),
  };
}

try {
  write("plan.md", "# Plan\n\nAnswer A1 and A2.\n");
  write("final.md", "# Final\n\nA1 is answered.\nA2 is answered.\nThe brief is present.\n");
  write("final.provenance.md", provenance("E2E: scope=pass prompt=pass flaws=0 ran=Opened final artifact and checked A1 and A2"));

  const positive = validateGoalCheck(record(), { repoRoot: root });
  assert.equal(positive.valid, true, positive.errors.join("\n"));
  assert.equal(positive.promotable, true);
  assert.equal(positive.verdict, "DONE");

  const omitted = record({ promptStatus: "gap", verdict: "NOT-DONE", prompt: "gap" });
  write("final.provenance.md", provenance("E2E: scope=pass prompt=gap flaws=0 ran=Opened final artifact and checked A1 and A2"));
  const omittedReport = validateGoalCheck(omitted, { repoRoot: root });
  assert.equal(omittedReport.valid, true, omittedReport.errors.join("\n"));
  assert.equal(omittedReport.promotable, false);
  assert.equal(omittedReport.verdict, "NOT-DONE");
  assert.equal(omittedReport.derived.prompt, "gap");

  const repeatedGap = validateGoalCheck(omitted, { repoRoot: root });
  assert.equal(repeatedGap.valid, true, repeatedGap.errors.join("\n"));
  assert.equal(repeatedGap.promotable, false);

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
  assert.match(mismatchReport.errors.join("\n"), /E2E prompt|report E2E/i);

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

  const alias = record();
  alias.plan_path = "FINAL.md";
  const aliasReport = validateGoalCheck(alias, { repoRoot: root });
  assert.equal(aliasReport.valid, false);
  assert.match(aliasReport.errors.join("\n"), /physically distinct|could not be read|hash mismatch/i);

  const openFinding = record();
  openFinding.findings = [{ id: "F1", severity: "minor", status: "open", summary: "A minor unresolved issue remains.", evidence: "The brief is present.", required_fix: "Clarify the caveat." }];
  openFinding.verdict = "NOT-DONE";
  openFinding.report = report({ verdict: "NOT-DONE", flaws: 1 });
  write("final.provenance.md", provenance("E2E: scope=pass prompt=pass flaws=1 ran=Opened final artifact and checked A1 and A2"));
  const findingReport = validateGoalCheck(openFinding, { repoRoot: root });
  assert.equal(findingReport.valid, true, findingReport.errors.join("\n"));
  assert.equal(findingReport.promotable, false);
  assert.equal(findingReport.derived.flaws, 1);

  const unevidenced = record();
  unevidenced.findings = [{ id: "F2", severity: "major", status: "wontfix", summary: "Trust me.", evidence: "not in final", justification: "No fix." }];
  unevidenced.verdict = "DONE";
  const unevidencedReport = validateGoalCheck(unevidenced, { repoRoot: root });
  assert.equal(unevidencedReport.valid, false);
  assert.match(unevidencedReport.errors.join("\n"), /evidence is not present in the final artifact/i);

  write("final.provenance.md", `${provenance("E2E: scope=pass prompt=pass flaws=0 ran=Opened final artifact and checked A1 and A2")}- **GOAL-CHECK:** E2E: scope=gap prompt=gap flaws=0 ran=Opened final artifact and checked A1 and A2\n`);
  const duplicateProvenance = validateGoalCheck(record(), { repoRoot: root });
  assert.equal(duplicateProvenance.valid, false);
  assert.match(duplicateProvenance.errors.join("\n"), /exactly one GOAL-CHECK line/i);

  write("final.provenance.md", `${provenance("E2E: scope=pass prompt=pass flaws=0 ran=Opened final artifact and checked A1 and A2")}- **Final artifact:** \`final.md\`\n`);
  const duplicateBinding = validateGoalCheck(record(), { repoRoot: root });
  assert.equal(duplicateBinding.valid, false);
  assert.match(duplicateBinding.errors.join("\n"), /exactly one Final artifact field/i);

  console.log("PASS: goal-check contract validates completion, manifest omissions, repeated gaps, and artifact binding");
} finally {
  rmSync(root, { recursive: true, force: true });
}
