import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const VALID_STATUSES = new Set(["pilot", "partial", "complete"]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isSafeRelativePath(value, prefix) {
  if (!isNonEmptyString(value) || isAbsolute(value)) return false;
  const normalized = value.replaceAll("\\", "/");
  const segments = normalized.split("/");
  if ((prefix && !normalized.startsWith(`${prefix}/`)) || segments.includes("..") || normalized.includes(":")) return false;
  return true;
}

function canonicalPath(path) {
  return process.platform === "win32" ? path.toLowerCase() : path;
}

function isSafeRegularFile(root, value) {
  if (!isSafeRelativePath(value, "")) return false;
  try {
    const rootReal = realpathSync(root);
    const path = resolve(root, value);
    if (!lstatSync(path).isFile()) return false;
    const actualPath = realpathSync(path);
    if (canonicalPath(actualPath) !== canonicalPath(resolve(rootReal, value))) return false;
    const relativePath = relative(rootReal, actualPath);
    return !isAbsolute(relativePath) && relativePath !== ".." && !relativePath.startsWith(`..${sep}`);
  } catch {
    return false;
  }
}

function validateTrigger(trigger, label, errors) {
  if (!trigger || typeof trigger !== "object" || Array.isArray(trigger)) {
    errors.push(`${label} must be an object`);
    return;
  }
  if (!isNonEmptyString(trigger.prompt)) errors.push(`${label}.prompt must be a non-empty string`);
  if (!Number.isInteger(trigger.top_k) || trigger.top_k < 1 || trigger.top_k > 3) {
    errors.push(`${label}.top_k must be an integer from 1 to 3`);
  }
}

export function validateEvalCatalog(catalog, { repoRoot }) {
  const errors = [];
  const root = resolve(repoRoot);
  const skillNames = new Set();

  try {
    for (const entry of readdirSync(join(root, "skills"), { withFileTypes: true })) {
      if (entry.isDirectory()) skillNames.add(entry.name);
    }
  } catch {
    errors.push("skills directory does not exist");
  }

  if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) {
    return { valid: false, errors: ["catalog must be an object"], caseCount: 0, skills: [] };
  }
  if (catalog.schema !== "vitruvius-e1.v1") errors.push("schema must be vitruvius-e1.v1");
  if (!catalog.coverage || !VALID_STATUSES.has(catalog.coverage.status) || typeof catalog.coverage.complete !== "boolean") {
    errors.push("coverage must declare a valid status and boolean complete flag");
  } else if ((catalog.coverage.status === "complete") !== catalog.coverage.complete) {
    errors.push("coverage.status and coverage.complete are inconsistent");
  }
  if (!Array.isArray(catalog.priority_skills) || catalog.priority_skills.length === 0) {
    errors.push("priority_skills must be a non-empty array");
    return { valid: false, errors, caseCount: 0, skills: [] };
  }

  const priorities = catalog.priority_skills;
  const prioritySet = new Set();
  for (const skill of priorities) {
    if (!isNonEmptyString(skill)) {
      errors.push("priority skill names must be non-empty strings");
    } else if (prioritySet.has(skill)) {
      errors.push(`duplicate priority skill: ${skill}`);
    } else {
      prioritySet.add(skill);
      if (!skillNames.has(skill)) errors.push(`unknown priority skill: ${skill}`);
    }
  }

  if (catalog.coverage?.status === "complete") {
    for (const skill of skillNames) {
      if (!prioritySet.has(skill)) errors.push(`complete coverage is missing skill case: ${skill}`);
    }
  }

  if (!Array.isArray(catalog.cases)) {
    errors.push("cases must be an array");
    return { valid: false, errors, caseCount: 0, skills: [...prioritySet] };
  }

  const caseIds = new Set();
  const caseSkills = new Set();
  for (const [index, evalCase] of catalog.cases.entries()) {
    const label = `cases[${index}]`;
    if (!evalCase || typeof evalCase !== "object" || Array.isArray(evalCase)) {
      errors.push(`${label} must be an object`);
      continue;
    }
    if (!isNonEmptyString(evalCase.id)) {
      errors.push(`${label}.id must be a non-empty string`);
    } else if (caseIds.has(evalCase.id)) {
      errors.push(`duplicate case id: ${evalCase.id}`);
    } else {
      caseIds.add(evalCase.id);
    }

    if (!isNonEmptyString(evalCase.skill)) {
      errors.push(`${label}.skill must be a non-empty string`);
    } else {
      if (!skillNames.has(evalCase.skill)) errors.push(`unknown skill: ${evalCase.skill}`);
      if (!prioritySet.has(evalCase.skill)) errors.push(`case skill is not in priority_skills: ${evalCase.skill}`);
      if (caseSkills.has(evalCase.skill)) errors.push(`duplicate skill case: ${evalCase.skill}`);
      caseSkills.add(evalCase.skill);
    }

    validateTrigger(evalCase.positive, `${label}.positive`, errors);
    validateTrigger(evalCase.negative, `${label}.negative`, errors);
    if (evalCase.negative && isNonEmptyString(evalCase.negative.owner)) {
      if (!skillNames.has(evalCase.negative.owner)) errors.push(`unknown negative owner: ${evalCase.negative.owner}`);
      if (evalCase.negative.owner === evalCase.skill) errors.push(`negative owner must differ from target: ${evalCase.skill}`);
    } else {
      errors.push(`${label}.negative.owner must be a non-empty string`);
    }

    const behavior = evalCase.behavior;
    if (!behavior || typeof behavior !== "object" || Array.isArray(behavior)) {
      errors.push(`${label}.behavior must be an object`);
      continue;
    }
    if (!isSafeRegularFile(root, behavior.test) || !behavior.test.startsWith("tests/")) {
      errors.push(`${label}.behavior.test must be a regular file under tests/`);
      continue;
    }
    if (behavior.execution !== "npm-test") {
      errors.push(`${label}.behavior.execution must be npm-test for the deterministic pilot`);
    }
    let testScript = "";
    try {
      testScript = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts?.test ?? "";
    } catch {
      errors.push("package.json test script could not be read");
    }
    if (!testScript) {
      errors.push("package.json scripts.test is missing or empty");
    } else {
      const testCommands = testScript.split("&&").map((command) => command.trim());
      if (!testCommands.includes(`node ${behavior.test}`)) {
        errors.push(`${label}.behavior.test is not an exact npm test command: ${behavior.test}`);
      }
    }
    const testPath = resolve(root, behavior.test);
    if (!behavior.artifact || !isNonEmptyString(behavior.artifact.path) || !["runtime-fixture", "recorded-artifact"].includes(behavior.artifact.kind)) {
      errors.push(`${label}.behavior.artifact requires kind and path`);
    } else if (!isSafeRegularFile(root, behavior.artifact.path)) {
      errors.push(`${label}.behavior.artifact must be a regular file inside the repository: ${behavior.artifact.path}`);
    }
    const testSource = readFileSync(testPath, "utf8");
    if (!Array.isArray(behavior.expectations) || behavior.expectations.length === 0) {
      errors.push(`${label}.behavior.expectations must be a non-empty array`);
    } else {
      for (const [expectationIndex, expectation] of behavior.expectations.entries()) {
        const expectationLabel = `${label}.behavior.expectations[${expectationIndex}]`;
        if (!expectation || !isNonEmptyString(expectation.statement) || !isNonEmptyString(expectation.marker)) {
          errors.push(`${expectationLabel} requires statement and marker strings`);
        } else if (!testSource.includes(expectation.marker)) {
          errors.push(`${expectationLabel} expectation marker not found in ${behavior.test}: ${expectation.marker}`);
        }
      }
    }
  }

  for (const skill of prioritySet) {
    if (!caseSkills.has(skill)) errors.push(`missing skill case: ${skill}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    caseCount: catalog.cases.length,
    skills: [...prioritySet],
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const catalogPath = process.argv[2];
  if (!catalogPath) {
    console.error("Usage: node scripts/eval-contract.mjs <catalog.json>");
    process.exit(1);
  }
  const catalog = JSON.parse(readFileSync(resolve(catalogPath), "utf8"));
  const repoRoot = process.argv[3] ? resolve(process.argv[3]) : process.cwd();
  const report = validateEvalCatalog(catalog, { repoRoot });
  if (!report.valid) {
    console.error(report.errors.map((error) => `- ${error}`).join("\n"));
    process.exit(1);
  }
  console.log(`PASS: E1 catalog valid (${report.caseCount} priority skill cases)`);
}
