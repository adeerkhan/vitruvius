/**
 * yaml-frontmatter.mjs — Shared YAML frontmatter parser for Vitruvius skills.
 *
 * Extracts and parses the --- delimited frontmatter block from Markdown files.
 * Used by test-skills.mjs and validate-contract.mjs.
 */

/**
 * Extract raw frontmatter string from Markdown text.
 * Returns null if no valid frontmatter block found.
 */
export function readYamlFrontmatter(text) {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 3);
  if (end === -1) return null;
  return text.slice(4, end);
}

/**
 * Parse frontmatter into key-value entries.
 * Returns array of [key, value] pairs.
 */
export function parseFrontmatterEntries(frontmatter) {
  const entries = [];
  for (const line of frontmatter.split("\n")) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):(.*)$/);
    if (match) entries.push([match[1], match[2].trim()]);
  }
  return entries;
}

/**
 * Parse frontmatter into an object.
 * Returns { key: value } map.
 */
export function parseFrontmatter(frontmatter) {
  const entries = {};
  for (const line of frontmatter.split("\n")) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (match) entries[match[1]] = match[2].trim();
  }
  return entries;
}

/**
 * Read a Markdown file and return its frontmatter as an object.
 * Returns null if file missing or no frontmatter.
 */
export function readFrontmatterFromFile(filePath) {
  const { readFileSync } = require("node:fs");
  let text;
  try {
    text = readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
  const raw = readYamlFrontmatter(text);
  if (!raw) return null;
  return parseFrontmatter(raw);
}
