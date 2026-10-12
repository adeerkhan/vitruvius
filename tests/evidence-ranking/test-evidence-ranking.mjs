/**
 * Behavioral test for evidence-ranking skill.
 *
 * Validates the scoring contract on the skill itself, then the output shape when
 * a ranking has been produced. The skill assertions run first and unconditionally:
 * the output half reads `outputs/`, which is gitignored, so on a fresh clone it
 * always found nothing and skipped — a suite that can only pass by finding
 * nothing. Everything the skill must carry is asserted before that point.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { check } from "../_contract/contract.mjs";
import { ws } from "../_support/ws.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

let passed = 0;
let failed = 0;

console.log("\n[Test] evidence-ranking — behavioral");

const skillText = readFileSync(join(REPO_ROOT, "skills", "evidence-ranking", "SKILL.md"), "utf8");

// --- Tier ranks the source; appraisal ranks the belief ----------------------
// The failure this guards is a table where one number silently becomes both:
// authority summed into certainty, which makes a code provision look like a
// well-supported finding and a weak study look authoritative.
check(
  skillText.includes("`references/evidence-appraisal-frameworks.md`"),
  "cites the appraisal frameworks reference",
);
check(
  existsSync(join(REPO_ROOT, "skills", "evidence-ranking", "references", "evidence-appraisal-frameworks.md")),
  "the appraisal frameworks reference exists on disk",
);
check(
  ws("The tier ranks the source, not the finding").test(skillText),
  "states the tier ranks the source, not the finding",
);
check(
  skillText.includes("never summed into one number"),
  "forbids summing tier and appraisal into one number",
);

// --- GRADE certainty, and the double-counting trap --------------------------
for (const beat of ["GRADE", "certainty", "risk of bias"]) {
  check(new RegExp(beat, "i").test(skillText), `declares the ${beat} dimension`);
}
check(
  /double-counts|double counting|double-counting/.test(skillText),
  "names the double-counting trap",
);
check(
  /n\/a/.test(skillText),
  "records n/a where a framework does not apply",
);
check(
  /with the reason|with a stated reason/.test(skillText),
  "requires the reason to be stated, not a blank cell",
);

// --- The output shape carries both judgements ------------------------------
check(
  skillText.includes("| # | Source | Year | Venue | Tier | Score | Certainty | Bias | Applicability | Key Claim | Status |"),
  "the ranking table carries certainty, bias, and applicability columns",
);
check(/\*\*Appraisal present\*\*/.test(skillText), "the quality gate checks the appraisal is present");
check(/\*\*No summing\*\*/.test(skillText), "the quality gate checks that nothing is summed");
check(/Each item carries a certainty and a bias judgement/.test(skillText), "the increment checklist checks both judgements");

// --- The reference itself must state where the frameworks stop -------------
const appraisal = readFileSync(
  join(REPO_ROOT, "skills", "evidence-ranking", "references", "evidence-appraisal-frameworks.md"),
  "utf8",
);
check(
  appraisal.includes("## Where these do not apply in engineering"),
  "the reference has a section stating where the frameworks do not apply",
);
check(
  /body of evidence/i.test(appraisal),
  "the reference states GRADE rates a body of evidence, not one paper",
);
check(
  /No randomization/.test(appraisal),
  "the reference states engineering evidence usually has no randomization",
);
check(
  /RoB 2/.test(appraisal) && /ROBINS-I/.test(appraisal) && /QUADAS-3/.test(appraisal),
  "the reference names the result-specific bias tools with their versions",
);
for (const domain of ["Risk of bias", "Inconsistency", "Indirectness", "Imprecision", "Missing-evidence bias"]) {
  check(appraisal.includes(domain), `lists the GRADE downgrade domain ${domain}`);
}
check(
  /Engineering analogue/.test(appraisal),
  "maps each domain to an engineering analogue rather than forcing the framework",
);

// --- Boundaries ------------------------------------------------------------
check(/research-only, not for final engineering sign-off/i.test(skillText), "has S7 boundary statement");
check(/Never fabricate scores/.test(skillText), "forbids fabricating scores");
check(/unverified/.test(skillText), "requires an unassessable source to be marked unverified");

// --- Output shape, when an output exists -----------------------------------
let latestFile = null;
let latestSize = 0;
try {
  const files = readdirSync(join(REPO_ROOT, "outputs", "evidence-ranking")).filter((f) => f.endsWith(".md"));
  for (const f of files) {
    const path = join(REPO_ROOT, "outputs", "evidence-ranking", f);
    const content = readFileSync(path, "utf-8");
    if (content.length > latestSize) {
      latestSize = content.length;
      latestFile = path;
    }
  }
} catch {
  // no outputs yet
}

if (!latestFile) {
  console.log("  SKIP: no outputs/evidence-ranking output to check (the skill assertions above still ran)");
} else {
  const text = readFileSync(latestFile, "utf-8");
  console.log(`\n  Testing: ${latestFile.split("/").pop()}`);

  check(text.includes("# Evidence Ranking:"), "has title with topic");
  check(text.includes("## Question"), "has question section");
  check(text.includes("## Evidence Items"), "has evidence items table");
  check(text.includes("## Tier Distribution"), "has tier distribution");
  check(text.includes("## Scoring Rationale"), "has scoring rationale");
  check(text.includes("## Conflicts"), "has conflicts section");
  check(text.includes("## Evidence Strength"), "has evidence strength assessment");
  check(text.includes("Tier 1"), "assigns Tier 1 (authoritative)");
  check(text.includes("Tier 2"), "assigns Tier 2 (reliable)");
  check(text.includes("Tier 3") || text.includes("Tier 4"), "assigns Tier 3-4 (supporting/weak)");
  check(
    !text.includes("best source") && !text.includes("recommended source"),
    "does not select a 'best' source",
  );
  check(
    text.includes("human") && text.includes("judgment"),
    "defers to human judgment",
  );
  check(text.includes("Conflict"), "identifies conflicts");
  check(text.includes("Resolution") || text.includes("resolution"), "attempts conflict resolution");
}

console.log("\nAll evidence-ranking checks passed (the output section above only applies once outputs/evidence-ranking holds a ranking).");
