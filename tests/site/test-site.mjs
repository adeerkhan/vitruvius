/**
 * SITE — the checks that keep `site/` honest.
 *
 * Why this exists: the site is hand-written static HTML, so nothing else in
 * this repo knows it exists. A command can be added to
 * installer/contract.mjs, a link can point at a file that was never
 * committed, and the README's docs-parity gate will not notice either one,
 * because that gate reads README.md and the help card — not the website.
 *
 * This is the site-side twin of `tests/docs/test-docs-parity.mjs`. It checks
 * the two things that silently rot: a command the site never mentions, and a
 * link that no longer resolves.
 *
 * What it deliberately does NOT do: verify any figure printed on the page.
 * Those are transcribed by hand from `tasks/benchmark/RESULTS.md` and the
 * provenance footer says so. A generated page would not have this gap; this
 * one does, and the gap is named rather than papered over.
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { commands } from "../../installer/contract.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const siteDir = join(root, "site");

const pages = readdirSync(siteDir).filter((name) => name.endsWith(".html"));
assert.ok(pages.length >= 2, `expected the site to have pages, found ${pages.length}`);

const problems = [];
for (const page of pages) {
  const html = readFileSync(join(siteDir, page), "utf8");

  // --- one document head, one first-level heading -------------------------
  const h1s = html.match(/<h1[\s>]/g) ?? [];
  if (h1s.length !== 1) problems.push(`${page}: has ${h1s.length} <h1> elements, expected exactly 1`);

  if (!/<html lang="[a-z-]+"/.test(html)) problems.push(`${page}: <html> has no lang attribute`);
  if (!/<title>[^<]+<\/title>/.test(html)) problems.push(`${page}: has no non-empty <title>`);
  if (!/<meta\s+name="description"\s+content="[^"]{40,}"/.test(html)) {
    problems.push(`${page}: missing a meta description of at least 40 characters`);
  }

  // --- the page must still be readable without JavaScript and CSP-strict ---
  // Inline style attributes are how a hand-written page quietly grows a second
  // stylesheet that the stylesheet file can no longer control.
  const inlineStyles = html.match(/\sstyle="/g) ?? [];
  if (inlineStyles.length > 0) {
    problems.push(`${page}: ${inlineStyles.length} inline style attribute(s); styling belongs in site.css`);
  }
  const inlineScripts = html.match(/<script(?![^>]*\bsrc=)/g) ?? [];
  if (inlineScripts.length > 0) {
    problems.push(`${page}: ${inlineScripts.length} inline <script> block(s); behaviour belongs in site.js`);
  }

  // --- every local reference resolves on disk ------------------------------
  const refs = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const ref of refs) {
    if (ref.startsWith("#") || ref === "") continue;
    if (/^https?:\/\//i.test(ref)) {
      if (ref.startsWith("http://")) problems.push(`${page}: insecure link ${ref}`);
      continue;
    }
    if (/^(mailto:|tel:|data:)/i.test(ref)) continue;
    const target = resolve(siteDir, ref.split("#")[0].split("?")[0]);
    if (!existsSync(target)) problems.push(`${page}: ${ref} does not exist on disk`);
  }
}

// --- every command in the contract is on the site --------------------------
const siteText = pages.map((page) => readFileSync(join(siteDir, page), "utf8")).join("\n");
const missingCommands = commands.filter((command) => !siteText.includes(`/${command.name}`));
if (missingCommands.length > 0) {
  problems.push(
    `site/ never mentions ${missingCommands.length} command(s) that exist in the contract: ` +
      missingCommands.map((c) => `/${c.name}`).join(", "),
  );
}

// --- the shared assets the pages depend on --------------------------------
for (const asset of [
  "assets/css/site.css",
  "assets/js/site.js",
  "assets/favicon.svg",
  "assets/vitruvian.svg",
  "assets/fonts/marcellus-latin.woff2",
  "assets/fonts/josefin-sans-latin.woff2",
  "assets/fonts/OFL-marcellus.txt",
  "assets/fonts/OFL-josefinsans.txt",
]) {
  if (!existsSync(join(siteDir, asset))) problems.push(`site/${asset} is missing`);
}

// --- the font faces point at files that exist ------------------------------
const css = readFileSync(join(siteDir, "assets", "css", "site.css"), "utf8");
for (const match of css.matchAll(/url\("\.\.\/([^"]+)"\)/g)) {
  const fontPath = join(siteDir, "assets", match[1]);
  if (!existsSync(fontPath)) problems.push(`site.css references ../${match[1]}, which does not exist`);
}

if (problems.length > 0) {
  console.error(`FAIL: ${problems.length} site problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(
  `PASS: site — ${pages.length} pages, ${commands.length} commands all named, ` +
    `every local href and font src resolves on disk, no inline styles or scripts`,
);