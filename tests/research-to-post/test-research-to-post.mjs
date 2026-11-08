import { strict as assert } from "node:assert";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { makeTempDir, removeTempDir } from "../_support/temp-dir.mjs";

// research-to-post — behavioural.
//
// The skill is deliberately small: 2-3 catchy hooks in plain language, a source
// link, and a copy-first card. No claim ledger, no verification section, no
// media. These assertions keep it from drifting back into a technical report.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const skillDir = join(repoRoot, "skills", "research-to-post");
const text = readFileSync(join(skillDir, "SKILL.md"), "utf8");
const script = join(skillDir, "scripts", "render-post-card.mjs");

// --- the simple shape -------------------------------------------------------
assert.match(text, /2[–-]3 short, catchy hooks/i, "the skill must ask for 2-3 catchy hooks");
assert.match(text, /Plain language/i, "the skill must ask for plain language");
assert.match(text, /Pick a lens before writing/i, "the skill must decide the angle before drafting");
assert.match(text, /no real connection/i, "the lens step must allow no connection");
assert.match(text, /user's own thought/i, "the user's thought must be a separate slot");
assert.match(text, /Keep the pieces separate/i, "source, thought, lens, draft, and final wording must stay separate");
assert.match(text, /It never posts, never\s+calls a social-media API, and never scrapes X/i, "the draft must never be posted or scraped");
assert.match(text, /No claim ledger/i, "the skill must explicitly drop the claim ledger");
assert.match(text, /no verification section/i, "the skill must explicitly drop the verification section");
assert.match(text, /one best source image/i, "the skill must keep one best source image");
assert.match(text, /pdfimages -png -p/i, "the PDF figures must be extracted");
assert.match(text, /outputs\/<slug>-media\.png/, "the chosen media must have a declared path");
assert.match(text, /By design\. The source\s+link is\s+the provenance\./i, "the no-ledger choice must be deliberate");
assert.match(text, /Never more|4\+ post|4\+ post threads/i, "the skill must refuse 4+ post threads");
assert.match(text, /Post 1: the question or surprise\. No link\./i, "post 1 must be a hook with no link");
assert.match(text, /Post 3: the source link plus a closing hook/i, "the last post must carry the link");
assert.match(text, /🌐/, "the skill must use the link emoji for repos and links");
assert.match(text, /📰/, "the skill must use the paper emoji for papers");
assert.match(text, /at most one emoji per post/i, "emoji use must be restrained");

// --- reading the source -----------------------------------------------------
assert.match(text, /pdftotext -layout/i, "the PDF must be converted to Markdown first");
assert.match(text, /GitHub/i, "GitHub repos must be supported");
assert.match(text, /project page/i, "project pages must be read");
assert.match(text, /references\/source-reading\.md/, "the source-reading commands must be reachable");
assert.match(text, /references\/post-hooks\.md/, "the hook shapes must be reachable");
assert.match(text, /references\/post-card\.md/, "the card schema must be reachable");
assert.match(text, /references\/post-checklist\.md/, "the checklist must be reachable");

// --- the copy-first card ----------------------------------------------------
assert.match(text, /Copy all\s+posts/i, "the card must have a Copy all button");
assert.match(text, /render-post-card\.mjs/, "the skill must call the deterministic renderer");
assert.match(text, /outputs\/<slug>-post\.md/, "the Markdown draft path must be declared");
assert.match(text, /outputs\/<slug>-post\.html/, "the card path must be declared");
assert.match(text, /research-only, not for final engineering sign-off/i, "the S7 boundary must be present");
assert.match(text, /## Common Rationalizations/, "the mandatory gate must carry the rationalization table");

// --- fixtures ---------------------------------------------------------------
const temp = makeTempDir(".rtp-test-");
process.on("exit", () => removeTempDir(temp));

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

function baseCard() {
  return {
    slug: "softmax-hooks",
    title: "Are we getting better at softmax?",
    source: {
      citation: "Barron et al., A Fix for Softmax and Cross-Entropy, arXiv:2610.31642v3",
      url: "https://arxiv.org/abs/2610.31642v3",
    },
    posts: [
      "Are we getting better at softmax yet? A new paper says the version in your framework is quietly broken — and it may explain those AdamW loss spikes.",
      "The usual fix hides the overflow, not the bug. Above a certain confidence, the target gradient goes to zero while every other gradient stays alive. The math stops adding up.",
      "The fix is not another surrogate loss. It rewrites softmax and cross-entropy in log space. Test accuracy on a toy task: 94.3% → 100%. Paper: https://arxiv.org/abs/2610.31642v3",
    ],
    media: {
      kind: "image",
      src: mediaPath,
      alt: "Figure 3: the step collapses at the fp32 cliff and the equilibrium sits just above it.",
      caption: "Figure 3: normalized step vs. logit margin.",
      credit: "Figure 3, Barron et al.",
      license: "CC BY 4.0",
      licenseChecked: true,
      sourceUrl: "https://arxiv.org/abs/2610.31642v3",
    },
    limit: 280,
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

// A valid 3-post card renders the posts, the copy buttons, the source link, and
// the one best image. It contains no ledger or verification table.
const validInput = writeCard("valid");
const validOutput = join(temp, "valid.html");
const valid = run(["--input", validInput, "--output", validOutput]);
assert.equal(valid.status, 0, valid.stderr);
const html = readFileSync(validOutput, "utf8");
for (const marker of ["Copy all posts", "data-copy=", "https://arxiv.org/abs/2610.31642v3", "<article", "post-text", "<img", "data:image/png;base64", "Figure 3", "CC BY 4.0"]) {
  assert.ok(html.includes(marker), `rendered card must contain ${marker}`);
}
for (const forbidden of ["<table", "Claim ledger", "Verification"]) {
  assert.ok(!html.includes(forbidden), `rendered card must not contain ${forbidden}`);
}

// The image is optional: without media the card is text-only.
const textOnlyInput = writeCard("text-only", (card) => { delete card.media; });
const textOnlyOutput = join(temp, "text-only.html");
const textOnly = run(["--input", textOnlyInput, "--output", textOnlyOutput]);
assert.equal(textOnly.status, 0, textOnly.stderr);
const textOnlyHtml = readFileSync(textOnlyOutput, "utf8");
assert.ok(!textOnlyHtml.includes("<img"), "a text-only card must not contain an image");
assert.ok(!textOnlyHtml.includes("<video"), "a text-only card must not contain a video");

// A remote image is linked, not embedded.
const remoteInput = writeCard("remote", (card) => { card.media.src = "https://example.org/figure.png"; });
const remoteOutput = join(temp, "remote.html");
const remote = run(["--input", remoteInput, "--output", remoteOutput]);
assert.equal(remote.status, 0, remote.stderr);
assert.match(readFileSync(remoteOutput, "utf8"), /https:\/\/example\.org\/figure\.png/);

// A video renders a video element.
const videoInput = writeCard("video", (card) => {
  card.media = {
    kind: "video",
    src: videoPath,
    alt: "Demo video.",
    caption: "Demo.",
    credit: "Project page.",
    license: "Apache 2.0",
    licenseChecked: true,
    sourceUrl: "https://example.org",
  };
});
const videoOutput = join(temp, "video.html");
const video = run(["--input", videoInput, "--output", videoOutput]);
assert.equal(video.status, 0, video.stderr);
assert.match(readFileSync(videoOutput, "utf8"), /<video /);

// An unchecked license stops the render.
const licenseInput = writeCard("license", (card) => { card.media.licenseChecked = false; });
const license = run(["--input", licenseInput]);
assert.notEqual(license.status, 0);
assert.match(license.stderr, /licenseChecked must be true/);

// A local media path outside outputs/ is refused.
const outsideInput = writeCard("outside", (card) => { card.media.src = "/tmp/figure.png"; });
const outside = run(["--input", outsideInput]);
assert.notEqual(outside.status, 0);
assert.match(outside.stderr, /must be an http\(s\) URL or a file under outputs\//);

// --check validates without writing.
const checkOutput = join(temp, "check-only.html");
const checked = run(["--input", validInput, "--output", checkOutput, "--check"]);
assert.equal(checked.status, 0, checked.stderr);
assert.ok(!existsSync(checkOutput), "--check must not write the card");

// A 2-post thread is allowed when the link is in post 2.
const twoPost = run(["--input", writeCard("two-post", (card) => {
  card.posts = [card.posts[0], "The fix is a log-space rewrite. Paper: https://arxiv.org/abs/2610.31642v3"];
})]);
assert.equal(twoPost.status, 0, twoPost.stderr);

// One post and four posts are both refused.
const onePost = run(["--input", writeCard("one-post", (card) => {
  card.posts = [card.posts[0]];
})]);
assert.notEqual(onePost.status, 0);
assert.match(onePost.stderr, /posts must contain 2 or 3 hook posts/);

const fourPost = run(["--input", writeCard("four-post", (card) => {
  card.posts.push("One more post.");
})]);
assert.notEqual(fourPost.status, 0);
assert.match(fourPost.stderr, /posts must contain 2 or 3 hook posts/);

// The first post must not carry the link.
const firstLink = run(["--input", writeCard("first-link", (card) => {
  card.posts[0] += " https://arxiv.org/abs/2610.31642v3";
})]);
assert.notEqual(firstLink.status, 0);
assert.match(firstLink.stderr, /first post must not contain a link/);

// The last post must carry the source URL.
const noLastLink = run(["--input", writeCard("no-last-link", (card) => {
  card.posts[2] = "The fix is a log-space rewrite. Test accuracy: 94.3% → 100%.";
})]);
assert.notEqual(noLastLink.status, 0);
assert.match(noLastLink.stderr, /last post must carry the source URL/);

// An over-limit post is refused.
const overLimit = run(["--input", writeCard("overlimit", (card) => {
  card.posts[0] = "x".repeat(300);
})]);
assert.notEqual(overLimit.status, 0);
assert.match(overLimit.stderr, /over the 280-character limit/);

console.log(
  "PASS: research-to-post renders 2-3 plain-language hooks with the best source image and a copy-first card, " +
    "and refuses 1-post, 4-post, first-link, missing-last-link, and over-limit drafts",
);
