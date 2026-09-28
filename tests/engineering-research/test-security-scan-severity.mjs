import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// The security scanner must assign severity levels
const scanner = readFileSync(join(repoRoot, "scripts", "security-scan.mjs"), "utf8");
assert.match(scanner, /HIGH:/, "scanner must assign HIGH severity");
assert.match(scanner, /MEDIUM:/, "scanner must assign MEDIUM severity");
assert.match(scanner, /severity levels/i, "scanner must document severity levels");

// The false positives reference must exist
const falsePositivesPath = join(repoRoot, "references", "security-scan-false-positives.md");
assert.ok(existsSync(falsePositivesPath), "security-scan-false-positives.md must exist");

const falsePositives = readFileSync(falsePositivesPath, "utf8");
assert.match(falsePositives, /# Security Scan False Positives/, "must have a title");
assert.match(falsePositives, /HIGH Severity False Positives/, "must document HIGH false positives");
assert.match(falsePositives, /MEDIUM Severity False Positives/, "must document MEDIUM false positives");
assert.match(falsePositives, /child_process/, "must document child_process false positive");
assert.match(falsePositives, /How to Document a New False Positive/, "must document how to add new false positives");

console.log("PASS: security scan has severity levels and false positives documentation");
