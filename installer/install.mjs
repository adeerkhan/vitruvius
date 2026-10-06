#!/usr/bin/env node
/**
 * install.mjs — install Vitruvius host adapters into a target project.
 *
 * Vitruvius keeps only hand-authored host files under `installer/hosts/<host>/`
 * (the OpenCode plugin entry, Claude/Qoder plugin manifests, the Cursor rule).
 * The slash commands, role adapters, rulesets, and the Command Code mod are all
 * derived and are rendered here into the target project's native
 * dot-directories — nothing generated is committed to the repository.
 *
 * Usage:
 *   node installer/install.mjs [--target <dir>] [--host <id>]... [--all]
 *
 * Options:
 *   --target <dir>   Project to install into (default: current directory)
 *   --host <id>      Install one host (repeatable). Default: every host.
 *   --all            Install every host (same as the default)
 *   --help           Show this message
 *
 * Examples:
 *   node installer/install.mjs --target . --all
 *   node installer/install.mjs --target ../my-project --host opencode --host cursor
 *
 * Installed dot-directories are derived output; add them to your .gitignore if
 * you do not want them tracked.
 */

import { mkdirSync, copyFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hosts } from "./contract.mjs";
import { renderAdapters } from "./render.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const USAGE = `install.mjs — install Vitruvius host adapters into a target project.

Usage:
  node installer/install.mjs [--target <dir>] [--host <id>]... [--all]

Options:
  --target <dir>   Project to install into (default: current directory)
  --host <id>      Install one host (repeatable). Default: every host.
  --all            Install every host (same as the default)
  --help           Show this message

Hosts: ${hosts.map((host) => host.id).join(", ")}`;

function parseArgs(argv) {
  const options = { target: process.cwd(), hosts: [], all: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--target" && argv[i + 1]) options.target = argv[++i];
    else if (arg === "--host" && argv[i + 1]) options.hosts.push(argv[++i]);
    else if (arg === "--all") options.all = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else {
      console.error(`Unknown argument: ${arg} (try --help)`);
      process.exit(2);
    }
  }
  return options;
}

function copyEntry(from, to) {
  const stats = statSync(from);
  if (stats.isDirectory()) {
    mkdirSync(to, { recursive: true });
    let count = 0;
    for (const entry of readdirSync(from, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      const childFrom = join(from, entry.name);
      const childTo = join(to, entry.name);
      if (entry.isDirectory()) count += copyEntry(childFrom, childTo);
      else {
        mkdirSync(dirname(childTo), { recursive: true });
        copyFileSync(childFrom, childTo);
        count++;
      }
    }
    return count;
  }
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  return 1;
}

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  console.log(USAGE);
  process.exit(0);
}

const targetRoot = resolve(options.target);
const known = new Map(hosts.map((host) => [host.id, host]));
const selected = [...new Set(options.hosts.length > 0 ? options.hosts : hosts.map((host) => host.id))];

for (const id of selected) {
  if (!known.has(id)) {
    console.error(`Unknown host "${id}". Known hosts: ${[...known.keys()].join(", ")}`);
    process.exit(2);
  }
}

let copied = 0;
for (const id of selected) {
  for (const entry of known.get(id).copy ?? []) {
    const from = join(REPO_ROOT, entry.from);
    if (!existsSync(from)) {
      console.error(`Missing authored source ${entry.from}`);
      process.exit(1);
    }
    copied += copyEntry(from, join(targetRoot, entry.to));
  }
}

const rendered = renderAdapters({ repoRoot: REPO_ROOT, targetRoot, hostIds: selected });

console.log(
  `Installed ${copied} authored + ${rendered.length} generated adapter file(s) ` +
    `for ${selected.join(", ")} into ${targetRoot}`,
);
