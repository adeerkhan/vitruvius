import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// simplified-technical-english — behavioral.
//
// Shape checks live in tests/all-skills. This suite covers the decisions that
// make a controlled-language rewrite worth having.
//
// The failure this skill has to resist is the subtle one: a rewrite that reads
// more clearly and has quietly changed meaning. STE shortens sentences and
// removes banned verb forms; none of that is allowed to touch a number, a unit,
// a symbol, or a safety consequence, and none of it applies to a quotation.
// The assertions below are therefore mostly about what STE must NOT change.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const text = readFileSync(join(repoRoot, "skills", "simplified-technical-english", "SKILL.md"), "utf8");

const ws = (s) =>
  new RegExp(
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").split(/\s+/).join("\\s+"),
    "i",
  );

// --- The scope: technical output, and not the evidence ---------------------
assert.match(
  text,
  /Do not rewrite the evidence\./i,
  "STE must refuse to rewrite the evidence",
);
assert.match(
  text,
  ws("Rewriting a quoted provision into STE changes the quotation"),
  "STE must say a rewritten quotation is a changed quotation",
);
assert.match(
  text,
  ws("Keep the quotation exactly, then explain it in STE in a separate sentence"),
  "STE must keep a quotation exact and explain it separately",
);

// --- The load-bearing constraint: language only, never the values ----------
assert.match(
  text,
  /Keep every number, unit, symbol, and safety consequence exactly as the source\s+states it/i,
  "STE must keep numbers, units, symbols, and safety consequences unchanged",
);
assert.match(
  text,
  /STE shortens sentences; it never changes a value or drops a risk/i,
  "STE must state that it shortens sentences but never changes a value or drops a risk",
);

// --- The controlled-language rules that define the style -------------------
assert.match(
  text,
  /Use only "can", "must", and "will" as helping verbs\. Do not use "should",\s+"would", "may", "might", or "shall"/i,
  "STE must restrict helping verbs to can/must/will and ban should/would/may/might/shall",
);
assert.match(
  text,
  /Procedural sentences: maximum 20 words/i,
  "STE must cap procedural sentences at 20 words",
);
assert.match(
  text,
  /Descriptive sentences: maximum 25 words/i,
  "STE must cap descriptive sentences at 25 words",
);
assert.match(
  text,
  /Do not use semicolons\. Write two sentences/i,
  "STE must ban semicolons",
);
assert.match(
  text,
  /Use "WARNING" for a risk of injury or death to persons/i,
  "STE must define WARNING as a risk to persons",
);
assert.match(
  text,
  /Use "CAUTION" for a risk of damage to objects/i,
  "STE must define CAUTION as a risk to objects",
);

// --- The checker, and its honest limit -------------------------------------
assert.match(
  text,
  /python3 scripts\/ste_check\.py/i,
  "STE must name the checker command, or step 6 has no tool",
);
assert.match(
  text,
  /The check tool cannot find all the errors/i,
  "STE must state the checker's limit rather than implying full compliance",
);

// --- Boundaries: not a certification, not an ASD product -------------------
assert.match(
  text,
  /research-only, not for final engineering sign-off/i,
  "STE must carry the S7 research-only boundary",
);
assert.match(
  text,
  /This skill is not an official ASD document/i,
  "STE must state it is not an official ASD document",
);

console.log(
  "PASS: simplified-technical-english asserts the evidence-exclusion rule, the " +
    "value-preservation constraint, the core controlled-language rules, the checker " +
    "with its limit, and the not-a-certification boundary",
);
