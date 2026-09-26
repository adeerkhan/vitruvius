#!/usr/bin/env node
/**
 * host-discovery-smoke.mjs — prove each host surface can discover the skills and
 * commands, and preserve a failure bundle when it cannot.
 *
 * Transfer from ref/abrt ("run a small behavioral host-smoke tier and preserve
 * stdout/stderr/log bundles on failure") and ref/humanizer ("executable
 * package/plugin discovery smoke tests"). We cannot boot every host binary in
 * CI, so this checks the discovery surface each host actually reads: every
 * command adapter exists with parseable frontmatter, the skill catalog parses,
 * and every ruleset copy matches its single source.
 *
 * Usage:
 *   node scripts/host-discovery-smoke.mjs [--root <dir>] [--out <dir>]
 *
 * On failure it writes report.json and report.md to `--out` (default
 * `.test-archive/host-smoke/<timestamp>`) and exits 1.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { commands, hosts, rulesetHosts } from "./command-contract.mjs";
import { readFrontmatterObject } from "./yaml-frontmatter.mjs";

const REPO_ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");

const normalize = (text) => text.replace(/\r\n?/g, "\n");

export function checkHostDiscovery({ root }) {
  const problems = [];

  const skillsDir = join(root, "skills");
  if (!existsSync(skillsDir)) {
    problems.push("skills/ directory is missing");
  } else {
    for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const skillMd = join(skillsDir, entry.name, "SKILL.md");
      if (!existsSync(skillMd)) {
        problems.push(`skills/${entry.name}/SKILL.md is missing`);
        continue;
      }
      const frontmatter = readFrontmatterObject(readFileSync(skillMd, "utf-8"));
      if (!frontmatter || frontmatter.name !== entry.name) {
        problems.push(`skills/${entry.name}/SKILL.md frontmatter name does not match the directory`);
      }
    }
  }

  for (const host of hosts) {
    if (host.id === "commandcode") {
      const mod = join(root, host.dir, "vitruvius.ts");
      if (!existsSync(mod)) problems.push(`${host.dir}/vitruvius.ts is missing`);
      continue;
    }
    const dir = join(root, host.dir);
    if (!existsSync(dir)) {
      problems.push(`${host.dir} is missing`);
      continue;
    }
    for (const command of commands) {
      const file = join(dir, `${command.name}.${host.ext}`);
      if (!existsSync(file)) {
        problems.push(`${host.dir}/${command.name}.${host.ext} is missing`);
        continue;
      }
      const frontmatter = readFrontmatterObject(readFileSync(file, "utf-8"));
      if (!frontmatter || frontmatter.name !== command.name) {
        problems.push(`${host.dir}/${command.name}.${host.ext} frontmatter name does not match the command`);
      }
    }
  }

  const rulesetSource = join(root, "references", "host-rules.md");
  for (const host of rulesetHosts) {
    const file = join(root, host.file);
    if (!existsSync(file)) {
      problems.push(`${host.file} is missing`);
      continue;
    }
    if (!existsSync(rulesetSource)) {
      problems.push("references/host-rules.md is missing");
      continue;
    }
    if (normalize(readFileSync(file, "utf-8")) !== normalize(readFileSync(rulesetSource, "utf-8"))) {
      problems.push(`${host.file} has drifted from references/host-rules.md`);
    }
  }

  return problems;
}

function writeBundle(outDir, root, problems) {
  mkdirSync(outDir, { recursive: true });
  const report = { timestamp: new Date().toISOString(), root, problemCount: problems.length, problems };
  writeFileSync(join(outDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  const lines = [
    "# Host discovery smoke failure",
    "",
    `- **When:** ${report.timestamp}`,
    `- **Root:** ${root}`,
    `- **Problems:** ${problems.length}`,
    "",
    ...problems.map((problem) => `- ${problem}`),
    "",
  ];
  writeFileSync(join(outDir, "report.md"), lines.join("\n"), "utf-8");
  return outDir;
}

function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.error("Usage: node scripts/host-discovery-smoke.mjs [--root <dir>] [--out <dir>]");
    return 0;
  }
  const rootIndex = argv.indexOf("--root");
  const outIndex = argv.indexOf("--out");
  const root = resolve(rootIndex === -1 ? REPO_ROOT : argv[rootIndex + 1]);
  const outDir = resolve(
    outIndex === -1
      ? join(REPO_ROOT, ".test-archive", "host-smoke", new Date().toISOString().replace(/[:.]/g, "-"))
      : argv[outIndex + 1],
  );

  const problems = checkHostDiscovery({ root });
  if (problems.length === 0) {
    console.log(`PASS: host discovery smoke — every command, skill, and ruleset surface resolves under ${root}`);
    return 0;
  }
  const bundle = writeBundle(outDir, root, problems);
  console.error(`FAIL: ${problems.length} host-discovery problem(s); bundle at ${bundle}`);
  for (const problem of problems) console.error(`  ${problem}`);
  return 1;
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  process.exitCode = main(process.argv.slice(2));
}
