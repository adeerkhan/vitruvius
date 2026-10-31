#!/usr/bin/env node
/**
 * render-post-card.mjs — render a simple, copy-first HTML card for the
 * research-to-post skill.
 *
 * The card shows 2-3 short hook posts and a source link. It has no claim
 * ledger, no verification section, and no media. It never posts, schedules, or
 * scrapes.
 *
 * Usage:
 *   node skills/research-to-post/scripts/render-post-card.mjs --input <json> --output <html>
 *   node skills/research-to-post/scripts/render-post-card.mjs --input <json> --check
 *
 * Exit 0 = card rendered (or input valid under --check).
 * Exit 1 = validation failed; no card is written.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parseArgs(argv) {
  const args = { input: null, output: null, check: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--input" && argv[i + 1]) args.input = argv[++i];
    else if (arg === "--output" && argv[i + 1]) args.output = argv[++i];
    else if (arg === "--check") args.check = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function charLength(value) {
  return [...value].length;
}

function isHttpUrl(value) {
  return /^https?:\/\/\S+$/i.test(value);
}

/** Validate the whole input and return every problem found. */
export function validateCard(data) {
  const errors = [];
  const add = (message) => errors.push(message);

  if (!isObject(data)) return ["input must be a JSON object"];
  if (!SLUG.test(text(data.slug))) add("slug must be lowercase-hyphen-separated");
  if (!text(data.title)) add("title is required");

  const source = data.source;
  if (!isObject(source)) add("source must be an object");
  else {
    if (!text(source.citation)) add("source.citation is required");
    if (source.url !== undefined && source.url !== null && !isHttpUrl(String(source.url))) {
      add("source.url must be an http(s) URL when present");
    }
  }

  const limit = data.limit === undefined ? 280 : data.limit;
  if (!Number.isInteger(limit) || limit < 1 || limit > 10000) add("limit must be an integer from 1 to 10000");

  const posts = data.posts;
  if (!Array.isArray(posts) || posts.length < 2 || posts.length > 3) {
    add("posts must contain 2 or 3 hook posts, never more");
  } else {
    posts.forEach((post, index) => {
      const body = text(post);
      if (!body) add(`posts[${index}] is empty`);
      else if (charLength(body) > limit) add(`posts[${index}] is ${charLength(body)} characters, over the ${limit}-character limit`);
      if (index === 0 && /https?:\/\//i.test(body)) add("the first post must not contain a link");
    });
    const last = posts[posts.length - 1];
    if (isObject(source) && text(source.url) && text(last) && !text(last).includes(text(source.url))) {
      add("the last post must carry the source URL");
    }
  }

  return errors;
}

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

function renderCard(data) {
  const source = isObject(data.source) ? data.source : {};
  const sourceLink = source.url
    ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.citation)}</a>`
    : escapeHtml(source.citation);

  const posts = data.posts
    .map(
      (post, index) => `
        <article class="post${index === 0 ? " hook" : ""}">
          <div class="post-head">
            <span>${index + 1}/${data.posts.length}</span>
            <span>${charLength(post)}/${data.limit ?? 280}</span>
            <button type="button" class="copy" data-copy="${escapeHtml(post)}">Copy</button>
          </div>
          <p class="post-text">${escapeHtml(post).replace(/\n/g, "<br />")}</p>
        </article>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="${escapeHtml(data.title)} — ${data.posts.length} hook posts, ready to copy." />
<title>${escapeHtml(data.title)} — post card</title>
<style>
  :root { color-scheme: light dark; --bg: #f7f7f5; --card: #ffffff; --ink: #1c1c1a; --muted: #62625c; --line: #d9d9d2; --accent: #2f6fed; }
  @media (prefers-color-scheme: dark) { :root { --bg: #141413; --card: #1e1e1c; --ink: #ecece6; --muted: #a3a39a; --line: #3a3a36; --accent: #7aa2ff; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 17px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 32px 20px 64px; }
  h1 { font-size: 1.7rem; line-height: 1.2; margin: 0 0 8px; }
  .source { color: var(--muted); margin: 0 0 4px; }
  .source a { color: var(--accent); }
  .lede { color: var(--muted); margin: 6px 0 0; }
  .copy-all { display: flex; justify-content: flex-end; margin: 28px 0 10px; }
  .post { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px 18px; margin: 0 0 12px; }
  .post.hook { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent) inset; }
  .post-head { display: flex; align-items: center; gap: 12px; color: var(--muted); font-size: .8rem; }
  .post-head button.copy { margin-left: auto; }
  .post-text { margin: 8px 0 0; white-space: pre-wrap; font-size: 1.08rem; }
  button.copy, button.action { border: 1px solid var(--line); background: var(--card); color: var(--ink); border-radius: 999px; padding: 4px 12px; font: inherit; font-size: .82rem; cursor: pointer; }
  button.copy:active, button.action:active { transform: translateY(1px); }
  footer { margin-top: 36px; color: var(--muted); font-size: .82rem; }
</style>
</head>
<body>
<main>
  <header>
    <h1>${escapeHtml(data.title)}</h1>
    <p class="source">${sourceLink}</p>
    <p class="lede">${data.posts.length} hook posts. Copy them one by one, or copy the whole thread.</p>
  </header>

  <div class="copy-all"><button type="button" class="action" data-copy-all>Copy all posts</button></div>
  <section>${posts}</section>

  <footer>Draft generated by Vitruvius <code>research-to-post</code>. Not posted, scheduled, or scraped.</footer>
</main>
<script>
  document.querySelectorAll("button.copy").forEach(function (button) {
    button.addEventListener("click", function () {
      var value = button.getAttribute("data-copy") || "";
      function done() { var old = button.textContent; button.textContent = "Copied"; setTimeout(function () { button.textContent = old; }, 1200); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(done, function () {});
    });
  });
  var copyAll = document.querySelector("[data-copy-all]");
  if (copyAll) {
    copyAll.addEventListener("click", function () {
      var posts = Array.from(document.querySelectorAll(".post-text")).map(function (p) { return p.textContent.trim(); });
      var value = posts.join("\\n\\n");
      function done() { var old = copyAll.textContent; copyAll.textContent = "Copied all"; setTimeout(function () { copyAll.textContent = old; }, 1200); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(done, function () {});
    });
  }
</script>
</body>
</html>
`;
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    return 1;
  }
  if (args.help) {
    console.log("Usage: render-post-card.mjs --input <json> [--output <html> | --check]");
    return 0;
  }
  if (!args.input) {
    console.error("FAIL: --input <json> is required");
    return 1;
  }

  let data;
  try {
    data = JSON.parse(readFileSync(resolve(process.cwd(), args.input), "utf8"));
  } catch (error) {
    console.error(`FAIL: could not read input: ${error.message}`);
    return 1;
  }

  const errors = validateCard(data);
  if (errors.length > 0) {
    console.error(`FAIL: ${errors.length} post-card problem(s):`);
    for (const error of errors) console.error(`  - ${error}`);
    return 1;
  }

  if (args.check) {
    console.log("PASS: post-card input is valid");
    return 0;
  }

  const output = resolve(process.cwd(), args.output || join("outputs", `${data.slug}-post.html`));
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, renderCard(data), "utf8");
  console.log(`PASS: wrote ${output}`);
  return 0;
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  process.exitCode = main();
}

export { renderCard };
