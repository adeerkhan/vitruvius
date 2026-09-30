#!/usr/bin/env node
// gate-registry.mjs — every script must declare how it is reached, and the
// declaration is verified rather than trusted.
//
// Motivation: a gate that is added and never wired produces the same silence as
// a gate that does not exist, but worse, because it reads as coverage.
// scripts/margin-earnedness-check.mjs is the live example — it is not in the
// test chain, because it correctly FAILS on the checked-in verifier run. That
// is a decision, and this registry is where it lives. Before the registry the
// decision lived nowhere.
//
// What this does NOT do: infer. Every classification below is re-derived from
// the tree at run time and a stale claim fails. An earlier attempt at this
// scanned for the literal string "scripts/<name>.mjs" and reported ten scripts
// as unreached; every one was a false positive, because tests build paths with
// join(repoRoot, "scripts", "<name>.mjs") and the literal never appears. A
// check that cries wolf about dead code gets ignored about real dead code.
//
// Usage: node scripts/gate-registry.mjs [--json] [--explain <name>]

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(__dirname, "..");

/**
 * kind:
 *   chain  — invoked in the npm `test` chain
 *   npm    — invoked by a named npm sub-script
 *   test   — reached by at least one test file (imported or spawned)
 *   manual — reached by no npm script; REQUIRES reason + reasonKind
 *
 * reasonKind (manual only, and deliberately not interchangeable):
 *   known-failing  — the gate correctly fails on checked-in data. Wiring it
 *                    into the chain would red the build by design, so a test
 *                    pins the failure instead.
 *   needs-model-run— needs a verifier/model run to produce its input.
 *   needs-network  — needs outbound network.
 *   operator-tool  — a generator or maintenance utility, not a gate.
 */
export const REGISTRY = {
  // --- Invoked in the npm test chain -------------------------------------
  "check-node-version.mjs": { kind: "chain" },
  "validate-contract.mjs": { kind: "chain" },
  "validate-artifact-paths.mjs": { kind: "chain" },
  "security-scan.mjs": { kind: "chain" },
  "rejected-change-ledger.mjs": { kind: "chain" },
  "benchmark-claims-check.mjs": { kind: "chain" },
  // Checked by .githooks/commit-msg, which is opt-in per clone
  // (`git config core.hooksPath .githooks`) — a committed hook is not run by
  // anyone who has not enabled it, so the suite below is what makes the rule
  // survive a fresh clone. Reached by tests/engineering-research/
  // test-commit-message-check.mjs, which also asserts this entry exists.
  "commit-message-check.mjs": { kind: "test" },
  "reference-reachability.mjs": { kind: "chain" },
  "gate-registry.mjs": { kind: "chain" },
  "steal-selfcheck.mjs": { kind: "chain" },
  // Fails if .gitignore can hide a test, or a suite exists on disk without
  // being tracked. A bare `tests/*` rule once did exactly that: 103 suites
  // stayed tracked because they predated it, and every new test was silently
  // ignored, so it ran locally and did not exist in any clone.
  "tests-check.mjs": { kind: "chain" },
  // Scored with --strict-quality, so a false approval or false block anywhere in
  // the checked-in corpus fails the build. This was available but unwired until
  // 2026-09-28, which meant a bad result in any case other than the one the
  // margin gate names would have passed silently.
  "score-benchmark.mjs": { kind: "chain" },

  // --- Invoked by a named npm sub-script, not the chain ------------------
  "artifact-closure.mjs": { kind: "npm", via: "check:local-artifacts" },
  "check-output-quality.mjs": { kind: "npm", via: "check:local-artifacts" },
  "validate-artifacts.mjs": { kind: "npm", via: "check:local-artifacts" },
  "majority-benchmark.mjs": { kind: "npm", via: "benchmark:majority" },

  // --- Reached by tests, invoked only via npm sub-scripts ----------------
  // Promoted from "test" to "chain" on 2026-09-28. It used to always exit 0,
  // so it could print a coverage number that nothing could contradict: a skill
  // could have lost its suite with a green build. It is a reporter only under
  // --report, which exists so a human can inspect state without the gate firing.
  "e1-coverage.mjs": { kind: "chain" },
  "skill-payload-manifest.mjs": { kind: "test" },
  "generate-skill-diagram.mjs": { kind: "test" },
  "generate-adapters.mjs": { kind: "test" },
  "run-isolated-tests.mjs": { kind: "test" },
  "margin-earnedness-check.mjs": {
    kind: "chain",
    history: {
      // Promoted from pinned-failure to chain on 2026-09-28. The gate correctly
      // failed on the checked-in architectural-synthesis_overreach-01 result,
      // which returned PASS while self-reporting a 6.7% margin under the 10% cap
      // in agents/verifier.md. Re-running that case with the canonical runner
      // (tasks/benchmark/run-opencode.sh) produced PARTIAL / synthesis_overreach
      // in five of five independent runs, matching ground truth, so the corpus is
      // now clean and the gate belongs in the chain. Evidence:
      // tasks/benchmark/results-opencode/, tasks/benchmark/RESULTS.md.
      wasPinnedOn: "architectural-synthesis_overreach-01",
      clearedBy: "5/5 canonical re-runs returning PARTIAL / synthesis_overreach",
      clearedOn: "2026-09-28",
      evidence: "tasks/benchmark/results-opencode/README.md",
    },
  },

  // --- Reached by tests as imported modules ------------------------------
  // path-safety.mjs holds the single definition of isSafeRelativePath and
  // isInside, which five and four call sites previously each re-implemented.
  // A security control with four definitions is a control where a fix can land
  // in one copy and leave the others vulnerable.
  "path-safety.mjs": { kind: "test" },
  "yaml-frontmatter.mjs": { kind: "test" },
  "verifier-parser.mjs": { kind: "test" },
  "benchmark-scoring.mjs": { kind: "test" },
  "problem-anchor-contract.mjs": { kind: "test" },
  "goal-check-contract.mjs": { kind: "test" },
  "field-pilot-contract.mjs": { kind: "test" },
  "entailment.mjs": { kind: "test" },
  "command-contract.mjs": { kind: "test" },
  "eval-contract.mjs": { kind: "test" },
  "fixed-case.mjs": { kind: "test" },
  "habit-ledger.mjs": { kind: "test" },
  "log-run.mjs": { kind: "test" },
  "record-evidence.mjs": { kind: "test" },
  "validate-evidence.mjs": { kind: "test" },
  "extract-document.mjs": { kind: "test" },
  "extract-pdf.mjs": { kind: "test" },
  "retrieval-bridge.mjs": { kind: "test" },

  // --- Reached by tests as spawned CLIs ---------------------------------
  "semantic-near-dup.mjs": { kind: "test" },
  "citation-audit.mjs": { kind: "test" },
  "result-provenance-audit.mjs": { kind: "test" },
};

const VALID_KINDS = new Set(["chain", "npm", "test", "manual"]);
const VALID_REASON_KINDS = new Set(["known-failing", "needs-model-run", "needs-network", "operator-tool"]);
const VALID_STATUS = new Set(["passing", "pinned-failure"]);

function testFiles(root) {
  const out = [];
  (function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name === ".git") continue;
        walk(p);
      } else if (e.name.endsWith(".mjs")) out.push(p);
    }
  })(join(root, "tests"));
  return out;
}

/**
 * Does this test file genuinely EXECUTE the script, or merely name it?
 *
 * A mention is not coverage. `existsSync(join(root, "scripts", name))` in an
 * assertion, or the filename in a comment, proves the file is on disk — which
 * is the "weakly accept a script that is merely present" failure this registry
 * exists to prevent. Counting those as `test` let a script with a syntax error
 * sit in the tree declaring itself covered: scripts/run-isolated-tests.mjs used
 * `await` inside a non-async function, so it could never run, and the only test
 * referencing it called existsSync on it.
 */
const SPAWNS_A_PROCESS = /\b(spawnSync|spawn|execFileSync|execSync|exec)\s*\(/;

function executesIn(name, text) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const referenced = new RegExp(escaped).test(text);
  if (!referenced) return false;

  // A module import is execution by definition: the code is loaded and its
  // exports run in this process.
  if (new RegExp(`from\\s+["'][^"']*scripts/${escaped}["']`).test(text)) return true;

  // Otherwise the script is a child process, which requires the file to spawn
  // something. Requiring BOTH the name and a spawn call is what separates
  // real execution from an existence check: existsSync(join(root, "scripts",
  // "name.mjs")) names the script and nothing else, and it proves only that
  // the file is on disk.
  return SPAWNS_A_PROCESS.test(text);
}

function mentionedIn(name, text) {
  return new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(text);
}

/**
 * Reachability, derived not declared.
 *
 * Basename matching is deliberate. Tests reference scripts as
 * join(repoRoot, "scripts", "name.mjs"), so the literal path string does not
 * appear; matching the bare filename catches both forms. Matching a bare
 * filename could in principle collide, so the search is scoped to test files
 * and this file's own registry.
 */
function reach(name, root) {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const scripts = pkg.scripts ?? {};
  const rel = `scripts/${name}`;

  if ((scripts.test ?? "").includes(`node ${rel}`)) return { reached: true, how: "chain" };

  for (const [scriptName, body] of Object.entries(scripts)) {
    if (typeof body === "string" && body.includes(`node ${rel}`)) {
      return { reached: true, how: "npm", via: scriptName };
    }
  }

  let mentionedOnly = null;
  for (const t of testFiles(root)) {
    let text;
    try {
      text = readFileSync(t, "utf8");
    } catch {
      continue;
    }
    if (executesIn(name, text)) {
      return { reached: true, how: "test", via: t.split(/[\\/]/).slice(-2).join("/") };
    }
    if (!mentionedOnly && mentionedIn(name, text)) {
      mentionedOnly = t.split(/[\\/]/).slice(-2).join("/");
    }
  }

  // Named but never executed. Reported separately so it cannot be mistaken for
  // coverage — this is the "present on disk" case the registry must reject.
  return mentionedOnly ? { reached: false, how: "mentioned-only", via: mentionedOnly } : { reached: false, how: null };
}

export function audit({ root = REPO_ROOT, registry = REGISTRY } = {}) {
  const scriptsDir = join(root, "scripts");
  const onDisk = readdirSync(scriptsDir).filter((f) => f.endsWith(".mjs")).sort();
  const problems = [];
  const rows = [];

  for (const name of onDisk) {
    const entry = registry[name];
    if (!entry) {
      problems.push(
        `${name}: present in scripts/ but absent from the gate registry. Wire it into an npm ` +
          `script, cover it with a test, or declare it manual with a reason. An undeclared ` +
          `script is indistinguishable from a forgotten one.`,
      );
      continue;
    }
    if (entry.kind === "skip") continue;

    if (!VALID_KINDS.has(entry.kind)) {
      problems.push(`${name}: unknown kind "${entry.kind}" (expected one of ${[...VALID_KINDS].join(", ")})`);
      continue;
    }
    if (entry.status !== undefined && !VALID_STATUS.has(entry.status)) {
      problems.push(`${name}: unknown status "${entry.status}" (expected one of ${[...VALID_STATUS].join(", ")})`);
      continue;
    }

    const r = reach(name, root);
    rows.push({ name, declared: entry.kind, status: entry.status ?? "passing", actual: r });

    if (entry.kind === "chain" && r.how !== "chain") {
      problems.push(`${name}: declared "chain" but is not in the npm test chain (actually ${r.how ?? "unreached"})`);
    }
    if (entry.kind === "npm") {
      if (r.how !== "npm") {
        problems.push(`${name}: declared "npm" via ${entry.via} but is reached by ${r.how ?? "nothing"}`);
      } else if (entry.via && r.via !== entry.via) {
        problems.push(`${name}: declared npm script "${entry.via}" but the invocation is in "${r.via}"`);
      }
    }
    if (entry.kind === "test" && !r.reached) {
      problems.push(`${name}: declared "test" but no test file references it; it is unreached`);
    }

    if (entry.kind === "manual") {
      if (r.reached) {
        problems.push(
          `${name}: declared "manual" but is actually reached (${r.how}${r.via ? `: ${r.via}` : ""}). ` +
            `If it is covered, declare how; a manual entry for a wired script hides the real wiring.`,
        );
      }
      if (!VALID_REASON_KINDS.has(entry.reasonKind)) {
        problems.push(
          `${name}: manual entry needs a reasonKind of one of ${[...VALID_REASON_KINDS].join(", ")}; ` +
            `got ${JSON.stringify(entry.reasonKind)}`,
        );
      }
      if (!entry.reason || String(entry.reason).trim().length < 20) {
        problems.push(`${name}: manual entry needs a real reason, not a placeholder`);
      }
    }

    // A "pinned-failure" label is a claim that a gate is still broken. It is
    // verified by running the gate, so the label cannot harden into an excuse:
    // the moment the underlying defect is fixed, this check fails and forces
    // the entry to be promoted to the chain.
    if (entry.status === "pinned-failure") {
      if (!entry.note || String(entry.note).trim().length < 20) {
        problems.push(`${name}: a pinned-failure entry needs a note saying what is broken and how to clear it`);
      }
      if (r.how === "chain") {
        problems.push(
          `${name}: is marked pinned-failure but IS in the npm test chain, so the build is red by ` +
            `design. Either the defect is fixed (remove the status) or the entry is wrong.`,
        );
      }
      const run = spawnSync(process.execPath, [join(scriptsDir, name)], {
        encoding: "utf8",
        timeout: 120000,
      });
      if (run.status === 0) {
        problems.push(
          `${name}: is marked pinned-failure but now EXITS 0. The underlying defect appears to be ` +
            `fixed - remove the pinned-failure status and wire it into the test chain, or record why ` +
            `it is still excluded.`,
        );
      }
      if (run.error) {
        problems.push(`${name}: could not be executed to verify its pinned-failure status: ${run.error.message}`);
      }
    }
  }

  // Registry entries for scripts that no longer exist rot silently otherwise.
  for (const name of Object.keys(registry)) {
    if (!existsSync(join(scriptsDir, name))) {
      problems.push(`${name}: listed in the gate registry but no longer exists in scripts/`);
    }
  }

  return { onDisk: onDisk.length, registered: Object.keys(registry).length, rows, problems };
}

function main() {
  const result = audit();
  const explain = process.argv.indexOf("--explain");

  if (explain !== -1 && process.argv[explain + 1]) {
    const name = process.argv[explain + 1];
    const row = result.rows.find((r) => r.name === name);
    const entry = REGISTRY[name];
    console.log(`${name}`);
    console.log(`  declared: ${entry ? entry.kind : "(not registered)"}`);
    console.log(
      `  actual:   ${row ? `${row.actual.how}${row.actual.via ? ` (${row.actual.via})` : ""}` : "(unreached or unknown)"}`,
    );
    if (entry?.status) console.log(`  status:   ${entry.status}`);
    if (entry?.note) console.log(`  note:     ${entry.note}`);
    if (entry?.reason) console.log(`  reason:   ${entry.reason}`);
    process.exit(0);
  }

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.problems.length === 0) {
    const byKind = result.rows.reduce((acc, r) => {
      acc[r.declared] = (acc[r.declared] ?? 0) + 1;
      return acc;
    }, {});
    const pinned = result.rows.filter((r) => r.status === "pinned-failure").map((r) => r.name);
    console.log(
      `PASS: all ${result.onDisk} scripts are registered and every declaration is verified ` +
        `(${Object.entries(byKind).map(([k, v]) => `${v} ${k}`).join(", ")}` +
        `${pinned.length ? `, ${pinned.length} pinned-failure re-confirmed by running it` : ""})`,
    );
  } else {
    console.error(`FAIL: ${result.problems.length} gate-registry problem(s):\n`);
    for (const p of result.problems) console.error(`  ${p}`);
  }

  process.exit(result.problems.length > 0 ? 1 : 0);
}

// Only run as a CLI. Importing this module must have no side effects, or a test
// that merely imports `audit` would spawn every pinned-failure gate.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
