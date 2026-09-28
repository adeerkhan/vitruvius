#!/usr/bin/env node
// generate-skill-diagram.mjs — generate a Mermaid workflow diagram from a
// skill's SKILL.md. Stolen from Scientific Agent Skills' skill diagram pattern.
//
// Usage:
//   node scripts/generate-skill-diagram.mjs <skill-name>
//   node scripts/generate-skill-diagram.mjs <skill-name> --output <path>
//
// Output: A Mermaid flowchart showing the skill's workflow steps.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = join(repoRoot, "skills");

function extractWorkflow(skillName) {
  const skillPath = join(skillsDir, skillName, "SKILL.md");
  let text;
  try {
    text = readFileSync(skillPath, "utf8");
  } catch {
    console.error(`FAIL: skills/${skillName}/SKILL.md not found`);
    process.exit(1);
  }

  // Extract workflow steps from numbered lists
  const steps = [];
  const lines = text.split("\n");
  let inWorkflow = false;

  for (const line of lines) {
    // Detect workflow section
    if (/^#+\s*(?:workflow|process|steps|how to work)/i.test(line)) {
      inWorkflow = true;
      continue;
    }

    // Detect end of workflow section (next heading)
    if (inWorkflow && /^#+\s+/.test(line)) {
      inWorkflow = false;
      continue;
    }

    // Extract numbered steps
    if (inWorkflow) {
      const match = line.match(/^\d+\.\s+(.+)/);
      if (match) {
        steps.push(match[1].trim());
      }
    }
  }

  // If no workflow section found, try to extract from the whole document
  if (steps.length === 0) {
    for (const line of lines) {
      const match = line.match(/^\d+\.\s+\*\*(.+?)\*\*/);
      if (match) {
        steps.push(match[1].trim());
      }
    }
  }

  return steps;
}

function generateMermaid(steps, skillName) {
  if (steps.length === 0) {
    return `graph TD\n  A[${skillName}] --> B[No workflow steps found]`;
  }

  const lines = ["graph TD"];
  lines.push(`  Start[${skillName}] --> Step1[${steps[0]}]`);

  for (let i = 1; i < steps.length; i++) {
    lines.push(`  Step${i}[${steps[i - 1]}] --> Step${i + 1}[${steps[i]}]`);
  }

  lines.push(`  Step${steps.length}[${steps[steps.length - 1]}] --> End[Done]`);

  return lines.join("\n");
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Usage: node scripts/generate-skill-diagram.mjs <skill-name> [--output <path>]");
  process.exit(1);
}

const skillName = args[0];
const outputIndex = args.indexOf("--output");
const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : null;

const steps = extractWorkflow(skillName);
const mermaid = generateMermaid(steps, skillName);

if (outputPath) {
  writeFileSync(outputPath, mermaid, "utf8");
  console.log(`Wrote diagram to ${outputPath}`);
} else {
  console.log(mermaid);
}

console.log(`\n${steps.length} workflow step(s) extracted from ${skillName}`);
