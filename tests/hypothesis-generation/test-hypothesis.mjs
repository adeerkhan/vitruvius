/**
 * Behavioral test for hypothesis-generation.
 *
 * Runs against a checked-in fixture instead of skipping when no live output
 * exists (a skip was a false green: the test could never fail). A valid record
 * must pass, and targeted mutations must each be detected, so the test proves
 * the shape it claims to check.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { check } from "../_contract/contract.mjs";

const root = join(fileURLToPath(new URL("../..", import.meta.url)));
const fixture = readFileSync(
  join(root, "tests", "hypothesis-generation", "fixtures", "valid.md"),
  "utf8",
);

function problems(text) {
  const found = [];
  const need = (needle, label) => {
    if (!text.includes(needle)) found.push(label);
  };

  need("# Hypothesis Generation:", "title with topic");
  need("## Observation (Frozen)", "frozen observation section");
  need("## Research Question", "research question section");
  need("## Evidence Boundary", "evidence boundary section");
  need("## Rival Hypotheses", "rival hypotheses section");
  need("## Discriminating Tests", "discriminating tests section");
  need("## Pre-registration Record", "pre-registration record");

  need("Date observed:", "observation is dated");
  need("Distinguish", "distinguishes measured vs inferred");
  need("Claim type:", "states claim type");
  need("Search date:", "evidence boundary has search date");
  need("Databases", "evidence boundary lists databases");
  need("Limitations:", "evidence boundary states limitations");

  const rivalCount = (text.match(/### H\d:/g) || []).length;
  if (rivalCount < 3) found.push(`3+ rival hypotheses (found ${rivalCount})`);

  if (!text.includes("candidate")) found.push("hypotheses marked as candidate");
  if (text.includes("best hypothesis") || text.includes("selected hypothesis")) {
    found.push("selects a 'best' hypothesis");
  }

  need("Generated:", "pre-registration is timestamped");
  need("Status:", "status is stated");
  need("S7 boundary:", "has S7 boundary statement");

  return found;
}

console.log("\n[Test] hypothesis-generation — behavioral");

const valid = problems(fixture);
check(valid.length === 0, `checked-in fixture passes (${valid.join("; ") || "ok"})`);

const mutations = [
  ["missing frozen observation", fixture.replace("## Observation (Frozen)", "## Notes")],
  ["missing evidence boundary", fixture.replace("## Evidence Boundary", "## Notes")],
  [
    "fewer than three rivals",
    fixture.replace(/\n### H3:[\s\S]*?(?=\n## Discriminating Tests)/, "\n"),
  ],
  ["selects a hypothesis", `${fixture}\nbest hypothesis: H1\n`],
  ["undated observation", fixture.replace("Date observed:", "Observed:")],
  ["no pre-registration", fixture.replace("## Pre-registration Record", "## Notes")],
];

for (const [name, text] of mutations) {
  check(problems(text).length > 0, `mutation detected: ${name}`);
}

console.log("\nPASS: hypothesis-generation validates its fixture and refuses each mutation");
