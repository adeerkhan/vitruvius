import { strict as assert } from "node:assert";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// vitruvius-help — behavioral.
//
// Shape checks live in tests/all-skills. This suite covers the decisions that
// make the reference card trustworthy rather than decorative.
//
// The characteristic failure: a help card that has drifted from the skills it
// documents. A card listing commands that no longer exist, or omitting one that
// does, is worse than no card — it is the first thing a new user reads, and it
// confidently points at a command that is not there.
//
// So this suite checks the card against the real skills/ directory. A new skill
// that is not on the card fails here, which is the same contract the vitruvius
// dispatcher suite applies in the other direction.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const text = readFileSync(join(repoRoot, "skills", "vitruvius-help", "SKILL.md"), "utf8");
const SKILLS_DIR = join(repoRoot, "skills");

// --- One-shot, non-persistent ---------------------------------------------
// A help card that installs a mode outlives its usefulness and is hard to
// discover how to leave.
assert.match(
  text,
  /Display this reference card when invoked\. One-shot; do not persist anything/i,
  "vitruvius-help must be one-shot and persist nothing",
);

// --- What the card has to carry -------------------------------------------
assert.match(
  text,
  /engineering research agent: discover → read → synthesize → verify → review/i,
  "vitruvius-help must state the research loop so the card explains what the agent does",
);
assert.match(
  text,
  /with auditable provenance/i,
  "vitruvius-help must state that provenance is auditable",
);

// --- The shared method is spelled out -------------------------------------
// The card is the only place a new user learns what actually happens in a run,
// so the loop's steps must be concrete rather than named.
for (const step of ["Plan", "Gather evidence", "Draft", "Cite", "Review", "Deliver"]) {
  assert.match(
    text,
    new RegExp(`\\*\\*${step}`),
    `vitruvius-help must spell out the "${step}" step of the shared method`,
  );
}
assert.match(
  text,
  /outputs\/\.plans\/<slug>\.md/,
  "vitruvius-help must name the plan artifact the method writes",
);
assert.match(
  text,
  /\.provenance\.md`? sidecar/i,
  "vitruvius-help must state every output gets a provenance sidecar",
);

// --- Non-negotiables -------------------------------------------------------
assert.match(
  text,
  /Never fabricate a source\. A reference or it didn't happen/i,
  "vitruvius-help must carry the no-fabrication non-negotiable in its plainest form",
);
assert.match(
  text,
  /Mark status honestly: `verified`, `inferred`, `blocked`, `unverified`/i,
  "vitruvius-help must name all four status values, so a reader knows the vocabulary",
);
assert.match(
  text,
  /A numeric claim without a unit, sign convention, and source is noise/i,
  "vitruvius-help must state the numeric-claim rule",
);

// --- All seven roles, with what each does ----------------------------------
// The card is where the role vocabulary is taught. A role missing here is a role
// a user cannot ask for by name.
const ROLES = {
  researcher: "gather",
  writer: "synthesize",
  verifier: "cite \+ verify",
  reviewer: "critique",
  arbiter: "adjudicates verifier disagreement",
  "goal-checker": "independent completion check",
  habit: "read-only preference extraction",
};
// The role list is a single wrapped sentence, so match whitespace-insensitively
// rather than pinning it to one line — a rewrap must not read as a missing role.
const ws = (s) =>
  new RegExp(
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .split(/\s+/)
      .join("\\s+"),
    "i",
  );

for (const [role, does] of Object.entries(ROLES)) {
  assert.match(
    text,
    ws(`\`${role}\` (${does})`),
    `vitruvius-help must list the ${role} role and say what it does (${does})`,
  );
}
assert.match(
  text,
  /Subagents when the host supports\s+them, otherwise the lead agent performs the applicable role work/i,
  "vitruvius-help must state the subagent fallback, so a missing role is not silently dropped",
);

// --- Deactivation is documented -------------------------------------------
// A card that starts a mode without saying how to stop it is a trap.
assert.match(
  text,
  /Say ["“]stop vitruvius["”] or ["“]normal mode["”]/i,
  "vitruvius-help must document how to stop an active run",
);

// --- Every user-facing command is listed -----------------------------------
// The drift check. A skill that exists but is not on the card is unreachable
// from the only document a new user reads.
const onDisk = readdirSync(SKILLS_DIR).filter((n) => existsSync(join(SKILLS_DIR, n, "SKILL.md")));

// Skills the card lists by name, and the ones it legitimately does not: the
// dispatcher itself (this card is what /vitruvius shows) and the help card.
const NOT_A_COMMAND = new Set(["vitruvius", "vitruvius-help"]);
const missing = onDisk.filter(
  (n) => !NOT_A_COMMAND.has(n) && !new RegExp(`/vitruvius:${n}\\b`).test(text),
);
assert.deepStrictEqual(
  missing,
  [],
  `these skills exist but are absent from the reference card: ${missing.join(", ")}. ` +
    `A command missing from the card is a command a new user cannot find.`,
);

// And nothing listed that does not exist — the other half of the drift check.
// The character class includes digits so `eli5` is captured whole; a [a-z-]
// class silently truncates it to "eli" and reports a phantom that is really a
// regex bug. Which is what happened the first time this ran.
const listed = [...text.matchAll(/\/vitruvius:([a-z0-9-]+)/g)].map((m) => m[1]);
const phantom = [...new Set(listed)].filter((n) => !onDisk.includes(n));
assert.deepStrictEqual(
  phantom,
  [],
  `the card lists commands that do not exist: ${phantom.join(", ")}. ` +
    `A card pointing at a missing command is worse than no card.`,
);

// --- Boundaries ------------------------------------------------------------
assert.match(
  text,
  /does NOT produce final designs, construction documents, or implementation guidance/i,
  "vitruvius-help must state it produces research, not implementation guidance",
);
assert.match(
  text,
  /research-only, not for final engineering sign-off/i,
  "vitruvius-help must carry the S7 research-only boundary",
);

console.log(
  `PASS: vitruvius-help asserts one-shot display, the spelled-out method, all seven roles, ` +
    `documented deactivation, and that the card lists all ${onDisk.length - NOT_A_COMMAND.size} ` +
    `commands that exist and no phantoms`,
);
