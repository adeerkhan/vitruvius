#!/usr/bin/env node
/**
 * install.mjs — install Vitruvius into a project or a harness's global config.
 *
 * Two modes:
 *
 *   Project (default). Renders a target project's native dot-directories:
 *   slash commands, OpenCode role adapters, rulesets, and the Command Code mod,
 *   plus the authored host files under `installer/hosts/<host>/`. Nothing
 *   generated is committed to the repository.
 *
 *   Global (--global). Copies the Agent Skills bundle and the shared ruleset
 *   into a harness's global config root, so the same skills load in every
 *   agent without a project checkout. Roots and env overrides mirror the
 *   reference distribution.
 *
 * Usage:
 *   node installer/install.mjs [--target <dir>] [--host <id>]... [--all]
 *   node installer/install.mjs --global [--host <id>]... [--all]
 *
 * Options:
 *   --target <dir>   Project to install into (default: current directory)
 *   --global         Install into each harness's global config root instead
 *   --host <id>      Install one host (repeatable). Default: every host.
 *   --all            Install every host (same as the default)
 *   --help           Show this message
 *
 * Examples:
 *   node installer/install.mjs --target . --all
 *   node installer/install.mjs --global --host claude --host hermes
 */

import { mkdirSync, copyFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hosts, homeHosts } from "./contract.mjs";
import { renderAdapters } from "./render.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const USAGE = `install.mjs — install Vitruvius host adapters.

Usage:
  node installer/install.mjs [--target <dir>] [--host <id>]... [--all]
  node installer/install.mjs --global [--host <id>]... [--all]

Options:
  --target <dir>   Project to install into (default: current directory)
  --global         Install into each harness's global config root instead
  --host <id>      Install one host (repeatable). Default: every host.
  --all            Install every host (same as the default)
  --help           Show this message

Project hosts: ${hosts.map((host) => host.id).join(", ")}
Global hosts:  ${homeHosts.map((host) => host.id).join(", ")}`;

function parseArgs(argv) {
  const options = { target: process.cwd(), hosts: [], all: false, global: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--target" && argv[i + 1]) options.target = argv[++i];
    else if (arg === "--host" && argv[i + 1]) options.hosts.push(argv[++i]);
    else if (arg === "--all") options.all = true;
    else if (arg === "--global") options.global = true;
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

/** The global skill-discovery root for a host, honoring its env override. */
export function resolveHomeRoot(host, env = process.env, home = homedir()) {
  const spec = host.home;
  if (spec.env && env[spec.env]) return join(env[spec.env], ...spec.suffix);
  return join(home, ...spec.fallback);
}

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  console.log(USAGE);
  process.exit(0);
}

const manifest = options.global ? homeHosts : hosts;
const known = new Map(manifest.map((host) => [host.id, host]));
const selected = [...new Set(options.hosts.length > 0 ? options.hosts : manifest.map((host) => host.id))];

for (const id of selected) {
  if (!known.has(id)) {
    console.error(
      `Unknown ${options.global ? "global " : ""}host "${id}". Known hosts: ${[...known.keys()].join(", ")}`,
    );
    process.exit(2);
  }
}

if (options.global) {
  const destinations = [];
  for (const id of selected) {
    const dest = join(resolveHomeRoot(known.get(id)), "vitruvius");
    const skills = copyEntry(join(REPO_ROOT, "skills"), dest);
    mkdirSync(dest, { recursive: true });
    copyFileSync(join(REPO_ROOT, "references", "host-rules.md"), join(dest, "host-rules.md"));
    destinations.push(`${id} -> ${dest} (${skills + 1} files)`);
  }
  console.log(`Installed the Vitruvius skills bundle and ruleset for:\n  ${destinations.join("\n  ")}`);
} else {
  const targetRoot = resolve(options.target);
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
}
