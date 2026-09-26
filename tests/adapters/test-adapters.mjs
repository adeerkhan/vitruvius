import { strict as assert } from "node:assert";
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { commands, hosts, rulesetHosts } from "../../scripts/command-contract.mjs";
import { parseFrontmatterObject } from "../../scripts/yaml-frontmatter.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const generator = join(root, "scripts", "generate-adapters.mjs");
const generatedCommand = join(root, ".opencode", "command", "vitruvius.md");
const orphanCommand = join(root, ".opencode", "command", "zz-not-a-command.md");
const original = readFileSync(generatedCommand, "utf-8");

const check = () => spawnSync(process.execPath, [generator, "--check"], { cwd: root, encoding: "utf-8" });

const clean = check();
assert.equal(clean.status, 0, `clean generated command tree must pass --check: ${clean.stderr}`);
assert.match(clean.stdout, /free of orphans/);

try {
  writeFileSync(generatedCommand, `${original}\n<!-- intentional stale fixture -->\n`, "utf-8");
  const result = check();
  assert.notEqual(result.status, 0, "--check must fail on stale generated output");
  assert.match(`${result.stdout}\n${result.stderr}`, /command[\\/]vitruvius\.md/);
  assert.match(readFileSync(generatedCommand, "utf-8"), /intentional stale fixture/);
} finally {
  writeFileSync(generatedCommand, original, "utf-8");
}

// A command dropped from the contract used to leave its adapter behind, and a
// stale adapter still answers to its slash command: a routing dead end that
// looked alive. /verify was one for months.
try {
  writeFileSync(orphanCommand, "# not a command\n", "utf-8");
  const orphan = check();
  assert.notEqual(orphan.status, 0, "--check must fail on an orphaned adapter");
  assert.match(`${orphan.stdout}\n${orphan.stderr}`, /orphaned adapter file/);
  assert.match(`${orphan.stdout}\n${orphan.stderr}`, /zz-not-a-command\.md/);
  assert.ok(existsSync(orphanCommand), "--check must report orphans, not delete them");
} finally {
  rmSync(orphanCommand, { force: true });
}

// Every adapter on disk must name a command the contract still declares, and
// every command must reach every host that advertises it.
const contractNames = new Set(commands.map((command) => command.name));
for (const host of hosts) {
  if (host.id === "commandcode") continue;
  const dir = join(root, host.dir);
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith(`.${host.ext}`)) continue;
    const name = entry.slice(0, -host.ext.length - 1);
    assert.ok(contractNames.has(name), `${host.dir}/${entry} is not in the command contract`);
  }
}
for (const name of contractNames) {
  for (const host of hosts) {
    if (host.id === "commandcode") continue;
    assert.ok(
      existsSync(join(root, host.dir, `${name}.${host.ext}`)),
      `${host.dir} is missing an adapter for the declared command ${name}`,
    );
  }
}

// The router must not send users to a command that does not exist. This is the
// check that would have caught /vitruvius:verify pointing at nothing.
const routerPattern = /`\/vitruvius:([a-z][a-z0-9-]*)`/g;
for (const entry of readdirSync(join(root, "skills"), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const skillMd = join(root, "skills", entry.name, "SKILL.md");
  if (!existsSync(skillMd)) continue;
  const text = readFileSync(skillMd, "utf-8");
  for (const match of text.matchAll(routerPattern)) {
    assert.ok(
      contractNames.has(match[1]),
      `skills/${entry.name}/SKILL.md routes to /vitruvius:${match[1]}, which is not in the command contract`,
    );
  }
}

// The free-standing host ruleset is authored once. Three identical copies used
// to sit in the tree, hand-maintained, free to drift apart unnoticed. Compare
// after line-ending normalization: the generator emits LF, and a CRLF working
// tree must not read as drift.
const normalize = (text) => text.replace(/\r\n?/g, "\n");
const ruleset = normalize(readFileSync(join(root, "references", "host-rules.md"), "utf-8"));
for (const host of rulesetHosts) {
  const target = join(root, host.file);
  assert.ok(existsSync(target), `${host.file} is missing`);
  assert.equal(
    normalize(readFileSync(target, "utf-8")),
    ruleset,
    `${host.file} has drifted from references/host-rules.md`,
  );
}

// Every skill is present with parseable frontmatter, so a host that scans
// skills/ discovers a real catalog. (Ported from the retired host-discovery
// smoke; the bundle machinery was speculative infra around this one check.)
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

console.log("PASS: adapter drift and orphans are detected, and every routed command exists on every host");
