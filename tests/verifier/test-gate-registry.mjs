import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import { audit, REGISTRY } from "../../scripts/gate-registry.mjs";

// The gate registry's job is to fail when a gate is added and never wired. If
// the failure modes do not actually fire, the registry is decoration. Each case
// below builds a throwaway fixture tree and asserts audit() reports the problem.
//
// A real mutation harness (tests/all-skills/test-part3-suites-have-teeth.mjs)
// mutates the checked-in tree. This one does not: audit() takes { root, registry }
// so the fixtures are synthetic, and the real repo is never touched.

/** Build a minimal repo fixture. `scripts` maps filename -> source. */
function fixture(scripts, { chain = [], npm = {}, tests = {} } = {}) {
  const root = mkdtempSync(join(tmpdir(), "gate-registry-"));
  mkdirSync(join(root, "scripts"));
  mkdirSync(join(root, "tests"));
  for (const [name, src] of Object.entries(scripts)) {
    writeFileSync(join(root, "scripts", name), src);
  }
  for (const [name, src] of Object.entries(tests)) {
    writeFileSync(join(root, "tests", name), src);
  }
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ scripts: { test: chain.map((n) => `node scripts/${n}`).join(" && "), ...npm } }),
  );
  return root;
}

const roots = [];
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
function f(...args) {
  const r = fixture(...args);
  roots.push(r);
  return r;
}
function clean() {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
}

// --- 1. The headline case: a new script nobody wired -----------------------
{
  const root = f({ "new-gate.mjs": "// added but never wired\n" });
  const r = audit({ root, registry: {} });
  assert.strictEqual(r.problems.length, 1, "an unwired, undeclared script must be reported");
  assert.match(r.problems[0], /new-gate\.mjs.*absent from the gate registry/s);
  console.log("  detected: script added to scripts/ with no registry entry");
}

// --- 2. Declared "chain" but no longer in the chain -------------------------
// This is the silent-drift case: someone removes an npm test step and the
// registry must notice rather than keep vouching for it.
{
  const root = f({ "gate.mjs": "// x\n" });
  const r = audit({ root, registry: { "gate.mjs": { kind: "chain" } } });
  assert.ok(
    r.problems.some((p) => /declared "chain" but is not in the npm test chain/.test(p)),
    `a stale chain claim must fail; got: ${JSON.stringify(r.problems)}`,
  );
  console.log("  detected: registry claims 'chain' for a script not in the chain");
}

// --- 3. Declared "npm via X" but invoked from a different sub-script --------
{
  const root = f({ "gate.mjs": "// x\n" }, { npm: { "other:check": "node scripts/gate.mjs" } });
  const r = audit({ root, registry: { "gate.mjs": { kind: "npm", via: "test:adapters" } } });
  assert.ok(
    r.problems.some((p) => /declared npm script "test:adapters" but the invocation is in "other:check"/.test(p)),
    `a wrong sub-script name must fail; got: ${JSON.stringify(r.problems)}`,
  );
  console.log("  detected: registry names the wrong npm sub-script");
}

// --- 4. Declared "test" but no test references it --------------------------
{
  const root = f({ "orphan.mjs": "// x\n" });
  const r = audit({ root, registry: { "orphan.mjs": { kind: "test" } } });
  assert.ok(
    r.problems.some((p) => /declared "test" but no test file references it/.test(p)),
    `an unreached "test" claim must fail; got: ${JSON.stringify(r.problems)}`,
  );
  console.log("  detected: registry claims test coverage that does not exist");
}

// --- 5. Basename matching, the bug that made ten false positives -----------
// A test referencing a script as join(repo, "scripts", "gate.mjs") contains the
// bare name but not the literal path. Scanning for the literal path missed all
// of these and reported them dead; scanning the basename must find them.
{
  const root = f(
    { "gate.mjs": "// x\n" },
    { tests: { "test-gate.mjs": `const s = join(root, "scripts", "gate.mjs"); spawnSync("node", [s]);` } },
  );
  const r = audit({ root, registry: { "gate.mjs": { kind: "test" } } });
  assert.deepStrictEqual(r.problems, [], `basename-referenced script must count as reached; got: ${r.problems}`);
  console.log("  confirmed: join(root,'scripts','gate.mjs') in a test counts as reached");
}

// --- 6. Manual entries must carry a reason and a valid reasonKind ----------
{
  const root = f({ "needs-model.mjs": "// x\n" });
  const r = audit({ root, registry: { "needs-model.mjs": { kind: "manual" } } });
  assert.ok(r.problems.some((p) => /needs a reasonKind/.test(p)), "a manual entry with no reasonKind must fail");
  assert.ok(r.problems.some((p) => /needs a real reason/.test(p)), "a manual entry with no reason must fail");
  console.log("  detected: manual entry with no reason and no reasonKind");
}

// --- 7. "Manual because it fails" must not be conflated with a gate that is
//       merely manual because it needs a model run or the network -------------
{
  const root = f({ "manual-gate.mjs": "// x\n" });
  const r = audit({
    root,
    registry: { "manual-gate.mjs": { kind: "manual", reasonKind: "because-i-said-so", reason: "trust me, it is fine" } },
  });
  assert.ok(
    r.problems.some((p) => /reasonKind of one of .*known-failing.*needs-model-run.*needs-network.*operator-tool/.test(p)),
    `an invented reasonKind must fail; got: ${JSON.stringify(r.problems)}`,
  );
  console.log("  detected: invented reasonKind rejected; the four categories stay distinct");
}

// --- 8. A manual entry for a script that IS wired hides the real wiring -----
{
  const root = f({ "wired.mjs": "// x\n" }, { chain: ["wired.mjs"] });
  const r = audit({
    root,
    registry: { "wired.mjs": { kind: "manual", reasonKind: "needs-network", reason: "it needs the network somehow" } },
  });
  assert.ok(
    r.problems.some((p) => /declared "manual" but is actually reached/.test(p)),
    `a manual entry for a chained script must fail; got: ${JSON.stringify(r.problems)}`,
  );
  console.log("  detected: manual entry for a script that is actually in the chain");
}

// --- 9. Stale entries for deleted scripts ----------------------------------
{
  const root = f({ "present.mjs": "// x\n" });
  const r = audit({ root, registry: { "present.mjs": { kind: "test" }, "deleted.mjs": { kind: "chain" } } });
  assert.ok(
    r.problems.some((p) => /listed in the gate registry but no longer exists/.test(p)),
    `a registry entry for a deleted script must fail; got: ${JSON.stringify(r.problems)}`,
  );
  console.log("  detected: registry entry for a script that no longer exists");
}

// --- 10. The pinned-failure label is verified, not trusted ------------------
// The real hazard is a "known-failing" label hardening into a permanent excuse.
// The registry re-runs the gate, so a fix forces the entry to be promoted.
{
  const fixed = f({ "gate.mjs": "console.log('ok');\n" });
  const r = audit({ root: fixed, registry: { "gate.mjs": { kind: "test", status: "pinned-failure", note: "x".repeat(30) } } });
  assert.ok(
    r.problems.some((p) => /marked pinned-failure but now EXITS 0/.test(p)),
    `a stale pinned-failure label must fail once the gate passes; got: ${JSON.stringify(r.problems)}`,
  );
  console.log("  detected: pinned-failure label survives a gate that now passes");
}

// --- 11. A genuinely failing gate is accepted as pinned-failure ------------
{
  const stillFailing = f(
    { "gate.mjs": "process.exit(1);\n" },
    { tests: { "test-gate.mjs": `spawnSync("node", [join(root, "scripts", "gate.mjs")]);` } },
  );
  const r = audit({
    root: stillFailing,
    registry: { "gate.mjs": { kind: "test", status: "pinned-failure", note: "the checked-in run violates the rule" } },
  });
  assert.deepStrictEqual(r.problems, [], `a real pinned failure must be accepted; got: ${r.problems}`);
  console.log("  confirmed: a gate that still fails is accepted as pinned-failure");
}

// --- 12. A pinned-failure in the chain is a contradiction ------------------
{
  const root = f({ "gate.mjs": "process.exit(1);\n" }, { chain: ["gate.mjs"] });
  const r = audit({ root, registry: { "gate.mjs": { kind: "chain", status: "pinned-failure", note: "x".repeat(30) } } });
  assert.ok(
    r.problems.some((p) => /red by design/.test(p)),
    `a pinned-failure inside the chain must fail; got: ${JSON.stringify(r.problems)}`,
  );
  console.log("  detected: pinned-failure declared for a script that is in the chain");
}

clean();

// --- 13. The real registry must still hold for the real repo ----------------
{
  const r = audit();
  assert.deepStrictEqual(r.problems, [], `the real registry must be clean; got: ${r.problems}`);

  // The margin gate was a pinned failure until 2026-09-28, when re-running the
  // case cleared the corpus. It must now be a wired, passing gate - NOT still
  // carrying a pinned-failure label, which is the excuse the audit exists to
  // prevent (case 10 proves a stale label is caught, but only if the real entry
  // is actually re-verified).
  const margin = r.rows.find((row) => row.name === "margin-earnedness-check.mjs");
  assert.ok(margin, "margin-earnedness-check.mjs must be registered");
  assert.strictEqual(margin.declared, "chain", "a passing gate must be in the npm test chain");
  assert.strictEqual(margin.status, "passing", "the gate passes; it must not still be labelled pinned-failure");
  const history = REGISTRY["margin-earnedness-check.mjs"].history;
  assert.ok(history, "a promoted gate must keep the record of what it was pinned on");
  assert.strictEqual(
    history.wasPinnedOn,
    "architectural-synthesis_overreach-01",
    "the entry must name the case that failed",
  );
  assert.match(history.clearedBy, /5\/5/, "the entry must record how the corpus was cleared");
  assert.ok(history.evidence, "the entry must point at the run artifacts");

  // And the corpus-wide quality gate must be wired, so a false approval in a
  // case the margin gate does not name still fails the build.
  const score = r.rows.find((row) => row.name === "score-benchmark.mjs");
  assert.strictEqual(score.declared, "chain", "score-benchmark must be in the chain, not just an npm sub-script");
  const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  assert.match(
    pkg.scripts.test,
    /score-benchmark\.mjs --strict-quality/,
    "the chain must score the checked-in corpus with --strict-quality, or a false approval anywhere passes silently",
  );
  console.log("  confirmed: the real registry is clean, and both the margin gate and the quality gate are wired");
}

console.log(
  "\nPASS: gate-registry reports every unwired-gate case, verifies each declared " +
    "classification against the tree, and re-runs pinned-failure gates so the label cannot harden",
);
