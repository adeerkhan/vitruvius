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

// --- A waiver must not become a blanket permission -------------------------
// The hole, found by adding the SSRF fix. A file+rule waiver written for two
// RegExp.prototype.exec false positives ALSO silently allowed a real
// `eval(...)` appended to the same file: same rule name, so the same waiver
// matched it. The build went green with an eval in a shipped skill, and the
// report said nothing about it — the reason and removeWhen were both true.
//
// So a waiver may pin how many findings it speaks for. Widening from 2 to 3
// must become a visible edit, not a silent absorption.
{
  const waiver = (extra = {}) => ({
    file: "skills/x/scripts/x.mjs",
    rule: "dangerous function call",
    reason: "test",
    removeWhen: "test",
    ...extra,
  });
  const finding = (line) => ({ file: "skills/x/scripts/x.mjs", rule: "dangerous function call", line, severity: "HIGH" });

  // A pinned count covers exactly what it names.
  const two = partitionFindings([finding(10), finding(20)], [waiver({ maxFindings: 2 })]);
  assert.equal(two.blocking.length, 0, "two findings are covered by a waiver pinned to two");
  assert.equal(two.allowed.length, 2, "both are reported as waived, not silently dropped");
  assert.equal(two.stale.length, 0, "and the waiver is not reported stale");

  // A third finding in the same file is NOT covered — this is the regression.
  const three = partitionFindings([finding(10), finding(20), finding(30)], [waiver({ maxFindings: 2 })]);
  assert.equal(three.blocking.length, 1, "a third dangerous call must not be absorbed by a waiver pinned to two");
  assert.equal(three.blocking[0].line, 30, "and the un-waived finding must be the new one");
  assert.equal(three.allowed.length, 2, "the two reviewed findings stay waived");

  // An exact line pin is NOT supported, deliberately. It would be the
  // narrowest waiver, but it goes stale the moment anyone edits a line above
  // the finding, and a stale waiver that silently stops matching is worse than
  // a broad one that is visible in the report. `maxFindings` is the
  // line-rotation-safe way to narrow one.
  assert.equal(
    Object.keys(waiver({ line: 10 })).includes("line"),
    true,
    "sanity: a line field is still writable, so the assertion below is meaningful",
  );
  const withLineField = partitionFindings([finding(10), finding(20)], [waiver({ line: 10 })]);
  assert.equal(
    withLineField.blocking.length,
    0,
    "a stray `line` field is ignored rather than honoured — matching stays on file+rule+count",
  );

  // A waiver with neither stays usable, because pinning a line is wrong the
  // moment anyone edits above the finding — but it is the loose form, and it is
  // documented as such.
  const loose = partitionFindings([finding(10), finding(20)], [waiver()]);
  assert.equal(loose.blocking.length, 0, "an unpinned waiver still works, for compatibility");
}

console.log(
  "PASS: security-scan waivers require a reason and a removal condition, cannot suppress without both, " +
    "are reported stale when they match nothing, and cannot absorb a finding beyond the count they name",
);
