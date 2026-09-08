/**
 * Test suite for skills/fmea-brainstorm/SKILL.md
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
  check,
  readSkillMd,
} from "../_contract/contract.mjs";

const SKILL = "fmea-brainstorm";
let passed = 0;
let failed = 0;

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

const text = readSkillMd(SKILL);

console.log(`\n[Test] ${SKILL} — FMEA-specific`);

check(check(text.includes("Severity"), `${SKILL}: defines Severity rating`));
check(check(text.includes("Occurrence"), `${SKILL}: defines Occurrence rating`));
check(check(text.includes("Detection"), `${SKILL}: defines Detection rating`));
check(check(text.includes("RPN"), `${SKILL}: calculates Risk Priority Number`));
check(check(text.includes("Critical") && text.includes("200"), `${SKILL}: defines Critical threshold (RPN>=200)`));

console.log(`\n[Test] ${SKILL} — boundaries`);

check(check(
  text.includes("qualitative") || text.includes("brainstorming"),
  `${SKILL}: states it is qualitative, not quantitative`,
));
check(check(
  text.includes("not a formal FMEA"),
  `${SKILL}: clarifies it is not for regulatory submission`,
));

console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
