/**
 * eval-routing.mjs — Tier-2 trigger-routing evals (N3, from agent-skills).
 *
 * Two checks over the 25 skill descriptions:
 * 1. Pairwise collision: description 3-gram similarity >= 70% flags two
 *    skills whose triggers are too close to disambiguate.
 * 2. Prompt routing: a small labeled set of user prompts must rank the
 *    correct skill's description first by TF-IDF cosine similarity.
 *
 * Usage: node tests/routing/eval-routing.mjs
 * Exit 1 on any collision or routing miss.
 */

import { lstatSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { validateEvalCatalog } from "../../scripts/eval-contract.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const SKILLS_DIR = join(REPO_ROOT, "skills");

const COLLISION_THRESHOLD = 0.7;
const REPO_REAL = realpathSync(REPO_ROOT);

function assertSafeRegularFile(path) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`routing input is not a regular file: ${path}`);
  const real = realpathSync(path);
  const rel = relative(REPO_REAL, real);
  if (rel === ".." || rel.startsWith(`..${sep}`) || /^[A-Za-z]:[\\/]/.test(rel) || rel.startsWith("\\\\")) throw new Error(`routing input escapes repository: ${path}`);
  return path;
}

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
const routingInputErrors = [];
for (const entry of readdirSync(SKILLS_DIR)) {
  const skillDir = join(SKILLS_DIR, entry);
  const p = join(skillDir, "SKILL.md");
  try {
    const dirStat = lstatSync(skillDir);
    if (!dirStat.isDirectory() || dirStat.isSymbolicLink()) {
      if (dirStat.isSymbolicLink()) routingInputErrors.push(`skill directory is a symlink: ${skillDir}`);
      continue;
    }
    assertSafeRegularFile(p);
  } catch (error) {
    if (error.code !== "ENOENT" && error.message.startsWith("routing input")) routingInputErrors.push(error.message);
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

if (routingInputErrors.length > 0) {
  console.error("Routing input confinement failed:");
  for (const error of routingInputErrors) console.error(`  - ${error}`);
  process.exit(1);
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
const baselineRoutingCases = [
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
  { prompt: "research bearing selection and power transmission for my gearbox design", skill: "mechanical" },
  { prompt: "research motor drives and power systems for this grid-tied installation", skill: "electrical" },
  { prompt: "research facade and enclosure systems for my building science survey", skill: "architectural" },
  { prompt: "investigate the technical landscape and architecture options for this software system", skill: "software" },
];

const e1Catalog = JSON.parse(readFileSync(assertSafeRegularFile(join(REPO_ROOT, "evals", "catalog.json")), "utf8"));
const e1CatalogReport = validateEvalCatalog(e1Catalog, { repoRoot: REPO_ROOT });
if (!e1CatalogReport.valid) {
  console.error("E1 catalog contract failed:");
  for (const error of e1CatalogReport.errors) console.error(`  - ${error}`);
  process.exit(1);
}
const e1Cases = e1Catalog.cases;
const e1PositiveCases = e1Cases.map((evalCase) => ({
  id: evalCase.id,
  prompt: evalCase.positive.prompt,
  skill: evalCase.skill,
  top_k: evalCase.positive.top_k,
}));
const routingCases = baselineRoutingCases;

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

function evaluatePositiveCases(cases) {
  let hits = 0;
  const misses = [];
  for (const evalCase of cases) {
    const query = tfidfVec(tokenize(evalCase.prompt));
    const ranked = skillVecs
      .map((skill) => ({ name: skill.name, score: cosine(query, skill.v) }))
      .sort((left, right) => right.score - left.score);
    const targetRank = ranked.findIndex((rankedSkill) => rankedSkill.name === evalCase.skill) + 1;
    const topK = evalCase.top_k ?? 1;
    if (targetRank > 0 && targetRank <= topK) {
      hits++;
    } else {
      const top = ranked[0];
      misses.push(`${evalCase.skill} <- "${evalCase.prompt}" (got ${top.name}, rank ${targetRank || "unranked"})`);
      console.log(`  MISS: "${evalCase.prompt.slice(0, 50)}..." → got ${top.name}, want ${evalCase.skill}`);
    }
  }
  return { hits, misses };
}

console.log("\nCheck 2 — baseline prompt routing (rank-1 must hit labeled skill):");
const baselineReport = evaluatePositiveCases(routingCases);
console.log(`  rank-1: ${baselineReport.hits}/${routingCases.length}`);

console.log("\nCheck 2b — E1 positive routing (declared top-k):");
const e1Report = evaluatePositiveCases(e1PositiveCases);
console.log(`  top-k: ${e1Report.hits}/${e1PositiveCases.length}`);
if (e1Report.hits < e1PositiveCases.length) failed++;

console.log("\nCheck 3 — E1 owner negatives (named owner must outrank target):");
let negativeHits = 0;
const negativeMisses = [];
for (const evalCase of e1Cases) {
  const query = tfidfVec(tokenize(evalCase.negative.prompt));
  const ranked = skillVecs
    .map((skill) => ({ name: skill.name, score: cosine(query, skill.v) }))
    .sort((left, right) => right.score - left.score);
  const ownerRank = ranked.findIndex((skill) => skill.name === evalCase.negative.owner) + 1;
  const targetRank = ranked.findIndex((skill) => skill.name === evalCase.skill) + 1;
  const topK = evalCase.negative.top_k ?? 1;
  if (ownerRank > 0 && ownerRank <= topK && ownerRank < targetRank) {
    negativeHits++;
  } else {
    negativeMisses.push(`${evalCase.negative.owner} must outrank ${evalCase.skill} for "${evalCase.negative.prompt}"`);
  }
}
console.log(`  owner-negative: ${negativeHits}/${e1Cases.length}`);
if (negativeHits < e1Cases.length) {
  for (const miss of negativeMisses) console.log(`  MISS: ${miss}`);
  failed++;
}

function persistMisses(path, label, misses, scoreText) {
  const missBody = misses.length ? `${misses.join("\n")}\n` : "";
  const header = `# ${label}, last run ${new Date().toISOString().split("T")[0]}: ${scoreText}`;
  let shouldWrite = true;
  try {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`miss artifact is not a regular file: ${path}`);
    const current = readFileSync(path, "utf-8");
    const currentBody = current.replace(/^#[^\n]*\n/, "").replace(/\r\n/g, "\n");
    const currentHeader = current.split(/\r?\n/, 1)[0];
    shouldWrite = currentBody !== missBody || currentHeader !== header;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    // First run: create the artifact.
  }
  if (shouldWrite) writeFileSync(path, `${header}\n${missBody}`);
}

persistMisses(
  join(__dirname, "last-misses.txt"),
  "baseline routing misses (rank-1)",
  baselineReport.misses,
  `${baselineReport.hits}/${routingCases.length}`,
);
persistMisses(
  join(__dirname, "e1-misses.txt"),
  "E1 positive/owner-negative misses",
  [...e1Report.misses, ...negativeMisses],
  `positive ${e1Report.hits}/${e1PositiveCases.length}; owner-negative ${negativeHits}/${e1Cases.length}`,
);

// Baseline floor (2026-09 first measured run: 12/16). Raise only with a
// recorded better run and sharpened descriptions — never lower.
const floor = 0.75;
if (baselineReport.hits / routingCases.length < floor) {
  console.log(`  FAIL: baseline rank-1 ${(baselineReport.hits / routingCases.length * 100).toFixed(0)}% < ${floor * 100}% floor`);
  failed++;
} else {
  console.log(`  baseline rank-1 >= ${floor * 100}% floor: OK`);
}

console.log(`\n${failed === 0 ? "PASS" : "FAIL"}: routing eval`);
process.exit(failed === 0 ? 0 : 1);
