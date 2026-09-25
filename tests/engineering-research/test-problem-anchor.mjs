import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { validateProblemAnchor } from "../../scripts/problem-anchor-contract.mjs";

const repoRoot = join(fileURLToPath(new URL("../..", import.meta.url)));
const validator = join(repoRoot, "scripts", "problem-anchor-contract.mjs");

// The skill and agent contracts must actually carry the new rules; a validator
// nobody is told to run changes nothing.
const method = readFileSync(join(repoRoot, "skills", "engineering-research", "SKILL.md"), "utf8");
const scholarly = readFileSync(join(repoRoot, "skills", "scholarly-research", "SKILL.md"), "utf8");
const researcher = readFileSync(join(repoRoot, "agents", "researcher.md"), "utf8");
const writer = readFileSync(join(repoRoot, "agents", "writer.md"), "utf8");
const goalChecker = readFileSync(join(repoRoot, "agents", "goal-checker.md"), "utf8");

assert.match(method, /version: "0\.2\.5"/, "engineering-research version bumped");
assert.match(method, /`repo`/, "method documents the repo evidence type");
assert.match(method, /path:line/, "method requires a path:line anchor for repo claims");
assert.match(method, /What we did not find/i, "method requires negative coverage");
assert.match(method, /Impact vs\. evidence/i, "method requires impact-vs-evidence");
assert.match(method, /problem-anchor-contract\.md/, "method points at the contract reference");
assert.match(method, /decisions to inform/i, "method freezes the decisions to inform");

assert.match(scholarly, /version: "0\.1\.1"/, "scholarly-research version bumped");
assert.match(scholarly, /produces evidence, not a report/i, "scholarly-research boundary is enforced in prose");
assert.match(scholarly, /What the literature does not settle/i, "scholarly-research requires negative coverage");
assert.match(scholarly, /Handback/i, "scholarly-research requires a handback section");
assert.match(scholarly, /engineering-research/, "scholarly-research hands synthesis back");

assert.match(researcher, /Negative coverage/i, "researcher output requires negative coverage");
assert.match(researcher, /`repo`/, "researcher output documents the repo type");
assert.match(writer, /changes/i, "writer requires a changes field per finding");
assert.match(writer, /path:line/, "writer requires anchors for repo claims");
assert.match(goalChecker, /problem-anchor record path/i, "goal-checker reads the problem-anchor record");

const root = mkdtempSync(join(tmpdir(), "vitruvius-problem-anchor-"));

function write(relativePath, text) {
  const path = join(root, relativePath);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, text);
  return path;
}

function digest(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function fixture(overrides = {}) {
  write("solver/squarify.ts", "export const fill = true;\nexport const scale = 2;\n");
  write("solver/RoomProfile.ts", "export const usableWallM = 1.2;\n");
  const artifactA = join(root, "solver", "squarify.ts");
  const artifactB = join(root, "solver", "RoomProfile.ts");
  const finalPath = write(
    "treemap.md",
    [
      "# Treemap audit",
      "",
      "## Findings",
      "",
      "F1: the treemap fills its host exactly (`solver/squarify.ts:1`).",
      "F2: rooms already carry a usable-wall contract (`solver/RoomProfile.ts:1`).",
      "F3: the 3BR room ceiling is a product decision, not a research finding.",
      "",
      "## What we did not find",
      "",
      "N1: searched the reviewed sources for a universal geometric slack factor; not found.",
      "",
      "## Impact vs. evidence",
      "",
      "Keep the initializer. Thin evidence, low cost of being wrong.",
      "",
      "## Sources",
      "",
      "1. D3 v3.5.17 treemap source.",
      "",
    ].join("\n"),
  );
  const record = {
    schema: "vitruvius-problem-anchor.v1",
    question: "Should the treemap stay the unit-cell initializer?",
    commit: "1acba4d",
    anchor_root: ".",
    artifacts: [
      { id: "A1", path: "solver/squarify.ts", sha256: digest(artifactA), bytes: readFileSync(artifactA).length },
      { id: "A2", path: "solver/RoomProfile.ts", sha256: digest(artifactB), bytes: readFileSync(artifactB).length },
    ],
    decisions: [
      { id: "D1", text: "Keep the treemap as an initializer rather than a feasibility solver" },
      { id: "D2", text: "Whether the 3BR room ceiling changes" },
    ],
    findings: [
      {
        id: "F1",
        decision_id: "D1",
        claim: "The treemap fills its host exactly",
        type: "repo",
        anchor: { path: "solver/squarify.ts", line: 1 },
        artifact_id: "A1",
        changes: "measure",
        status: "verified",
      },
      {
        id: "F2",
        decision_id: "D1",
        claim: "Rooms already carry a usable-wall contract, so do not add a furniture evaluator",
        type: "repo",
        anchor: { path: "solver/RoomProfile.ts", line: 1 },
        artifact_id: "A2",
        changes: "defer",
        status: "verified",
      },
      {
        id: "F3",
        decision_id: "D2",
        claim: "The 3BR ceiling is product policy",
        type: "product",
        changes: "product-decision",
        status: "inferred",
      },
    ],
    coverage: {
      negative: [
        {
          id: "N1",
          searched: "Reviewed primary sources for a universal geometric slack factor",
          not_found: "No universal 10-30% slack factor",
          boundary: "Sources [1]-[13] in the cited brief",
        },
      ],
    },
    final: { path: "treemap.md", sha256: digest(finalPath), bytes: readFileSync(finalPath).length },
  };
  return { ...record, ...overrides };
}

function expectValid(record, label) {
  const result = validateProblemAnchor(record, { recordPath: join(root, "record.json") });
  assert.equal(result.valid, true, `${label}: ${result.errors.join("; ")}`);
}

function expectInvalid(record, label, pattern) {
  const result = validateProblemAnchor(record, { recordPath: join(root, "record.json") });
  assert.equal(result.valid, false, `${label}: expected an invalid record`);
  if (pattern) {
    assert.ok(
      result.errors.some((error) => pattern.test(error)),
      `${label}: no error matched ${pattern}\n  got: ${result.errors.join("\n  ")}`,
    );
  }
}

try {
  // --- the happy path, and the exact defect this contract exists to catch ---
  expectValid(fixture(), "baseline record");

  // Defect 1 from the audit: recommend building a module that already exists.
  // Here the claim asserts absence of A2, but the anchor points at A2 — the
  // validator cannot judge the prose, so this is the reviewer/verifier's job.
  // What it CAN catch is the anchor not resolving at all.
  expectInvalid(
    fixture({
      findings: [
        {
          id: "F1",
          decision_id: "D1",
          claim: "The repo has no furniture evaluator",
          type: "repo",
          anchor: { path: "solver/does-not-exist.ts", line: 1 },
          artifact_id: "A1",
          changes: "change",
          status: "verified",
        },
      ],
    }),
    "anchor path that does not exist",
    /does not resolve to a readable file/,
  );

  expectInvalid(
    fixture({
      findings: [
        {
          id: "F1",
          decision_id: "D1",
          claim: "The treemap fills its host",
          type: "repo",
          anchor: { path: "solver/squarify.ts", line: 99 },
          artifact_id: "A1",
          changes: "measure",
          status: "verified",
        },
      ],
    }),
    "anchor line past end of file",
    /past end of file/,
  );

  expectInvalid(
    fixture({
      findings: [
        {
          id: "F1",
          decision_id: "D1",
          claim: "The treemap fills its host",
          type: "repo",
          anchor: { path: "solver/squarify.ts", line: 3 },
          artifact_id: "A1",
          changes: "measure",
          status: "verified",
        },
      ],
    }),
    "anchor pointing at end-of-file blank line",
    /is blank/,
  );

  expectInvalid(
    fixture({
      findings: [
        {
          id: "F1",
          decision_id: "D1",
          claim: "The treemap fills its host",
          type: "repo",
          changes: "measure",
          status: "verified",
        },
      ],
    }),
    "repo finding with no anchor",
    /must carry an anchor/,
  );

  expectInvalid(
    fixture({
      findings: [
        {
          id: "F1",
          decision_id: "D1",
          claim: "The treemap fills its host",
          type: "repo",
          anchor: { path: "solver/RoomProfile.ts", line: 1 },
          artifact_id: "A1",
          changes: "measure",
          status: "verified",
        },
      ],
    }),
    "anchor path disagreeing with its artifact",
    /must match artifact_id path/,
  );

  // Defect 4: impact asserted with no landing site.
  expectInvalid(
    fixture({
      findings: [
        {
          id: "F1",
          decision_id: "D1",
          claim: "House-GAN assumes rectangular rooms",
          type: "external",
          changes: "background",
          status: "verified",
        },
        {
          id: "F3",
          decision_id: "D2",
          claim: "The 3BR ceiling is product policy",
          type: "product",
          changes: "product-decision",
          status: "inferred",
        },
      ],
    }),
    "external finding with no locator",
    /must carry a locator/,
  );

  expectInvalid(
    fixture({
      findings: [
        {
          id: "F1",
          decision_id: "D1",
          claim: "Add a spatial network layer",
          type: "product",
          changes: "change",
          status: "inferred",
        },
        {
          id: "F3",
          decision_id: "D2",
          claim: "The 3BR ceiling is product policy",
          type: "product",
          changes: "product-decision",
          status: "inferred",
        },
      ],
    }),
    "product finding not routed to a product decision",
    /must set changes=product-decision/,
  );

  expectInvalid(
    fixture({
      findings: [
        {
          id: "F1",
          decision_id: "D1",
          claim: "Reframe the scorer",
          type: "repo",
          anchor: { path: "solver/squarify.ts", line: 1 },
          changes: "change",
          status: "unverified",
        },
        {
          id: "F3",
          decision_id: "D2",
          claim: "The 3BR ceiling is product policy",
          type: "product",
          changes: "product-decision",
          status: "inferred",
        },
      ],
    }),
    "action with no artifact id",
    /must name the artifact it rests on via artifact_id/,
  );

  // A product/background finding must not smuggle in a repository anchor.
  expectInvalid(
    fixture({
      findings: [
        {
          id: "F1",
          decision_id: "D1",
          claim: "Background note",
          type: "background",
          anchor: { path: "solver/squarify.ts", line: 1 },
          changes: "background",
          status: "unverified",
        },
        {
          id: "F3",
          decision_id: "D2",
          claim: "The 3BR ceiling is product policy",
          type: "product",
          changes: "product-decision",
          status: "inferred",
        },
      ],
    }),
    "background finding carrying an anchor",
    /cannot carry a repository anchor/,
  );

  // A verified claim with nothing behind it.
  expectInvalid(
    fixture({
      findings: [
        {
          id: "F1",
          decision_id: "D1",
          claim: "The repo is unusually strong",
          type: "background",
          changes: "background",
          status: "verified",
        },
        {
          id: "F3",
          decision_id: "D2",
          claim: "The 3BR ceiling is product policy",
          type: "product",
          changes: "product-decision",
          status: "inferred",
        },
      ],
    }),
    "verified claim with neither anchor nor locator",
    /carries neither a resolvable anchor nor a locator/,
  );

  // A decision the report lists and then ignores.
  expectInvalid(
    fixture({
      findings: [
        {
          id: "F1",
          decision_id: "D1",
          claim: "The treemap fills its host",
          type: "repo",
          anchor: { path: "solver/squarify.ts", line: 1 },
          artifact_id: "A1",
          changes: "measure",
          status: "verified",
        },
      ],
    }),
    "decision with no finding",
    /decision D2 has no finding/,
  );

  expectInvalid(
    fixture({ coverage: { negative: [] } }),
    "empty negative coverage",
    /at least one searched-for-and-not-found boundary/,
  );

  expectInvalid(
    fixture({ coverage: { negative: [{ id: "N1", searched: "x", not_found: "y", boundary: "  " }] } }),
    "negative coverage with a blank boundary",
    /boundary must be non-empty/,
  );

  expectInvalid(
    fixture({ coverage: { negative: [{ id: "N1", searched: "x", not_found: "y" }] } }),
    "negative coverage missing its boundary key",
    /is missing boundary/,
  );

  expectInvalid(
    fixture({ commit: "not-a-sha" }),
    "unpinned commit",
    /commit must be 7-40 lowercase hex/,
  );

  expectInvalid(
    fixture({ anchor_root: "no/such/dir" }),
    "anchor root that does not exist",
    /anchor_root does not resolve to a directory/,
  );

  expectInvalid(
    fixture({ artifacts: [{ id: "A1", path: "solver/squarify.ts", sha256: "0".repeat(64), bytes: 44 }] }),
    "artifact hash that does not match disk",
    /sha256 does not match the bytes on disk/,
  );

  expectInvalid(
    fixture({ final: { path: "treemap.md", sha256: "0".repeat(64), bytes: 10 } }),
    "candidate hash that does not match disk",
    /final\.sha256 does not match/,
  );

  // A record and a report that have drifted apart: the anchor is in the JSON
  // but the report never cites it.
  const drifted = fixture();
  drifted.final = { ...drifted.final, path: "drifted.md" };
  write("drifted.md", "# Report\n\nNo anchors here at all.\n");
  drifted.final.sha256 = digest(join(root, "drifted.md"));
  drifted.final.bytes = readFileSync(join(root, "drifted.md")).length;
  expectInvalid(drifted, "report that does not cite its anchor", /is not cited in the final artifact/);

  // Range citations are legal in the report.
  const ranged = fixture();
  ranged.final = { ...ranged.final, path: "ranged.md" };
  write("ranged.md", "# Report\n\nF1 cites solver/squarify.ts:1-2 and F2 cites solver/RoomProfile.ts:1.\nF3 product. N1 searched and not found.\n");
  ranged.final.sha256 = digest(join(root, "ranged.md"));
  ranged.final.bytes = readFileSync(join(root, "ranged.md")).length;
  expectValid(ranged, "range citation");

  // --- M2 regression: an anchor must not be satisfied by a longer line number
  write("solver/many.ts", Array.from({ length: 200 }, (_, i) => `export const v${i + 1} = ${i + 1};`).join("\n"));
  const manyBytes = readFileSync(join(root, "solver", "many.ts"));
  const manyBase = () => ({
    schema: "vitruvius-problem-anchor.v1",
    question: "q",
    commit: "1acba4d",
    anchor_root: ".",
    artifacts: [
      { id: "A1", path: "solver/many.ts", sha256: digest(join(root, "solver", "many.ts")), bytes: manyBytes.length },
    ],
    decisions: [{ id: "D1", text: "t" }],
    findings: [
      {
        id: "F1",
        decision_id: "D1",
        claim: "c",
        type: "repo",
        anchor: { path: "solver/many.ts", line: 1 },
        artifact_id: "A1",
        changes: "measure",
        status: "verified",
      },
    ],
    coverage: { negative: [{ id: "N1", searched: "a", not_found: "b", boundary: "c" }] },
    final: { path: "many.md", sha256: "0".repeat(64), bytes: 1 },
  });
  const withReport = (record, text) => {
    write("many.md", text);
    record.final.sha256 = digest(join(root, "many.md"));
    record.final.bytes = readFileSync(join(root, "many.md")).length;
    return record;
  };
  expectValid(withReport(manyBase(), "F1 solver/many.ts:1\nN1 searched and not found.\n"), "anchor at the exact line");
  expectInvalid(
    withReport(manyBase(), "F1 solver/many.ts:13\nN1 searched and not found.\n"),
    "anchor satisfied by a longer line number",
    /is not cited in the final artifact/,
  );
  expectInvalid(
    withReport(manyBase(), "F1 apps/solver/many.ts:1\nN1 searched and not found.\n"),
    "anchor satisfied by a longer path prefix",
    /is not cited in the final artifact/,
  );
  expectValid(
    withReport(manyBase(), "F1 solver/many.ts:1-200\nN1 searched and not found.\n"),
    "range from the anchored line",
  );

  // --- M5: negative coverage must be bound to the candidate
  const noCoverageCite = fixture();
  noCoverageCite.final = { ...noCoverageCite.final, path: "nocite.md" };
  write("nocite.md", "# Report\n\nF1 solver/squarify.ts:1 F2 solver/RoomProfile.ts:1 F3 product.\n");
  noCoverageCite.final.sha256 = digest(join(root, "nocite.md"));
  noCoverageCite.final.bytes = readFileSync(join(root, "nocite.md")).length;
  expectInvalid(
    noCoverageCite,
    "negative-coverage entry the report never mentions",
    /coverage\.negative\[0\]\.id does not appear in the final artifact/,
  );

  // --- m8: a repo finding always rests on a hash-pinned artifact
  expectInvalid(
    fixture({
      findings: [
        {
          id: "F1",
          decision_id: "D1",
          claim: "Background note about the solver",
          type: "repo",
          anchor: { path: "solver/RoomProfile.ts", line: 1 },
          changes: "background",
          status: "unverified",
        },
        fixture().findings[2],
      ],
    }),
    "repo finding resting on an unpinned file",
    /must name the artifact it rests on via artifact_id/,
  );

  // --- M4: the record must sit beside its candidate
  mkdirSync(join(root, "outputs", ".drafts"), { recursive: true });
  writeFileSync(join(root, "outputs", ".drafts", "stray-problem-anchor.json"), JSON.stringify(fixture()));
  const stray = spawnSync(
    process.execPath,
    [validator, join(root, "outputs", ".drafts", "stray-problem-anchor.json")],
    { encoding: "utf8" },
  );
  assert.equal(stray.status, 1, "a record outside the candidate's directory is rejected");
  assert.match(stray.stderr, /must be beside the final candidate|does not resolve to a readable file/);

  // --- branches that were untested and matter
  expectInvalid(fixture({ schema: "vitruvius-problem-anchor.v2" }), "wrong schema", /schema must be/);
  const d3 = () => fixture().findings[2];
  expectInvalid(
    fixture({
      findings: [
        { id: "F1", decision_id: "D1", claim: "c", type: "repo", typo_field: 1, anchor: { path: "solver/squarify.ts", line: 1 }, artifact_id: "A1", changes: "measure", status: "verified" },
        d3(),
      ],
    }),
    "unknown key on a finding",
    /is not allowed/,
  );
  for (const [label, line] of [["line as a string", "1"], ["line zero", 0], ["line negative", -3], ["line fractional", 1.5]]) {
    expectInvalid(
      fixture({
        findings: [
          { id: "F1", decision_id: "D1", claim: "c", type: "repo", anchor: { path: "solver/squarify.ts", line }, artifact_id: "A1", changes: "measure", status: "verified" },
          d3(),
        ],
      }),
      label,
      /line must be a positive integer/,
    );
  }
  expectInvalid(
    fixture({ decisions: [{ id: "D1", text: "a" }, { id: "D1", text: "b" }] }),
    "duplicate decision id",
    /id is duplicated/,
  );
  expectInvalid(
    fixture({
      coverage: {
        negative: [
          { id: "N1", searched: "a", not_found: "b", boundary: "c" },
          { id: "N1", searched: "a", not_found: "b", boundary: "c" },
        ],
      },
    }),
    "duplicate negative-coverage id",
    /id is duplicated/,
  );
  expectInvalid(
    fixture({ final: { path: "../escape.md", sha256: "0".repeat(64), bytes: 1 } }),
    "final path climbing out with ..",
    /confined relative path/,
  );
  expectInvalid(
    fixture({ artifacts: [{ id: "A1", path: "solver\\squarify.ts", sha256: "0".repeat(64), bytes: 1 }] }),
    "backslash path separator",
    /confined relative path/,
  );

  // --- M3 regression: a link inside the root must not reach outside it
  const outside = mkdtempSync(join(tmpdir(), "vitruvius-pa-outside-"));
  let linkCreated = false;
  try {
    writeFileSync(join(outside, "secret.ts"), "export const outside = true;\n");
    try {
      symlinkSync(outside, join(root, "solver", "link"), process.platform === "win32" ? "junction" : "dir");
      linkCreated = true;
    } catch {
      linkCreated = false;
    }
    if (linkCreated) {
      const escaped = fixture({
        artifacts: [
          {
            id: "A1",
            path: "solver/link/secret.ts",
            sha256: digest(join(outside, "secret.ts")),
            bytes: readFileSync(join(outside, "secret.ts")).length,
          },
        ],
        decisions: [fixture().decisions[0], fixture().decisions[1]],
      });
      escaped.findings = [
        {
          id: "F1",
          decision_id: "D1",
          claim: "c",
          type: "repo",
          anchor: { path: "solver/link/secret.ts", line: 1 },
          artifact_id: "A1",
          changes: "measure",
          status: "verified",
        },
        d3(),
      ];
      expectInvalid(
        escaped,
        "anchor reached through a link out of the root",
        /escapes anchor_root|resolves outside anchor_root/,
      );
    } else {
      console.log("  (skipped link-escape case: no symlink/junction privilege on this host)");
    }
  } finally {
    rmSync(outside, { recursive: true, force: true });
  }

  // --- CLI surface ---
  const recordPath = join(root, "cli.json");
  writeFileSync(recordPath, JSON.stringify(fixture(), null, 2));
  const ok = spawnSync(process.execPath, [validator, recordPath], { encoding: "utf8" });
  assert.equal(ok.status, 0, `CLI should accept a valid record: ${ok.stderr}`);
  assert.match(ok.stdout, /PASS: problem anchor valid/);

  const badPath = join(root, "bad.json");
  writeFileSync(badPath, JSON.stringify(fixture({ commit: "nope" }), null, 2));
  const bad = spawnSync(process.execPath, [validator, badPath], { encoding: "utf8" });
  assert.equal(bad.status, 1, "CLI must reject an invalid record");
  assert.match(bad.stderr, /commit must be 7-40/);

  const missing = spawnSync(process.execPath, [validator], { encoding: "utf8" });
  assert.equal(missing.status, 1, "CLI must reject a missing argument");
  assert.match(missing.stderr, /Usage:/);

  const unparsable = join(root, "broken.json");
  writeFileSync(unparsable, "{ not json");
  const broken = spawnSync(process.execPath, [validator, unparsable], { encoding: "utf8" });
  assert.equal(broken.status, 1, "CLI must reject unparsable JSON");
  assert.match(broken.stderr, /Could not read problem-anchor record/);

  console.log("PASS: problem-anchor contract binds findings to artifacts, decisions, and negative coverage");
} finally {
  rmSync(root, { recursive: true, force: true });
}
