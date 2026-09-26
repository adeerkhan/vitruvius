import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = join(fileURLToPath(new URL("../..", import.meta.url)));
const validator = join(repoRoot, "scripts", "validate-artifacts.mjs");
const root = mkdtempSync(join(tmpdir(), "vitruvius-validate-artifacts-"));
const outputs = join(root, "outputs");
mkdirSync(outputs, { recursive: true });

const hash = "a".repeat(64);
const base = [
  "# Provenance: shape test",
  "- **Final artifact:** `test.md`",
  `- **Final SHA-256:** \`${hash}\``,
  "- **Final bytes:** `1234`",
  "- **Date:** 2026-09-26",
  "- **Rounds:** 3",
  "- **Sources consulted:** 5",
  "- **Sources accepted:** 4",
  "- **Verification:** partial",
  "- **Claims verified:** 2",
  "- **Plan:** outputs/.plans/test.md",
  "- **GOAL-CHECK:** E2E: scope=pass prompt=pass flaws=0 ran=three rounds",
  "",
].join("\n");

function writeProvenance(text) {
  writeFileSync(join(outputs, "shape-test.provenance.md"), text);
}

function run() {
  return spawnSync(process.execPath, [validator, outputs], { encoding: "utf8" });
}

try {
  // A conformant engineering-research sidecar passes.
  writeProvenance(base);
  const valid = run();
  assert.equal(valid.status, 0, valid.stderr);

  // Markdown emphasis around the verdict value is normalized, not rejected.
  writeProvenance(base.replace("**Verification:** partial", "**Verification:** **partial**"));
  assert.equal(run().status, 0, "bolded verdict value should be normalized");

  // An off-taxonomy claim label is refused, even alongside valid ones.
  writeProvenance(base.replace("- **Claims verified:** 2", "- **Claims verified:** 2\n- **Claims withdrawn:** 3"));
  const offTaxonomy = run();
  assert.equal(offTaxonomy.status, 1);
  assert.match(offTaxonomy.stderr, /claim label `withdrawn`/);

  // The sidecar must be byte-pinned.
  const noHash = runAfter(base.replace(`- **Final SHA-256:** \`${hash}\`\n`, ""));
  assert.equal(noHash.status, 1);
  assert.match(noHash.stderr, /Final SHA-256/);

  const noBytes = runAfter(base.replace("- **Final bytes:** `1234`\n", ""));
  assert.equal(noBytes.status, 1);
  assert.match(noBytes.stderr, /Final bytes/);

  // A run that skipped the mandatory GOAL-CHECK record is caught.
  const noGoal = runAfter(base.replace(/- \*\*GOAL-CHECK:\*\*.*\n/, ""));
  assert.equal(noGoal.status, 1);
  assert.match(noGoal.stderr, /GOAL-CHECK/);

  // A non-engineering-research sidecar is not judged against that template.
  writeProvenance(
    "# Provenance: gap dossier\n- **Date:** 2026-09-26\n- **Sources consulted:** 6\n- **Sources accepted:** 5\n- **Verification:** partial\n- **Claims verified:** 3\n- **Plan:** outputs/gap-analysis/test.md\n",
  );
  assert.equal(run().status, 0, "non-research sidecars are exempt from byte-pin/GOAL-CHECK");

  // The observed field shape (`Final:` + `Rounds:`, no `Final artifact:`) is
  // still recognized: it is an engineering-research sidecar and must be pinned.
  writeProvenance(
    [
      "# Provenance: observed",
      "- **Date:** 2026-09-26",
      "- **Rounds:** 3 discovery + 2 verification",
      "- **Sources consulted:** 21",
      "- **Sources accepted:** 15",
      "- **Verification:** partial",
      "- **Claims verified:** 7",
      "- **Plan:** outputs/.plans/observed.md",
      "- **Final:** `outputs/observed.md`",
      "",
    ].join("\n"),
  );
  const observedShape = run();
  assert.equal(observedShape.status, 1);
  assert.match(observedShape.stderr, /Final SHA-256/);
  assert.match(observedShape.stderr, /GOAL-CHECK/);

  console.log("PASS: provenance shape is byte-pinned, goal-checked, and label-bounded");
} finally {
  rmSync(root, { recursive: true, force: true });
}

function runAfter(text) {
  writeProvenance(text);
  return run();
}
