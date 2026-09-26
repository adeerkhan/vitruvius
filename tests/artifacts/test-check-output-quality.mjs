import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = join(fileURLToPath(new URL("../..", import.meta.url)));
const validator = join(repoRoot, "scripts", "check-output-quality.mjs");
const root = mkdtempSync(join(tmpdir(), "vitruvius-output-quality-"));

function write(relativePath, text) {
  const path = join(root, relativePath);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, text);
}

function run() {
  return spawnSync(process.execPath, [validator, root], { encoding: "utf8" });
}

try {
  write("brief-draft.md", "# Draft\n\n[1] A cited claim.\n\n## Sources\n1. Source\n");
  write("claim-verification.md", "# Verification\n\nMACHINE_VERDICT: PASS\n\n## Evidence Trail\n| Claim | Evidence |\n");
  write("research-plan.md", "# Plan\n\n## Key Questions\n- What?\n\n## Evidence Needed\n- Source\n");

  const valid = run();
  assert.equal(valid.status, 0, valid.stderr);

  write("brief-draft.md", "# Draft\n\nAn uncited claim.\n");
  const invalidDraft = run();
  assert.equal(invalidDraft.status, 1);
  assert.match(invalidDraft.stderr, /inline citations|Sources/i);

  // A numbered Sources entry that nothing cites is a reference kept for looks.
  write("brief-draft.md", "# Draft\n\n[1] A cited claim.\n\n## Sources\n1. Source A\n2. Source B\n");
  const uncited = run();
  assert.equal(uncited.status, 1);
  assert.match(uncited.stderr, /\[2\] listed but never cited/);

  write("claim-verification.md", "# Verification\n\nNo machine markers.\n");
  const invalidVerifier = run();
  assert.equal(invalidVerifier.status, 1);
  assert.match(invalidVerifier.stderr, /MACHINE_VERDICT|Evidence Trail/i);

  // --- final deliverables must be grounded in the artifact they study ---
  // A fresh root: the fixtures above are intentionally broken at this point.
  const finalRoot = mkdtempSync(join(tmpdir(), "vitruvius-output-final-"));
  const writeFinal = (name, text) => {
    mkdirSync(join(finalRoot, name, ".."), { recursive: true });
    writeFileSync(join(finalRoot, name), text);
  };
  const runFinal = () => spawnSync(process.execPath, [validator, finalRoot], { encoding: "utf8" });
  const only = (...names) => {
    for (const entry of readdirSync(finalRoot, { withFileTypes: true })) {
      if (entry.isFile() && !names.includes(entry.name)) rmSync(join(finalRoot, entry.name));
    }
  };

  const body = [
    "The initializer fills its host exactly (`packages/solver/src/treemap/squarify.ts:9`).",
    "",
    "## What we did not find",
    "",
    "Searched the reviewed sources for a universal geometric slack factor; not found.",
    "",
    "## Impact vs. evidence",
    "",
    "Keep it. Thin evidence, low cost of being wrong.",
    "",
  ].join("\n");

  // A deliverable is one carrying a GOAL-CHECK or problem-anchor record. A
  // sidecar alone is not enough — every shaped artifact has one.
  writeFinal("treemap-audit.md", `# Treemap audit\n\n${body}`);
  writeFinal("treemap-audit.provenance.md", "# Provenance: treemap audit\n- **Final SHA-256:** `abc`\n");
  writeFinal("treemap-audit-problem-anchor.json", "{}\n");
  const validFinal = runFinal();
  assert.equal(validFinal.status, 0, validFinal.stderr);

  // A repo claim anchored to a bare filename cannot be resolved by a reader.
  writeFinal("treemap-audit.md", `# Audit\n\nSee \`squarify.ts:9\`.\n\n${body}`);
  const bareAnchor = runFinal();
  assert.equal(bareAnchor.status, 1);
  assert.match(bareAnchor.stderr, /bare filename anchor.*squarify\.ts/);
  writeFinal("treemap-audit.md", `# Treemap audit\n\n${body}`);

  // Regression: neither a provenance sidecar nor any of the shaped artifacts
  // that share the outputs tree may be judged as a research report.
  for (const exempt of [
    "lpbf-bracket.md", // FMEA table
    "am-fatigue-methods.md", // evidence ranking
    "joining-alternatives.md", // comparison matrix
    "adhesive-review.md", // severity-graded review
    "treemap-audit.provenance.md", // the sidecar itself
  ]) {
    only("treemap-audit.provenance.md");
    writeFinal(exempt, "# Artifact\n\nNo anchors. No sections. No evidence.\n");
    const result = runFinal();
    assert.equal(result.status, 0, `${exempt} must not be treated as a final research report: ${result.stderr}`);
  }
  only();

  // A report with no machine record is not ours to judge.
  writeFinal("loose-notes.md", "# Notes\n\nNothing anchored, nothing recorded.\n");
  assert.equal(runFinal().status, 0, "files without a machine record are not judged");
  only();

  // A well-cited report that never names the system it is about.
  writeFinal("treemap-audit.md", "# Audit\n\n[1] The literature is broadly favourable.\n\n## Sources\n1. Paper\n");
  writeFinal("treemap-audit.provenance.md", "# Provenance: treemap audit\n- **Final SHA-256:** `abc`\n");
  writeFinal("treemap-audit-goal-check.json", "{}\n");
  const noAnchor = runFinal();
  assert.equal(noAnchor.status, 1);
  assert.match(noAnchor.stderr, /no artifact anchor/);

  // A report grounded in a measured command rather than a file anchor.
  writeFinal(
    "treemap-audit.md",
    `# Audit\n\nRan \`npx vitest run tests/autogrow.test.ts\` -> 13 passed.\n\n${body}`,
  );
  assert.equal(runFinal().status, 0, "a command and its result is a legal anchor");

  // A bare `npm test` with no result is not an anchor (no file anchor either).
  const noFileAnchor = body.replace("`packages/solver/src/treemap/squarify.ts:9`", "the treemap source");
  writeFinal("treemap-audit.md", `# Audit\n\nJust run npm test.\n\n${noFileAnchor}`);
  assert.equal(runFinal().status, 1, "a command with no result is not an anchor");

  // The same line with a result is.
  writeFinal("treemap-audit.md", `# Audit\n\nRan npm test: 0 failed.\n\n${noFileAnchor}`);
  assert.equal(runFinal().status, 0, "a command with a result is an anchor");

  // Silence about what was searched for and not found.
  writeFinal("treemap-audit.md", `# Audit\n\n${body.replace("## What we did not find", "## Notes")}`);
  assert.equal(runFinal().status, 1);

  // A heading with no content is not negative coverage.
  writeFinal(
    "treemap-audit.md",
    `# Audit\n\nAnchor: packages/solver/src/treemap/squarify.ts:9\n\n## What we did not find\n\n## Impact vs. evidence\n\nKeep it: thin evidence, low cost of being wrong either way.\n`,
  );
  const bareHeading = runFinal();
  assert.equal(bareHeading.status, 1, "an empty negative-coverage heading does not satisfy the check");
  assert.match(bareHeading.stderr, /negative-coverage section/);

  // The standard engineering name for the section is accepted, with content.
  writeFinal(
    "treemap-audit.md",
    `# Audit\n\nAnchor: packages/solver/src/treemap/squarify.ts:9\n\n## Open questions\n\nWhether the 3BR room ceiling is product policy rather than a research question.\n\n## Impact vs. evidence\n\nKeep it: thin evidence, low cost of being wrong either way.\n`,
  );
  assert.equal(runFinal().status, 0, "## Open questions counts as negative coverage when it has content");

  // Range citations and case-insensitive headings.
  writeFinal(
    "treemap-audit.md",
    `# Treemap audit\n\n${body.replace("squarify.ts:9", "squarify.ts:9-13").replace("## Impact vs. evidence", "## impact / evidence")}`,
  );
  assert.equal(runFinal().status, 0, "range citations and alternate headings are accepted");

  // Working files in dot-directories are not deliverables.
  writeFinal(".drafts/scratch.md", "no anchors, no sections\n");
  assert.equal(runFinal().status, 0, "dot-directory working files are exempt");

  rmSync(finalRoot, { recursive: true, force: true });
  console.log("PASS: output-quality checks cover citations, machine markers, and final-deliverable grounding");
} finally {
  rmSync(root, { recursive: true, force: true });
}
