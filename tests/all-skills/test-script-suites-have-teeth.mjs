import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Teeth for the two script-level suites repaired on 2026-09-28:
// tests/engineering-research/test-retrieval-bridge.mjs and
// tests/engineering-research/test-isolated-tests.mjs.
//
// The E1 harness (test-e1-suites-have-teeth.mjs) mutates skills/<skill>/SKILL.md.
// These two suites cover scripts/, so that harness cannot host them — and before
// this, neither had a teeth check at all. test-retrieval-bridge.mjs in
// particular read the script's SOURCE and asserted it contained the words
// "semantic recall", "exact search", "direct read", so it passed against a
// script whose steps 2 and 3 printed "completed" without doing anything.
//
// A mutation that does not land is a BROKEN HARNESS failure, never a pass.
//
// Restore is retried and swept from an exit hook, because a failed restore here
// leaves a real script broken in the working tree. That is not hypothetical: an
// earlier scratch version of this check left retrieval-bridge.mjs with its
// --max-results parsing gutted, and the defect was found by reading the file
// afterwards rather than by the check reporting it.

// fileURLToPath, not URL.pathname: on Windows the latter yields "/C:/Users/…",
// which string-concatenates into "C:\C:\Users\…".
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const abs = (rel) => join(REPO_ROOT, rel);

function rewriteWithFreshHash(path, content) {
  const match = /<!-- VITRUVIUS-COMPILED-SKILL:BEGIN v1 sha256=([0-9a-f]{64}) -->/.exec(content);
  if (!match) return content;
  const [, oldHash] = match;
  const body = content.slice(content.indexOf("-->", match.index) + 3);
  return content.replace(oldHash, createHash("sha256").update(body).digest("hex"));
}

const CASES = [
  {
    file: "scripts/retrieval-bridge.mjs",
    rule: "exact search excludes node_modules and .git",
    find: /const SEARCH_EXCLUDE = new Set\(\["node_modules", "\.git", "outputs", "\.codegraph", "ref"\]\);/,
    replace: "const SEARCH_EXCLUDE = new Set([]);",
    test: "tests/engineering-research/test-retrieval-bridge.mjs",
  },
  {
    file: "scripts/retrieval-bridge.mjs",
    rule: "codegraph invoked with an argv array, not a shell string",
    find: /execFileSync\("codegraph", \["explore", query\]/,
    replace: 'execSync(`codegraph explore "${query}"`,',
    test: "tests/engineering-research/test-retrieval-bridge.mjs",
  },
  {
    file: "scripts/retrieval-bridge.mjs",
    rule: "maxResults is parsed from argv",
    find: /args\.maxResults = parseInt\(argv\[i \+ 1\], 10\);/,
    replace: "args.maxResults = 5;",
    test: "tests/engineering-research/test-retrieval-bridge.mjs",
  },
  {
    file: "scripts/retrieval-bridge.mjs",
    rule: "the CLI returns non-zero with no query",
    find: /return 1;\n  \}/,
    replace: "return 0;\n  }",
    test: "tests/engineering-research/test-retrieval-bridge.mjs",
  },
  {
    file: "scripts/retrieval-bridge.mjs",
    rule: "directRead returns null for a missing file rather than throwing",
    find: /if \(!existsSync\(full\)\) return null;/,
    replace: "if (!existsSync(full)) return 'placeholder';",
    test: "tests/engineering-research/test-retrieval-bridge.mjs",
  },
  {
    file: "scripts/run-isolated-tests.mjs",
    rule: "the runner reads its test list from disk",
    find: /const testFiles = readdirSync\(testDir\)/,
    replace: "const testFiles = [];",
    test: "tests/engineering-research/test-isolated-tests.mjs",
  },
  {
    file: "scripts/run-isolated-tests.mjs",
    rule: "a failing skill suite propagates a non-zero exit",
    find: /if \(result\.status === 0\) \{/,
    replace: "if (result.status !== 999) {",
    test: "tests/engineering-research/test-isolated-tests.mjs",
  },
  // The security-scan allowlist, stolen from src-05 scripts/npm-audit.mjs
  // on 2026-09-29. A waiver list is the easiest thing in this repo to add as
  // decoration: it can be written, referenced, and never once suppress
  // anything. Each case below removes one rule and requires the suite to notice.
  {
    file: "scripts/security-scan.mjs",
    rule: "a waiver without a reason is invalid",
    find: /const WAIVER_FIELDS = \["file", "rule", "reason", "removeWhen"\];/,
    replace: 'const WAIVER_FIELDS = ["file", "rule", "removeWhen"];',
    test: "tests/engineering-research/test-security-scan-waivers.mjs",
  },
  {
    file: "scripts/security-scan.mjs",
    rule: "a waiver without a removal condition is invalid",
    find: /const WAIVER_FIELDS = \["file", "rule", "reason", "removeWhen"\];/,
    replace: 'const WAIVER_FIELDS = ["file", "rule", "reason"];',
    test: "tests/engineering-research/test-security-scan-waivers.mjs",
  },
  {
    file: "scripts/security-scan.mjs",
    rule: "an incomplete waiver cannot suppress the finding it names",
    find: /const usable = waivers\.filter\(\(w\) =>\n    WAIVER_FIELDS\.every\(\(k\) => typeof w\?\.\[k\] === "string" && w\[k\]\.trim\(\) !== ""\),\n  \);/,
    replace: "const usable = waivers;",
    test: "tests/engineering-research/test-security-scan-waivers.mjs",
  },
  {
    file: "scripts/security-scan.mjs",
    rule: "a waiver matching no finding is reported stale",
    find: /const stale = usable\.filter\(\(w\) => !used\.has\(`\$\{w\.file\}\|\$\{w\.rule\}`\)\);/,
    replace: "const stale = [];",
    test: "tests/engineering-research/test-security-scan-waivers.mjs",
  },
  {
    file: "scripts/security-scan.mjs",
    rule: "a waiver survives the finding moving down the file",
    // Anchored on the current matcher. The old anchor was the single-line
    // `usable.find((w) => w.file === ... && w.rule === ...)`, which the
    // maxFindings work replaced with a multi-line predicate — so this pattern
    // stopped matching and the case silently became vacuous. The teeth harness
    // reporting a broken harness is what caught it.
    //
    // The mutation now introduces a line pin, which the suite must reject: a
    // line-keyed waiver rots the moment anyone edits above the finding.
    find: /      if \(w\.file !== finding\.file \|\| w\.rule !== finding\.rule\) return false;/,
    replace:
      "      if (w.file !== finding.file || w.rule !== finding.rule) return false;\n" +
      "      if (typeof w.line === 'number' && w.line !== finding.line) return false;",
    test: "tests/engineering-research/test-security-scan-waivers.mjs",
  },
  {
    file: "scripts/security-scan.mjs",
    rule: "a waiver for one rule does not allow a different rule",
    find: /      if \(typeof w\.maxFindings === "number" && capOf\(w\) <= 0\) return false;/,
    replace: "",
    test: "tests/engineering-research/test-security-scan-waivers.mjs",
  },
  // The regression the maxFindings work was written for: a file+rule waiver
  // must not absorb a THIRD dangerous call added to the same file. This is the
  // case that would have caught the real `eval` that got waived silently.
  {
    file: "scripts/security-scan.mjs",
    rule: "a waiver cannot absorb a finding beyond the count it names",
    find: /      if \(typeof w\.maxFindings === "number" && capOf\(w\) <= 0\) return false;\n      return true;/,
    replace: "      return true;",
    test: "tests/engineering-research/test-security-scan-waivers.mjs",
  },
  // P5, stolen from src-06 scripts/validate-package.py:61 (MIT, 225a6f3).
  // The old test hardcoded `.claude-plugin/plugin.json`, which is how
  // `.qoder-plugin/plugin.json` came to sit unchecked beside it. These cases
  // mutate the manifests, not a script, so the version is replaced by
  // regex rather than a literal — a release bump must not silently disarm them.
  {
    file: ".qoder-plugin/plugin.json",
    rule: "a plugin manifest whose version drifts from package.json is caught",
    find: /"version":\s*"[^"]+"/,
    replace: '"version": "0.0.0-drift"',
    test: "tests/engineering-research/test-version-sync.mjs",
  },
  {
    file: ".claude-plugin/plugin.json",
    rule: "a plugin manifest whose version drifts from package.json is caught",
    find: /"version":\s*"[^"]+"/,
    replace: '"version": "0.0.0-drift"',
    test: "tests/engineering-research/test-version-sync.mjs",
  },
  {
    file: ".qoder-plugin/plugin.json",
    rule: "a plugin manifest whose name drifts from package.json is caught",
    find: /"name":\s*"[^"]+"/,
    replace: '"name": "not-vitruvius"',
    test: "tests/engineering-research/test-version-sync.mjs",
  },
  // P1, stolen from src-05 src/telemetry/posthog.ts:51 (MIT, cd72f97).
  // The defect is a hang, so each mutation below must make the suite stop
  // rather than merely print something different. Two of the three do that by
  // removing the deadline entirely, which is why the suite bounds its own cases.
  {
    file: "skills/scholarly-research/scripts/extract-pdf.mjs",
    rule: "a download is bounded — no AbortSignal reaches fetch",
    find: /    signal: composed,\n/,
    replace: "",
    test: "tests/scholarly-research/test-extract-pdf.mjs",
  },
  {
    file: "skills/scholarly-research/scripts/extract-pdf.mjs",
    rule: "the caller's budget is the one applied",
    find: /const budget = AbortSignal\.timeout\(budgetMs\);/,
    replace: "const budget = AbortSignal.timeout(3_600_000);",
    test: "tests/scholarly-research/test-extract-pdf.mjs",
  },
  // --- SSRF: the redirect that was the traversal -------------------------
  // `redirect: 'follow'` handed every hop to the transport unchecked, so a
  // public URL answering 302 Location: http://169.254.169.254/ reached the
  // cloud metadata service. These two cases are the SSRF guard's teeth: one
  // removes the manual-redirect rule, the other removes the address check that
  // the walk depends on.
  {
    file: "skills/scholarly-research/scripts/extract-pdf.mjs",
    rule: "redirects are followed by hand so each hop is re-validated",
    find: /      redirect: 'manual',\n/,
    replace: "      redirect: 'follow',\n",
    test: "tests/scholarly-research/test-extract-pdf-ssrf.mjs",
  },
  {
    file: "skills/scholarly-research/scripts/extract-pdf.mjs",
    rule: "a host that resolves to a private address is refused",
    find: /  if \(isPrivateAddress\(host\)\) \{/,
    replace: "  if (false) {",
    test: "tests/scholarly-research/test-extract-pdf-ssrf.mjs",
  },
  {
    file: "skills/scholarly-research/scripts/extract-pdf.mjs",
    rule: "the budget is composed with the caller's signal, not replaced by it",
    find: /const composed = signal \? AbortSignal\.any\(\[signal, budget\]\) : budget;/,
    replace: "const composed = signal ? signal : budget;",
    test: "tests/scholarly-research/test-extract-pdf.mjs",
  },
  // The ledger test dated its own fixtures 2026-09-26. The append-only guard
  // refuses a row older than the newest real rejection, so the first 2026-09-29
  // ledger entry made this suite fail — on a date it had written itself, while
  // asserting a valid ledger was malformed. Restoring the hardcoded date would
  // re-break it at the next rejection, so the case removes the derivation.
  {
    file: "tests/contracts/test-rejected-change-ledger.mjs",
    rule: "ledger fixtures are dated relative to the newest real row",
    find: /const lastRowDate = \[\.\.\.base\.matchAll\(.*\)\]\.at\(-1\)\?\.\[1\];/,
    replace: 'const lastRowDate = "2026-09-26";',
    test: "tests/contracts/test-rejected-change-ledger.mjs",
  },
  // The map's own self-check, added 2026-09-29. It runs in npm test and gates
  // this repo's published numbers, and until now nothing proved any of its rules
  // could fail. These cases remove the rule and require the suite to notice.
  {
    file: "scripts/steal-selfcheck.mjs",
    rule: "a bold pair with no adjacent name is still the suite floor",
    find: /: saysSuite \|\| bold \? "suite" : null;/,
    replace: ': saysSuite ? "suite" : null; // mutated: the bold signal is gone',
    test: "tests/engineering-research/test-steal-selfcheck.mjs",
  },
  {
    file: "scripts/steal-selfcheck.mjs",
    rule: "a wrong suite floor is refused",
    find: /if \(claimed !== withSuite\) \{/,
    replace: "if (false) {",
    test: "tests/engineering-research/test-steal-selfcheck.mjs",
  },
  {
    file: "scripts/steal-selfcheck.mjs",
    rule: "the model-run catalog is not misread as the suite floor",
    find: /const counter = saysCatalog && !saysSuite \? "catalog"/,
    replace: 'const counter = saysSuite || bold ? "suite" : null; const _unused = saysCatalog && "catalog"',
    test: "tests/engineering-research/test-steal-selfcheck.mjs",
  },
  {
    file: "scripts/steal-selfcheck.mjs",
    rule: "a historical floor value is not read as a present-tense claim",
    find: /if \(\/->\|→\|\\bwas\\b\|formerly\/i\.test\(line\)\) continue;/,
    replace: "// mutated: history is read as a live claim",
    test: "tests/engineering-research/test-steal-selfcheck.mjs",
  },
  // The commit rule, added 2026-09-29. A commit-message checker is the easiest
  // gate in the repo to write as decoration: it can pass every message forever
  // while refusing nothing. Each case below removes one rule and requires the
  // suite to notice.
  {
    file: "scripts/commit-message-check.mjs",
    rule: "a vague subject asserting no finding is refused",
    find: /export const VAGUE_SUBJECTS = \[/,
    replace: "export const VAGUE_SUBJECTS = [\n];\nconst _unusedVague = [",
    test: "tests/engineering-research/test-commit-message-check.mjs",
  },
  {
    file: "scripts/commit-message-check.mjs",
    rule: "a non-imperative subject is refused",
    find: /const NON_IMPERATIVE = \[/,
    replace: "const NON_IMPERATIVE = [\n];\nconst _unusedMood = [",
    test: "tests/engineering-research/test-commit-message-check.mjs",
  },
  {
    file: "scripts/commit-message-check.mjs",
    rule: "a non-allowed type is refused",
    find: /if \(!TYPES\.includes\(type\)\) \{/,
    replace: "if (false) {",
    test: "tests/engineering-research/test-commit-message-check.mjs",
  },
  {
    file: "scripts/commit-message-check.mjs",
    rule: "a message with no Conventional header is refused",
    find: /if \(!match\) \{/,
    replace: "if (false) {",
    test: "tests/engineering-research/test-commit-message-check.mjs",
  },
  {
    file: "scripts/commit-message-check.mjs",
    rule: "a trailing period is refused",
    find: /if \(\/\[\.\]\\s\*\$\/\.test\(subject\)\) \{/,
    replace: "if (false) {",
    test: "tests/engineering-research/test-commit-message-check.mjs",
  },
  {
    file: "scripts/commit-message-check.mjs",
    rule: "N7 — a skill edit without a version bump is refused",
    find: /if \(before === after\) \{/,
    replace: "if (false) {",
    test: "tests/engineering-research/test-commit-message-check.mjs",
  },
  {
    file: "scripts/commit-message-check.mjs",
    rule: "N7 — a skill edit with an unreadable version is refused, not skipped",
    find: /if \(before === undefined \|\| after === undefined\) \{/,
    replace: "if (false) {",
    test: "tests/engineering-research/test-commit-message-check.mjs",
  },
];

function writeWithRetry(path, contents, attempts = 5) {
  for (let i = 1; ; i++) {
    try {
      writeFileSync(path, contents, "utf8");
      return;
    } catch (err) {
      if (i >= attempts) throw err;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50 * i);
    }
  }
}

const snapshots = new Map();
for (const c of CASES) {
  const a = abs(c.file);
  if (!snapshots.has(a)) snapshots.set(a, readFileSync(a, "utf8"));
}
const originalFor = (rel) => snapshots.get(abs(rel));

function restoreAll() {
  const failed = [];
  for (const [file, original] of snapshots) {
    try {
      writeWithRetry(file, original);
    } catch (err) {
      failed.push(`${file}: ${err.message}`);
    }
  }
  return failed;
}

process.on("exit", () => {
  if (snapshots.size === 0) return;
  const failed = restoreAll();
  if (failed.length > 0) {
    console.error(`\nFATAL: could not restore ${failed.length} mutated script(s):\n  ${failed.join("\n  ")}`);
    process.exitCode = 1;
  }
});

let allDetected = true;
const vacuous = [];
const broken = [];

for (const c of CASES) {
  const relFile = c.file;
  const a = abs(relFile);
  const original = originalFor(relFile);
  const afterReplace = original.replace(c.find, c.replace);

  if (afterReplace === original) {
    console.log(`  BROKEN HARNESS: ${c.file} — "${c.rule}" did not match`);
    allDetected = false;
    broken.push(`${c.file}: ${c.rule}`);
    continue;
  }

  let status;
  let output = "";
  try {
    writeWithRetry(a, rewriteWithFreshHash(relFile, afterReplace));
    const run = spawnSync("node", [c.test], { encoding: "utf8", cwd: REPO_ROOT });
    status = run.status;
    output = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  } finally {
    writeWithRetry(a, original);
  }

  if (status === 0) {
    console.log(`  NOT DETECTED: ${c.file} — "${c.rule}" removed, suite still passed`);
    allDetected = false;
    vacuous.push(`${c.file}: ${c.rule}`);
  } else {
    const caught = /AssertionError.*?: (.*)/.exec(output);
    console.log(`  detected: ${c.file} — "${c.rule}"`);
    if (caught) console.log(`             caught by: ${caught[1].slice(0, 100)}`);
  }
}

// The restore must leave each file byte-identical to what it was at snapshot
// time. Compared against the snapshot, not git, because these scripts have
// legitimate uncommitted fixes in flight.
const stillDirty = [...snapshots].filter(([f, before]) => {
  try {
    return readFileSync(f, "utf8") !== before;
  } catch {
    return true;
  }
});
if (stillDirty.length > 0) {
  console.log(`\n  DIRTY AFTER RESTORE — ${stillDirty.map(([f]) => f).join(", ")}`);
  allDetected = false;
} else {
  console.log("  all mutated scripts restored byte-for-byte");
}

console.log(
  allDetected
    ? `\nPASS: all ${CASES.length} script-level assertions fail when their rule is removed, and every file is restored`
    : "\nFAIL: a script-level assertion is vacuous, the harness is broken, or a file was left dirty" +
        (vacuous.length ? `\n  vacuous: ${vacuous.join("; ")}` : "") +
        (broken.length ? `\n  broken harness: ${broken.join("; ")}` : ""),
);
process.exit(allDetected ? 0 : 1);
