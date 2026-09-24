import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { writeJsonAtomic } from "../../scripts/habit-ledger.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const cli = join(root, "scripts", "habit-ledger.mjs");
const temp = mkdtempSync(join(tmpdir(), "vitruvius-habit-cli-"));
const ledgerPath = join(temp, "ledger.json");
const storePath = join(temp, "active.json");
const at = "2026-09-24T11:00:00.000Z";
const createdAt = "2026-09-24T10:00:00.000Z";

const ledger = {
  schema: "habit.v1",
  version: 1,
  run: "cli-fixture",
  scope: "research",
  createdAt,
  window: [{ id: "u1", role: "user", text: "Always cite sections.", createdAt }],
  c: [{
    id: "h1",
    t: "Cite sections.",
    d: "",
    e: ["u1"],
    scope: "research",
    status: "proposed",
    createdAt,
  }],
};
writeJsonAtomic(ledgerPath, ledger, { projectRoot: temp });

function run(args) {
  return spawnSync(process.execPath, [cli, ...args], {
    encoding: "utf-8",
    env: { ...process.env, VITRUVIUS_PROJECT_ROOT: temp },
  });
}

{
  const result = run(["validate", ledgerPath]);
  assert.equal(result.status, 0, result.stderr);
}
{
  const result = run(["validate", ledgerPath, "--unknown"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /option/i);
}
{
  const result = run(["validate", ledgerPath, "--store", storePath]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /option|not valid|usage/i);
}
{
  const result = run(["approve", ledgerPath, "--id", "h1", "--by", "user", "--at", at]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(readFileSync(ledgerPath, "utf-8")).c[0].status, "approved");
}
{
  const missingSidecar = run(["activate", ledgerPath, "--store", storePath, "--at", at]);
  assert.notEqual(missingSidecar.status, 0);
  assert.match(missingSidecar.stderr, /provenance|sidecar/i);
  writeFileSync(join(temp, "ledger.provenance.md"), "# Provenance\n\nrun: cli-fixture\n\n## Sources\n- fixture window; candidate h1\n\n## Verification\nverified fixture\n\n## Approval\napprovedBy: user; candidate h1\n");
}
{
  writeFileSync(`${storePath}.lock`, "held\n");
  const locked = run(["activate", ledgerPath, "--store", storePath, "--at", at]);
  assert.notEqual(locked.status, 0);
  assert.match(locked.stderr, /locked/i);
  unlinkSync(`${storePath}.lock`);
}
{
  const result = run(["activate", ledgerPath, "--store", storePath, "--at", at]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(readFileSync(storePath, "utf-8")).rules[0].status, "active");
}
{
  const result = run(["load", "--store", storePath, "--scope", "research", "--at", at]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /"id": "h1"/);
}
{
  const result = run(["load", "--store", storePath, "--at", "not-a-date"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /date|time|timestamp/i);
}
{
  const result = run(["load", "--store", storePath]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scope|usage/i);
}
{
  const result = run(["revoke", "--store", storePath, "--id", "h1", "--at", at]);
  assert.equal(result.status, 0, result.stderr);
  const loaded = run(["load", "--store", storePath, "--scope", "research", "--at", at]);
  assert.equal(loaded.status, 0, loaded.stderr);
  assert.match(loaded.stdout, /"context": \[\]/);
}
{
  const secretPath = join(temp, "secret.json");
  writeFileSync(
    secretPath,
    JSON.stringify({ ...ledger, window: [{ ...ledger.window[0], text: "token=ghp_1234567890abcdef" }] }),
  );
  const result = run(["validate", secretPath]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /secret/i);
}
{
  const outsideStore = join(temp, "..", "outside-habit-store.json");
  const outside = run(["activate", ledgerPath, "--store", outsideStore, "--at", at]);
  assert.notEqual(outside.status, 0);
  assert.match(outside.stderr, /project-local|outside|root/i);
}
{
  const brief = join(temp, "brief.md");
  writeFileSync(brief, "api_key=sk_live_1234567890\n");
  const result = run(["redact-file", brief, "--output", brief]);
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(readFileSync(brief, "utf-8"), /sk_live_/);
}
{
  assert.throws(() => writeJsonAtomic(join(temp, "AGENTS.md"), {}), /AGENTS\.md/);
}

rmSync(temp, { recursive: true, force: true });
console.log("PASS: Habit file-based lifecycle CLI and AGENTS.md refusal");
