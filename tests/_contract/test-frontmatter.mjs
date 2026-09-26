/**
 * Fixture matrix for the bounded YAML frontmatter parser.
 *
 * The parser is a deliberate subset, so these fixtures pin exactly what it does
 * support (folded/literal blocks, one nesting level, quotes, comments) and that
 * the flat, nested, and entry views agree on one parse.
 */
import { strict as assert } from "node:assert";
import {
  normalizeNewlines,
  parseFrontmatter,
  parseFrontmatterEntries,
  parseFrontmatterObject,
  readFrontmatterObject,
  readSkillDescription,
  readYamlFrontmatter,
} from "../../scripts/yaml-frontmatter.mjs";

const doc = (frontmatter) => `---\n${frontmatter}\n---\n\n# Skill\n`;

const nested = [
  "name: example",
  "description: >",
  "  First line of the description",
  "  continues on the next line.",
  'argument-hint: "<topic or paper>"',
  "allowed-tools: Write Edit Bash Read",
  "license: MIT",
  "metadata:",
  '  version: "0.1.0"',
].join("\n");

// Nested view: folded block scalar, quoted scalar, one nesting level.
const object = parseFrontmatterObject(nested);
assert.equal(object.name, "example");
assert.equal(object.description, "First line of the description continues on the next line.");
assert.equal(object["argument-hint"], "<topic or paper>");
assert.equal(object.metadata.version, "0.1.0");

// Flat view: every value is a string, so callers that string-index or .replace
// never receive an object.
const flat = parseFrontmatter(nested);
assert.equal(flat.description, object.description);
assert.equal(flat["argument-hint"], "<topic or paper>");
assert.equal(flat.metadata, "", "a nested map flattens to an empty string");
assert.ok(Object.values(flat).every((value) => typeof value === "string"), "flat values are strings");

// Entry view: ordered triples; the block flag is available to callers.
const entries = parseFrontmatterEntries(nested);
const description = entries.find(([key]) => key === "description");
assert.equal(description[1], object.description);
assert.equal(description[2], true, "description is flagged as a block scalar");
assert.equal(entries.find(([key]) => key === "name")[2], false);

// Literal block preserves line breaks; folded collapses to one line.
assert.equal(parseFrontmatterObject("name: x\ndescription: |\n  line one\n  line two\n").description, "line one\nline two");
assert.equal(parseFrontmatterObject("name: x\ndescription: >-\n  a\n  b\n").description, "a b");

// Unquoted trailing comment; quoted inner colon; single quotes.
assert.equal(parseFrontmatterObject("name: x # the skill name\n").name, "x");
assert.equal(parseFrontmatterObject('argument-hint: "a: b"\n')["argument-hint"], "a: b");
assert.equal(parseFrontmatterObject("license: 'MIT'\n").license, "MIT");

// Whole-document helpers.
assert.equal(readSkillDescription(doc(nested)), object.description);
assert.equal(readSkillDescription(doc("name: x\ndescription: inline value")), "inline value");
assert.equal(readFrontmatterObject(doc(nested)).metadata.version, "0.1.0");
assert.equal(readYamlFrontmatter(doc(nested))?.startsWith("name: example"), true);

// Line-ending independence.
const crlf = normalizeNewlines(nested).replace(/\n/g, "\r\n");
assert.deepEqual(parseFrontmatterObject(crlf), object);
assert.equal(normalizeNewlines("a\r\nb\rc"), "a\nb\nc");

// The merged-key defect (two keys on one line) still surfaces as a value.
assert.equal(parseFrontmatterEntries("name: x\nlicense: MITmetadata:\n").find(([key]) => key === "license")[1], "MITmetadata:");

console.log("PASS: frontmatter parser handles folded/literal blocks, nesting, quotes, and comments");
