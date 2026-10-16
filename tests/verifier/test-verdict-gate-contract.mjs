import { strict as assert } from "node:assert";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const script = join(root, "scripts", "verdict-gate-contract.mjs");
const NODE = process.execPath;

function run(record) {
  const dir = mkdtempSync(join(tmpdir(), "vitruvius-vg-"));
  const path = join(dir, "record.json");
  writeFileSync(path, JSON.stringify(record));
  const r = spawnSync(NODE, [script, path, "--strict"], { encoding: "utf8" });
  rmSync(dir, { recursive: true, force: true });
  return r;
}

const okRecord = {
  schema: "vitruvius-verdict-gate.v1",
  question: "is the beam flexural strength compliance claim valid?",
  protocol: { revision: "v2", sha256: "a".repeat(64) },
  context: {
    jurisdiction_known: true,
    edition_pinned: true,
    requirements_context: true,
    quantitative_claims_present: true,
  },
  checks: [
    {
      id: "C1",
      gate: "G1",
      status: "pass",
      reason: "provision read and verified",
      rationale: "C0 read and quoted",
      evidence: ["AISC 360-16 §H1.1"],
    },
  ],
  items: ["F1"],
  gates: {
    G1: { id: "G1", status: "pass", failure_reasons: [], unresolved_reasons: [] },
  },
  verdict: "PASS",
  failure_basis: [],
  ran: "verifier pass over foo.md",
  report: "ok",
};

const r = run(okRecord);
assert.equal(r.status, 0, "good gate record accepted: " + r.stderr);

const passImpossible = JSON.parse(JSON.stringify(okRecord));
passImpossible.checks = [
  {
    id: "C2",
    gate: "G1",
    status: "gap",
    reason: "provision says X",
    rationale: "the claim says Y",
    evidence: ["foo.md:42"],
  },
];
passImpossible.verdict = "PASS";
passImpossible.failure_basis = [];
const r2 = run(passImpossible);
assert.notEqual(r2.status, 0, "PASS with a failing check fails");

const vanish = JSON.parse(JSON.stringify(okRecord));
vanish.verdict = "PASS";
vanish.failure_basis = ["detected_violation"];
const r3 = run(vanish);
assert.notEqual(r3.status, 0, "PASS carrying failure_basis fails");

const nApp = JSON.parse(JSON.stringify(okRecord));
nApp.checks = [
  {
    id: "C3",
    gate: "G1",
    status: "not_applicable",
    reason: "short",
    rationale: "short",
    evidence: ["foo.md:1"],
  },
];
const r4 = run(nApp);
assert.notEqual(r4.status, 0, "not_applicable requires substantive reason");

console.log("PASS: verdict-gate contract enforces FAIL vs UNRESOLVED separation");
