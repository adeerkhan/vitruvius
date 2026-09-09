/**
 * eval-routing.mjs — Tier-2 trigger-routing evals (N3, from agent-skills).
 *
 * Two checks over the 24 skill descriptions:
 * 1. Pairwise collision: description 3-gram similarity >= 70% flags two
 *    skills whose triggers are too close to disambiguate.
 * 2. Prompt routing: a small labeled set of user prompts must rank the
 *    correct skill's description first by TF-IDF cosine similarity.
 *
 * Usage: node tests/routing/eval-routing.mjs
 * Exit 1 on any collision or routing miss.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const SKILLS_DIR = join(REPO_ROOT, "skills");

const COLLISION_THRESHOLD = 0.7;

// ---------------------------------------------------------------------------
// Tiny TF-IDF over skill descriptions (no deps)
// ---------------------------------------------------------------------------

const STOP = new Set(
  "a an and are as at be by for from has have in is it its of on or that the to use when with user asks this these those not do does into than then".split(" "),
);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function termFreq(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}

function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [, v] of a) na += v * v;
  for (const [k, v] of b) {
    nb += v * v;
    const av = a.get(k);
    if (av) dot += av * v;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function trigrams(text) {
  const tokens = tokenize(text);
  const set = new Set();
  for (let i = 0; i < tokens.length - 2; i++) set.add(tokens.slice(i, i + 3).join(" "));
  return set;
}

function jaccard(a, b) {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

// ---------------------------------------------------------------------------
// Load skills
// ---------------------------------------------------------------------------

const skills = [];
for (const entry of readdirSync(SKILLS_DIR)) {
  const p = join(SKILLS_DIR, entry, "SKILL.md");
  try {
    if (!statSync(p).isFile()) continue;
  } catch {
    continue;
  }
  const text = readFileSync(p, "utf-8");
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) continue;
  const descMatch = m[1].match(/description:\s*>-?\s*\n([\s\S]*?)(?=\n[a-z-]+:|\n---)/) ||
    m[1].match(/description:\s*(.+)/);
  const description = descMatch ? descMatch[1].replace(/\n\s*/g, " ").trim() : "";
  skills.push({ name: entry, description, tokens: tokenize(entry + " " + description) });
}

console.log(`[routing-eval] ${skills.length} skills loaded`);

let failed = 0;

// ---------------------------------------------------------------------------
// Check 1: pairwise description collisions
// ---------------------------------------------------------------------------

console.log("\nCheck 1 — description collisions (trigram Jaccard >= " + COLLISION_THRESHOLD + "):");
const tgs = skills.map((s) => ({ name: s.name, tg: trigrams(s.description) }));
let collisions = 0;
for (let i = 0; i < tgs.length; i++) {
  for (let j = i + 1; j < tgs.length; j++) {
    const sim = jaccard(tgs[i].tg, tgs[j].tg);
    if (sim >= COLLISION_THRESHOLD) {
      console.log(`  COLLISION: ${tgs[i].name} <-> ${tgs[j].name} (${(sim * 100).toFixed(0)}%)`);
      collisions++;
    }
  }
}
console.log(`  ${collisions} collision(s)`);
if (collisions > 0) failed++;

// ---------------------------------------------------------------------------
// Check 2: labeled prompts route to the right skill
// ---------------------------------------------------------------------------

// Each case: a user prompt and the skill that must rank first.
// Derived from each skill's own "Use when" territory.
const routingCases = [
  { prompt: "is this right — does my calculation of the flexural strength hold up", skill: "verifier" },
  { prompt: "what does ACI 318 say about the reduction factor for post-tensioned tendons", skill: "standards-lookup" },
  { prompt: "find research gaps in FRP bonding literature for civil structures", skill: "gap-analysis" },
  { prompt: "rank these five papers by evidence quality for my fatigue question", skill: "evidence-ranking" },
  { prompt: "compare three design alternatives for this pressure vessel closure", skill: "design-alternatives" },
  { prompt: "what failure modes could go wrong in this gearbox assembly", skill: "fmea-brainstorm" },
  { prompt: "formulate testable hypotheses for why this beam cracked", skill: "hypothesis-generation" },
  { prompt: "peer review my research brief before I submit it", skill: "peer-review" },
  { prompt: "summarize this datasheet into a digestible brief", skill: "summarize" },
  { prompt: "explain what a resistance factor is in simple terms", skill: "eli5" },
  { prompt: "audit whether the paper's claims match its published code", skill: "audit" },
  { prompt: "compare what Eurocode and AISC say about this connection", skill: "compare" },
  { prompt: "extract the tables from this 80-page specification PDF", skill: "artifact-reading" },
  { prompt: "find prior academic work on retraction-aware paper ranking", skill: "scholarly-research" },
  { prompt: "check my claimed weld size against the code requirement", skill: "verifier" },
  { prompt: "research wind loading on long-span bridges for my survey", skill: "civil" },
];

const idf = new Map();
for (const s of skills) {
  for (const [k] of termFreq(s.tokens)) idf.set(k, (idf.get(k) || 0) + 1);
}
const N = skills.length;

function tfidfVec(tokens) {
  const tf = termFreq(tokens);
  const v = new Map();
  for (const [k, c] of tf) {
    const idfVal = Math.log((N + 1) / ((idf.get(k) || 0) + 1));
    v.set(k, c * idfVal);
  }
  return v;
}

const skillVecs = skills.map((s) => ({ name: s.name, v: tfidfVec(s.tokens) }));

console.log("\nCheck 2 — prompt routing (rank-1 must hit labeled skill):");
let hits = 0;
for (const c of routingCases) {
  const qv = tfidfVec(tokenize(c.prompt));
  const ranked = skillVecs
    .map((s) => ({ name: s.name, score: cosine(qv, s.v) }))
    .sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const ok = top.name === c.skill;
  if (ok) hits++;
  else {
    console.log(`  MISS: "${c.prompt.slice(0, 50)}..." → got ${top.name}, want ${c.skill}`);
  }
}
console.log(`  rank-1: ${hits}/${routingCases.length}`);

// Baseline floor (2026-09 first measured run: 12/16). Raise only with a
// recorded better run and sharpened descriptions — never lower.
const floor = 0.75;
if (hits / routingCases.length < floor) {
  console.log(`  FAIL: rank-1 ${(hits / routingCases.length * 100).toFixed(0)}% < ${floor * 100}% floor`);
  failed++;
} else {
  console.log(`  rank-1 >= ${floor * 100}% floor: OK`);
}

console.log(`\n${failed === 0 ? "PASS" : "FAIL"}: routing eval`);
process.exit(failed === 0 ? 0 : 1);
