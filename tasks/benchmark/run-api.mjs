#!/usr/bin/env node
/**
 * run-api.mjs — Run the verifier benchmark via direct OpenCode API calls.
 *
 * Usage:
 *   node tasks/benchmark/run-api.mjs [case-name-filter] [model]
 *
 * Defaults:
 *   model = opencode-go/longcat-2.5-preview-free
 *
 * Reads cases from tasks/benchmark/cases/, strips ground truth, sends each
 * case to the OpenCode chat completions API with the verifier protocol as
 * system prompt, and writes results to tasks/benchmark/results-api/.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

// --- Config ---------------------------------------------------------------
const SERVER_URL = process.env.OPENCODE_SERVER_URL || "http://127.0.0.1:49374";
// No inline fallback. A hardcoded `||` key was committed and pushed here once;
// the env var is now the only source, and a missing one fails loudly below
// rather than silently using a credential that outlives its revocation.
const API_KEY = process.env.OPENCODE_API_KEY;
if (!API_KEY) {
  console.error("OPENCODE_API_KEY is not set. Export it before running this script.");
  process.exit(1);
}
const MODEL = process.argv[3] || "opencode-go/longcat-2.5-preview-free";
const FILTER = process.argv[2] || "";
const CASES_DIR = join(REPO_ROOT, "tasks", "benchmark", "cases");
const OUT_DIR = join(REPO_ROOT, "tasks", "benchmark", "results-api");
const VERIFIER_PROTOCOL = readFileSync(join(REPO_ROOT, "agents", "verifier.md"), "utf-8");

mkdirSync(OUT_DIR, { recursive: true });

// --- Find cases -----------------------------------------------------------
const cases = [];
for (const discipline of readdirSync(CASES_DIR, { withFileTypes: true })) {
  if (!discipline.isDirectory()) continue;
  const disciplineDir = join(CASES_DIR, discipline.name);
  for (const file of readdirSync(disciplineDir, { withFileTypes: true })) {
    if (!file.isFile() || !file.name.endsWith(".md")) continue;
    if (file.name === "README.md") continue;
    const name = file.name.replace(/\.md$/, "");
    if (FILTER && !name.includes(FILTER)) continue;
    cases.push({ name, path: join(disciplineDir, file.name) });
  }
}

if (cases.length === 0) {
  console.error("INCOMPLETE: filter matched no benchmark cases");
  process.exit(1);
}

console.log(`Running ${cases.length} case(s) with model: ${MODEL}`);

// --- Run each case --------------------------------------------------------
let scored = 0;
for (const { name, path } of cases) {
  console.log(`--- running ${name}`);

  // Strip ground truth
  const fullContent = readFileSync(path, "utf-8");
  const blindContent = fullContent.split(/\*\*Ground-truth verdict:\*\*/)[0].trimEnd();

  // Leak guard
  if (/ground.truth|flaw type/i.test(blindContent)) {
    console.error(`    LEAK: ${name} still contains ground-truth material after stripping`);
    process.exit(1);
  }

  // Build the prompt
  const userMessage = `Blind verification dispatch. Verify the claimed conclusion below against its evidence items, following your verifier protocol. Ground truth is not provided. Return your report in your Output format, including the MACHINE_VERDICT line. Case:

${blindContent}`;

  // Call the API
  const response = await fetch(`${SERVER_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: VERIFIER_PROTOCOL },
        { role: "user", content: userMessage },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`    API ERROR (${response.status}): ${text.slice(0, 200)}`);
    process.exit(1);
  }

  const data = await response.json();
  const assistantMessage = data.choices?.[0]?.message?.content || "";

  // Write result
  const resultPath = join(OUT_DIR, `${name}-result.md`);
  writeFileSync(resultPath, assistantMessage);

  // Score it
  const { execSync } = await import("node:child_process");
  try {
    execSync(
      `node scripts/score-benchmark.mjs --case "${path}" "${resultPath}"`,
      { cwd: REPO_ROOT, stdio: "pipe" }
    );
    scored++;
    console.log("    ok");
  } catch {
    console.error(`    INVALID MACHINE_VERDICT (see ${resultPath})`);
  }
}

console.log(`\nscored runs with MACHINE_VERDICT: ${scored}/${cases.length}`);
if (scored !== cases.length) {
  process.exit(1);
}
