import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validateArtifactClosure } from "../../scripts/artifact-closure.mjs";

const root = mkdtempSync(join(tmpdir(), "vitruvius-artifact-closure-"));

function write(relativePath, text) {
  const path = join(root, relativePath);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, text);
  return path;
}

function sidecar(finalPath) {
  const finalBytes = readFileSync(join(root, finalPath));
  const finalName = finalPath.split(/[\\/]/).at(-1);
  return [
    "# Provenance",
    `- **Final artifact:** \`${finalName}\``,
    `- **Final SHA-256:** \`${createHash("sha256").update(finalBytes).digest("hex")}\``,
    `- **Final bytes:** ${finalBytes.length}`,
  ].join("\n") + "\n";
}

try {
  write("topic.md", "# Topic\n\nA final artifact.\n");
  write("topic.provenance.md", sidecar("topic.md"));
  write("civil/deep/nested.md", "# Nested\n\nA nested final artifact.\n");
  write("civil/deep/nested.provenance.md", sidecar("civil/deep/nested.md"));
  write(".drafts/draft.md", "# Draft\n\nWorking file without a sidecar.\n");
  write("verifier/verdict.md", "# Verifier\n\nJudge artifact without a generic sidecar.\n");
  write(".q1-example/ledger.json", "{}\n");
  write(".q1-example/ledger.provenance.md", "# Custom Q1 sidecar\n");

  const valid = validateArtifactClosure(root);
  assert.equal(valid.valid, true, valid.errors.join("\n"));
  assert.equal(valid.finalCount, 2);
  assert.equal(valid.sidecarCount, 2);
  if (process.platform === "win32") {
    write(".DRAFTS/UPPER.md", "# Working\n\nCase-insensitive reserved directory.\n");
    assert.equal(validateArtifactClosure(root).valid, true);
  }

  rmSync(join(root, "civil", "deep", "nested.provenance.md"));
  const missing = validateArtifactClosure(root);
  assert.equal(missing.valid, false);
  assert.match(missing.errors.join("\n"), /civil\/deep\/nested\.md.*missing provenance sidecar/i);

  write("orphan.provenance.md", sidecar("topic.md"));
  const orphan = validateArtifactClosure(root);
  assert.equal(orphan.valid, false);
  assert.match(orphan.errors.join("\n"), /orphan provenance sidecar: orphan\.provenance\.md/i);

  write("stale.md", "# Stale\n\nOne byte.\n");
  write("stale.provenance.md", sidecar("stale.md"));
  const staleBytes = readFileSync(join(root, "stale.md"));
  write("stale.md", `${staleBytes.toString()}x`);
  const stale = validateArtifactClosure(root);
  assert.equal(stale.valid, false);
  assert.match(stale.errors.join("\n"), /stale\.md.*hash mismatch/i);
  assert.match(stale.errors.join("\n"), /stale\.md.*byte count mismatch/i);

  write("duplicate.md", "# Duplicate\n\nA final artifact.\n");
  write("duplicate.provenance.md", `${sidecar("duplicate.md")}- **Final artifact:** \`duplicate.md\`\n`);
  const duplicate = validateArtifactClosure(root);
  assert.equal(duplicate.valid, false);
  assert.match(duplicate.errors.join("\n"), /duplicate\.provenance\.md.*exactly one Final artifact field/i);

  write("escape.md", "# Escape\n\nA final artifact.\n");
  write("escape.provenance.md", [
    "# Provenance",
    "- **Final artifact:** `../escape.md`",
    "- **Final SHA-256:** `0000000000000000000000000000000000000000000000000000000000000000`",
    "- **Final bytes:** 1",
  ].join("\n") + "\n");
  const escape = validateArtifactClosure(root);
  assert.equal(escape.valid, false);
  assert.match(escape.errors.join("\n"), /escape\.provenance\.md.*Final artifact must be a basename/i);

  console.log("PASS: artifact closure validates nested pairs and refuses missing, orphan, stale, and escaping bindings");
} finally {
  rmSync(root, { recursive: true, force: true });
}
