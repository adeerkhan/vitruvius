import { strict as assert } from "node:assert";
import { writeFileSync, unlinkSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const script = join(root, "scripts", "review-item-contract.mjs");
const NODE = process.execPath;

function run(record) {
  const dir = mkdtempSync(join(tmpdir(), "vitruvius-ri-"));
  const path = join(dir, "record.json");
  writeFileSync(path, JSON.stringify(record));
  const r = spawnSync(NODE, [script, path, "--strict"], { encoding: "utf8" });
  rmSync(dir, { recursive: true, force: true });
  return r;
}

const minimalGood = {
  schema: "review-item.v1",
  items: [
    {
      id: "F1",
      target: "foo.md:10",
      claim: "the steady-state deflection is mis-computed",
      evidence: [{ quote: "see table 3", locator: "foo.md:12" }],
      correctness: "correct",
      significance: "significant",
      evidence_sufficiency: "sufficient",
      requires_adjudication: false,
      adjudication_reason: "none",
      flaw: "calculation_error",
    },
  ],
};

const ok = run(minimalGood);
assert.equal(ok.status, 0, "good record accepted: " + ok.stderr);

const cascades = [
  {
    name: "bad cascade — significant without correct",
    record: {
      schema: "review-item.v1",
      items: [
        {
          id: "F2",
          target: "foo.md:10",
          claim: "summary claim",
          evidence: [{ quote: "x", locator: "foo.md:10" }],
          correctness: "incorrect",
          significance: "significant",
          evidence_sufficiency: "sufficient",
          requires_adjudication: false,
          adjudication_reason: "none",
          flaw: "none",
        },
      ],
    },
  },
];

for (const c of cascades) {
  const r = run(c.record);
  assert.notEqual(r.status, 0, `${c.name} should fail`);
}

const abstain = run({
  schema: "review-item.v1",
  items: [
    {
      id: "F3",
      target: "foo.md:10",
      claim: "ambiguous item",
      evidence: [{ quote: "x", locator: "foo.md:10" }],
      correctness: "incorrect",
      significance: null,
      evidence_sufficiency: null,
      requires_adjudication: true,
      adjudication_reason: "no_applicable_value",
      flaw: "entailment_failure",
    },
  ],
});
assert.equal(abstain.status, 0, "abstaining item accepted: " + abstain.stderr);

const badAdj = run({
  schema: "review-item.v1",
  items: [
    {
      id: "F4",
      target: "foo.md:10",
      claim: "x",
      evidence: [{ quote: "x", locator: "foo.md:10" }],
      correctness: null,
      significance: null,
      evidence_sufficiency: null,
      requires_adjudication: false,
      adjudication_reason: "none",
      flaw: "none",
    },
  ],
});
assert.notEqual(badAdj.status, 0, "inconsistent abstention fails");

const emptyEvidence = run({
  schema: "review-item.v1",
  items: [
    {
      id: "F5",
      target: "foo.md:10",
      claim: "x claim",
      evidence: [],
      correctness: "correct",
      significance: "significant",
      evidence_sufficiency: "sufficient",
      requires_adjudication: false,
      adjudication_reason: "none",
      flaw: "none",
    },
  ],
});
assert.notEqual(emptyEvidence.status, 0, "empty evidence fails");

console.log("PASS: review-item contract fails-closed on bad cascades, accepts abstentions and good records");
