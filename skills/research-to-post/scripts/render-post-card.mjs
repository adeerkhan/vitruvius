#!/usr/bin/env node
/**
 * render-post-card.mjs — render a simple, copy-first HTML card for the
 * research-to-post skill.
 *
 * The card shows 2-3 short hook posts, the single best source image/video, and
 * a source link. It has no claim ledger and no verification section. It never
 * posts, schedules, or scrapes.
 *
 * Usage:
 *   node skills/research-to-post/scripts/render-post-card.mjs --input <json> --output <html>
 *   node skills/research-to-post/scripts/render-post-card.mjs --input <json> --check
 *
 * Exit 0 = card rendered (or input valid under --check).
 * Exit 1 = validation failed; no card is written.
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MEDIA_KINDS = new Set(["image", "gif", "video"]);
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov"]);
const MAX_MEDIA_BYTES = 10 * 1024 * 1024;

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

function safeLocalMedia(value, field, errors) {
  const src = text(value);
  if (!src) return null;
  if (!src.startsWith("outputs/")) {
    errors.push(`${field} must be a file under outputs/ (got ${src})`);
    return null;
  }
  const full = resolve(process.cwd(), src);
  const root = resolve(process.cwd());
  if (!full.startsWith(`${root}${sep}`)) {
    errors.push(`${field} must stay inside the project`);
    return null;
  }
  if (!existsSync(full) || !statSync(full).isFile()) {
    errors.push(`${field} does not exist: ${src}`);
    return null;
  }
  if (statSync(full).size > MAX_MEDIA_BYTES) {
    errors.push(`${field} is larger than 10 MB`);
    return null;
  }
  return { full, rel: src };
}

function validateMedia(media, add) {
  if (!isObject(media)) {
    add("media must be an object when present");
    return;
  }
  if (!MEDIA_KINDS.has(media.kind)) add("media.kind must be image, gif, or video");
  if (!text(media.src)) add("media.src is required");
  if (!text(media.alt)) add("media.alt is required; it is the image description");
  if (!text(media.credit)) add("media.credit is required");
  if (!text(media.license)) add("media.license is required");
  if (media.licenseChecked !== true) add("media.licenseChecked must be true before source media is shown");

  if (text(media.src)) {
    if (isHttpUrl(media.src)) {
      // Remote media is linked; the license fields above still apply.
    } else {
      const local = safeLocalMedia(media.src, "media.src", []);
      if (!local) {
        add("media.src must be an http(s) URL or a file under outputs/");
      } else if (media.kind === "video" && !VIDEO_EXT.has(extname(local.full).toLowerCase())) {
        add("media.src must be an mp4, webm, or mov file for a video");
      } else if (media.kind !== "video" && !IMAGE_EXT.has(extname(local.full).toLowerCase())) {
        add("media.src must be a png, jpg, jpeg, webp, gif, or svg file for an image");
      }
    }
  }

  if (media.kind === "video" && media.poster !== undefined && text(media.poster)) {
    if (isHttpUrl(media.poster)) {
      // remote poster
    } else {
      const local = safeLocalMedia(media.poster, "media.poster", []);
      if (!local) add("media.poster must be an http(s) URL or a file under outputs/");
      else if (!IMAGE_EXT.has(extname(local.full).toLowerCase())) add("media.poster must be an image file");
    }
  }

  if (media.sourceUrl !== undefined && media.sourceUrl !== null && !isHttpUrl(String(media.sourceUrl))) {
    add("media.sourceUrl must be an http(s) URL when present");
  }
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

  if (data.media !== undefined && data.media !== null) validateMedia(data.media, add);

  return errors;
}

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

function embedLocalImage(src) {
  const full = resolve(process.cwd(), src);
  const ext = extname(full).toLowerCase();
  const mime = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  }[ext];
  if (!mime) throw new Error(`unsupported image type: ${ext || "none"}`);
  const bytes = readFileSync(full);
  if (bytes.length > MAX_MEDIA_BYTES) throw new Error("image is larger than 10 MB");
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

function mediaSrc(src, outputDir, { embed = false } = {}) {
  if (isHttpUrl(src)) return src;
  if (embed) return embedLocalImage(src);
  return relative(outputDir, resolve(process.cwd(), src)).split(sep).join("/");
}

function renderMedia(media, outputDir) {
  let body = "";
  if (media.kind === "video") {
    const src = mediaSrc(media.src, outputDir);
    const poster = media.poster ? ` poster="${escapeHtml(mediaSrc(media.poster, outputDir, { embed: true }))}"` : "";
    body = `<video controls preload="metadata" src="${escapeHtml(src)}"${poster}></video>`;
  } else {
    body = `<img src="${escapeHtml(mediaSrc(media.src, outputDir, { embed: true }))}" alt="${escapeHtml(media.alt)}" loading="lazy" />`;
  }
  const link = media.sourceUrl
    ? ` <a href="${escapeHtml(media.sourceUrl)}" target="_blank" rel="noopener">Open original</a>`
    : "";
  return `
    <figure class="media">
      <div class="media-body">${body}</div>
      <figcaption>
        ${media.caption ? `<p class="caption">${escapeHtml(media.caption)}</p>` : ""}
        <p class="credit">${escapeHtml(media.credit)}. License: ${escapeHtml(media.license)}.${link}</p>
      </figcaption>
    </figure>`;
}

function renderCard(data, outputPath) {
  const outputDir = dirname(resolve(process.cwd(), outputPath));
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

  const media = data.media ? renderMedia(data.media, outputDir) : "";

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
  .media { margin: 22px 0 0; background: var(--card); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
  .media-body { display: grid; place-items: center; background: #0f0f0f; }
  .media-body img, .media-body video { display: block; width: 100%; height: auto; max-height: 520px; object-fit: contain; }
  figcaption { padding: 12px 14px; }
  figcaption p { margin: 4px 0; }
  .caption { font-size: .95rem; }
  .credit { color: var(--muted); font-size: .82rem; }
  .credit a { color: var(--accent); }
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
  ${media}

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
  writeFileSync(output, renderCard(data, output), "utf8");
  console.log(`PASS: wrote ${output}`);
  return 0;
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  process.exitCode = main();
}

export { renderCard };
