import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import { checkResultFile } from "../../scripts/margin-earnedness-check.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = join(repoRoot, "scripts", "margin-earnedness-check.mjs");
const tmp = mkdtempSync(join(tmpdir(), "margin-earnedness-"));

function result(body) {
  const p = join(tmp, `case-${Math.random().toString(36).slice(2)}-result.md`);
  writeFileSync(p, body, "utf8");
  return p;
}

const VERDICT = (v, flaw = "none", checks = "8/8") =>
  `MACHINE_VERDICT: ${v} | FLAW: ${flaw} | CONFIDENCE: 0.9 | CHECKS_PASSED: ${checks} | LINE_PINNED: 3/3`;

// --- The real violation is caught ------------------------------------------
const violation = result(
  [
    "## Verdict: PASS",
    "",
    VERDICT("PASS"),
    "",
    "### Issues found",
    '- **Margin wording:** "exceeds the minimum" is a 96 vs 90 in margin of 6.7% (< 10%).',
    "I judge this compliant rather than material.",
    "",
  ].join("\n"),
);
const caught = checkResultFile(violation);
assert.strictEqual(caught.length, 1, "a sub-10% self-reported margin on a PASS verdict must be caught");
assert.match(caught[0], /6\.7%/, "the finding must name the margin the run itself reported");
assert.match(caught[0], /PARTIAL/, "the finding must state the verdict the rule requires");

// --- A margin at or above the cap is not a violation -----------------------
const generous = result(
  [
    "## Verdict: PASS",
    "",
    VERDICT("PASS"),
    "",
    "The design exceeds the minimum with a 42% margin.",
    "",
  ].join("\n"),
);
assert.strictEqual(
  checkResultFile(generous).length,
  0,
  "a margin above the cap does not trigger the threshold",
);

// --- No margin language at all is not a violation --------------------------
const noMargin = result(
  ["## Verdict: PASS", "", VERDICT("PASS"), "", "Required width 90 in; provided 96 in.", ""].join("\n"),
);
assert.strictEqual(
  checkResultFile(noMargin).length,
  0,
  "a result with no margin language is outside this check",
);

// --- A non-PASS verdict is never a violation here --------------------------
const partial = result(
  [
    "## Verdict: PARTIAL",
    "",
    VERDICT("PARTIAL", "synthesis_overreach", "7/8"),
    "",
    '- **Margin wording:** "exceeds the minimum" is a 6.7% margin.',
    "",
  ].join("\n"),
);
assert.strictEqual(
  checkResultFile(partial).length,
  0,
  "PARTIAL is the verdict the rule asks for; it must not be flagged",
);

// --- Quantifying the margin in the corrected conclusion does NOT rescue a
//     sub-cap margin. This is the escape that would have hidden the real defect.
const repairedButStillPass = result(
  [
    "## Verdict: PASS",
    "",
    VERDICT("PASS"),
    "",
    "### Issues found",
    '- **Margin wording:** "exceeds the minimum" is a 96 vs 90 in margin of 6.7% (< 10%).',
    "",
    "## Corrected Conclusion",
    "Exceeding the minimum by 6 inches (6.7%).",
    "",
  ].join("\n"),
);
assert.strictEqual(
  checkResultFile(repairedButStillPass).length,
  1,
  "repairing the wording in the corrected conclusion must not excuse a PASS verdict on a sub-cap margin",
);

// --- The gate runs on the real corpus and must fail closed ----------------
const real = spawnSync("node", [script], { encoding: "utf8" });
assert.strictEqual(
  real.status,
  1,
  `the checked-in corpus contains a known override, so the gate must fail; got ${real.status}: ${real.stdout}${real.stderr}`,
);
// The failure is reported on stderr, so both streams are part of the contract.
assert.match(
  `${real.stdout}${real.stderr}`,
  /architectural-synthesis_overreach-01/,
  "the gate must name the offending case",
);

// --- The threshold constant matches the documented rule --------------------
const source = readFileSync(script, "utf8");
assert.match(
  source,
  /MARGIN_CAP_PERCENT\s*=\s*10/,
  "the cap constant must stay in sync with the ~10% rule in agents/verifier.md",
);
const verifierRole = readFileSync(join(repoRoot, "agents", "verifier.md"), "utf8");
assert.match(
  verifierRole,
  /under\s*~?10%\s*caps the\s*verdict at PARTIAL/i,
  "agents/verifier.md must still state the rule this check enforces",
);

rmSync(tmp, { recursive: true, force: true });

console.log("PASS: margin-earnedness gate catches a sub-cap PASS verdict and is documented in the verifier role");
