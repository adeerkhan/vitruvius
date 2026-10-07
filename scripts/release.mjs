#!/usr/bin/env node
/**
 * release.mjs — bump the version, write the changelog entry, cut the tag.
 *
 * The version lives in several places that must move together: package.json and
 * every `installer/hosts/<host>/plugin.json` (tests/engineering-research/
 * test-version-sync.mjs fails the build if they drift). This script bumps them
 * all, prepends a CHANGELOG section built from the commits since the last `v*`
 * tag, and prints the commit/tag/push steps.
 *
 * It never pushes. Pass --commit to also create the release commit and tag.
 *
 * Usage:
 *   node scripts/release.mjs patch|minor|major|<X.Y.Z>
 *   node scripts/release.mjs minor --commit
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function fail(message) {
  console.error(`release: ${message}`);
  process.exit(1);
}

function git(args) {
  return execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}

function nextVersion(current, spec) {
  if (/^\d+\.\d+\.\d+$/.test(spec)) return spec;
  const [major, minor, patch] = current.split(".").map(Number);
  if (spec === "major") return `${major + 1}.0.0`;
  if (spec === "minor") return `${major}.${minor + 1}.0`;
  if (spec === "patch") return `${major}.${minor}.${patch + 1}`;
  fail(`expected patch, minor, major, or an X.Y.Z version; got "${spec}"`);
}

/** Every file whose `"version"` must move with the package. */
function versionFiles() {
  const files = ["package.json"];
  const hostsDir = join(REPO_ROOT, "installer", "hosts");
  if (existsSync(hostsDir)) {
    for (const entry of readdirSync(hostsDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const manifest = join(hostsDir, entry.name, "plugin.json");
      if (entry.isDirectory() && existsSync(manifest)) files.push(`installer/hosts/${entry.name}/plugin.json`);
    }
  }
  return files;
}

function bumpVersion(file, version) {
  const path = join(REPO_ROOT, file);
  const before = readFileSync(path, "utf-8");
  const next = before.replace(/("version"\s*:\s*")[^"]+(")/, `$1${version}$2`);
  if (next === before) fail(`${file} has no "version" field to bump`);
  writeFileSync(path, next);
}

function lastTag() {
  try {
    return git(["describe", "--tags", "--abbrev=0", "--match", "v*"]);
  } catch {
    return null;
  }
}

function subjectsSince(tag) {
  // No tag yet means this is the first release; do not dump the entire history
  // into the changelog.
  if (!tag) return [];
  return git(["log", "--no-merges", "--pretty=format:%s", `${tag}..HEAD`]).split("\n").filter(Boolean);
}

function changelogSection(version, date, subjects) {
  const bullets = subjects.length > 0 ? subjects.map((s) => `- ${s}`).join("\n") : "- Initial release.";
  return `## [${version}] - ${date}\n\n${bullets}\n\n`;
}

const argv = process.argv.slice(2);
const commit = argv.includes("--commit");
const spec = argv.find((arg) => !arg.startsWith("--"));
if (!spec) fail("usage: node scripts/release.mjs <patch|minor|major|X.Y.Z> [--commit]");

const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf-8"));
const current = pkg.version;
const version = nextVersion(current, spec);
const tag = `v${version}`;

// 1. Bump every manifest that carries the version.
for (const file of versionFiles()) bumpVersion(file, version);

// 2. Prepend the changelog entry.
const changelogPath = join(REPO_ROOT, "CHANGELOG.md");
const HEADER = `# Changelog\n\nAll notable changes to Vitruvius are documented here. The format follows\n[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases follow\n[Semantic Versioning](https://semver.org/).\n\n## [Unreleased]\n`;
let changelog = existsSync(changelogPath) ? readFileSync(changelogPath, "utf-8") : `${HEADER}\n`;
const date = new Date().toISOString().slice(0, 10);
const section = changelogSection(version, date, subjectsSince(lastTag()));
if (changelog.includes("## [Unreleased]")) {
  changelog = changelog.replace("## [Unreleased]\n", `## [Unreleased]\n\n${section}`);
} else {
  changelog = `${changelog.trimEnd()}\n\n${section}`;
}
writeFileSync(changelogPath, changelog);

const versionedFiles = versionFiles();
console.log(`release: ${current} -> ${version}`);
for (const file of versionedFiles) console.log(`  bumped ${file}`);
console.log("  updated CHANGELOG.md");

if (commit) {
  execFileSync("git", ["add", ...versionedFiles, "CHANGELOG.md"], { cwd: REPO_ROOT, stdio: "inherit" });
  execFileSync("git", ["commit", "-m", `chore(release): ${version}`], { cwd: REPO_ROOT, stdio: "inherit" });
  execFileSync("git", ["tag", tag], { cwd: REPO_ROOT, stdio: "inherit" });
  console.log(`\nCreated commit and tag ${tag}. Push with: git push origin main --follow-tags`);
} else {
  console.log(
    `\nNext:\n  git add ${[...versionedFiles, "CHANGELOG.md"].join(" ")}\n` +
      `  git commit -m "chore(release): ${version}"\n  git tag ${tag}\n  git push origin main --follow-tags`,
  );
}
