import { strict as assert } from "node:assert";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

// research-to-post — behavioural.
//
// The prose assertions pin the decisions that prevent the named failure: posting
// or scraping without permission, an unverified number in the hook, a media
// choice that carries a different claim, or a card that is not generated at all.
// The script assertions prove the card renderer fails closed on every one of
// those inconsistencies instead of trusting the prose alone.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const skillDir = join(repoRoot, "skills", "research-to-post");
const text = readFileSync(join(skillDir, "SKILL.md"), "utf8");
const script = join(skillDir, "scripts", "render-post-card.mjs");

// --- the draft is never published by the agent ------------------------------
assert.match(
  text,
  /never posts, never\s+calls\s+a\s+social-media API, and never scrapes/i,
  "research-to-post must refuse posting, API calls, and scraping",
);
assert.match(text, /No scraping, no automation of a platform/i, "the hard boundary must name scraping");
assert.match(text, /It drafts and previews; it does not post/i, "the scope must say it does not post");

// --- reading before writing -------------------------------------------------
assert.match(text, /Read the source itself/i, "the source must be read, not summarized from a listing");
assert.match(text, /claim ledger/i, "the claim ledger is the accuracy spine");
assert.match(text, /verified.*partial|partial.*verified/is, "the ledger must use the verification labels");
assert.match(text, /three hook variants/i, "three hooks are required so the first line is chosen, not defaulted");

// --- the HTML card and the media decision ----------------------------------
assert.match(text, /outputs\/<slug>-post\.html/, "the rendered post card must have a declared path");
assert.match(text, /render-post-card\.mjs/, "the skill must call the deterministic renderer");
assert.match(text, /references\/post-card\.md/, "the media and card contract must be reachable");
assert.match(text, /if its license is\s+checked/i, "a figure license must be checked before embedding");
assert.match(text, /unrelated stock imagery|No unrelated or synthetic evidence imagery/i, "stock and synthetic evidence imagery must be refused");
assert.match(text, /virality/i, "the skill must be honest that virality is not guaranteed");

// --- metrics stay descriptive ----------------------------------------------
assert.match(text, /below 20 posts/i, "small metric samples must be reported as observations");
assert.match(text, /do not fetch\s+analytics|not a causal model/i, "metrics are the user's own file, not scraped analytics");

// --- artifact contract and boundary ----------------------------------------
assert.match(text, /outputs\/<slug>-post\.md/, "the Markdown draft path must be declared");
assert.match(text, /outputs\/<slug>-post\.provenance\.md/, "the provenance sidecar path must be declared");
assert.match(text, /ready to paste/i, "the user must receive paste-ready text");
assert.match(text, /research-only, not for final engineering sign-off/i, "the S7 boundary must be present");
assert.match(text, /## Common Rationalizations/, "the mandatory gate must carry the rationalization table");

// --- fixtures ---------------------------------------------------------------
const temp = mkdtempSync(join(repoRoot, ".rtp-test-"));
process.on("exit", () => rmSync(temp, { recursive: true, force: true }));

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const figurePath = join(temp, "figure.png");
writeFileSync(figurePath, PNG);
const figureRel = figurePath.slice(repoRoot.length + 1);

function baseCard() {
  return {
    slug: "demo-steel-brace",
    title: "Steel brace connection",
    source: { citation: "Author et al., Journal, 2026", url: "https://doi.org/10.0000/example" },
    format: "thread",
    limit: 280,
    angle: "Result-first",
    angle_reason: "The paper reports one strong, directly comparable number.",
    hooks: [
      { text: "18% drift capacity, against 12% for the baseline.", recommended: true },
      { text: "The brace changed the drift capacity.", recommended: false },
      { text: "What does a braced frame buy you?", recommended: false },
    ],
    post: [
      { text: "The brace reached 18% drift capacity, against 12% for the baseline.", claims: ["C1"] },
      { text: "The gain comes from a more stable hysteretic response.", claims: ["C2"] },
      { text: "Limitation: the result holds for the tested frame only.", claims: [] },
      { text: "Source: Author et al., 2026.", claims: [] },
    ],
    claims: [
      {
        id: "C1",
        claim: "Drift capacity of the braced frame",
        value: "18",
        unit: "%",
        baseline: "12%",
        source_location: "Table 3, p. 9",
        status: "verified",
        used: true,
      },
      {
        id: "C2",
        claim: "Mechanism is a stable hysteretic response",
        source_location: "Section 4.2",
        status: "partial",
        qualifier: "for the tested frame only",
        numeric: false,
        used: true,
      },
    ],
    media: {
      kind: "chart",
      why: "The hook is the drift comparison, so the chart shows both bars.",
      alt: "Bar chart: baseline 12% drift capacity, braced frame 18%.",
      caption: "Drift capacity at the same drift limit, Table 3.",
      credit: "Chart built from Table 3.",
      chart: {
        type: "bar",
        title: "Drift capacity",
        unit: "%",
        data: [
          { label: "Baseline", value: 12, claim: "C1", role: "baseline" },
          { label: "Braced frame", value: 18, claim: "C1" },
        ],
      },
    },
    verification: { verified: 1, partial: 1, blocked: 0, checked_by: "lead agent", notes: "Table 3 read directly." },
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

// A valid card renders, embeds the chart, and carries the ledger and alt text.
const validInput = writeCard("valid");
const validOutput = join(temp, "valid.html");
const valid = run(["--input", validInput, "--output", validOutput]);
assert.equal(valid.status, 0, valid.stderr);
const html = readFileSync(validOutput, "utf8");
for (const marker of [
  "<svg",
  "The brace reached 18% drift capacity",
  "Baseline",
  "Bar chart: baseline 12% drift capacity",
  "data-copy=",
  "Download chart as PNG",
  'data-slug="demo-steel-brace"',
  "verified",
  "https://doi.org/10.0000/example",
]) {
  assert.ok(html.includes(marker), `rendered card must contain ${marker}`);
}

// --check validates without writing.
const checkOutput = join(temp, "check-only.html");
const checked = run(["--input", validInput, "--output", checkOutput, "--check"]);
assert.equal(checked.status, 0, checked.stderr);
assert.ok(!existsSync(checkOutput), "--check must not write the card");

// A used claim that is blocked stops the render.
const blocked = run(["--input", writeCard("blocked", (card) => {
  card.claims[0].status = "blocked";
  card.verification = { verified: 0, partial: 1, blocked: 1, checked_by: "lead agent" };
})]);
assert.notEqual(blocked.status, 0);
assert.match(blocked.stderr, /used as fact but its status is blocked/);

// A chart value that disagrees with the ledger stops the render.
const mismatch = run(["--input", writeCard("mismatch", (card) => {
  card.media.chart.data[1].value = 19;
})]);
assert.notEqual(mismatch.status, 0);
assert.match(mismatch.stderr, /does not match C1's ledger value 18/);

// An unchecked figure license stops the render.
const license = run(["--input", writeCard("license", (card) => {
  card.media = {
    kind: "figure",
    why: "The figure is the result.",
    alt: "Figure 4.",
    credit: "Figure 4, Author et al.",
    license: "CC BY 4.0",
    licenseChecked: false,
    figure: { path: figureRel },
  };
})]);
assert.notEqual(license.status, 0);
assert.match(license.stderr, /licenseChecked must be true/);

// A checked figure is embedded as a data URI, not a remote link.
const figureInput = writeCard("figure", (card) => {
  card.media = {
    kind: "figure",
    why: "The figure is the result.",
    alt: "Figure 4.",
    credit: "Figure 4, Author et al.",
    license: "CC BY 4.0",
    licenseChecked: true,
    figure: { path: figureRel },
  };
});
const figureOutput = join(temp, "figure.html");
const figure = run(["--input", figureInput, "--output", figureOutput]);
assert.equal(figure.status, 0, figure.stderr);
const figureHtml = readFileSync(figureOutput, "utf8");
assert.match(figureHtml, /data:image\/png;base64/);
assert.match(figureHtml, /download="demo-steel-brace-figure\.png"/);

// A text card is the honest fallback when no figure or chart fits.
const textInput = writeCard("text", (card) => {
  card.media = {
    kind: "text",
    why: "The claim is a condition, not a number.",
    alt: "Text card: the result holds for the tested frame only.",
    caption: "Scope condition from Section 4.2.",
    credit: "Text card built from Section 4.2.",
    text: "The result holds for the tested frame only.",
  };
});
const textOutput = join(temp, "text.html");
const textCard = run(["--input", textInput, "--output", textOutput]);
assert.equal(textCard.status, 0, textCard.stderr);
assert.match(readFileSync(textOutput, "utf8"), /<blockquote>The result holds for the tested frame only\.<\/blockquote>/);

// An over-limit post, a broken claim reference, an unreferenced used claim,
// a link in the first post, and a short thread all fail closed.
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
assert.match(unused.stderr, /C2 is marked used but no post references it/);

const firstLink = run(["--input", writeCard("first-link", (card) => {
  card.post[0].text += " https://example.com";
})]);
assert.notEqual(firstLink.status, 0);
assert.match(firstLink.stderr, /first post must not contain a link/);

const shortThread = run(["--input", writeCard("short-thread", (card) => {
  card.post = card.post.slice(0, 3);
})]);
assert.notEqual(shortThread.status, 0);
assert.match(shortThread.stderr, /thread must contain 4 to 7 posts/);

// Verification counts must agree with the ledger.
const counts = run(["--input", writeCard("counts", (card) => {
  card.verification.verified = 2;
})]);
assert.notEqual(counts.status, 0);
assert.match(counts.stderr, /verification.verified is 2, but the ledger has 1/);

console.log(
  "PASS: research-to-post refuses posting and scraping, requires the claim ledger, renders the post card, " +
    "and fails closed on unverified claims, chart drift, unchecked figure licenses, over-limit posts, and count drift",
);
