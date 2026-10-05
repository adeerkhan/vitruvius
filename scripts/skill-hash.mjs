// skill-hash.mjs — shared content-addressing for skill payloads (SKILL.md).
//
// The header sits immediately AFTER the `---` frontmatter, never on line 1: a
// leading comment breaks frontmatter parsing for every skill in the repo. The
// hashed body is everything after that header line.
//
// This is the single definition, imported by scripts/skill-payload-manifest.mjs
// (the verify/update CLI) and scripts/generate-discipline-skills.mjs (the
// generator), so the two cannot compute the hash differently.
//
// Pattern reference: references/skill-payload-manifest.md

import { createHash } from "node:crypto";

export const HEADER_PREFIX = "<!-- VITRUVIUS-COMPILED-SKILL:BEGIN v1 sha256=";
export const HEADER_SUFFIX = " -->";
export const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;

export function computeHash(body) {
  return createHash("sha256").update(body, "utf8").digest("hex");
}

export function makeHeader(hash) {
  return `${HEADER_PREFIX}${hash}${HEADER_SUFFIX}`;
}

export function isHeaderLine(line) {
  return line.startsWith(HEADER_PREFIX) && line.trimEnd().endsWith(HEADER_SUFFIX);
}

export function headerHash(line) {
  return line.slice(HEADER_PREFIX.length, line.trimEnd().length - HEADER_SUFFIX.length);
}

/**
 * Split a SKILL.md into { frontmatter, header, body }. The header is the first
 * line after the frontmatter when present. Any duplicate header lines are
 * stripped from the body so `--update` is idempotent and cannot stack headers.
 */
export function splitSkill(content) {
  const fm = content.match(FRONTMATTER);
  const frontmatter = fm ? fm[0] : "";
  let rest = fm ? content.slice(fm[0].length) : content;

  const firstBreak = rest.indexOf("\n");
  const firstLine = firstBreak === -1 ? rest : rest.slice(0, firstBreak);
  let header = null;
  if (isHeaderLine(firstLine)) {
    header = headerHash(firstLine);
    rest = firstBreak === -1 ? "" : rest.slice(firstBreak + 1);
  }

  // Defensive: drop any stray header lines that ended up in the body.
  const body = rest
    .split("\n")
    .filter((line) => !isHeaderLine(line))
    .join("\n");

  return { frontmatter, header, body };
}
