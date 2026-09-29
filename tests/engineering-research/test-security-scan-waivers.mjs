import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { WAIVERS, formatFinding, partitionFindings } from "../../scripts/security-scan.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const finding = (over = {}) => ({
  severity: "HIGH",
  file: "scripts/extract-pdf.mjs",
  line: 42,
  rule: "dangerous function call",
  ...over,
});

const waiver = (over = {}) => ({
  file: "scripts/extract-pdf.mjs",
  rule: "dangerous function call",
  reason: "spawns pdftotext with a fixed argv, never a shell string",
  removeWhen: "the PDF path moves to a pure-JS parser",
  ...over,
});

// --- 1. An unwaived finding blocks -----------------------------------------
{
  const r = partitionFindings([finding()], []);
  assert.equal(r.blocking.length, 1, "an unwaived finding must block");
  assert.equal(r.allowed.length, 0);
}

// --- 2. A complete waiver allows it, and is not stale ----------------------
{
  const r = partitionFindings([finding()], [waiver()]);
  assert.equal(r.blocking.length, 0, "a complete waiver must suppress the finding");
  assert.equal(r.allowed.length, 1);
  assert.equal(r.invalid.length, 0);
  assert.equal(r.stale.length, 0, "a waiver that matched a finding is not stale");
  assert.equal(r.allowed[0].waiver.reason, waiver().reason, "the reason must survive to the report");
}

// --- 3. A waiver without a reason is itself a failure, and suppresses nothing
{
  const r = partitionFindings([finding()], [waiver({ reason: "" })]);
  assert.equal(r.invalid.length, 1, "a waiver with no reason must be reported invalid");
  assert.match(r.invalid[0], /reason/);
  assert.equal(
    r.blocking.length,
    1,
    "an invalid waiver must NOT also quietly allow the finding it names",
  );
  assert.equal(r.allowed.length, 0);
}

// --- 4. A waiver without a removal condition is invalid too ----------------
{
  const r = partitionFindings([finding()], [waiver({ removeWhen: undefined })]);
  assert.equal(r.invalid.length, 1, "a waiver with no removeWhen must be reported invalid");
  assert.match(r.invalid[0], /removeWhen/);
  assert.equal(r.blocking.length, 1, "an invalid waiver must not suppress anything");
}

// --- 5. A waiver matching nothing is stale ---------------------------------
{
  const r = partitionFindings([finding()], [waiver({ file: "scripts/never-scanned.mjs" })]);
  assert.equal(r.stale.length, 1, "a waiver that matches no finding must be stale");
  assert.equal(r.blocking.length, 1);
}

// --- 6. With no findings, every waiver is stale ----------------------------
// An allowlist for findings that do not exist is permission, not documentation.
{
  const r = partitionFindings([], [waiver()]);
  assert.equal(r.stale.length, 1, "a waiver is stale when the scanner reports nothing");
  assert.equal(r.blocking.length, 0);
}

// --- 7. Waivers key on file + rule, so a line shift does not void them -----
// Line numbers move on every edit above them. A line-keyed waiver would go
// stale the moment anyone touched the file above it, which is how an allowlist
// decays into something nobody trusts.
{
  const moved = partitionFindings([finding({ line: 999 })], [waiver()]);
  assert.equal(
    moved.blocking.length,
    0,
    "a waiver must survive the finding moving down the file",
  );
  assert.equal(moved.allowed.length, 1, "the moved finding is still the waived one");
  assert.equal(moved.stale.length, 0);

  // And it is structurally impossible to key on a line: no line field exists.
  assert.equal(
    Object.keys(waiver()).includes("line"),
    false,
    "a waiver must not carry a line field — that is how line-keyed waivers rot",
  );
}

// --- 8. Waivers are matched per rule, not per file ------------------------
{
  const r = partitionFindings([finding({ rule: "potential secret/credential" })], [waiver()]);
  assert.equal(r.blocking.length, 1, "a waiver for one rule must not allow a different rule");
  assert.equal(r.stale.length, 1, "and the mismatched waiver is then stale");
}

// --- 9. The shipped WAIVERS list is structurally valid --------------------
{
  assert.ok(Array.isArray(WAIVERS), "WAIVERS must be an array");
  for (const [i, w] of WAIVERS.entries()) {
    for (const key of ["file", "rule", "reason", "removeWhen"]) {
      assert.equal(
        typeof w[key],
        "string",
        `shipped WAIVERS[${i}] is missing a string "${key}" — every waiver needs it`,
      );
      assert.notEqual(w[key].trim(), "", `shipped WAIVERS[${i}].${key} is empty`);
    }
  }
}

// --- 10. The real gate still passes, as a spawned process ------------------
{
  const result = spawnSync(process.execPath, [join(repoRoot, "scripts", "security-scan.mjs")], {
    encoding: "utf8",
  });
  assert.equal(
    result.status,
    0,
    `security-scan.mjs must exit 0 on the current tree:\n${result.stdout}\n${result.stderr}`,
  );
}

console.log(
  "PASS: security-scan waivers require a reason and a removal condition, cannot suppress without both, " +
    "and are reported stale when they match nothing",
);
