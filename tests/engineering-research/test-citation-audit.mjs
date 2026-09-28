import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = join(repoRoot, "scripts", "citation-audit.mjs");

const tmpDir = mkdtempSync(join(tmpdir(), "citation-audit-"));
const draftPath = join(tmpDir, "draft.md");

// Draft with orphan citation and orphan source
const draft = `# Test Draft

The API achieves 94.2% accuracy [1]. This is a factual claim [9].
The system uses a transformer architecture and was trained on 10,000 samples.

## Sources

1. Smith et al. "API Performance" 2024
2. Jones et al. "Unrelated Work" 2023
`;

writeFileSync(draftPath, draft);

const result = spawnSync("node", [script, draftPath], { encoding: "utf8" });
assert.strictEqual(result.status, 1, "script should exit 1 on orphan citations/sources");

const output = result.stdout;
const jsonMatch = output.match(/\{[\s\S]*\}/);
assert.ok(jsonMatch, "script should output JSON");

const report = JSON.parse(jsonMatch[0]);

// [9] is an orphan citation (not in Sources)
assert.ok(report.orphanCitations.includes(9), "should detect orphan citation [9]");

// Source 2 is an orphan source (not cited in body)
assert.ok(report.orphanSources.includes(2), "should detect orphan source 2");

// Should detect unsourced factual claim
assert.ok(report.unsourcedClaims.length > 0, "should detect unsourced claims");

rmSync(tmpDir, { recursive: true, force: true });

console.log("PASS: citation audit detects orphan citations, orphan sources, and unsourced claims");
