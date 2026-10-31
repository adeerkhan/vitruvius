#!/usr/bin/env node
/**
 * render-post-card.mjs — render a copy-first HTML post card for the
 * research-to-post skill.
 *
 * The card is a preview for a human to inspect before publishing. It does not
 * post, schedule, scrape, or call any platform API. It shows 2-3 hook posts,
 * the source's own media (local files embedded, remote files linked), the claim
 * ledger, and the verification summary.
 *
 * Usage:
 *   node skills/research-to-post/scripts/render-post-card.mjs --input <json> --output <html>
 *   node skills/research-to-post/scripts/render-post-card.mjs --input <json> --check
 *
 * Exit 0 = card rendered (or input valid under --check).
 * Exit 1 = validation failed; no card is written.
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const FORMATS = new Set(["single", "thread", "figure"]);
const STATUSES = new Set(["verified", "partial", "blocked", "unverified", "inferred", "failed"]);
const FACT_STATUSES = new Set(["verified", "partial"]);
const MEDIA_KINDS = new Set(["image", "gif", "video", "chart", "text"]);
const CHART_TYPES = new Set(["bar", "line"]);
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov"]);
const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CLAIM_ID = /^C[0-9]+$/;

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

function isRemote(value) {
  return isHttpUrl(value);
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

function validateChart(chart, where, byId, add) {
  if (!isObject(chart)) {
    add(`${where} is required`);
    return;
  }
  if (!CHART_TYPES.has(chart.type)) add(`${where}.type must be bar or line`);
  if (!text(chart.title)) add(`${where}.title is required`);
  if (!text(chart.unit)) add(`${where}.unit is required`);
  if (!Array.isArray(chart.data) || chart.data.length === 0) add(`${where}.data must be a non-empty array`);
  else if (chart.data.length > 12) add(`${where}.data supports at most 12 points`);
  else {
    chart.data.forEach((point, index) => {
      const at = `${where}.data[${index}]`;
      if (!isObject(point)) {
        add(`${at} must be an object`);
        return;
      }
      if (!text(point.label)) add(`${at}.label is required`);
      if (typeof point.value !== "number" || !Number.isFinite(point.value)) add(`${at}.value must be a finite number`);
      const claim = byId.get(point.claim);
      if (!claim) {
        add(`${at}.claim must name a ledger claim`);
        return;
      }
      if (claim.used !== true) add(`${at}.claim ${point.claim} is not marked used`);
      if (!FACT_STATUSES.has(claim.status)) add(`${at}.claim ${point.claim} is ${claim.status}; a chart may only plot verified or partial claims`);
      if (claim.numeric === false) add(`${at}.claim ${point.claim} is marked non-numeric`);
      if (text(claim.unit) && text(chart.unit) && text(claim.unit) !== text(chart.unit)) {
        add(`${at}.claim ${point.claim} has unit ${claim.unit}, but the chart unit is ${chart.unit}`);
      }
      if (point.role !== undefined && point.role !== "baseline" && point.role !== "value") {
        add(`${at}.role must be baseline or value when present`);
      }
      const role = point.role === "baseline" ? "baseline" : "value";
      if (role === "baseline" && !text(claim.baseline)) add(`${at}.role is baseline, but ${point.claim} has no baseline value`);
      const ledgerText = role === "baseline" ? text(claim.baseline) : text(claim.value);
      const ledgerValue = Number.parseFloat(ledgerText.replace(/,/g, ""));
      if (Number.isFinite(ledgerValue)) {
        if (Math.abs(ledgerValue - point.value) > 1e-9) {
          add(`${at}.value ${point.value} does not match ${point.claim}'s ledger ${role} ${ledgerText}`);
        }
      } else if (text(ledgerText)) {
        add(`${at}.claim ${point.claim} has a non-numeric ${role} ${ledgerText}`);
      }
    });
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
    for (const key of ["url", "projectUrl", "repoUrl"]) {
      if (source[key] !== undefined && source[key] !== null && !isHttpUrl(String(source[key]))) {
        add(`source.${key} must be an http(s) URL when present`);
      }
    }
  }

  if (!FORMATS.has(data.format)) add("format must be single, thread, or figure");
  const limit = data.limit === undefined ? 280 : data.limit;
  if (!Number.isInteger(limit) || limit < 1 || limit > 10000) add("limit must be an integer from 1 to 10000");

  if (!text(data.angle)) add("angle is required");
  if (!text(data.angle_reason)) add("angle_reason is required");

  const hooks = data.hooks;
  if (!Array.isArray(hooks) || hooks.length !== 3) add("hooks must contain exactly three variants");
  else {
    let recommended = 0;
    hooks.forEach((hook, index) => {
      if (!isObject(hook) || !text(hook.text)) add(`hooks[${index}].text is required`);
      if (hook && hook.recommended === true) recommended++;
    });
    if (recommended !== 1) add("exactly one hook must be marked recommended");
  }

  const claims = data.claims;
  const byId = new Map();
  if (!Array.isArray(claims)) add("claims must be an array");
  else {
    claims.forEach((claim, index) => {
      const where = `claims[${index}]`;
      if (!isObject(claim)) {
        add(`${where} must be an object`);
        return;
      }
      const id = text(claim.id);
      if (!CLAIM_ID.test(id)) add(`${where}.id must look like C1, C2, ...`);
      else if (byId.has(id)) add(`${where}.id ${id} is duplicated`);
      else byId.set(id, claim);

      if (!STATUSES.has(claim.status)) add(`${where}.status must be one of ${[...STATUSES].join(", ")}`);
      if (typeof claim.used !== "boolean") add(`${where}.used must be true or false`);
      if (!text(claim.claim)) add(`${where}.claim is required`);
      if (!text(claim.source_location)) add(`${where}.source_location is required`);

      const numeric = claim.numeric !== false;
      if (claim.used === true) {
        if (!FACT_STATUSES.has(claim.status)) {
          add(`${where} is used as fact but its status is ${claim.status}; only verified or partial may appear as fact`);
        }
        if (claim.status === "partial" && !text(claim.qualifier)) add(`${where} is partial but has no qualifier to carry into the post`);
        if (numeric) {
          if (!text(claim.value)) add(`${where}.value is required for a used numeric claim`);
          if (!text(claim.unit)) add(`${where}.unit is required for a used numeric claim`);
          if (!text(claim.baseline)) add(`${where}.baseline is required for a used numeric claim`);
          if (text(claim.value) && !Number.isFinite(Number.parseFloat(claim.value.replace(/,/g, "")))) {
            add(`${where}.value must be numeric for a charted or numeric claim`);
          }
        }
      }
      if (claim.status === "failed") add(`${where} is failed; fix the claim before delivery`);
    });
  }

  const posts = data.post;
  const referenced = new Set();
  if (!Array.isArray(posts) || posts.length === 0) add("post must be a non-empty array");
  else {
    if (data.format === "single" && posts.length !== 1) add("a single post must contain exactly one post");
    if (data.format === "figure" && posts.length !== 1) add("a figure post must contain exactly one post");
    if (data.format === "thread" && (posts.length < 2 || posts.length > 3)) {
      add("a hook thread must contain 2 or 3 posts, never more");
    }
    posts.forEach((post, index) => {
      const where = `post[${index}]`;
      if (!isObject(post)) {
        add(`${where} must be an object`);
        return;
      }
      const body = text(post.text);
      if (!body) add(`${where}.text is required`);
      else if (charLength(body) > limit) add(`${where} is ${charLength(body)} characters, over the ${limit}-character limit`);
      if (index === 0 && /https?:\/\//i.test(body)) add("the first post must not contain a link");
      if (!Array.isArray(post.claims)) add(`${where}.claims must be an array of claim ids`);
      else {
        for (const id of post.claims) {
          if (!byId.has(id)) add(`${where} references ${id}, which is not in the ledger`);
          else referenced.add(id);
        }
      }
    });
    const last = posts[posts.length - 1];
    if (data.format !== "single" && isObject(last) && text(source?.url) && !text(last.text).includes(text(source.url))) {
      add("the last post must carry the source URL so the reader can click through");
    }
  }
  for (const [id, claim] of byId) {
    if (claim.used === true && !referenced.has(id)) add(`${id} is marked used but no post references it`);
  }

  const media = data.media;
  if (!isObject(media)) add("media must be an object");
  else {
    if (!text(media.why)) add("media.why is required; say why these visuals fit the hook");
    if (!Array.isArray(media.items) || media.items.length === 0) add("media.items must be a non-empty array");
    else if (media.items.length > 6) add("media.items supports at most 6 items");
    else {
      media.items.forEach((item, index) => {
        const where = `media.items[${index}]`;
        if (!isObject(item)) {
          add(`${where} must be an object`);
          return;
        }
        if (!MEDIA_KINDS.has(item.kind)) add(`${where}.kind must be image, gif, video, chart, or text`);
        if (!text(item.alt)) add(`${where}.alt is required; alt text is part of the post`);
        if (!text(item.credit)) add(`${where}.credit is required`);

        if (item.kind === "image" || item.kind === "gif") {
          if (!text(item.src)) add(`${where}.src is required`);
          else if (isRemote(item.src)) {
            if (!text(item.license)) add(`${where}.license is required for remote media`);
            if (item.licenseChecked !== true) add(`${where}.licenseChecked must be true before remote media is shown`);
          } else {
            const local = safeLocalMedia(item.src, `${where}.src`, errors);
            if (local && !IMAGE_EXT.has(extname(local.full).toLowerCase())) {
              add(`${where}.src must be a png, jpg, jpeg, webp, gif, or svg file`);
            }
            if (!text(item.license)) add(`${where}.license is required for source media`);
            if (item.licenseChecked !== true) add(`${where}.licenseChecked must be true before source media is shown`);
          }
        }

        if (item.kind === "video") {
          if (!text(item.src)) add(`${where}.src is required`);
          else if (isRemote(item.src)) {
            if (!text(item.license)) add(`${where}.license is required for remote media`);
            if (item.licenseChecked !== true) add(`${where}.licenseChecked must be true before remote media is shown`);
          } else {
            const local = safeLocalMedia(item.src, `${where}.src`, errors);
            if (local && !VIDEO_EXT.has(extname(local.full).toLowerCase())) {
              add(`${where}.src must be an mp4, webm, or mov file`);
            }
            if (!text(item.license)) add(`${where}.license is required for source media`);
            if (item.licenseChecked !== true) add(`${where}.licenseChecked must be true before source media is shown`);
          }
          if (item.poster !== undefined && text(item.poster)) {
            if (isRemote(item.poster)) {
              if (!isHttpUrl(item.poster)) add(`${where}.poster must be an http(s) URL or a local outputs/ file`);
            } else {
              safeLocalMedia(item.poster, `${where}.poster`, errors);
            }
          }
        }

        if (item.kind === "chart") validateChart(item.chart, `${where}.chart`, byId, add);
        if (item.kind === "text" && !text(item.text)) add(`${where}.text is required for a text card`);
        if (item.sourceUrl !== undefined && item.sourceUrl !== null && !isHttpUrl(String(item.sourceUrl))) {
          add(`${where}.sourceUrl must be an http(s) URL when present`);
        }
      });
    }
  }

  const verification = data.verification;
  if (!isObject(verification)) add("verification must be an object");
  else {
    for (const key of ["verified", "partial", "blocked"]) {
      if (!Number.isInteger(verification[key]) || verification[key] < 0) add(`verification.${key} must be a non-negative integer`);
    }
    if (!text(verification.checked_by)) add("verification.checked_by is required");
    const counts = { verified: 0, partial: 0, blocked: 0 };
    for (const claim of byId.values()) {
      if (counts[claim.status] !== undefined) counts[claim.status]++;
    }
    for (const key of ["verified", "partial", "blocked"]) {
      if (verification[key] !== counts[key]) add(`verification.${key} is ${verification[key]}, but the ledger has ${counts[key]}`);
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// HTML rendering
// ---------------------------------------------------------------------------

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

function statusClass(status) {
  if (status === "verified") return "ok";
  if (status === "partial") return "warn";
  if (status === "blocked") return "bad";
  return "muted";
}

function chartSvg(chart, alt) {
  const width = 640;
  const height = 360;
  const pad = { top: 44, right: 24, bottom: 56, left: 56 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const values = chart.data.map((point) => point.value);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const y = (value) => pad.top + plotHeight - ((value - min) / span) * plotHeight;
  const zeroY = y(0);

  const parts = [];
  parts.push(`<svg role="img" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`);
  parts.push(`<title>${escapeHtml(chart.title)}</title><desc>${escapeHtml(alt)}</desc>`);
  parts.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="transparent"/>`);
  parts.push(
    `<text x="${pad.left}" y="22" font-size="13" font-weight="600" fill="currentColor">${escapeHtml(chart.title)} <tspan fill-opacity="0.65" font-weight="400">(${escapeHtml(chart.unit)})</tspan></text>`,
  );
  parts.push(`<line x1="${pad.left}" y1="${zeroY}" x2="${width - pad.right}" y2="${zeroY}" stroke="currentColor" stroke-opacity="0.35"/>`);

  if (chart.type === "bar") {
    const slot = plotWidth / chart.data.length;
    const barWidth = Math.min(72, slot * 0.6);
    chart.data.forEach((point, index) => {
      const center = pad.left + slot * (index + 0.5);
      const top = Math.min(y(point.value), zeroY);
      const barHeight = Math.abs(y(point.value) - zeroY);
      const baseline = /baseline|control|before/i.test(point.label);
      const accent = /equilibrium|fixed|after/i.test(point.label) ? "#d97706" : "#2f6fed";
      parts.push(
        `<rect x="${(center - barWidth / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${Math.max(barHeight, 1).toFixed(1)}" rx="4" fill="${baseline ? "currentColor" : accent}" fill-opacity="${baseline ? "0.35" : "0.9"}"/>`,
      );
      parts.push(`<text x="${center.toFixed(1)}" y="${(top - 8).toFixed(1)}" text-anchor="middle" font-size="14" font-weight="600" fill="currentColor">${escapeHtml(String(point.value))}</text>`);
      parts.push(`<text x="${center.toFixed(1)}" y="${(height - 24).toFixed(1)}" text-anchor="middle" font-size="12" fill="currentColor" fill-opacity="0.75">${escapeHtml(point.label)}</text>`);
    });
  } else {
    const slot = chart.data.length === 1 ? 0 : plotWidth / (chart.data.length - 1);
    const points = chart.data.map((point, index) => ({ x: pad.left + slot * index, y: y(point.value), point }));
    const path = points.map((p, index) => `${index === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    parts.push(`<path d="${path}" fill="none" stroke="#2f6fed" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`);
    points.forEach((p) => {
      parts.push(`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="#2f6fed"/>`);
      parts.push(`<text x="${p.x.toFixed(1)}" y="${(p.y - 12).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="600" fill="currentColor">${escapeHtml(String(p.point.value))}</text>`);
      parts.push(`<text x="${p.x.toFixed(1)}" y="${(height - 24).toFixed(1)}" text-anchor="middle" font-size="12" fill="currentColor" fill-opacity="0.75">${escapeHtml(p.point.label)}</text>`);
    });
  }
  parts.push(`</svg>`);
  return parts.join("");
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
  if (isRemote(src)) return src;
  const full = resolve(process.cwd(), src);
  if (embed) return embedLocalImage(src);
  return relative(outputDir, full).split(sep).join("/");
}

function renderMediaItem(item, index, outputDir) {
  let body = "";
  let download = "";
  if (item.kind === "image" || item.kind === "gif") {
    body = `<img src="${escapeHtml(mediaSrc(item.src, outputDir, { embed: true }))}" alt="${escapeHtml(item.alt)}" loading="lazy" />`;
  } else if (item.kind === "video") {
    const src = mediaSrc(item.src, outputDir);
    const poster = item.poster ? ` poster="${escapeHtml(mediaSrc(item.poster, outputDir, { embed: true }))}"` : "";
    body = `<video controls preload="metadata" src="${escapeHtml(src)}"${poster}></video>`;
  } else if (item.kind === "chart") {
    body = chartSvg(item.chart, item.alt);
    download = `<p><button type="button" class="action" data-download-chart="${index}">Download chart as PNG</button></p>`;
  } else if (item.kind === "text") {
    body = `<blockquote>${escapeHtml(item.text).replace(/\n/g, "<br />")}</blockquote>`;
  }

  const link = item.sourceUrl
    ? ` <a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener">Open original</a>`
    : "";
  const license = item.license ? ` License: ${escapeHtml(item.license)}.` : "";
  return `
    <figure class="media-item" data-media-index="${index}">
      <div class="media-body">${body}</div>
      <figcaption>
        ${item.caption ? `<p class="caption">${escapeHtml(item.caption)}</p>` : ""}
        <p class="credit">${escapeHtml(item.credit)}.${license}${link}</p>
        ${download}
      </figcaption>
    </figure>`;
}

function renderCard(data, outputPath) {
  const outputDir = dirname(resolve(process.cwd(), outputPath));
  const sourceLinks = [];
  if (data.source.url) sourceLinks.push(`<a href="${escapeHtml(data.source.url)}" target="_blank" rel="noopener">Source</a>`);
  if (data.source.projectUrl) sourceLinks.push(`<a href="${escapeHtml(data.source.projectUrl)}" target="_blank" rel="noopener">Project page</a>`);
  if (data.source.repoUrl) sourceLinks.push(`<a href="${escapeHtml(data.source.repoUrl)}" target="_blank" rel="noopener">Repository</a>`);

  const posts = data.post
    .map(
      (post, index) => `
        <article class="post${index === 0 ? " hook" : ""}">
          <div class="post-head">
            <span>${index + 1}/${data.post.length}</span>
            <span>${charLength(post.text)}/${data.limit ?? 280}</span>
            <button type="button" class="copy" data-copy="${escapeHtml(post.text)}">Copy</button>
          </div>
          <p class="post-text">${escapeHtml(post.text).replace(/\n/g, "<br />")}</p>
          <div class="claims">${post.claims.map((id) => `<code>${escapeHtml(id)}</code>`).join(" ")}</div>
        </article>`,
    )
    .join("");

  const media = data.media.items.map((item, index) => renderMediaItem(item, index, outputDir)).join("");

  const hooks = data.hooks
    .map(
      (hook) => `<li class="${hook.recommended ? "recommended" : ""}">${escapeHtml(hook.text)}${hook.recommended ? ' <span class="tag">recommended</span>' : ""}</li>`,
    )
    .join("");

  const rows = data.claims
    .map(
      (claim) => `
        <tr>
          <td><code>${escapeHtml(claim.id)}</code></td>
          <td>${escapeHtml(claim.claim)}</td>
          <td>${escapeHtml(claim.value ?? "—")}${claim.value !== undefined ? " " + escapeHtml(claim.unit ?? "") : ""}</td>
          <td>${escapeHtml(claim.baseline ?? "—")}</td>
          <td>${escapeHtml(claim.source_location)}</td>
          <td><span class="status ${statusClass(claim.status)}">${escapeHtml(claim.status)}</span></td>
          <td>${claim.used ? "yes" : "no"}</td>
        </tr>`,
    )
    .join("");

  const verification = data.verification;
  const warning =
    verification.partial > 0 || verification.blocked > 0
      ? `<p class="warning">Partial: ${verification.partial}. Blocked: ${verification.blocked}. A partial claim must carry its qualifier; a blocked claim may not appear as fact.</p>`
      : `<p class="ok-line">All ledger claims used in the posts are verified.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="${escapeHtml(data.title)} — a research-to-post draft with ${data.post.length} hook posts and source media." />
<title>${escapeHtml(data.title)} — post card</title>
<style>
  :root { color-scheme: light dark; --bg: #f7f7f5; --card: #ffffff; --ink: #1c1c1a; --muted: #62625c; --line: #d9d9d2; --accent: #2f6fed; --warn: #9a6400; --bad: #a3231b; --ok: #1f6b3a; }
  @media (prefers-color-scheme: dark) { :root { --bg: #141413; --card: #1e1e1c; --ink: #ecece6; --muted: #a3a39a; --line: #3a3a36; --accent: #7aa2ff; --warn: #e2b25c; --bad: #ff8a80; --ok: #7fd39a; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 880px; margin: 0 auto; padding: 32px 20px 64px; }
  h1 { font-size: 1.75rem; line-height: 1.2; margin: 0 0 8px; }
  h2 { font-size: 1.05rem; letter-spacing: .04em; text-transform: uppercase; color: var(--muted); margin: 36px 0 12px; }
  .source { color: var(--muted); margin: 0 0 4px; }
  .source a { color: var(--accent); }
  .angle { display: inline-block; border: 1px solid var(--line); border-radius: 999px; padding: 2px 10px; font-size: .8rem; color: var(--muted); margin-top: 8px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 18px; }
  .post { border: 1px solid var(--line); border-radius: 12px; padding: 14px; margin: 0 0 12px; background: var(--card); }
  .post.hook { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent) inset; }
  .post p { margin: 6px 0 8px; white-space: pre-wrap; }
  .post-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--muted); font-size: .8rem; }
  .post-head button.copy { margin-left: auto; }
  .claims code { font-size: .75rem; color: var(--muted); }
  .copy-all { display: flex; justify-content: flex-end; margin: 0 0 10px; }
  .gallery { display: grid; gap: 16px; }
  .media-item { margin: 0; background: var(--card); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
  .media-body { display: grid; place-items: center; background: #0f0f0f; }
  .media-body img, .media-body video { display: block; width: 100%; height: auto; max-height: 520px; object-fit: contain; }
  .media-body svg { width: 100%; height: auto; color: var(--ink); background: var(--card); }
  .media-body blockquote { margin: 0; padding: 22px; font-size: 1.15rem; line-height: 1.45; border-left: 4px solid var(--accent); }
  figcaption { padding: 12px 14px; }
  figcaption p { margin: 4px 0; }
  .caption { font-size: .95rem; }
  .credit { color: var(--muted); font-size: .82rem; }
  .credit a { color: var(--accent); }
  ul.hooks { margin: 0; padding-left: 20px; }
  ul.hooks li { margin: 6px 0; }
  .tag { font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; color: var(--accent); border: 1px solid currentColor; border-radius: 999px; padding: 1px 6px; }
  details { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 12px 16px; }
  summary { cursor: pointer; color: var(--muted); font-weight: 600; }
  .table-wrap { overflow-x: auto; margin-top: 12px; }
  table { border-collapse: collapse; width: 100%; font-size: .88rem; }
  th, td { text-align: left; padding: 9px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { color: var(--muted); font-weight: 600; }
  .status { font-size: .75rem; padding: 1px 7px; border-radius: 999px; border: 1px solid currentColor; }
  .status.ok { color: var(--ok); } .status.warn { color: var(--warn); } .status.bad { color: var(--bad); } .status.muted { color: var(--muted); }
  .verification dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 18px; margin: 12px 0 0; }
  .verification dt { color: var(--muted); }
  .verification dd { margin: 0; }
  .warning { color: var(--warn); margin: 12px 0 0; }
  .ok-line { color: var(--ok); margin: 12px 0 0; }
  .muted { color: var(--muted); }
  button.copy, button.action { border: 1px solid var(--line); background: var(--card); color: var(--ink); border-radius: 999px; padding: 3px 10px; font: inherit; font-size: .8rem; cursor: pointer; }
  button.copy:active, button.action:active { transform: translateY(1px); }
  footer { margin-top: 40px; color: var(--muted); font-size: .82rem; }
</style>
</head>
<body data-slug="${escapeHtml(data.slug)}">
<main>
  <header>
    <h1>${escapeHtml(data.title)}</h1>
    <p class="source">${escapeHtml(data.source.citation)}${sourceLinks.length ? " · " + sourceLinks.join(" · ") : ""}</p>
    <span class="angle">${escapeHtml(data.angle)} · ${data.post.length} hook${data.post.length === 1 ? "" : "s"}</span>
  </header>

  <h2>Posts</h2>
  <div class="copy-all"><button type="button" class="action" data-copy-all>Copy all posts</button></div>
  <section class="card">${posts}</section>

  <h2>Media</h2>
  <p class="muted">${escapeHtml(data.media.why)}</p>
  <section class="gallery">${media}</section>

  <h2>Hooks</h2>
  <section class="card"><ul class="hooks">${hooks}</ul></section>

  <h2>Claim ledger</h2>
  <details>
    <summary>${data.claims.length} claims · ${verification.verified} verified · ${verification.partial} partial · ${verification.blocked} blocked</summary>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Claim</th><th>Value</th><th>Baseline</th><th>Source</th><th>Status</th><th>Used</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </details>

  <h2>Verification</h2>
  <details class="verification">
    <summary>${escapeHtml(verification.checked_by)}</summary>
    <dl>
      <dt>Verified</dt><dd>${verification.verified}</dd>
      <dt>Partial</dt><dd>${verification.partial}</dd>
      <dt>Blocked</dt><dd>${verification.blocked}</dd>
      <dt>Checked by</dt><dd>${escapeHtml(verification.checked_by)}</dd>
      ${verification.notes ? `<dt>Notes</dt><dd>${escapeHtml(verification.notes)}</dd>` : ""}
    </dl>
    ${warning}
  </details>

  <footer>
    Draft generated by Vitruvius <code>research-to-post</code>. Not posted, scheduled, or scraped.
    ${data.source.commit ? `Source commit: <code>${escapeHtml(data.source.commit)}</code>.` : ""}
  </footer>
</main>
<script>
  document.querySelectorAll("button.copy").forEach(function (button) {
    if (!button.hasAttribute("data-copy")) return;
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
  document.querySelectorAll("[data-download-chart]").forEach(function (button) {
    button.addEventListener("click", function () {
      var figure = button.closest("figure");
      var svg = figure && figure.querySelector("svg");
      if (!svg) return;
      var xml = new XMLSerializer().serializeToString(svg);
      var blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var image = new Image();
      image.onload = function () {
        var canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 675;
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 1200, 675);
        ctx.drawImage(image, 0, 0, 1200, 675);
        URL.revokeObjectURL(url);
        canvas.toBlob(function (png) {
          if (!png) return;
          var link = document.createElement("a");
          link.href = URL.createObjectURL(png);
          link.download = (document.body.dataset.slug || "post") + "-chart-" + button.getAttribute("data-download-chart") + ".png";
          link.click();
          setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
        }, "image/png");
      };
      image.src = url;
    });
  });
</script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

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
  let html;
  try {
    html = renderCard(data, output);
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    return 1;
  }

  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, html, "utf8");
  console.log(`PASS: wrote ${output}`);
  return 0;
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  process.exitCode = main();
}

export { renderCard };
