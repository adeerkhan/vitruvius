import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = join(repoRoot, "scripts", "semantic-near-dup.mjs");

// Create a temporary evidence ledger
const tmpDir = mkdtempSync(join(tmpdir(), "semantic-near-dup-"));
const ledgerPath = join(tmpDir, "ledger.json");

const ledger = {
  schema: "evidence.v1",
  run_id: "test-run",
  question: "test",
  sources: [
    {
      id: "SRC-001",
      title: "RCE in API endpoint",
      locator: "https://example.com/rce",
      type: "remote code execution",
      status: "verified",
    },
    {
      id: "SRC-002",
      title: "Command injection in API endpoint",
      locator: "https://example.com/rce",
      type: "command injection",
      status: "verified",
    },
    {
      id: "SRC-003",
      title: "SQL injection in login",
      locator: "https://example.com/sqli",
      type: "sql injection",
      status: "verified",
    },
  ],
  searches: [],
  claims: [],
  coverage: { negative: [], ambiguous: [] },
};

writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));

const result = spawnSync("node", [script, ledgerPath], { encoding: "utf8" });
assert.strictEqual(result.status, 0, `script failed: ${result.stderr}`);

const output = result.stdout;
const jsonMatch = output.match(/\[[\s\S]*\]/);
assert.ok(jsonMatch, "script should output JSON");

const proposals = JSON.parse(jsonMatch[0]);
assert.ok(Array.isArray(proposals), "proposals should be an array");

// Should propose a merge for SRC-001 and SRC-002 (same type after normalization, same locator)
const rceMerge = proposals.find(
  (p) => p.sources.includes("SRC-001") && p.sources.includes("SRC-002")
);
assert.ok(rceMerge, "should propose merge for RCE/command-injection pair");
assert.ok(rceMerge.reason, "merge should have a reason");
assert.ok(rceMerge.confidence, "merge should have confidence");

// Should NOT propose a merge for SRC-001 and SRC-003 (different types)
const falseMerge = proposals.find(
  (p) => p.sources.includes("SRC-001") && p.sources.includes("SRC-003")
);
assert.strictEqual(falseMerge, undefined, "should not merge different types");

rmSync(tmpDir, { recursive: true, force: true });

console.log("PASS: semantic near-duplicate matching proposes correct merges");
