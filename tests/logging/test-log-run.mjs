import { strict as assert } from "node:assert";
import { closeSync, cpSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const logger = join(repoRoot, "scripts", "log-run.mjs");
const skillLogger = join(repoRoot, "skills", "engineering-research", "scripts", "log-run.mjs");
const tempRoot = mkdtempSync(join(tmpdir(), "vitruvius-run-ledger-"));
const runsDir = join(tempRoot, "runs");
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function run(args = [], input = "", directory = runsDir) {
  return spawnSync(process.execPath, [logger, ...args], {
    cwd: repoRoot,
    env: { ...process.env, VITRUVIUS_RUNS_DIR: directory },
    input,
    encoding: "utf-8",
  });
}

function spawnRun(script, args, input, directory) {
  return new Promise((resolveRun) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: repoRoot,
      env: { ...process.env, VITRUVIUS_RUNS_DIR: directory },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf-8");
    child.stderr.setEncoding("utf-8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (status) => resolveRun({ status, stdout, stderr }));
    child.stdin.end(input);
  });
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

function entries(directory = runsDir) {
  return readdirSync(directory)
    .filter((name) => name.endsWith(".jsonl"))
    .flatMap((name) => readFileSync(join(directory, name), "utf-8").trim().split("\n").filter(Boolean).map(JSON.parse));
}

try {
  const syntax = spawnSync(process.execPath, ["--check", logger], { encoding: "utf-8" });
  assert.equal(syntax.status, 0, syntax.stderr);
  const skillSyntax = spawnSync(process.execPath, ["--check", skillLogger], { encoding: "utf-8" });
  assert.equal(skillSyntax.status, 0, skillSyntax.stderr);

  const validInput = {
    skill: "engineering-research",
    topic: "demo",
    discipline: "software",
    phase: "verify",
    status: "completed",
    verdict: "PASS",
    sources_consulted: 2,
    claims_verified: 1,
    claims_blocked: 0,
    artifacts: ["outputs/demo.md"],
  };
  const valid = run([], JSON.stringify(validInput));
  assert.equal(valid.status, 0, valid.stderr);
  assert.match(valid.stdout, /Logged: [0-9a-f-]+/i);
  const first = entries();
  assert.equal(first.length, 1);
  assert.equal(first[0].schema, "run.v1");
  assert.match(first[0].run_id, uuidPattern);
  assert.match(first[0].timestamp, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(first[0].skill, validInput.skill);
  assert.equal(first[0].topic, validInput.topic);
  assert.equal(first[0].discipline, validInput.discipline);
  assert.equal(first[0].sources_consulted, validInput.sources_consulted);
  assert.equal(first[0].claims_verified, validInput.claims_verified);
  assert.equal(first[0].claims_blocked, validInput.claims_blocked);
  assert.equal(first[0].verdict, validInput.verdict);
  assert.deepEqual(first[0].artifacts, validInput.artifacts);
  const firstFiles = readdirSync(runsDir).filter((name) => name.endsWith(".jsonl"));
  assert.equal(firstFiles.length, 1);
  assert.equal(firstFiles[0], `${first[0].timestamp.slice(0, 10)}.jsonl`);

  const second = run([], JSON.stringify({ skill: "gap-analysis", status: "blocked", verdict: "BLOCKED" }));
  assert.equal(second.status, 0, second.stderr);
  assert.equal(entries().length, 2);
  assert.notEqual(entries()[0].run_id, entries()[1].run_id);

  const copiedProject = join(tempRoot, "copied-project");
  const copiedHelper = join(copiedProject, "helper", "log-run.mjs");
  mkdirSync(join(copiedProject, "helper"), { recursive: true });
  cpSync(skillLogger, copiedHelper);
  const copiedEnv = { ...process.env, VITRUVIUS_PROJECT_ROOT: copiedProject };
  delete copiedEnv.VITRUVIUS_RUNS_DIR;
  const copiedSkill = spawnSync(process.execPath, [copiedHelper], {
    cwd: copiedProject,
    env: copiedEnv,
    input: JSON.stringify({ skill: "engineering-research", status: "recorded" }),
    encoding: "utf-8",
  });
  assert.equal(copiedSkill.status, 0, copiedSkill.stderr);
  assert.equal(entries(join(copiedProject, ".runs")).length, 1);

  const compatibilityRoot = join(tempRoot, "compatibility-root");
  const compatibilityCwd = join(tempRoot, "compatibility-cwd");
  mkdirSync(join(compatibilityRoot, "scripts"), { recursive: true });
  mkdirSync(join(compatibilityRoot, "skills", "engineering-research", "scripts"), { recursive: true });
  mkdirSync(compatibilityCwd, { recursive: true });
  cpSync(logger, join(compatibilityRoot, "scripts", "log-run.mjs"));
  cpSync(skillLogger, join(compatibilityRoot, "skills", "engineering-research", "scripts", "log-run.mjs"));
  const compatibilityEnv = { ...process.env };
  delete compatibilityEnv.VITRUVIUS_RUNS_DIR;
  delete compatibilityEnv.VITRUVIUS_PROJECT_ROOT;
  const compatibility = spawnSync(process.execPath, [join(compatibilityRoot, "scripts", "log-run.mjs")], {
    cwd: compatibilityCwd,
    env: compatibilityEnv,
    input: JSON.stringify({ skill: "test", status: "recorded" }),
    encoding: "utf-8",
  });
  assert.equal(compatibility.status, 0, compatibility.stderr);
  assert.equal(entries(join(compatibilityRoot, ".runs")).length, 1);
  assert.equal(existsSync(join(compatibilityCwd, ".runs")), false);

  const fixedId = "11111111-1111-4111-8111-111111111111";
  const duplicateDir = join(tempRoot, "duplicate-runs");
  const firstFixed = run(["--run-id", fixedId], JSON.stringify({ skill: "test" }), duplicateDir);
  assert.equal(firstFixed.status, 0, firstFixed.stderr);
  const duplicate = run(["--run-id", fixedId], JSON.stringify({ skill: "test" }), duplicateDir);
  assert.notEqual(duplicate.status, 0);
  assert.match(duplicate.stderr, /duplicate|already exists/i);
  assert.equal(entries(duplicateDir).length, 1);
  const uppercaseDuplicate = run(["--run-id", fixedId.toUpperCase()], JSON.stringify({ skill: "test" }), duplicateDir);
  assert.notEqual(uppercaseDuplicate.status, 0);
  assert.match(uppercaseDuplicate.stderr, /duplicate|already exists/i);
  assert.equal(entries(duplicateDir).length, 1);

  const heldDir = join(tempRoot, "held-lock-runs");
  mkdirSync(heldDir, { recursive: true });
  const heldLockPath = join(heldDir, ".log-run.lock");
  let heldFd = openSync(heldLockPath, "wx");
  let heldChild = null;
  try {
    const heldResult = new Promise((resolveHeld, rejectHeld) => {
      heldChild = spawn(process.execPath, [logger], {
        cwd: repoRoot,
        env: { ...process.env, VITRUVIUS_RUNS_DIR: heldDir },
        stdio: ["pipe", "pipe", "pipe"],
      });
      let heldStderr = "";
      heldChild.stderr.setEncoding("utf-8");
      heldChild.stderr.on("data", (chunk) => { heldStderr += chunk; });
      heldChild.on("error", rejectHeld);
      heldChild.on("close", (status) => resolveHeld({ status, stderr: heldStderr }));
      heldChild.stdin.end(JSON.stringify({ skill: "test" }));
    });
    await delay(150);
    assert.equal(heldChild.exitCode, null, "logger should wait while the ledger lock is held");
    closeSync(heldFd);
    heldFd = null;
    rmSync(heldLockPath, { force: true });
    const released = await heldResult;
    assert.equal(released.status, 0, released.stderr);
    assert.equal(entries(heldDir).length, 1);
  } finally {
    if (heldFd !== null) closeSync(heldFd);
    rmSync(heldLockPath, { force: true });
    if (heldChild && heldChild.exitCode === null) heldChild.kill();
  }

  const concurrentDir = join(tempRoot, "concurrent-runs");
  const concurrentId = "22222222-2222-4222-8222-222222222222";
  const concurrent = await Promise.all(Array.from({ length: 8 }, () => spawnRun(
    logger,
    ["--run-id", concurrentId],
    JSON.stringify({ skill: "test" }),
    concurrentDir,
  )));
  assert.equal(concurrent.filter((result) => result.status === 0).length, 1);
  assert.equal(entries(concurrentDir).length, 1);
  assert.equal(existsSync(join(concurrentDir, ".log-run.lock")), false);

  const independentDir = join(tempRoot, "independent-runs");
  const independent = await Promise.all(Array.from({ length: 4 }, () => spawnRun(
    logger,
    [],
    JSON.stringify({ skill: "test" }),
    independentDir,
  )));
  assert.equal(independent.filter((result) => result.status === 0).length, 4, JSON.stringify(independent));
  assert.equal(entries(independentDir).length, 4);
  assert.equal(new Set(entries(independentDir).map((entry) => entry.run_id)).size, 4);

  const invalidDir = join(tempRoot, "invalid-runs");
  const invalidInputs = [
    "not json",
    "[]",
    "null",
    "{}",
    '{"skill":""}',
    '{"skill":"test","phase":3}',
    '{"skill":"test","topic":3}',
    '{"skill":"test","discipline":[]}',
    '{"skill":"test","sources_consulted":-1}',
    '{"skill":"test","claims_verified":1.5}',
    '{"skill":"test","claims_blocked":"0"}',
    '{"skill":"test","status":"unknown"}',
    '{"skill":"test","verdict":"unknown"}',
    '{"skill":"test","artifacts":[3]}',
    '{"skill":"test","error":3}',
  ];
  for (const input of invalidInputs) {
    const result = run([], input, invalidDir);
    assert.notEqual(result.status, 0, `input should fail: ${input}`);
  }
  assert.equal(existsSync(invalidDir) ? readdirSync(invalidDir).length : 0, 0);

  const malformedDir = join(tempRoot, "malformed-runs");
  mkdirSync(malformedDir, { recursive: true });
  writeFileSync(join(malformedDir, "2026-01-01.jsonl"), "{not-json}\n");
  const malformed = run([], JSON.stringify({ skill: "test" }), malformedDir);
  assert.notEqual(malformed.status, 0);
  assert.match(malformed.stderr, /invalid JSONL|duplicate|locked/i);
  const unterminatedDir = join(tempRoot, "unterminated-runs");
  mkdirSync(unterminatedDir, { recursive: true });
  writeFileSync(join(unterminatedDir, "2026-01-01.jsonl"), '{"run_id":"old"}');
  const unterminated = run([], JSON.stringify({ skill: "test" }), unterminatedDir);
  assert.notEqual(unterminated.status, 0);
  assert.match(unterminated.stderr, /newline-terminated|invalid JSONL|locked/i);

  const lockedDir = join(tempRoot, "prelocked-runs");
  mkdirSync(lockedDir, { recursive: true });
  const lockPath = join(lockedDir, ".log-run.lock");
  const lockContents = "operator-held-lock\n";
  writeFileSync(lockPath, lockContents);
  const locked = spawnSync(process.execPath, [logger], {
    cwd: repoRoot,
    env: { ...process.env, VITRUVIUS_RUNS_DIR: lockedDir },
    input: JSON.stringify({ skill: "test" }),
    encoding: "utf-8",
    timeout: 12_000,
  });
  assert.equal(locked.error, undefined);
  assert.notEqual(locked.status, 0);
  assert.match(locked.stderr, /busy|locked/i);
  assert.equal(readFileSync(lockPath, "utf-8"), lockContents);

  const explicitDir = join(tempRoot, "explicit-runs");
  const explicit = run(["--runs-dir", explicitDir], JSON.stringify({ skill: "test", status: "recorded" }));
  assert.equal(explicit.status, 0, explicit.stderr);
  assert.equal(entries(explicitDir).length, 1);

  const projectRoot = join(tempRoot, "active-project");
  const projectEnv = { ...process.env, VITRUVIUS_PROJECT_ROOT: projectRoot };
  delete projectEnv.VITRUVIUS_RUNS_DIR;
  const projectDefault = spawnSync(process.execPath, [logger], {
    cwd: repoRoot,
    env: projectEnv,
    input: JSON.stringify({ skill: "test", status: "recorded" }),
    encoding: "utf-8",
  });
  assert.equal(projectDefault.status, 0, projectDefault.stderr);
  assert.equal(entries(join(projectRoot, ".runs")).length, 1);

  const help = spawnSync(process.execPath, [logger, "--help"], { cwd: repoRoot, encoding: "utf-8" });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /Usage: node scripts\/log-run\.mjs/);
  const unknown = spawnSync(process.execPath, [logger, "--unknown"], { cwd: repoRoot, input: "{}", encoding: "utf-8" });
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /unknown option/i);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

console.log("PASS: run.v1 JSONL logger, validation, duplicate refusal, and isolation");
