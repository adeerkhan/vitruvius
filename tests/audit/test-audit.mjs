import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// audit — behavioral.
//
// Shape checks live in tests/all-skills. This suite covers the decisions that
// make an audit worth anything. The characteristic failure is an audit that
// reads one side of the comparison and declares the other wrong — or one that
// checks a claim against a version nobody pinned.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const text = readFileSync(join(repoRoot, "skills", "audit", "SKILL.md"), "utf8");
const ws = (s) =>
  new RegExp(
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .split(/\s+/)
      .join("\\s+"),
    "i",
  );

// The defining property: audit is two-sided. Reading only the claim, or only the
// implementation, produces a confident and wrong finding.
assert.match(
  text,
  ws("Read both sides directly"),
  "audit must require reading both the claim and the implementation directly",
);
assert.match(
  text,
  ws("read the actual code, not the README"),
  "audit must forbid auditing against documentation instead of the implementation",
);

// Failure mode: the claim is checked against a moving target. Versions,
// editions, and commits are what make a finding reproducible.
assert.match(
  text,
  ws("Record versions/editions/commits"),
  "audit must pin versions, editions, and commits, or the finding is not reproducible",
);

// Failure mode: a vague verdict. Each checked item needs a claim, its source
// location, and an explicit result.
assert.match(
  text,
  ws("the claim (with its source location)"),
  "audit must record each claim with its source location",
);
assert.match(
  text,
  ws("compare claim-by-claim"),
  "audit must work claim-by-claim rather than in one global verdict",
);

// The mismatch taxonomy: an audit that cannot say what kind of gap it found
// cannot be acted on.
assert.match(
  text,
  /omission|missing/i,
  "audit must classify omissions, not just contradictions",
);
assert.match(
  text,
  /mismatch|discrepanc|disagree/i,
  "audit must classify mismatches between claim and implementation",
);

// A claim verified only against the implementation's own docs is circular.
assert.match(
  text,
  /standard vs as-built|paper vs code|spec vs/i,
  "audit must name the claim/implementation pairs it handles",
);

assert.match(text, /## Input Gate/, "audit must declare the shared input gate");
assert.match(
  text,
  /outputs\/\.plans\/<slug>\.md/,
  "audit must write a plan artifact naming what is being compared",
);
assert.match(
  text,
  /research-only, not for final engineering sign-off/i,
  "audit must carry the S7 research-only boundary",
);

console.log(
  "PASS: audit asserts two-sided reading, version pinning, claim-by-claim structure, a mismatch " +
    "taxonomy, the plan artifact, and the S7 boundary",
);
