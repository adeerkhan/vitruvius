// vitruvius — OpenCode plugin.
//
// Registers the Vitruvius engineering-research skills with OpenCode and wires
// the /vitruvius slash command to the skill dispatcher. When OpenCode runs
// with this repo as its working directory it also auto-loads this file from
// .opencode/plugins/. Users on a checkout can point opencode.json at this
// file directly:
//   { "plugin": ["./path/to/vitruvius/.opencode/plugins/vitruvius.mjs"] }

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// A tiny frontmatter reader for the command files (name + description are all
// OpenCode needs; argument hints come from the description text).
function parseCommandFile(file) {
  const text = fs.readFileSync(file, "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const fm = match[1];
  const description = (fm.match(/^description:\s*(.+)$/m) || [])[1];
  if (!description) return null;
  return { description: description.trim() };
}

export default async () => {
  const commandDir = path.join(__dirname, "..", "command");
  const skillsDir = path.resolve(__dirname, "..", "..", "skills");

  return {
    config: async (config) => {
      if (!config.command) config.command = {};
      try {
        for (const file of fs.readdirSync(commandDir).filter((f) => f.endsWith(".md"))) {
          const name = path.basename(file, ".md");
          const parsed = parseCommandFile(path.join(commandDir, file));
          if (parsed) config.command[name] = parsed;
        }
      } catch {}

      if (!config.skills) config.skills = {};
      if (!config.skills.paths) config.skills.paths = [];
      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir);
      }
    },
  };
};
