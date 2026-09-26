/**
 * DP1 — docs/code parity.
 *
 * Transfer from ref/feynman (5087ac8 "List only commands and tools that
 * exist"; e18b7e3 "Check every docs page ... against the code"). Vitruvius had
 * command-contract parity but nothing that reads the README/help card back
 * against it, so a doc could name a dead command or omit a real one.
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { commands } from "../../scripts/command-contract.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const contract = new Set(commands.map((command) => command.name));

const read = (relative) => readFileSync(join(root, relative), "utf8");
const readme = read("README.md");
const help = read("skills/vitruvius-help/SKILL.md");

// Normalize namespaced helpers so `/vitruvius:audit` and `/skill:x` tokenize as
// `/audit` and `/x`, then collect `/name` mentions.
const MENTION = /(?<=^|\s|`|[*\[(])\/([a-z][a-z0-9-]{2,})\b(?!\/)/g;
function mentions(text) {
  const normalized = text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\/vitruvius:/g, "/")
    .replace(/\/skill:/g, "/");
  return [...normalized.matchAll(MENTION)].map((match) => match[1]);
}

const readmeMentions = new Set(mentions(readme));
const helpMentions = new Set(mentions(help));

// 1. Docs may only name commands that exist.
for (const [file, found] of [["README.md", readmeMentions], ["vitruvius-help", helpMentions]]) {
  for (const name of found) {
    if (name === "skill") continue;
    assert.ok(contract.has(name), `${file} mentions /${name}, which is not in the command contract`);
  }
}

// 2. Every contract command is documented somewhere (README or help card).
const undocumented = [...contract].filter((name) => !readmeMentions.has(name) && !helpMentions.has(name));
assert.deepEqual(undocumented, [], `contract commands missing from docs: ${undocumented.join(", ")}`);

// 3. Relative markdown links in the README resolve on disk.
const LINK = /\]\(([^)#\s]+)\)/g;
const missing = [];
for (const match of readme.matchAll(LINK)) {
  const target = match[1];
  if (/^https?:/i.test(target) || target.startsWith("#")) continue;
  const path = target.split("#")[0].replace(/[.,;:]+$/, "");
  if (path === "") continue;
  if (!existsSync(join(root, path))) missing.push(path);
}
assert.deepEqual(missing, [], `README links to missing paths: ${missing.join(", ")}`);

console.log(
  `PASS: docs parity — ${contract.size} commands documented, ${readmeMentions.size + helpMentions.size} doc mentions, all README links resolve`,
);
