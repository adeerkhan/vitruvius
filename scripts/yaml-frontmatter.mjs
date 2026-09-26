/**
 * yaml-frontmatter.mjs — Shared YAML frontmatter parser for Vitruvius skills.
 *
 * Extracts and parses the --- delimited frontmatter block from Markdown files.
 * Used by test-skills.mjs, validate-contract.mjs, and the routing eval.
 *
 * This is a deliberate, bounded subset of YAML, not a general parser. It covers
 * the shapes a SKILL.md frontmatter actually uses and refuses to guess beyond
 * them:
 *   - line-ending independent (CRLF and lone CR normalize to LF);
 *   - folded (`>`) and literal (`|`) block scalars, with optional chomping;
 *   - one level of nested maps (`metadata:\n  version: "0.1.0"`);
 *   - single/double quoted scalars;
 *   - trailing `# comments` on unquoted scalars.
 *
 * It does not model flow collections, anchors/aliases, multi-document streams,
 * or arbitrary indentation. Anything outside that subset is left as a plain
 * string rather than silently mis-parsed. Three exports share one internal
 * parse so the flat and nested views can never disagree:
 *   - parseFrontmatter        flat `{ key: string }` (callers that string-index)
 *   - parseFrontmatterObject  nested `{ key: string | Record<string,string> }`
 *   - parseFrontmatterEntries ordered `[key, value, isBlock]` triples
 * plus `readFrontmatterObject(rawText)` for a whole file.
 */

/**
 * Normalize CRLF and lone CR to LF so every downstream match is line-ending
 * independent. Returns the text unchanged if it is already LF.
 */
export function normalizeNewlines(text) {
  return text.includes("\r") ? text.replace(/\r\n?/g, "\n") : text;
}

/**
 * Extract raw frontmatter string from Markdown text.
 * Returns null if no valid frontmatter block found.
 */
export function readYamlFrontmatter(rawText) {
  const text = normalizeNewlines(rawText);
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 3);
  if (end === -1) return null;
  return text.slice(4, end);
}

const TOP_KEY = /^([A-Za-z][A-Za-z0-9_-]*):(.*)$/;
const NESTED_KEY = /^\s+([A-Za-z][A-Za-z0-9_-]*):(.*)$/;
const BLOCK_INDICATOR = /^[>|][+-]?$/;

/** Parse a scalar value: strip matching quotes, otherwise strip a trailing comment. */
function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"');
  }
  if (trimmed.length >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  const comment = trimmed.indexOf(" #");
  return (comment === -1 ? trimmed : trimmed.slice(0, comment)).trim();
}

/**
 * Read a block scalar body starting at `start`. Body lines are blank or
 * indented; the block ends at the next top-level (column 0) line. `>` folds to
 * one line, `|` keeps line breaks. Chomping indicators are accepted and the
 * result is trimmed, which is what every caller wants.
 */
function readBlock(lines, start, indicator) {
  const body = [];
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === "") {
      body.push("");
      index++;
      continue;
    }
    if (/^\s/.test(line)) {
      body.push(line);
      index++;
      continue;
    }
    break;
  }
  while (body.length > 0 && body[0].trim() === "") body.shift();
  while (body.length > 0 && body[body.length - 1].trim() === "") body.pop();

  let value = "";
  if (body.length > 0) {
    const indents = body.filter((line) => line.trim() !== "").map((line) => line.match(/^\s*/)[0].length);
    const indent = Math.min(...indents);
    const stripped = body.map((line) => line.slice(indent));
    value =
      indicator[0] === "|"
        ? stripped.join("\n")
        : stripped.map((line) => line.trim()).filter((line) => line !== "").join(" ");
  }
  return { value: value.trim(), next: index };
}

/** Read an indented one-level nested map starting at `start`. */
function readNested(lines, start) {
  const map = {};
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === "") {
      index++;
      continue;
    }
    if (!/^\s/.test(line)) break;
    const match = line.match(NESTED_KEY);
    if (match) map[match[1]] = parseScalar(match[2]);
    index++;
  }
  return { map, next: index };
}

function parseInternal(frontmatter) {
  const lines = normalizeNewlines(frontmatter).split("\n");
  const object = {};
  const entries = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === "" || line.trimStart().startsWith("#")) {
      index++;
      continue;
    }
    const match = line.match(TOP_KEY);
    if (!match) {
      index++;
      continue;
    }
    const key = match[1];
    const rest = match[2].trim();
    if (BLOCK_INDICATOR.test(rest)) {
      const { value, next } = readBlock(lines, index + 1, rest);
      object[key] = value;
      entries.push([key, value, true]);
      index = next;
      continue;
    }
    if (rest === "") {
      const { map, next } = readNested(lines, index + 1);
      object[key] = Object.keys(map).length > 0 ? map : "";
      entries.push([key, "", false]);
      index = next;
      continue;
    }
    const value = parseScalar(rest);
    object[key] = value;
    entries.push([key, value, false]);
    index++;
  }
  return { object, entries };
}

/** Parse frontmatter into a nested object (one level of maps; block scalars folded). */
export function parseFrontmatterObject(frontmatter) {
  return parseInternal(frontmatter).object;
}

/** Parse a whole Markdown file's frontmatter into a nested object, or null. */
export function readFrontmatterObject(rawText) {
  const frontmatter = readYamlFrontmatter(rawText);
  return frontmatter === null ? null : parseFrontmatterObject(frontmatter);
}

/**
 * Parse frontmatter into a flat `{ key: string }` map. Nested maps flatten to an
 * empty string so callers that string-index a value, or call `.replace`, never
 * receive an object.
 */
export function parseFrontmatter(frontmatter) {
  const flat = {};
  for (const [key, value] of Object.entries(parseInternal(frontmatter).object)) {
    flat[key] = typeof value === "string" ? value : "";
  }
  return flat;
}

/**
 * Parse frontmatter into ordered `[key, value, isBlock]` triples. The third
 * element (block scalar) is ignored by two-element destructuring callers.
 */
export function parseFrontmatterEntries(frontmatter) {
  return parseInternal(frontmatter).entries.map((entry) => [entry[0], entry[1], entry[2]]);
}

/**
 * Extract the `description` value from a Markdown file, handling both folded
 * block scalars and inline values.
 */
export function readSkillDescription(rawText) {
  const object = readFrontmatterObject(rawText);
  if (object && typeof object.description === "string") return object.description;
  return "";
}
