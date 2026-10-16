import { strict as assert } from "node:assert";
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const itemScript = join(root, "scripts", "verdict-gate.mjs");
const NODE = process.execPath;

const item = {
  id: "T1",
  target: "foo.md:10",
  claim: "deflection is mis-computed",
  evidence: [{ quote: "table 3", locator: "foo.md:12" }],
  correctness: "correct",
  significance: "significant",
  evidence_sufficiency: "sufficient",
  requires_adjudication: false,
  adjudication_reason: "none",
  flaw: "none",
};

const dir = mkdtempSync(join(tmpdir(), "vitruvius-vg-e-"));
const itemPath = join(dir, "item.json");
writeFileSync(itemPath, JSON.stringify({ schema: "review-item.v1", items: [item] }));
const r = spawnSync(NODE, [itemScript, itemPath, "--strict"], { encoding: "utf8" });
rmSync(dir, { recursive: true, force: true });
assert.equal(r.status, 0, "gate engine passes on fully positive item: " + r.stderr);
const out = JSON.parse(r.stdout);
assert.equal(out.verdict, "PASS", "verdict must be PASS when all items are fully positive");
assert.equal(out.failure_basis.length, 0, "PASS verdict carries no failure_basis");
console.log("PASS: verdict-gate engine derives PASS from a fully positive finding set");
