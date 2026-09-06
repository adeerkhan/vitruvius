/**
 * Test suite for skills/design-alternatives/SKILL.md
 *
 * Validates structure, methodology phases, and boundary language.
 */

import {
  hasFrontmatter,
  hasRequiredFields,
  hasSection,
  hasMethodologyPhases,
  hasS7Boundary,
  lineCountUnder,
  assert,
} from "../_contract/contract.mjs";

const SKILL = "design-alternatives";
let passed = 0;
let failed = 0;

function check(result) {
  if (result) passed++;
  else failed++;
}

console.log(`\n[Test] ${SKILL} — structure`);

check(hasFrontmatter(SKILL));
check(hasRequiredFields(SKILL));
check(lineCountUnder(SKILL, 500));
check(hasS7Boundary(SKILL));

console.log(`\n[Test] ${SKILL} — required sections`);

check(hasSection(SKILL, "Invocation"));
check(hasSection(SKILL, "Methodology"));
check(hasSection(SKILL, "Output"));
check(hasSection(SKILL, "Scope and Boundaries"));

console.log(`\n[Test] ${SKILL} — methodology`);

check(hasMethodologyPhases(SKILL, 4));

console.log(`\n[Test] ${SKILL} — output format`);

import { readSkillMd } from "../_contract/contract.mjs";
const text = readSkillMd(SKILL);
check(assert(text.includes("Inline Summary"), `${SKILL}: defines inline summary`));
check(assert(text.includes("Full Analysis"), `${SKILL}: defines full analysis`));
check(assert(text.includes("outputs/design-alternatives/"), `${SKILL}: specifies output path`));

console.log(`\n[Test] ${SKILL} — boundaries`);

check(assert(
  text.includes("does NOT produce final designs"),
  `${SKILL}: states it does not produce final designs`,
));
check(assert(
  text.includes("trade-offs"),
  `${SKILL}: emphasizes trade-offs over single answer`,
));

console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
