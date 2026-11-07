/**
 * eval-routing.mjs — Tier-2 trigger-routing evals (N3, from src-02).
 *
 * Two checks over the 25 skill descriptions:
 * 1. Pairwise collision: description 3-gram similarity >= 70% flags two
 *    skills whose triggers are too close to disambiguate.
 * 2. Prompt routing: a small labeled set of user prompts must rank the
 *    correct skill's description first by TF-IDF cosine similarity.
 *
 * Usage: node tests/routing/eval-routing.mjs [--case <id>] [--list]
 * Exit 1 on any collision or routing miss; exit 2 on a bad flag or an
 * unknown/ambiguous --case id.
 *
 * --case runs exactly one case (its groups only): collision check, whole-set
 * floors and the miss artifacts are set-level measurements, so a filtered run
 * skips them rather than shrinking them. --list prints every selectable id.
 */

import { lstatSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { join, dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { validateEvalCatalog } from "../../scripts/eval-contract.mjs";
import { readSkillDescription } from "../../scripts/yaml-frontmatter.mjs";
import {
  negativeMissLine,
  mustNotFireMissLine,
  positiveInfoLine,
  positiveMissConsole,
  positiveMissLine,
} from "./report-lines.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const SKILLS_DIR = join(REPO_ROOT, "skills");

const COLLISION_THRESHOLD = 0.7;
const REPO_REAL = realpathSync(REPO_ROOT);

// --- Flags (src-02 #742: one case by id, without a hand-built harness) ----
const argv = process.argv.slice(2);
let selectedCaseId = null;
let listOnly = false;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--list") {
    listOnly = true;
  } else if (argv[i] === "--case") {
    if (i + 1 >= argv.length || argv[i + 1].startsWith("--")) {
      console.error("usage: eval-routing.mjs [--case <id>] [--list]  (--case needs an id; see --list)");
      process.exit(2);
    }
    selectedCaseId = argv[++i];
  } else {
    console.error(`unknown argument: ${argv[i]} (usage: eval-routing.mjs [--case <id>] [--list])`);
    process.exit(2);
  }
}
if (listOnly && selectedCaseId !== null) {
  console.error("--list and --case are mutually exclusive");
  process.exit(2);
}
const filtered = selectedCaseId !== null;

function canonicalPath(path) {
  return process.platform === "win32" ? path.toLowerCase() : path;
}

function assertSafeRegularFile(path) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`routing input is not a regular file: ${path}`);
  const real = realpathSync(path);
  const expected = resolve(REPO_REAL, relative(REPO_ROOT, path));
  if (canonicalPath(real) !== canonicalPath(expected)) throw new Error(`routing input uses a symlink or junction: ${path}`);
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
  // Line-ending independent. A CRLF checkout used to drop the skill from the
  // index entirely, so the measured rank-1 depended on checkout settings.
  const description = readSkillDescription(text);
  if (!description) {
    routingInputErrors.push(`${entry.name}: no frontmatter description parsed`);
    continue;
  }
  skills.push({ name: entry, description, tokens: tokenize(entry + " " + description) });
}

if (routingInputErrors.length > 0) {
  console.error("Routing input confinement failed:");
  for (const error of routingInputErrors) console.error(`  - ${error}`);
  process.exit(1);
}

if (!listOnly) console.log(`[routing-eval] ${skills.length} skills loaded`);

let failed = 0;

// ---------------------------------------------------------------------------
// Check 2: labeled prompts route to the right skill
// ---------------------------------------------------------------------------

// Each case: an id, a user prompt and the skill that must rank first.
// Derived from each skill's own "Use when" territory. Ids are explicit and
// stable so --case keeps working as cases are inserted around them.
let baselineRoutingCases = [
  { id: "verifier-flexural-strength", prompt: "is this right — does my calculation of the flexural strength hold up", skill: "verifier" },
  { id: "standards-post-tensioned-tendons", prompt: "what does ACI 318 say about the reduction factor for post-tensioned tendons", skill: "standards-lookup" },
  { id: "gap-frp-bonding", prompt: "find research gaps in FRP bonding literature for civil structures", skill: "gap-analysis" },
  { id: "rank-papers-evidence-quality", prompt: "rank these five papers by evidence quality for my fatigue question", skill: "evidence-ranking" },
  { id: "compare-pressure-vessel-closure", prompt: "compare three design alternatives for this pressure vessel closure", skill: "design-alternatives" },
  { id: "fmea-gearbox", prompt: "what failure modes could go wrong in this gearbox assembly", skill: "fmea-brainstorm" },
  { id: "hypothesis-beam-crack", prompt: "formulate testable hypotheses for why this beam cracked", skill: "hypothesis-generation" },
  { id: "peer-review-research-brief", prompt: "peer review my research brief before I submit it", skill: "peer-review" },
  { id: "summarize-datasheet", prompt: "summarize this datasheet into a digestible brief", skill: "summarize" },
  { id: "post-paper-twitter-thread", prompt: "write a twitter thread about this paper's result", skill: "research-to-post" },
  { id: "eli5-resistance-factor", prompt: "explain what a resistance factor is in simple terms", skill: "eli5" },
  { id: "ste-procedure-rewrite", prompt: "rewrite this procedure in simplified technical english controlled language", skill: "simplified-technical-english" },
  { id: "audit-paper-vs-code", prompt: "audit whether the paper's claims match its published code", skill: "audit" },
  { id: "compare-eurocode-aisc", prompt: "compare what Eurocode and AISC say about this connection", skill: "compare" },
  { id: "extract-spec-pdf-tables", prompt: "extract the tables from this 80-page specification PDF", skill: "artifact-reading" },
  { id: "scholar-retraction-aware", prompt: "find prior academic work on retraction-aware paper ranking", skill: "scholarly-research" },
  { id: "verifier-weld-size", prompt: "check my claimed weld size against the code requirement", skill: "verifier" },
  { id: "civil-wind-loading", prompt: "research wind loading on long-span bridges for my survey", skill: "civil" },
  { id: "mechanical-bearing-selection", prompt: "research bearing selection and power transmission for my gearbox design", skill: "mechanical" },
  { id: "motor-drives-grid", prompt: "research motor drives and power systems for this grid-tied installation", skill: "electrical" },
  { id: "architectural-facade-enclosure", prompt: "research facade and enclosure systems for my building science survey", skill: "architectural" },
  { id: "software-landscape", prompt: "investigate the technical landscape and architecture options for this software system", skill: "software" },
];

const e1Catalog = JSON.parse(readFileSync(assertSafeRegularFile(join(REPO_ROOT, "evals", "catalog.json")), "utf8"));
const e1CatalogReport = validateEvalCatalog(e1Catalog, { repoRoot: REPO_ROOT });
if (!e1CatalogReport.valid) {
  console.error("E1 catalog contract failed:");
  for (const error of e1CatalogReport.errors) console.error(`  - ${error}`);
  process.exit(1);
}
let e1Cases = e1Catalog.cases;
let mustNotFireCases = e1Catalog.must_not_fire ?? [];

// Every selectable case id across all three groups. Duplicate ids are
// refused: --case must resolve to exactly one case or the flag is a guess.
const selectable = new Map();
function addSelectable(id, group) {
  if (selectable.has(id)) {
    console.error(`duplicate selectable case id "${id}" (${selectable.get(id)} and ${group}); --case would be ambiguous`);
    process.exit(2);
  }
  selectable.set(id, group);
}
for (const evalCase of baselineRoutingCases) addSelectable(evalCase.id, "baseline");
for (const evalCase of e1Cases) addSelectable(evalCase.id, "e1-positive+negative");
for (const entry of mustNotFireCases) addSelectable(entry.id, "must-not-fire");

if (listOnly) {
  for (const [id, group] of selectable) console.log(`${id}\t${group}`);
  process.exit(0);
}
if (filtered && !selectable.has(selectedCaseId)) {
  console.error(`no case with id "${selectedCaseId}" — run --list for the ${selectable.size} selectable ids`);
  process.exit(2);
}
if (filtered) {
  baselineRoutingCases = baselineRoutingCases.filter((evalCase) => evalCase.id === selectedCaseId);
  e1Cases = e1Cases.filter((evalCase) => evalCase.id === selectedCaseId);
  mustNotFireCases = mustNotFireCases.filter((entry) => entry.id === selectedCaseId);
}

const e1PositiveCases = e1Cases.map((evalCase) => ({
  id: evalCase.id,
  prompt: evalCase.positive.prompt,
  skill: evalCase.skill,
  top_k: evalCase.positive.top_k,
}));
const routingCases = baselineRoutingCases;

// ---------------------------------------------------------------------------
// Check 1: pairwise description collisions (after the case index so --list
// can exit with nothing but ids on stdout)
// ---------------------------------------------------------------------------

if (filtered) {
  console.log("\nCheck 1 — description collisions: skipped (--case runs one case, collisions are set-level)");
} else {
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
}

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
    const targetScore = targetRank > 0 ? ranked[targetRank - 1].score : 0;
    const topK = evalCase.top_k ?? 1;
    const top = ranked[0];
    if (targetRank > 0 && targetRank <= topK) {
      hits++;
      if (targetRank > 1) {
        // A top-k pass that is not rank-1: visible, but the rank-1 floor
        // does not count it (src-02 #760's gap line).
        console.log(positiveInfoLine({ skill: evalCase.skill, prompt: evalCase.prompt, top, targetRank, targetScore, topK }));
      }
    } else {
      misses.push(positiveMissLine({ skill: evalCase.skill, prompt: evalCase.prompt, top, targetRank, targetScore, topK }));
      console.log(positiveMissConsole({ skill: evalCase.skill, prompt: evalCase.prompt, top, targetRank, targetScore, topK }));
    }
  }
  return { hits, misses };
}

let baselineReport = { hits: 0, misses: [] };
let e1Report = { hits: 0, misses: [] };
if (routingCases.length > 0) {
  console.log("\nCheck 2 — baseline prompt routing (rank-1 must hit labeled skill):");
  baselineReport = evaluatePositiveCases(routingCases);
  console.log(`  rank-1: ${baselineReport.hits}/${routingCases.length}`);
}
if (e1PositiveCases.length > 0) {
  console.log("\nCheck 2b — E1 positive routing (declared top-k):");
  e1Report = evaluatePositiveCases(e1PositiveCases);
  console.log(`  top-k: ${e1Report.hits}/${e1PositiveCases.length}`);
  if (e1Report.hits < e1PositiveCases.length) failed++;
}

console.log(
  e1Cases.length > 0
    ? "\nCheck 3 — E1 owner negatives (named owner must outrank target):"
    : "\nCheck 3 — E1 owner negatives: skipped (--case selected no e1 case)",
);
let negativeHits = 0;
const negativeMisses = [];
if (e1Cases.length > 0) {
  for (const evalCase of e1Cases) {
    const query = tfidfVec(tokenize(evalCase.negative.prompt));
    const ranked = skillVecs
      .map((skill) => ({ name: skill.name, score: cosine(query, skill.v) }))
      .sort((left, right) => right.score - left.score);
    const ownerRank = ranked.findIndex((skill) => skill.name === evalCase.negative.owner) + 1;
    const targetRank = ranked.findIndex((skill) => skill.name === evalCase.skill) + 1;
    const ownerScore = ownerRank > 0 ? ranked[ownerRank - 1].score : 0;
    const targetScore = targetRank > 0 ? ranked[targetRank - 1].score : 0;
    const topK = evalCase.negative.top_k ?? 1;
    if (ownerRank > 0 && ownerRank <= topK && ownerRank < targetRank) {
      negativeHits++;
    } else {
      negativeMisses.push(
        negativeMissLine({
          owner: evalCase.negative.owner,
          skill: evalCase.skill,
          prompt: evalCase.negative.prompt,
          ownerRank,
          ownerScore,
          targetRank,
          targetScore,
        }),
      );
    }
  }
  console.log(`  owner-negative: ${negativeHits}/${e1Cases.length}`);
  if (negativeHits < e1Cases.length) {
    for (const miss of negativeMisses) console.log(`  MISS: ${miss}`);
    failed++;
  }
}

console.log(
  mustNotFireCases.length > 0
    ? "\nCheck 3b — E1 must-not-fire (target skill must stay out of top-k):"
    : "\nCheck 3b — E1 must-not-fire: skipped (--case selected no must-not-fire case)",
);
let mustNotFireHits = 0;
const mustNotFireMisses = [];
if (mustNotFireCases.length > 0) {
  for (const entry of mustNotFireCases) {
    const query = tfidfVec(tokenize(entry.prompt));
    const ranked = skillVecs
      .map((skill) => ({ name: skill.name, score: cosine(query, skill.v) }))
      .sort((left, right) => right.score - left.score);
    const targetRank = ranked.findIndex((skill) => skill.name === entry.skill) + 1;
    const targetScore = targetRank > 0 ? ranked[targetRank - 1].score : 0;
    const topK = entry.top_k ?? 1;
    if (targetRank === 0 || targetRank > topK) {
      mustNotFireHits++;
    } else {
      mustNotFireMisses.push(
        mustNotFireMissLine({ skill: entry.skill, prompt: entry.prompt, targetRank, targetScore, top: ranked[0], topK }),
      );
    }
  }
  console.log(`  must-not-fire: ${mustNotFireHits}/${mustNotFireCases.length}`);
  if (mustNotFireHits < mustNotFireCases.length) {
    for (const miss of mustNotFireMisses) console.log(`  MISS: ${miss}`);
    failed++;
  }
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

// Miss artifacts and floors are WHOLE-SET measurements: a --case run has a
// partial view of them, so it skips them rather than shrinking them (a
// filtered persist would overwrite the regression record with one case).
if (filtered) {
  console.log("\nmiss artifacts and baseline floor: skipped (--case is not a whole-set measurement)");
} else {
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
}

console.log(`\n${failed === 0 ? "PASS" : "FAIL"}: routing eval${filtered ? ` (--case ${selectedCaseId})` : ""}`);
process.exit(failed === 0 ? 0 : 1);
