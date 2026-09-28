import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const reference = readFileSync(join(repoRoot, "references", "prompt-patterns.md"), "utf8");

// The reference file must exist and follow the numbered pattern format
assert.match(reference, /# Prompt Patterns/, "reference must have a title");
assert.match(reference, /numbered.*ordered by strength/i, "reference must describe the ordering");

// Must have numbered patterns (## 1. through ## 10.)
for (let i = 1; i <= 10; i++) {
  assert.match(reference, new RegExp(`## ${i}\\.`), `reference must have pattern ## ${i}`);
}

// Each pattern must have "Watch for" and "Problem" sections
const watchForCount = (reference.match(/\*\*Watch for:\*\*/g) || []).length;
const problemCount = (reference.match(/\*\*Problem:\*\*/g) || []).length;
assert.ok(watchForCount >= 10, `expected at least 10 "Watch for" sections, found ${watchForCount}`);
assert.ok(problemCount >= 10, `expected at least 10 "Problem" sections, found ${problemCount}`);

// Must document the "no gaps" rule
assert.match(reference, /numbered from 1 without gaps/i, "reference must document the no-gaps rule");

console.log("PASS: prompt-patterns reference follows the numbered pattern format");
