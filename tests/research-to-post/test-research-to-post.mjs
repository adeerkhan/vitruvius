import { strict as assert } from "node:assert";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

// research-to-post — behavioural.
//
// The prose assertions pin the decisions that prevent the named failure: a
// 7-post explainer, an unchecked source figure, a card that does not link the
// source, or a thread that buries the link in the first post. The script
// assertions prove the card renderer fails closed on each one.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const skillDir = join(repoRoot, "skills", "research-to-post");
const text = readFileSync(join(skillDir, "SKILL.md"), "utf8");
const script = join(skillDir, "scripts", "render-post-card.mjs");

// --- the draft is never published by the agent ------------------------------
assert.match(
  text,
  /never posts, never\s+calls a social-media API, and never scrapes X/i,
  "research-to-post must refuse posting, API calls, and X scraping",
);
assert.match(text, /No scraping, no automation of X/i, "the hard boundary must name X");
assert.match(text, /Reading the source's paper, GitHub repo,\s+project page, or linked demo is not platform scraping/i, "source reading must be allowed");

// --- PDF -> Markdown and source exploration --------------------------------
assert.match(text, /pdftotext -layout/i, "the PDF must be converted to Markdown text, not read from the abstract");
assert.match(text, /pdfimages -png -p/i, "the PDF figures must be extracted");
assert.match(text, /outputs\/\.drafts\/<slug>-source\.md/, "the converted source must have a declared path");
assert.match(text, /GitHub/i, "GitHub repos must be a supported source");
assert.match(text, /project page/i, "project pages must be explored");
assert.match(text, /og:image/i, "project-page media discovery must be named");
assert.match(text, /references\/source-media\.md/, "the source/media commands must be reachable");
assert.match(text, /render-post-card\.mjs/, "the skill must call the deterministic renderer");

// --- 2-3 hooks, not an explainer -------------------------------------------
assert.match(text, /2[–-]3 hook posts/i, "the skill must require 2-3 hook posts");
assert.match(text, /Each post is a hook/i, "every post must be a hook");
assert.match(text, /Never 4 or more|not 4\+|2–3 posts/i, "the skill must refuse a 4+ post thread");
assert.match(text, /last post (?:has|contains|carries) the (?:source )?link/i, "the link belongs in the last post");
assert.match(text, /Copy all\s+posts/i, "the card must make copying easy");

// --- source media, not a generated chart by default ------------------------
assert.match(text, /Prefer the source's own figure, screenshot,\s+GIF, or video/i, "source media must come before a chart");
assert.match(text, /licenseChecked/i, "the media license must be checked");
assert.match(text, /No unrelated or synthetic evidence imagery/i, "stock and synthetic evidence imagery must be refused");
assert.match(text, /outputs\/<slug>-media-<n>\.png/, "media must have a declared local path");

// --- artifact contract and boundary ----------------------------------------
assert.match(text, /outputs\/<slug>-post\.md/, "the Markdown draft path must be declared");
assert.match(text, /outputs\/<slug>-post\.html/, "the card path must be declared");
assert.match(text, /outputs\/<slug>-post\.provenance\.md/, "the provenance sidecar path must be declared");
assert.match(text, /ready to paste/i, "the user must receive paste-ready text");
assert.match(text, /research-only, not for final engineering sign-off/i, "the S7 boundary must be present");
assert.match(text, /## Common Rationalizations/, "the mandatory gate must carry the rationalization table");

// --- fixtures ---------------------------------------------------------------
const mediaId = `rtp-test-${process.pid}`;
const mediaPath = `outputs/.${mediaId}.png`;
const videoPath = `outputs/.${mediaId}.mp4`;
writeFileSync(join(repoRoot, mediaPath), Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
));
writeFileSync(join(repoRoot, videoPath), Buffer.from([0]));
process.on("exit", () => {
  rmSync(join(repoRoot, mediaPath), { force: true });
  rmSync(join(repoRoot, videoPath), { force: true });
});

const temp = mkdtempSync(join(repoRoot, ".rtp-test-"));
process.on("exit", () => rmSync(temp, { recursive: true, force: true }));

function baseCard() {
  return {
    slug: "demo-hook-thread",
    title: "Demo hook thread",
    source: {
      citation: "Author et al., Journal, 2026",
      url: "https://example.org/paper",
      projectUrl: "https://example.org",
      repoUrl: "https://github.com/example/repo",
    },
    format: "thread",
    limit: 280,
    angle: "Counterintuitive finding",
    angle_reason: "The default setting lands just above a precision cliff.",
    hooks: [
      { text: "A 16.6 threshold appears in fp32. The default lands at 18.4.", recommended: true },
      { text: "The default setting sits above the cliff.", recommended: false },
      { text: "A log-space rewrite removes the spike.", recommended: false },
    ],
    post: [
      { text: "A 16.6 threshold appears in fp32. The default setting lands at 18.4 — just above it.", claims: ["C1", "C2"] },
      { text: "Above it, the target gradient rounds to zero while every other gradient stays positive.", claims: ["C3"] },
      { text: "The fix is a log-space rewrite. It reached 100.0% vs 94.3%. Paper: https://example.org/paper", claims: ["C4", "C5"] },
    ],
    claims: [
      { id: "C1", claim: "fp32 threshold", value: "16.6", unit: "logit margin", baseline: "bf16 5.5", source_location: "Figure 1", status: "verified", used: true },
      { id: "C2", claim: "default equilibrium", value: "18.4", unit: "logit margin", baseline: "fp32 16.6", source_location: "Eq. 11", status: "verified", used: true },
      { id: "C3", claim: "target gradient rounds to zero while others stay positive", source_location: "Section 2", status: "verified", numeric: false, used: true },
      { id: "C4", claim: "fixed accuracy", value: "100.0", unit: "%", baseline: "standard 94.3", source_location: "Table 1", status: "verified", used: true },
      { id: "C5", claim: "standard accuracy", value: "94.3", unit: "%", baseline: "fixed 100.0", source_location: "Table 1", status: "verified", used: true },
    ],
    media: {
      why: "The source's own figure carries the threshold comparison.",
      items: [
        {
          kind: "image",
          src: mediaPath,
          alt: "Figure 3: the step collapses at the fp32 threshold and the equilibrium sits just above it.",
          caption: "Figure 3: normalized step vs. logit margin.",
          credit: "Figure 3, Author et al.",
          license: "CC BY 4.0",
          licenseChecked: true,
          sourceUrl: "https://example.org/paper",
        },
      ],
    },
    verification: { verified: 5, partial: 0, blocked: 0, checked_by: "verifier subagent (blind) — PASS", notes: "Figure 1 and Table 1 checked." },
  };
}

function writeCard(name, mutate) {
  const card = baseCard();
  if (mutate) mutate(card);
  const path = join(temp, `${name}.json`);
  writeFileSync(path, JSON.stringify(card, null, 2));
  return path;
}

function run(args) {
  return spawnSync(process.execPath, [script, ...args], { cwd: repoRoot, encoding: "utf8" });
}

// A valid 3-post card renders the posts first, embeds the source image, and
// links the source/project/repo.
const validInput = writeCard("valid");
const validOutput = join(temp, "valid.html");
const valid = run(["--input", validInput, "--output", validOutput]);
assert.equal(valid.status, 0, valid.stderr);
const html = readFileSync(validOutput, "utf8");
for (const marker of [
  "<img",
  "data:image/png;base64",
  "Copy all posts",
  "data-copy=",
  "https://example.org/paper",
  "https://example.org",
  "https://github.com/example/repo",
  "Figure 3",
  "verified",
]) {
  assert.ok(html.includes(marker), `rendered card must contain ${marker}`);
}

// --check validates without writing.
const checkOutput = join(temp, "check-only.html");
const checked = run(["--input", validInput, "--output", checkOutput, "--check"]);
assert.equal(checked.status, 0, checked.stderr);
assert.ok(!existsSync(checkOutput), "--check must not write the card");

// A 2-post thread is allowed when the link is in post 2.
const twoPost = run(["--input", writeCard("two-post", (card) => {
  card.post = card.post.slice(0, 2);
  card.post[1].text = "Above it, the target gradient rounds to zero. Paper: https://example.org/paper";
  card.post[1].claims = ["C3", "C4", "C5"];
})]);
assert.equal(twoPost.status, 0, twoPost.stderr);

// A 4-post thread is refused.
const fourPost = run(["--input", writeCard("four-post", (card) => {
  card.post.push({ text: "One more post.", claims: [] });
})]);
assert.notEqual(fourPost.status, 0);
assert.match(fourPost.stderr, /hook thread must contain 2 or 3 posts/);

// The first post must not carry the link.
const firstLink = run(["--input", writeCard("first-link", (card) => {
  card.post[0].text += " https://example.org/paper";
})]);
assert.notEqual(firstLink.status, 0);
assert.match(firstLink.stderr, /first post must not contain a link/);

// The last post must carry the source URL.
const noLastLink = run(["--input", writeCard("no-last-link", (card) => {
  card.post[2].text = "The fix is a log-space rewrite. It reached 100.0% vs 94.3%.";
})]);
assert.notEqual(noLastLink.status, 0);
assert.match(noLastLink.stderr, /last post must carry the source URL/);

// A remote image is linked, not embedded.
const remote = run(["--input", writeCard("remote", (card) => {
  card.media.items[0].src = "https://example.org/figure.png";
})]);
assert.equal(remote.status, 0, remote.stderr);
const remoteOutput = join(temp, "remote.html");
run(["--input", join(temp, "remote.json"), "--output", remoteOutput]);
assert.match(readFileSync(remoteOutput, "utf8"), /https:\/\/example\.org\/figure\.png/);

// A video item renders a video element.
const video = run(["--input", writeCard("video", (card) => {
  card.media.items = [{
    kind: "video",
    src: videoPath,
    alt: "Demo video.",
    caption: "Demo.",
    credit: "Project page.",
    license: "Apache 2.0",
    licenseChecked: true,
    sourceUrl: "https://example.org",
  }];
})]);
assert.equal(video.status, 0, video.stderr);
const videoOutput = join(temp, "video.html");
run(["--input", join(temp, "video.json"), "--output", videoOutput]);
assert.match(readFileSync(videoOutput, "utf8"), /<video /);

// A chart fallback renders inline SVG.
const chart = run(["--input", writeCard("chart", (card) => {
  card.media.items = [{
    kind: "chart",
    alt: "Bar chart: 16.6 vs 18.4.",
    credit: "Chart built from Figure 1.",
    chart: {
      type: "bar",
      title: "Threshold vs equilibrium",
      unit: "logit margin",
      data: [
        { label: "Threshold", value: 16.6, claim: "C1" },
        { label: "Equilibrium", value: 18.4, claim: "C2" },
      ],
    },
  }];
})]);
assert.equal(chart.status, 0, chart.stderr);
const chartOutput = join(temp, "chart.html");
run(["--input", join(temp, "chart.json"), "--output", chartOutput]);
assert.match(readFileSync(chartOutput, "utf8"), /<svg/);

// An unchecked license stops the render.
const license = run(["--input", writeCard("license", (card) => {
  card.media.items[0].licenseChecked = false;
})]);
assert.notEqual(license.status, 0);
assert.match(license.stderr, /licenseChecked must be true/);

// A local media path outside outputs/ is refused.
const outside = run(["--input", writeCard("outside", (card) => {
  card.media.items[0].src = "/tmp/figure.png";
})]);
assert.notEqual(outside.status, 0);
assert.match(outside.stderr, /must be a file under outputs\//);

// A used claim that is blocked stops the render.
const blocked = run(["--input", writeCard("blocked", (card) => {
  card.claims[0].status = "blocked";
  card.verification = { verified: 4, partial: 0, blocked: 1, checked_by: "lead" };
})]);
assert.notEqual(blocked.status, 0);
assert.match(blocked.stderr, /used as fact but its status is blocked/);

// A chart value that disagrees with the ledger stops the render.
const mismatch = run(["--input", writeCard("mismatch", (card) => {
  card.media.items = [{
    kind: "chart",
    alt: "Bar chart.",
    credit: "Chart.",
    chart: {
      type: "bar",
      title: "Threshold",
      unit: "logit margin",
      data: [{ label: "Threshold", value: 19.9, claim: "C1" }],
    },
  }];
})]);
assert.notEqual(mismatch.status, 0);
assert.match(mismatch.stderr, /does not match C1's ledger value 16.6/);

// An over-limit post, a broken claim reference, an unreferenced used claim,
// and verification-count drift all fail closed.
const overLimit = run(["--input", writeCard("overlimit", (card) => {
  card.post[0].text = "x".repeat(300);
})]);
assert.notEqual(overLimit.status, 0);
assert.match(overLimit.stderr, /over the 280-character limit/);

const brokenRef = run(["--input", writeCard("broken-ref", (card) => {
  card.post[1].claims = ["C9"];
})]);
assert.notEqual(brokenRef.status, 0);
assert.match(brokenRef.stderr, /C9, which is not in the ledger/);

const unused = run(["--input", writeCard("unused", (card) => {
  card.post[1].claims = [];
})]);
assert.notEqual(unused.status, 0);
assert.match(unused.stderr, /C3 is marked used but no post references it/);

const counts = run(["--input", writeCard("counts", (card) => {
  card.verification.verified = 4;
})]);
assert.notEqual(counts.status, 0);
assert.match(counts.stderr, /verification.verified is 4, but the ledger has 5/);

console.log(
  "PASS: research-to-post renders 2-3 hook posts with source media, links the source, " +
    "and fails closed on 4+ posts, a first-post link, a missing last-post link, unchecked media, " +
    "outside-outputs paths, unverified claims, chart drift, over-limit posts, and count drift",
);
