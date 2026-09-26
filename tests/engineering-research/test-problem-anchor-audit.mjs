/**
 * Real-artifact regression for the problem-anchor contract.
 *
 * The synthetic fixtures in test-problem-anchor.mjs prove the validator does
 * what its author intended. This proves it catches the failure that actually
 * happened: a fully cited engineering audit that never opened the codebase it
 * was commissioned about.
 *
 * The document under test is a verbatim excerpt; see fixtures/README.md for its
 * provenance and for the four defects verified against the floorplanner repo.
 */
import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { validateProblemAnchor } from "../../scripts/problem-anchor-contract.mjs";

const repoRoot = join(fileURLToPath(new URL("../..", import.meta.url)));
const excerpt = readFileSync(join(repoRoot, "tests", "engineering-research", "fixtures", "audit-excerpts.md"), "utf8");

// The four defects, stated as the contract would have to catch them.
assert.ok(!/packages\/solver|\.ts:\d+|npm test|vitest|commit [0-9a-f]{7}/.test(excerpt),
  "fixture must remain anchor-free, or it no longer reproduces defect 1");
assert.match(excerpt, /Honeybee\/Ladybug expertise in the surrounding stack/,
  "fixture must retain the nonexistent-dependency claim, or it no longer reproduces defect 3");
assert.match(excerpt, /Very high \| Medium/,
  "fixture must retain the ungrounded impact grades, or it no longer reproduces defect 4");
assert.match(excerpt, /RoomProfile\.usabilityProfile/,
  "fixture must retain the recommendation to rebuild an existing module, or it no longer reproduces defect 2");

const root = mkdtempSync(join(tmpdir(), "vitruvius-audit-regression-"));
cpSync(join(repoRoot, "tests", "engineering-research", "fixtures", "audit-excerpts.md"), join(root, "audit.md"), {
  recursive: false,
});

const artifactPath = join(root, "furniture.ts");
mkdirSync(join(root, "solver"), { recursive: true });
writeFileSync(artifactPath, "export const CLEARANCE = { bed: { side: 0.08, front: 0 } }; // per-kind clearance table\n");

/**
 * The record an agent would have written for this run. The anchor is the file
 * that proves the module §5 proposes to build already exists.
 */
const record = {
  schema: "vitruvius-problem-anchor.v1",
  question: "What is missing, what is structurally wrong, and what should become the next architecture?",
  commit: "1acba4d",
  anchor_root: ".",
  artifacts: [
    {
      id: "A1",
      path: "furniture.ts",
      sha256: createHash("sha256").update(readFileSync(artifactPath)).digest("hex"),
      bytes: readFileSync(artifactPath).length,
    },
  ],
  decisions: [
    { id: "D1", text: "Whether to add a room usability / furniture evaluator" },
    { id: "D2", text: "Whether the solver has environmental-performance instrumentation" },
    { id: "D3", text: "What the next architecture should be" },
  ],
  findings: [
    {
      id: "F1",
      decision_id: "D1",
      claim: "A deterministic furniture kernel with per-kind clearance already exists",
      type: "repo",
      anchor: { path: "furniture.ts", line: 1 },
      artifact_id: "A1",
      changes: "defer",
      status: "verified",
    },
    {
      id: "F2",
      decision_id: "D2",
      claim: "The dependency set contains no simulation toolkit, so the Honeybee/Ladybug premise is unsupported",
      type: "repo",
      anchor: { path: "furniture.ts", line: 1 },
      artifact_id: "A1",
      changes: "change",
      status: "verified",
    },
    {
      id: "F3",
      decision_id: "D3",
      claim: "The roadmap grades impact with no measurement behind any row",
      type: "product",
      changes: "product-decision",
      status: "inferred",
    },
  ],
  coverage: {
    negative: [
      {
        id: "N1",
        searched: "Every tracked file for honeybee, ladybug, radiance, or energyplus",
        not_found: "No simulation toolkit is present anywhere in the repository",
        boundary: "git grep across tracked files at commit 1acba4d",
      },
    ],
  },
  final: {
    path: "audit.md",
    sha256: createHash("sha256").update(readFileSync(join(root, "audit.md"))).digest("hex"),
    bytes: readFileSync(join(root, "audit.md")).length,
  },
};

try {
  const result = validateProblemAnchor(record, { recordPath: join(root, "record.json") });
  const errors = result.errors.join("\n");

  // Defect 1: the report carries no artifact anchor at all, so the record's
  // findings are not delivered. This is the defect that makes the document
  // useless, and it fails closed.
  assert.equal(result.valid, false, "the real audit must not pass the problem-anchor contract");
  assert.match(errors, /findings\[0\]\.id does not appear in the final artifact/,
    "defect 1 (no anchors, findings not delivered) must be caught");
  assert.match(errors, /findings\[0\] anchor furniture\.ts:1 is not cited in the final artifact/,
    "defect 1 must name the uncited anchor");
  assert.match(errors, /coverage\.negative\[0\]\.id does not appear in the final artifact/,
    "the report never records what it did not find, so the negative coverage is not delivered");

  // And the cheap prose-level detector agrees, independently of the record.
  const drift = readFileSync(join(repoRoot, "scripts", "check-output-quality.mjs"), "utf8");
  assert.match(drift, /no artifact anchor/, "the drift detector must still carry the anchor check");

  // The same findings, once grounded and cited, must pass. Otherwise the
  // assertions above would only be proving the contract rejects everything.
  writeFileSync(
    join(root, "grounded.md"),
    [
      "# Grounded rewrite of the same findings",
      "",
      "F1 furniture.ts:1 — a deterministic furniture kernel already exists.",
      "F2 furniture.ts:1 — no simulation toolkit is present in the dependency set.",
      "F3 the impact grades need a decision on what evidence would justify them.",
      "N1 searched every tracked file for a simulation toolkit; not found.",
      "",
    ].join("\n"),
  );
  const grounded = {
    ...record,
    final: {
      path: "grounded.md",
      sha256: createHash("sha256").update(readFileSync(join(root, "grounded.md"))).digest("hex"),
      bytes: readFileSync(join(root, "grounded.md")).length,
    },
  };
  const good = validateProblemAnchor(grounded, { recordPath: join(root, "record.json") });
  assert.equal(good.valid, true, `the same findings, grounded and cited, must pass: ${good.errors.join("; ")}`);

  console.log(
    "PASS: the real audit fails the problem-anchor contract for the right reasons, and the same findings pass once grounded",
  );
} finally {
  rmSync(root, { recursive: true, force: true });
}
