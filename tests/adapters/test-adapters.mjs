/**
 * test-adapters.mjs — the command contract renders correctly for every host.
 *
 * Adapters are no longer committed; they are rendered from
 * installer/contract.mjs at install time. This suite renders the full
 * tree into a temp directory and proves: every command reaches every host that
 * advertises a command tree (and no host emits a command the contract dropped),
 * every rendered command has parseable frontmatter, the rulesets match
 * references/host-rules.md, the OpenCode role adapters mirror agents/*.md
 * exactly, and every authored source referenced by the install map exists.
 *
 * Usage: node tests/adapters/test-adapters.mjs
 * Exit 1 on any failure.
 */

import { strict as assert } from "node:assert";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { commands, hosts } from "../../installer/contract.mjs";
import { renderAdapters } from "../../installer/render.mjs";
import { parseFrontmatterObject } from "../../scripts/yaml-frontmatter.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const temp = mkdtempSync(join(tmpdir(), "vitruvius-generate-"));
process.on("exit", () => rmSync(temp, { recursive: true, force: true }));

const written = renderAdapters({ targetRoot: temp });
const contractNames = new Set(commands.map((command) => command.name));

// Every adapter on disk names a command the contract still declares, and every
// command reaches every host that advertises a command tree.
for (const host of hosts) {
  if (!host.commands) continue;
  const dir = join(temp, host.commands.dir);
  const entries = readdirSync(dir).filter((file) => file.endsWith(`.${host.commands.ext}`));
  for (const entry of entries) {
    const name = entry.slice(0, -host.commands.ext.length - 1);
    assert.ok(contractNames.has(name), `${host.commands.dir}/${entry} is not in the command contract`);
    const frontmatter = parseFrontmatterObject(readFileSync(join(dir, entry), "utf-8"));
    assert.equal(frontmatter?.name, name, `${host.commands.dir}/${entry} frontmatter name must match its file name`);
  }
  for (const name of contractNames) {
    assert.ok(
      existsSync(join(dir, `${name}.${host.commands.ext}`)),
      `${host.commands.dir} is missing an adapter for the declared command ${name}`,
    );
  }
}

// The free-standing ruleset is authored once and rendered into each host.
const normalize = (text) => text.replace(/\r\n?/g, "\n");
const ruleset = normalize(readFileSync(join(root, "references", "host-rules.md"), "utf-8"));
for (const host of hosts) {
  if (!host.ruleset) continue;
  const target = join(temp, host.ruleset.file);
  assert.ok(existsSync(target), `${host.ruleset.file} must be rendered`);
  assert.equal(normalize(readFileSync(target, "utf-8")), ruleset, `${host.ruleset.file} must match references/host-rules.md`);
}

// Role adapters mirror the canonical agents/*.md set exactly.
const roleFiles = readdirSync(join(root, "agents"))
  .filter((file) => file.endsWith(".md") && file !== "README.md")
  .sort();
for (const host of hosts) {
  if (!host.roles) continue;
  const found = readdirSync(join(temp, host.roles.dir)).filter((file) => file.endsWith(".md")).sort();
  assert.deepEqual(found, roleFiles, `${host.roles.dir} must mirror agents/*.md exactly`);
}

// Every authored source named by the install map exists.
for (const host of hosts) {
  for (const entry of host.copy ?? []) {
    assert.ok(existsSync(join(root, entry.from)), `${host.id}: missing authored source ${entry.from}`);
  }
}

// The router must not send users to a command that does not exist.
const routerPattern = /`\/vitruvius:([a-z][a-z0-9-]*)`/g;
for (const entry of readdirSync(join(root, "skills"), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const skillMd = join(root, "skills", entry.name, "SKILL.md");
  if (!existsSync(skillMd)) continue;
  for (const match of readFileSync(skillMd, "utf-8").matchAll(routerPattern)) {
    assert.ok(
      contractNames.has(match[1]),
      `skills/${entry.name}/SKILL.md routes to /vitruvius:${match[1]}, which is not in the command contract`,
    );
  }
}

// Every skill is present with parseable frontmatter.
for (const entry of readdirSync(join(root, "skills"), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const skillMd = join(root, "skills", entry.name, "SKILL.md");
  assert.ok(existsSync(skillMd), `skills/${entry.name}/SKILL.md is missing`);
  const frontmatter = parseFrontmatterObject(readFileSync(skillMd, "utf-8"));
  assert.ok(
    frontmatter && frontmatter.name === entry.name,
    `skills/${entry.name}/SKILL.md frontmatter name does not match the directory`,
  );
}

console.log(
  `PASS: ${written.length} adapter file(s) render from the contract; every command reaches every host and every authored source exists`,
);
