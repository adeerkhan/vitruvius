// Vitruvius skill-package validator.
// Checks the structural invariants that make the package portable:
// every skill is a folder with a SKILL.md carrying YAML frontmatter with a
// name and description, and every frontmatter name matches its folder.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const skillsDir = join(root, "skills");

const entries = readdirSync(skillsDir).map((name) => join(skillsDir, name));
const failures = [];
const checked = [];

for (const dir of entries) {
  if (!statSync(dir).isDirectory()) continue;
  const name = dir.split(/[\\/]/).pop();
  const skillPath = join(dir, "SKILL.md");

  if (!exists(skillPath)) {
    failures.push(`${name}/SKILL.md: missing`);
    continue;
  }

  const text = readFileSync(skillPath, "utf8");
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) {
    failures.push(`${name}/SKILL.md: missing YAML frontmatter`);
    continue;
  }

  const nameMatch = fm[1].match(/^name:\s*(.+)$/m);
  const descMatch = fm[1].match(/^description:\s*(?:>|.+)$/m);
  if (!nameMatch) failures.push(`${name}/SKILL.md: frontmatter missing 'name'`);
  if (!descMatch) failures.push(`${name}/SKILL.md: frontmatter missing 'description'`);

  const fmName = nameMatch?.[1]?.trim().replace(/^["']|["']$/g, "");
  if (fmName && fmName !== name) {
    failures.push(`${name}/SKILL.md: frontmatter name '${fmName}' != folder name`);
  }

  checked.push(name);
}

// AGENTS.md must exist at the root.
if (!exists(join(root, "AGENTS.md"))) {
  failures.push("AGENTS.md: missing at repo root");
}

if (failures.length > 0) {
  console.error(`vitruvius: ${failures.length} structural failure(s)`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`vitruvius: OK (${checked.length} skills: ${checked.join(", ")})`);

function exists(p) {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
}
