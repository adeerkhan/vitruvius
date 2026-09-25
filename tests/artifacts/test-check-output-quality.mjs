import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
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

  write("claim-verification.md", "# Verification\n\nNo machine markers.\n");
  const invalidVerifier = run();
  assert.equal(invalidVerifier.status, 1);
  assert.match(invalidVerifier.stderr, /MACHINE_VERDICT|Evidence Trail/i);

  console.log("PASS: output-quality checks remain deterministic for valid and invalid draft/verifier fixtures");
} finally {
  rmSync(root, { recursive: true, force: true });
}
