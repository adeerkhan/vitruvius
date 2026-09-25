/**
 * yaml-frontmatter.mjs — Shared YAML frontmatter parser for Vitruvius skills.
 *
 * Extracts and parses the --- delimited frontmatter block from Markdown files.
 * Used by test-skills.mjs, validate-contract.mjs, and the routing eval.
 *
 * Line endings are normalized on the way in. A CRLF checkout previously made
 * the block invisible: `startsWith("---\n")` is false for `---\r\n`, so five
 * skills reported "no frontmatter" and dropped out of the routing index
 * depending on how the file happened to be checked out. Never match a literal
 * `\n` against raw file text here.
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

/**
 * Parse frontmatter into key-value entries.
 * Returns array of [key, value] pairs.
 */
export function parseFrontmatterEntries(frontmatter) {
  const entries = [];
  for (const line of normalizeNewlines(frontmatter).split("\n")) {
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
  for (const line of normalizeNewlines(frontmatter).split("\n")) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (match) entries[match[1]] = match[2].trim();
  }
  return entries;
}

/**
 * Extract the folded/single-line `description` value from a Markdown file.
 * Callers that only need the description should use this rather than
 * re-implementing the frontmatter match.
 */
export function readSkillDescription(rawText) {
  const frontmatter = readYamlFrontmatter(rawText);
  if (frontmatter === null) return "";
  const folded = frontmatter.match(/description:\s*>-?\s*\n([\s\S]*?)(?=\n[a-z][a-z-]*:|\n*$)/);
  if (folded) return folded[1].replace(/\n\s*/g, " ").trim();
  const inline = frontmatter.match(/description:\s*(.+)/);
  return inline ? inline[1].trim() : "";
}
