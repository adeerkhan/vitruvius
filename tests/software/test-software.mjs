import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// software — behavioral.
//
// Shape checks live in tests/all-skills. This suite covers the decisions that
// make a *software* dispatcher worth having, written to fail if the file could
// be pasted into another discipline unchanged.
//
// The characteristic failure: describing a library's behaviour from its README
// rather than its source, quoting a benchmark number with no harness, or citing a
// security claim with no CVE. The "a repo exists ≠ a feature exists" rule is the
// software-specific one, and it is the reason this discipline needs its own
// payload at all.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const text = readFileSync(join(repoRoot, "skills", "software", "SKILL.md"), "utf8");

const ws = (s) =>
  new RegExp(
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .split(/\s+/)
      .join("\\s+"),
    "i",
  );

// --- The dispatch decision -------------------------------------------------
assert.match(
  text,
  ws("Activate the `/skill:engineering-research` method"),
  "software must activate the shared engineering-research method",
);
assert.match(
  text,
  ws("Do not restate the research loop here"),
  "software must forbid restating the research loop",
);

// --- The evidence landscape is software-specific ---------------------------
assert.match(text, /IETF RFCs/, "software must name IETF RFCs as governing documents");
assert.match(text, /W3C/, "software must name W3C");
assert.match(text, /NIST/, "software must name NIST for security standards");
assert.match(
  text,
  /read the actual code before describing\s+it|read the actual code before describing it/i,
  "software must require reading the actual code before describing it",
);
assert.match(
  text,
  /Architectural decision records|architectural decision records/i,
  "software must carry ADRs as a source",
);
assert.match(
  text,
  /Deprioritize undated posts, listicles, and social media/i,
  "software must deprioritize undated posts and listicles; the source-quality ranking is the payload",
);
assert.match(
  text,
  /Accept with caveats/i,
  "software must state which tier trade press and secondary summaries occupy",
);
assert.match(
  text,
  /scholarly-research`?\s+discovery layers/i,
  "software must route papers and academic prior art through scholarly-research",
);

// --- The defining rule: existence is not behaviour -------------------------
assert.match(
  text,
  /read the code or the official doc before describing\s+behavior/i,
  "software must require reading the code or official docs before describing behaviour",
);
assert.match(
  text,
  /A repo exists ≠ a feature exists/i,
  "software must state that a repo existing does not mean the feature exists",
);
assert.match(
  text,
  /verify in the source/i,
  "software must require verification in the source",
);

// --- Version specificity ---------------------------------------------------
// An unversioned API claim is the software equivalent of an untraced material
// grade: correct at some unknown point, unusable for a decision.
assert.match(
  text,
  /claims must name the version, commit, or release\s+they were checked against/i,
  "software must require claims to name the version, commit, or release they were checked against",
);
assert.match(
  text,
  /Unversioned claims are `inferred`/i,
  "software must mark unversioned claims as inferred",
);

// --- Benchmarks must be reproducible ---------------------------------------
assert.match(
  text,
  /harness,\s+hardware, dataset, date/i,
  "software must require a benchmark number to trace to harness, hardware, dataset, and date",
);
assert.match(
  text,
  /["“]Verified faster["”] is not a claim/i,
  "software must reject 'verified faster' as a claim",
);

// --- Security claims need an identifier ------------------------------------
assert.match(
  text,
  /name the exact CVE, advisory, or\s+standard \(CWE, OWASP\) and the version range/i,
  "software must require a security claim to name the CVE/advisory/standard and its version range",
);

// --- Paper-vs-code audits --------------------------------------------------
assert.match(
  text,
  /compare claimed methods, defaults, metrics, and\s+data handling against the actual code/i,
  "software must compare claimed methods, defaults, and metrics against the actual code",
);
assert.match(
  text,
  /missing code, mismatches,\s+ambiguous defaults, and reproduction risks/i,
  "software must name the mismatch taxonomy a paper-vs-code audit reports",
);

// --- Deliverable shape -----------------------------------------------------
assert.match(
  text,
  /\*\*Sources\*\* section of URLs/i,
  "software must end with a Sources section of URLs",
);
assert.match(
  text,
  /annotated with\s+what was checked/i,
  "software must require each source to be annotated with what was actually checked",
);
assert.match(
  text,
  /mark every claim `verified`, `inferred`, or `blocked`|`verified`,\s*`inferred`,\s*or `blocked`/i,
  "software must mark every claim verified/inferred/blocked",
);

// --- Gap detection: offered, never auto-invoked ---------------------------
assert.match(
  text,
  ws("suggest running `/gap-analysis software <sub-topic>`"),
  "software must name its own gap-analysis sub-topic when escalating",
);
assert.match(
  text,
  /Do not invoke gap-analysis automatically/i,
  "software must not invoke gap-analysis automatically",
);

// --- Boundaries ------------------------------------------------------------
// Note the wording: software says "final designs or implementation guidance",
// where the four built-environment dispatchers say "final designs or
// construction documents". That difference is the point — a software payload
// must not inherit a boundary phrased for concrete.
assert.match(
  text,
  ws("does NOT produce final designs or implementation guidance"),
  "software must state it produces research, not implementation guidance",
);
assert.match(
  text,
  /research-only, not for final engineering sign-off/i,
  "software must carry the S7 research-only boundary",
);

console.log(
  "PASS: software asserts the shared-method dispatch, existence-is-not-behaviour, " +
    "version and benchmark reproducibility, CVE-level security claims, and the S7 boundary",
);
