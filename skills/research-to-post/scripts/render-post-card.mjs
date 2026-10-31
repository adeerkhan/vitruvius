#!/usr/bin/env node
/**
 * render-post-card.mjs — render a self-contained HTML post card for the
 * research-to-post skill.
 *
 * The card is a preview for a human to inspect before publishing. It does not
 * post, schedule, scrape, or call any platform API. It embeds the chosen figure
 * as a data URI (or draws a chart as inline SVG) so the file travels on its own.
 *
 * Usage:
 *   node skills/research-to-post/scripts/render-post-card.mjs --input <json> --output <html>
 *   node skills/research-to-post/scripts/render-post-card.mjs --input <json> --check
 *
 * Exit 0 = card rendered (or input valid under --check).
 * Exit 1 = validation failed; no card is written.
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const FORMATS = new Set(["single", "thread", "figure"]);
const STATUSES = new Set(["verified", "partial", "blocked", "unverified", "inferred", "failed"]);
const FACT_STATUSES = new Set(["verified", "partial"]);
const MEDIA_KINDS = new Set(["figure", "chart", "text", "video", "none"]);
const CHART_TYPES = new Set(["bar", "line"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
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

  if (!FORMATS.has(data.format)) add("format must be single, thread, or figure");
  const limit = data.limit === undefined ? 280 : data.limit;
  if (!Number.isInteger(limit) || limit < 1 || limit > 10000) add("limit must be an integer from 1 to 10000");

  if (!text(data.angle)) add("angle is required");
  if (!text(data.angle_reason)) add("angle_reason is required");

  // --- hooks ---------------------------------------------------------------
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

  // --- claims --------------------------------------------------------------
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
        if (claim.status === "partial" && !text(claim.qualifier)) {
          add(`${where} is partial but has no qualifier to carry into the post`);
        }
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

  // --- posts ---------------------------------------------------------------
  const posts = data.post;
  const referenced = new Set();
  if (!Array.isArray(posts) || posts.length === 0) add("post must be a non-empty array");
  else {
    if (data.format === "single" && posts.length !== 1) add("a single post must contain exactly one post");
    if (data.format === "figure" && posts.length !== 1) add("a figure post must contain exactly one post");
    if (data.format === "thread" && (posts.length < 4 || posts.length > 7)) {
      add("a thread must contain 4 to 7 posts");
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
  }
  for (const [id, claim] of byId) {
    if (claim.used === true && !referenced.has(id)) {
      add(`${id} is marked used but no post references it`);
    }
  }

  // --- media ---------------------------------------------------------------
  const media = data.media;
  if (!isObject(media)) add("media must be an object");
  else {
    if (!MEDIA_KINDS.has(media.kind)) add("media.kind must be figure, chart, text, video, or none");
    if (!text(media.alt)) add("media.alt is required; alt text is part of the post");
    if (!text(media.why)) add("media.why is required; say why this visual fits the angle");
    if (media.kind !== "none" && !text(media.credit)) add("media.credit is required for a figure, chart, text, or video");

    if (media.kind === "text" && !text(media.text)) {
      add("media.text is required for a text card");
    }

    if (media.kind === "figure") {
      const figure = media.figure;
      if (!isObject(figure) || !text(figure.path)) add("media.figure.path is required");
      else {
        const figurePath = resolve(process.cwd(), figure.path);
        const root = resolve(process.cwd());
        if (figurePath !== root && !figurePath.startsWith(`${root}${sep}`)) {
          add("media.figure.path must stay inside the project");
        } else if (!existsSync(figurePath) || !statSync(figurePath).isFile()) {
          add(`media.figure.path does not exist: ${figure.path}`);
        } else if (![".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(extname(figurePath).toLowerCase())) {
          add("media.figure.path must be a png, jpg, jpeg, webp, gif, or svg file");
        }
      }
      if (!text(media.license)) add("media.license is required for a figure");
      if (media.licenseChecked !== true) add("media.licenseChecked must be true before a figure is embedded");
    }

    if (media.kind === "chart") {
      const chart = media.chart;
      if (!isObject(chart)) add("media.chart is required for a chart");
      else {
        if (!CHART_TYPES.has(chart.type)) add("media.chart.type must be bar or line");
        if (!text(chart.title)) add("media.chart.title is required");
        if (!text(chart.unit)) add("media.chart.unit is required");
        if (!Array.isArray(chart.data) || chart.data.length === 0) add("media.chart.data must be a non-empty array");
        else if (chart.data.length > 12) add("media.chart.data supports at most 12 points");
        else {
          chart.data.forEach((point, index) => {
            const where = `media.chart.data[${index}]`;
            if (!isObject(point)) {
              add(`${where} must be an object`);
              return;
            }
            if (!text(point.label)) add(`${where}.label is required`);
            if (typeof point.value !== "number" || !Number.isFinite(point.value)) {
              add(`${where}.value must be a finite number`);
            }
            const claim = byId.get(point.claim);
            if (!claim) {
              add(`${where}.claim must name a ledger claim`);
              return;
            }
            if (claim.used !== true) add(`${where}.claim ${point.claim} is not marked used`);
            if (!FACT_STATUSES.has(claim.status)) {
              add(`${where}.claim ${point.claim} is ${claim.status}; a chart may only plot verified or partial claims`);
            }
            if (claim.numeric === false) add(`${where}.claim ${point.claim} is marked non-numeric`);
            if (text(claim.unit) && text(chart.unit) && text(claim.unit) !== text(chart.unit)) {
              add(`${where}.claim ${point.claim} has unit ${claim.unit}, but the chart unit is ${chart.unit}`);
            }
            if (point.role !== undefined && point.role !== "baseline" && point.role !== "value") {
              add(`${where}.role must be baseline or value when present`);
            }
            const role = point.role === "baseline" ? "baseline" : "value";
            if (role === "baseline" && !text(claim.baseline)) {
              add(`${where}.role is baseline, but ${point.claim} has no baseline value`);
            }
            const ledgerText = role === "baseline" ? text(claim.baseline) : text(claim.value);
            const ledgerValue = Number.parseFloat(ledgerText.replace(/,/g, ""));
            if (Number.isFinite(ledgerValue)) {
              if (Math.abs(ledgerValue - point.value) > 1e-9) {
                add(`${where}.value ${point.value} does not match ${point.claim}'s ledger ${role} ${ledgerText}`);
              }
            } else if (text(ledgerText)) {
              add(`${where}.claim ${point.claim} has a non-numeric ${role} ${ledgerText}`);
            }
          });
        }
      }
    }

    if (media.kind === "video") {
      const video = media.video;
      if (!isObject(video)) add("media.video is required for a video");
      else {
        if (!Number.isFinite(video.duration_s) || video.duration_s < 1 || video.duration_s > 60) {
          add("media.video.duration_s must be between 1 and 60 seconds");
        }
        if (!Array.isArray(video.shots) || video.shots.length === 0) add("media.video.shots must be a non-empty array");
        else if (video.shots.length > 8) add("media.video.shots supports at most 8 shots");
        else {
          video.shots.forEach((shot, index) => {
            const where = `media.video.shots[${index}]`;
            if (!isObject(shot)) {
              add(`${where} must be an object`);
              return;
            }
            for (const key of ["t", "visual", "text"]) {
              if (!text(shot[key])) add(`${where}.${key} is required`);
            }
          });
        }
      }
    }
  }

  // --- verification --------------------------------------------------------
  const verification = data.verification;
  if (!isObject(verification)) add("verification must be an object");
  else {
    for (const key of ["verified", "partial", "blocked"]) {
      if (!Number.isInteger(verification[key]) || verification[key] < 0) {
        add(`verification.${key} must be a non-negative integer`);
      }
    }
    if (!text(verification.checked_by)) add("verification.checked_by is required");
    const counts = { verified: 0, partial: 0, blocked: 0 };
    for (const claim of byId.values()) {
      if (counts[claim.status] !== undefined) counts[claim.status]++;
    }
    for (const key of ["verified", "partial", "blocked"]) {
      if (verification[key] !== counts[key]) {
        add(`verification.${key} is ${verification[key]}, but the ledger has ${counts[key]}`);
      }
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

function barChart(chart, alt) {
  const width = 640;
  const height = 360;
  const pad = { top: 32, right: 24, bottom: 56, left: 56 };
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
    `<text x="${pad.left}" y="20" font-size="13" font-weight="600" fill="currentColor">${escapeHtml(chart.title)} <tspan fill-opacity="0.65" font-weight="400">(${escapeHtml(chart.unit)})</tspan></text>`,
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
      parts.push(
        `<text x="${center.toFixed(1)}" y="${(top - 8).toFixed(1)}" text-anchor="middle" font-size="14" font-weight="600" fill="currentColor">${escapeHtml(String(point.value))}</text>`,
      );
      parts.push(
        `<text x="${center.toFixed(1)}" y="${(height - 24).toFixed(1)}" text-anchor="middle" font-size="12" fill="currentColor" fill-opacity="0.75">${escapeHtml(point.label)}</text>`,
      );
    });
  } else {
    const slot = chart.data.length === 1 ? 0 : plotWidth / (chart.data.length - 1);
    const points = chart.data.map((point, index) => ({
      x: pad.left + slot * index,
      y: y(point.value),
      point,
    }));
    const path = points.map((p, index) => `${index === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    parts.push(`<path d="${path}" fill="none" stroke="#2f6fed" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`);
    points.forEach((p) => {
      parts.push(`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="#2f6fed"/>`);
      parts.push(
        `<text x="${p.x.toFixed(1)}" y="${(p.y - 12).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="600" fill="currentColor">${escapeHtml(String(p.point.value))}</text>`,
      );
      parts.push(
        `<text x="${p.x.toFixed(1)}" y="${(height - 24).toFixed(1)}" text-anchor="middle" font-size="12" fill="currentColor" fill-opacity="0.75">${escapeHtml(p.point.label)}</text>`,
      );
    });
  }
  parts.push(`</svg>`);
  return parts.join("");
}

function embedFigure(figurePath) {
  const full = resolve(process.cwd(), figurePath);
  const ext = extname(full).toLowerCase();
  const mime = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  }[ext];
  if (!mime) throw new Error(`media.figure.path has an unsupported image type: ${ext || "none"}`);
  const bytes = readFileSync(full);
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error("media.figure.path is larger than 10 MB");
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

function renderMedia(media, slug) {
  if (media.kind === "none") {
    return `<div class="media none"><p class="muted">No visual: the claim is qualitative or no honest visual is available.</p></div>`;
  }
  if (media.kind === "chart") {
    return `<div class="media chart">${barChart(media.chart, media.alt)}<p><button type="button" class="copy" id="download-chart">Download chart as PNG</button></p></div>`;
  }
  if (media.kind === "figure") {
    const src = embedFigure(media.figure.path);
    return `<div class="media figure"><img src="${src}" alt="${escapeHtml(media.alt)}" /><p><a class="copy" download="${escapeHtml(slug)}-figure.png" href="${src}">Download figure</a></p></div>`;
  }
  if (media.kind === "text") {
    return `<div class="media text"><blockquote>${escapeHtml(media.text).replace(/\n/g, "<br />")}</blockquote></div>`;
  }
  const shots = media.video.shots
    .map(
      (shot) => `<li><span class="shot-time">${escapeHtml(shot.t)}</span><span><b>${escapeHtml(shot.visual)}</b><br />${escapeHtml(shot.text)}</span></li>`,
    )
    .join("");
  return `<div class="media video"><p class="muted">Storyboard only. ${escapeHtml(String(media.video.duration_s))} s, sound off.</p><ol class="shots">${shots}</ol></div>`;
}

function renderCard(data) {
  const sourceLine = data.source.url
    ? `<a href="${escapeHtml(data.source.url)}">${escapeHtml(data.source.citation)}</a>`
    : escapeHtml(data.source.citation);
  const posts = data.post
    .map(
      (post, index) => `
        <article class="post${index === 0 ? " hook" : ""}">
          <div class="post-head"><span>${index + 1}/${data.post.length}</span><span>${charLength(post.text)}/${data.limit ?? 280}</span></div>
          <p>${escapeHtml(post.text).replace(/\n/g, "<br />")}</p>
          <div class="claims">${post.claims.map((id) => `<code>${escapeHtml(id)}</code>`).join(" ")}</div>
        </article>`,
    )
    .join("");

  const hooks = data.hooks
    .map(
      (hook) => `<li class="${hook.recommended ? "recommended" : ""}">${escapeHtml(hook.text)}${hook.recommended ? " <span class=\"tag\">recommended</span>" : ""}</li>`,
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

  const copyBlocks = data.post
    .map(
      (post, index) => `
        <div class="copy-block">
          <div class="post-head"><span>Post ${index + 1}</span><button type="button" class="copy" data-copy="${escapeHtml(post.text)}">Copy</button></div>
          <pre>${escapeHtml(post.text)}</pre>
        </div>`,
    )
    .join("");

  const verification = data.verification;
  const warning =
    verification.partial > 0 || verification.blocked > 0
      ? `<p class="warning">Partial: ${verification.partial}. Blocked: ${verification.blocked}. The post must carry each partial qualifier; blocked claims may not appear as fact.</p>`
      : `<p class="ok-line">All ledger claims used in the post are verified.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="${escapeHtml(data.title)} — a research-to-post draft with its claim ledger and media." />
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
  .angle { display: inline-block; border: 1px solid var(--line); border-radius: 999px; padding: 2px 10px; font-size: .8rem; color: var(--muted); margin-top: 8px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 18px; }
  .post { border: 1px solid var(--line); border-radius: 12px; padding: 14px; margin: 0 0 12px; background: var(--card); }
  .post.hook { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent) inset; }
  .post p { margin: 6px 0 8px; white-space: pre-wrap; }
  .post-head { display: flex; justify-content: space-between; gap: 12px; color: var(--muted); font-size: .8rem; }
  .claims code { font-size: .75rem; color: var(--muted); }
  .media { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 14px; }
  .media svg { width: 100%; height: auto; color: var(--ink); }
  .media img { display: block; max-width: 100%; height: auto; border-radius: 8px; }
  .media.none p { margin: 0; }
  .media.text blockquote { margin: 0; font-size: 1.15rem; line-height: 1.45; border-left: 4px solid var(--accent); padding-left: 14px; }
  .shots { margin: 8px 0 0; padding-left: 0; list-style: none; }
  .shots li { display: grid; grid-template-columns: 64px 1fr; gap: 10px; padding: 8px 0; border-top: 1px solid var(--line); }
  .shot-time { color: var(--muted); font-variant-numeric: tabular-nums; }
  .alt { color: var(--muted); font-size: .9rem; margin: 10px 0 0; }
  .why { font-size: .9rem; margin: 10px 0 0; }
  ul.hooks { margin: 0; padding-left: 20px; }
  ul.hooks li { margin: 6px 0; }
  .tag { font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; color: var(--accent); border: 1px solid currentColor; border-radius: 999px; padding: 1px 6px; }
  .table-wrap { overflow-x: auto; background: var(--card); border: 1px solid var(--line); border-radius: 14px; }
  table { border-collapse: collapse; width: 100%; font-size: .88rem; }
  th, td { text-align: left; padding: 9px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { color: var(--muted); font-weight: 600; }
  .status { font-size: .75rem; padding: 1px 7px; border-radius: 999px; border: 1px solid currentColor; }
  .status.ok { color: var(--ok); } .status.warn { color: var(--warn); } .status.bad { color: var(--bad); } .status.muted { color: var(--muted); }
  .verification { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px; }
  .verification dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 18px; margin: 0; }
  .verification dt { color: var(--muted); }
  .verification dd { margin: 0; }
  .warning { color: var(--warn); margin: 12px 0 0; }
  .ok-line { color: var(--ok); margin: 12px 0 0; }
  .muted { color: var(--muted); }
  .copy-block { margin: 0 0 12px; }
  .copy-block pre { white-space: pre-wrap; word-wrap: break-word; background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 12px; margin: 6px 0 0; font: inherit; }
  button.copy { border: 1px solid var(--line); background: var(--card); color: var(--ink); border-radius: 999px; padding: 3px 10px; font: inherit; font-size: .8rem; cursor: pointer; }
  button.copy:active { transform: translateY(1px); }
  footer { margin-top: 40px; color: var(--muted); font-size: .82rem; }
</style>
</head>
<body data-slug="${escapeHtml(data.slug)}">
<main>
  <header>
    <h1>${escapeHtml(data.title)}</h1>
    <p class="source">${sourceLine}</p>
    <span class="angle">${escapeHtml(data.angle)} · ${escapeHtml(data.format)}</span>
  </header>

  <h2>Post</h2>
  <section class="card">${posts}</section>

  <h2>Media</h2>
  <section class="media-wrap">
    ${renderMedia(data.media, data.slug)}
    <p class="alt"><b>Alt text:</b> ${escapeHtml(data.media.alt)}</p>
    ${data.media.why ? `<p class="why"><b>Why this visual:</b> ${escapeHtml(data.media.why)}</p>` : ""}
    ${data.media.caption ? `<p class="why"><b>Caption:</b> ${escapeHtml(data.media.caption)}</p>` : ""}
    ${data.media.credit ? `<p class="why"><b>Credit:</b> ${escapeHtml(data.media.credit)}</p>` : ""}
    ${data.media.license ? `<p class="why"><b>License:</b> ${escapeHtml(data.media.license)}</p>` : ""}
  </section>

  <h2>Hooks</h2>
  <section class="card"><ul class="hooks">${hooks}</ul></section>

  <h2>Claim ledger</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>#</th><th>Claim</th><th>Value</th><th>Baseline</th><th>Source</th><th>Status</th><th>Used</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <h2>Verification</h2>
  <section class="verification">
    <dl>
      <dt>Verified</dt><dd>${verification.verified}</dd>
      <dt>Partial</dt><dd>${verification.partial}</dd>
      <dt>Blocked</dt><dd>${verification.blocked}</dd>
      <dt>Checked by</dt><dd>${escapeHtml(verification.checked_by)}</dd>
      ${verification.notes ? `<dt>Notes</dt><dd>${escapeHtml(verification.notes)}</dd>` : ""}
    </dl>
    ${warning}
  </section>

  <h2>Ready to paste</h2>
  <section>${copyBlocks}</section>

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
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done, function () {});
      }
    });
  });
  var chartButton = document.getElementById("download-chart");
  if (chartButton) {
    chartButton.addEventListener("click", function () {
      var svg = document.querySelector(".media.chart svg");
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
          link.download = (document.body.dataset.slug || "post") + "-chart.png";
          link.click();
          setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
        }, "image/png");
      };
      image.src = url;
    });
  }
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

  let html;
  try {
    html = renderCard(data);
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    return 1;
  }

  const output = resolve(process.cwd(), args.output || join("outputs", `${data.slug}-post.html`));
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
