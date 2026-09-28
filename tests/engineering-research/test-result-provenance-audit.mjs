import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = join(repoRoot, "scripts", "result-provenance-audit.mjs");

const tmpDir = mkdtempSync(join(tmpdir(), "result-provenance-audit-"));
const draftPath = join(tmpDir, "draft.md");

// Draft with sourced and unsourced quantitative claims
const draft = `# Test Draft

The model achieves 94.2% accuracy [1]. The latency is 3.5x faster [2].
The throughput is 10,000 requests per second. The F1 score is 0.85.

## Sources

1. Smith et al. "Model Performance" 2024
2. Jones et al. "Latency Analysis" 2023
`;

writeFileSync(draftPath, draft);

const result = spawnSync("node", [script, draftPath], { encoding: "utf8" });
assert.strictEqual(result.status, 1, "script should exit 1 on unsourced quantitative claims");

const output = result.stdout;
const jsonMatch = output.match(/\{[\s\S]*\}/);
assert.ok(jsonMatch, "script should output JSON");

const report = JSON.parse(jsonMatch[0]);

// Should detect quantitative claims
assert.ok(report.summary.total >= 4, `should detect at least 4 quantitative claims, got ${report.summary.total}`);

// Should detect unsourced claims (throughput and F1 have no citations)
assert.ok(report.summary.unsourced >= 2, `should detect at least 2 unsourced claims, got ${report.summary.unsourced}`);

// Should detect sourced claims (accuracy and latency have citations)
assert.ok(report.summary.sourced >= 2, `should detect at least 2 sourced claims, got ${report.summary.sourced}`);

rmSync(tmpDir, { recursive: true, force: true });

console.log("PASS: result provenance audit detects sourced and unsourced quantitative claims");
