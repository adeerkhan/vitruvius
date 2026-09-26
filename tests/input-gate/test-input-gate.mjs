import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("../..", import.meta.url)));

// Skills that run research on their own must open with the shared gate. The
// discipline lenses dispatch to engineering-research, which carries its own
// gate, so they are not listed here.
const standalone = [
  "scholarly-research",
  "gap-analysis",
  "evidence-ranking",
  "design-alternatives",
  "fmea-brainstorm",
  "hypothesis-generation",
  "peer-review",
  "compare",
  "audit",
  "review",
  "summarize",
  "standards-lookup",
  "artifact-reading",
  "verifier",
];

assert.ok(
  existsSync(join(root, "references", "input-gate.md")),
  "shared input-gate reference exists",
);

for (const skill of standalone) {
  const text = readFileSync(join(root, "skills", skill, "SKILL.md"), "utf8");
  assert.match(text, /^## Input Gate$/m, `${skill}: declares an Input Gate`);
  assert.match(
    text,
    /references\/input-gate\.md/,
    `${skill}: points at the shared input gate`,
  );
}

// The shared method carries its own (level-3) gate.
const method = readFileSync(
  join(root, "skills", "engineering-research", "SKILL.md"),
  "utf8",
);
assert.match(method, /Input Gate/, "engineering-research: declares an Input Gate");

console.log(
  `PASS: ${standalone.length + 1} research-producing skills declare the shared input gate`,
);
