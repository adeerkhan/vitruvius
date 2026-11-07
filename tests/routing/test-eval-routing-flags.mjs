/**
 * test-eval-routing-flags.mjs — one case by id, scores on every rank line.
 *
 * src-02 #742: no way to select a single case made every routing iteration a
 * full eval run. src-02 #760: a positive that slipped to rank 2 printed
 * nothing about the gap between its top-k pass and its rank-1 miss, so
 * finding it took a hand-built harness around the ranker.
 *
 * Pinned here: the --case/--list behavior (including that a filtered run
 * must NOT rewrite the whole-set miss artifacts or apply the set-level
 * floor), and the exact shape of the report lines via report-lines.mjs.
 */

import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  fmtRank,
  fmtScore,
  mustNotFireMissLine,
  negativeMissLine,
  positiveInfoLine,
  positiveMissConsole,
  positiveMissLine,
} from "./report-lines.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const evalScript = join(repoRoot, "tests", "routing", "eval-routing.mjs");

function run(...args) {
  return spawnSync(process.execPath, [evalScript, ...args], { encoding: "utf8", cwd: repoRoot });
}

// --- 1. Report lines carry scores and the outranking skill ----------------
{
  assert.equal(fmtScore(0.4126), "0.413");
  assert.equal(fmtRank(0, 0), "unranked");
  assert.equal(fmtRank(2, 0.3984), "rank 2 0.398");

  const top = { name: "civil", score: 0.4126 };
  const miss = positiveMissLine({
    skill: "gap-analysis",
    prompt: "find research gaps in FRP bonding literature",
    top,
    targetRank: 2,
    targetScore: 0.3984,
    topK: 1,
  });
  assert.match(miss, /got civil 0\.413/, "miss line must carry the winner's score");
  assert.match(miss, /target rank 2 0\.398/, "miss line must carry the target's rank and score");
  assert.match(miss, /want rank <= 1/, "miss line must state what would have passed");
  assert.match(miss, /gap-analysis <- "find research gaps/, "miss line must name the case");

  const consoleMiss = positiveMissConsole({
    skill: "gap-analysis",
    prompt: "find research gaps in FRP bonding literature",
    top,
    targetRank: 2,
    targetScore: 0.3984,
    topK: 1,
  });
  assert.match(consoleMiss, /MISS/);
  assert.match(consoleMiss, /civil 0\.413/);
  assert.match(consoleMiss, /gap-analysis rank 2 0\.398/);

  // The gap line: a top-k pass the rank-1 floor does not count (src-02 #760).
  const info = positiveInfoLine({
    skill: "gap-analysis",
    prompt: "find research gaps",
    top,
    targetRank: 2,
    targetScore: 0.3984,
    topK: 3,
  });
  assert.match(info, /top-3 pass, not rank-1/, "the gap must be named as a pass that is not rank-1");
  assert.match(info, /civil 0\.413 outranks it/, "the outranking skill and score must appear");
  assert.match(info, /floor does not count this hit/, "the reader must learn the floor ignores it");

  const negative = negativeMissLine({
    owner: "software",
    skill: "engineering-research",
    prompt: "investigate the technical landscape",
    ownerRank: 2,
    ownerScore: 0.4011,
    targetRank: 1,
    targetScore: 0.4122,
  });
  assert.match(negative, /owner rank 2 0\.401/, "negative miss must carry the owner's rank and score");
  assert.match(negative, /target rank 1 0\.412/, "negative miss must carry the target's rank and score");

  const mnf = mustNotFireMissLine({
    skill: "simplified-technical-english",
    prompt: "rewrite this text",
    targetRank: 2,
    targetScore: 0.3511,
    top: { name: "summarize", score: 0.402 },
    topK: 3,
  });
  assert.match(mnf, /rank 2 0\.351/, "must-not-fire miss must carry where the skill landed");
  assert.match(mnf, /top: summarize 0\.402/, "must-not-fire miss must show what beat it");
}

// --- 2. --list prints every selectable id, nothing else --------------------
{
  const list = run("--list");
  assert.equal(list.status, 0, `--list must exit 0:\n${list.stdout}\n${list.stderr}`);
  assert.match(list.stdout, /^verifier-flexural-strength\tbaseline$/m, "a baseline id must be listed");
  assert.match(list.stdout, /^verifier-missing-verdict\t/m, "an e1 case id must be listed");
  assert.match(list.stdout, /^ste-not-for-generic-editing\t/m, "a must-not-fire id must be listed");
  assert.ok(!list.stdout.includes("Check 1"), "--list must exit before any check runs");
  const ids = list.stdout.trim().split("\n");
  assert.equal(ids.length, 36, `expected 22 baseline + 4 e1 + 10 must-not-fire ids, got ${ids.length}`);
  assert.equal(new Set(ids.map((line) => line.split("\t")[0])).size, ids.length, "ids must be unique");
}

// --- 3. --case runs one case and leaves the set-level artifacts alone ------
{
  const lastMisses = join(repoRoot, "tests", "routing", "last-misses.txt");
  const e1Misses = join(repoRoot, "tests", "routing", "e1-misses.txt");
  const beforeLast = readFileSync(lastMisses, "utf8");
  const beforeE1 = readFileSync(e1Misses, "utf8");

  const one = run("--case", "verifier-flexural-strength");
  assert.equal(one.status, 0, `--case on a passing case must exit 0:\n${one.stdout}\n${one.stderr}`);
  assert.match(one.stdout, /PASS: routing eval \(--case verifier-flexural-strength\)/);
  assert.match(one.stdout, /rank-1: 1\/1/, "the selected case must actually run");
  assert.match(one.stdout, /skipped/, "set-level checks must be skipped, not shrunk");
  assert.ok(!one.stdout.includes("wind loading"), "unselected cases must not run");
  assert.ok(!one.stdout.includes("COLLISION"), "collisions are set-level and must not run filtered");

  assert.equal(readFileSync(lastMisses, "utf8"), beforeLast, "a --case run must not rewrite last-misses.txt");
  assert.equal(readFileSync(e1Misses, "utf8"), beforeE1, "a --case run must not rewrite e1-misses.txt");

  const e1 = run("--case", "verifier-missing-verdict");
  assert.equal(e1.status, 0, `--case on an e1 case must exit 0:\n${e1.stdout}\n${e1.stderr}`);
  assert.match(e1.stdout, /top-k: 1\/1/);
  assert.match(e1.stdout, /owner-negative: 1\/1/, "an e1 case runs its positive AND its owner-negative");
}

// --- 4. Bad flags are exit 2 (usage), not a routing verdict ----------------
{
  const bogus = run("--case", "no-such-id");
  assert.equal(bogus.status, 2, "an unknown id must be a usage error, not a pass or a miss");
  assert.match(bogus.stderr, /no-such-id/, "the error must echo the id that was asked for");
  assert.match(bogus.stderr, /--list/, "the error must point at how to find real ids");

  assert.equal(run("--case").status, 2, "--case without a value must be refused");
  assert.equal(run("--case", "x", "--list").status, 2, "--case and --list must be mutually exclusive");
  assert.equal(run("--nonsense").status, 2, "an unknown argument must be refused");
}

console.log("PASS: routing eval selects one case by id, prints scores on rank lines, guards its artifacts");
