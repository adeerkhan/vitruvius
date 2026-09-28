#!/usr/bin/env node
// certify-runner.mjs — run the adversarial benchmark N times, resumably.
//
// Purpose: replace a single-run point estimate with a majority-of-N
// measurement. Written for a long unattended run, so the design priorities are,
// in order: never lose a completed run, never silently skip one, and never
// overwrite evidence.
//
// Mirrors tasks/benchmark/run-opencode.sh exactly (same blind cut, same leak
// guard, same dispatch prompt, same model) but adds:
//   - a separate output directory per run, never overwritten
//   - resumption: a case already scored is skipped, not redone
//   - a per-run journal (run journal) recording every attempt, including
//     failures and retries, so a gap is visible rather than inferred
//   - --retries with failures counted as failures, never as results
//
// Usage:
//   node tasks/benchmark/certify-runner.mjs --run 1 [--cases <filter>] [--retries 2]
//   node tasks/benchmark/certify-runner.mjs --all-runs 3
//   node tasks/benchmark/certify-runner.mjs --status
//
// Usage: `node certify-runner.mjs --help` for the full flag list.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

const MODEL = process.env.CERT_MODEL || "opencode-go/longcat-2.5-preview-free";
const RESULT_SUFFIX = "-result.md";

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : dflt;
};

function usage() {
  console.log(`certify-runner.mjs — majority-of-N certification runs

  --run <n>          run index (1-based). Output: tasks/benchmark/<prefix>-r<n>
  --all-runs <n>     run indexes 1..n, sequentially
  --cases <filter>   substring filter on the case name (default: all)
  --cases-dir <dir>  cases directory (default tasks/benchmark/cases)
  --out-prefix <s>   output dir prefix (default results-cert).
                     The pressure suite uses --out-prefix results-pressure
                     so its artifacts can never mix with the adversarial corpus.
  --retries <n>      attempts per case before recording a failure (default 2)
  --model <name>     model (default ${MODEL})
  --status           print per-run, per-case coverage and exit
  --dry-run          list what would run, execute nothing
  --help             this text

Each run writes to its own directory and is never overwritten. A case already
present with a parseable MACHINE_VERDICT is skipped, so an interrupted sweep
resumes where it stopped.

The blind cut, leak guard, dispatch prompt, and model are copied from
tasks/benchmark/run-opencode.sh. Changing any of them invalidates comparison
against a run produced by that script.`);
}

// --- case discovery --------------------------------------------------------
function discoverCases(casesDir, filter) {
  const out = [];
  for (const discipline of readdirSync(casesDir, { withFileTypes: true })) {
    if (discipline.isDirectory()) {
      const dir = join(casesDir, discipline.name);
      for (const file of readdirSync(dir)) {
        if (!file.endsWith(".md") || file === "README.md") continue;
        const name = basename(file, ".md");
        if (filter && !name.includes(filter)) continue;
        out.push({ name, path: join(dir, file) });
      }
    } else if (discipline.name.endsWith(".md") && discipline.name !== "README.md") {
      const name = basename(discipline.name, ".md");
      if (filter && !name.includes(filter)) continue;
      out.push({ name, path: join(casesDir, discipline.name) });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// --- blind cut, identical to run-opencode.sh -------------------------------
function blindCase(casePath) {
  const full = readFileSync(casePath, "utf8");
  const lines = full.split(/\r?\n/);
  const idx = lines.findIndex((l) => /^\*\*Ground-truth verdict:\*\*/.test(l));
  if (idx === -1) throw new Error(`no ground-truth marker in ${casePath}`);
  const blind = `${lines.slice(0, idx).join("\n").replace(/\s+$/, "")}\n`;
  // Leak guard, same as the runner: a blind case must not carry the answer.
  if (/ground.truth|flaw type/i.test(blind)) throw new Error(`LEAK GUARD tripped for ${casePath}`);
  return blind;
}

const PROMPT =
  "Blind verification dispatch. Verify the claimed conclusion below against its evidence items, " +
  "following your verifier protocol. Ground truth is not provided. Return your report in your " +
  "Output format, including the MACHINE_VERDICT line. Case:";

function parseVerdict(text) {
  const m = /MACHINE_VERDICT:\s*(\S+)\s*\|\s*FLAW:\s*(\S+)(?:\s*\|\s*CONFIDENCE:\s*([\d.]+))?(?:\s*\|\s*CHECKS_PASSED:\s*([^|]+))?/.exec(text);
  if (!m) return null;
  return { verdict: m[1], flaw: m[2], confidence: m[3] ?? null, checks: (m[4] ?? "").trim() || null };
}

// --- one case, one run -----------------------------------------------------
/**
 * Resolve the opencode launcher.
 *
 * On Windows the npm shim is a `.cmd` file, and spawnSync cannot execute a `.cmd`
 * without a shell — it fails with ENOENT while `opencode --version` works
 * perfectly from a prompt. `shell: true` is not an option: the dispatch prompt
 * would be re-parsed by the shell, and a mangled prompt still runs and returns a
 * plausible-looking wrong answer, which is worse than a hard failure.
 *
 * So the .cmd is invoked explicitly through cmd.exe with an argv array. The
 * dispatch prompt contains no quotes, parentheses, redirects, or % signs, and
 * the case path is under a repo path with no spaces, so cmd re-parsing is a
 * no-op here. If a future path breaks that assumption this fails loudly rather
 * than silently, which is the correct direction to fail.
 */
function opencodeLauncher() {
  if (process.platform !== "win32") return { cmd: "opencode", prefix: [] };
  const appData = process.env.APPDATA;
  if (appData && existsSync(join(appData, "npm", "opencode.cmd"))) {
    return { cmd: "cmd.exe", prefix: ["/c", join(appData, "npm", "opencode.cmd")] };
  }
  return { cmd: "opencode.cmd", prefix: [] };
}

const LAUNCHER = opencodeLauncher();

function runOne({ name, path }, outDir, retries) {
  const resultPath = join(outDir, `${name}${RESULT_SUFFIX}`);

  // Resumption: a complete, parseable result is evidence, not a redo.
  if (existsSync(resultPath)) {
    const existing = parseVerdict(readFileSync(resultPath, "utf8"));
    if (existing) return { name, status: "skipped", ...existing };
  }

  let blind;
  try {
    blind = blindCase(path);
  } catch (e) {
    return { name, status: "error", error: e.message };
  }

  const blindPath = join(outDir, `.blind-${name}.md`);
  writeFileSync(blindPath, blind, "utf8");

  let lastError = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    // An argv array, so the prompt is data rather than a shell fragment. This
    // also sidesteps the UTF-16 corruption the shell runner hits: PowerShell's
    // `>` redirection writes UTF-16, which the verdict parser cannot read.
    const res = spawnSync(
      LAUNCHER.cmd,
      [
        ...LAUNCHER.prefix,
        "run",
        "--agent",
        "verifier",
        "--model",
        MODEL,
        "--format",
        "json",
        "-f",
        blindPath,
        PROMPT,
      ],
      { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 900000 },
    );

    if (res.error) {
      lastError = res.error.message;
    } else if (res.status !== 0) {
      lastError = `exit ${res.status}: ${(res.stderr || "").slice(0, 200)}`;
    } else {
      // --format json emits one JSON object per line; the assistant text is the
      // last text part.
      const texts = [];
      for (const line of (res.stdout || "").split(/\r?\n/)) {
        if (!line.trim()) continue;
        try {
          const d = JSON.parse(line);
          if (d.part?.type === "text" && d.part.text) texts.push(d.part.text);
        } catch {
          // non-JSON noise is expected
        }
      }
      if (!texts.length) {
        lastError = "no text part in output";
      } else {
        const body = texts[texts.length - 1];
        const parsed = parseVerdict(body);
        if (!parsed) {
          lastError = "output has no parseable MACHINE_VERDICT";
        } else {
          // Write only after a parseable verdict, so a partial file never
          // occupies the result path and blocks resumption.
          writeFileSync(resultPath, body, "utf8");
          rmSync(blindPath, { force: true });
          return { name, status: "ok", attempts: attempt, ...parsed };
        }
      }
    }
    if (attempt < retries) {
      // Free-tier rate limits are the common failure. Back off briefly.
      spawnSync(process.execPath, ["-e", `setTimeout(()=>{},${1000 * attempt * 5})`], { timeout: 40000 });
    }
  }
  rmSync(blindPath, { force: true });
  return { name, status: "failed", error: lastError, attempts: retries };
}

// --- status ----------------------------------------------------------------
function status(casesDir, filter, runIndexes, outPrefix) {
  const cases = discoverCases(casesDir, filter);
  console.log(`cases: ${cases.length}${filter ? ` (filter: ${filter})` : ""}\n`);
  for (const r of runIndexes) {
    const dir = join(REPO_ROOT, "tasks", "benchmark", `${outPrefix}-r${r}`);
    if (!existsSync(dir)) {
      console.log(`run ${r}: (no directory yet)`);
      continue;
    }
    const present = cases.filter((c) => existsSync(join(dir, `${c.name}${RESULT_SUFFIX}`)));
    console.log(`run ${r}: ${present.length}/${cases.length} results present`);
    const missing = cases.filter((c) => !present.includes(c)).map((c) => c.name);
    if (missing.length) console.log(`         missing: ${missing.join(", ")}`);
  }
}

function main() {
  if (flag("help")) return usage(), 0;

  const casesDirRel = opt("cases-dir", "tasks/benchmark/cases");
  const casesDir = join(REPO_ROOT, casesDirRel);
  const filter = opt("cases", "");
  const retries = Number(opt("retries", "2"));
  // The pressure suite is a SEPARATE measurement with its own denominator. It
  // gets its own output prefix so its artifacts can never be mixed with the
  // adversarial corpus, and so a change to one cannot silently move the other.
  const outPrefix = opt("out-prefix", "results-cert");
  const cases = discoverCases(casesDir, filter);
  if (cases.length === 0) {
    console.error(`no cases matched (dir: ${casesDirRel}, filter: "${filter}")`);
    return 1;
  }

  const runIndexes = flag("all-runs")
    ? Array.from({ length: Number(opt("all-runs", "1")) }, (_, i) => i + 1)
    : [Number(opt("run", "1"))];

  if (flag("status")) {
    status(casesDir, filter, runIndexes, outPrefix);
    return 0;
  }

  if (flag("dry-run")) {
    console.log(`${cases.length} case(s) x ${runIndexes.length} run(s), model ${MODEL}, out-prefix ${outPrefix}`);
    cases.forEach((c) => console.log(`  ${c.name}`));
    return 0;
  }

  const started = Date.now();
  const all = [];

  for (const r of runIndexes) {
    const outDir = join(REPO_ROOT, "tasks", "benchmark", `${outPrefix}-r${r}`);
    mkdirSync(outDir, { recursive: true });
    console.log(`\n=== run ${r}/${runIndexes.length} -> ${basename(outDir)} ===`);

    for (const c of cases) {
      const t0 = Date.now();
      const res = runOne(c, outDir, retries);
      const secs = ((Date.now() - t0) / 1000).toFixed(1);
      all.push({ run: r, ...res });
      const tag = res.status === "ok" ? "ok      " : res.status === "skipped" ? "skipped " : res.status.toUpperCase();
      console.log(`  ${tag} ${c.name.padEnd(46)} ${res.verdict ?? ""} ${res.flaw ?? ""} (${res.error ?? ""}${res.error ? " " : ""}${secs}s)`);

      // A journal, appended per case, so an interrupted sweep leaves a record
      // of exactly what completed. Written in the run directory, which is
      // force-added later as evidence.
      writeFileSync(
        join(outDir, "journal.jsonl"),
        JSON.stringify({ run: r, case: c.name, ...res, seconds: Number(secs) }) + "\n",
        { flag: "a", encoding: "utf8" },
      );
    }
  }

  const ok = all.filter((r) => r.status === "ok").length;
  const skipped = all.filter((r) => r.status === "skipped").length;
  const failed = all.filter((r) => r.status === "failed" || r.status === "error").length;
  const mins = ((Date.now() - started) / 60000).toFixed(1);
  console.log(`\n${ok} ok, ${skipped} already present, ${failed} failed, in ${mins} min`);

  // Exit non-zero if anything failed, so a sweep is never mistaken for complete.
  if (failed > 0) {
    console.error("\nFAILURES (not results — re-run these):");
    for (const f of all.filter((x) => x.status === "failed" || x.status === "error")) {
      console.error(`  run ${f.run} ${f.name}: ${f.error}`);
    }
    return 1;
  }
  return 0;
}

process.exit(main());
