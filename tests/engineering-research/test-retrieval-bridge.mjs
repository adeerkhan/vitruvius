import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import { parseArgs, exactSearch, directRead, main } from "../../scripts/retrieval-bridge.mjs";

// retrieval-bridge — behavioral.
//
// The previous version of this suite read the script's SOURCE and asserted it
// contained the words "semantic recall", "exact search", and "direct read". It
// passed against a script whose steps 2 and 3 printed "completed" without doing
// anything: the words were in the file, the work was not.
//
// So this suite calls the functions. Each step is checked by what it returns,
// on a fixture tree it controls, so a query containing quotes and backticks —
// the queries most worth running — is exercised.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = join(repoRoot, "scripts", "retrieval-bridge.mjs");

// --- The three steps exist as callable behaviour, not as prose -------------
const steps = { parseArgs, exactSearch, directRead, main };
for (const [name, fn] of Object.entries(steps)) {
  assert.strictEqual(typeof fn, "function", `${name} must be an exported function, not a comment`);
}

// --- parseArgs -------------------------------------------------------------
{
  // Every bare token overwrites, so the last one is the query. Asserted
  // literally because the behaviour is load-bearing for the single-token
  // callers: a "fix" that joins the tokens would change their query.
  const a = parseArgs(["find", "the", "thing", "--max-results", "7"]);
  assert.strictEqual(a.query, "thing", "parseArgs must leave the last bare token as the query");
  assert.strictEqual(
    parseArgs(["only-one-token"]).query,
    "only-one-token",
    "a single-token query must pass through unchanged",
  );
  assert.strictEqual(a.maxResults, 7, "--max-results must be parsed");
  assert.strictEqual(
    parseArgs(["x", "--max-results", "0"]).maxResults,
    5,
    "a nonsensical --max-results must fall back to the default, not to 0 (which would return nothing and look like a miss)",
  );
  assert.strictEqual(
    parseArgs(["x", "--max-results", "abc"]).maxResults,
    5,
    "a non-numeric --max-results must fall back to the default",
  );
  assert.strictEqual(
    parseArgs(["x", "--project-path", "sub/dir"]).projectPath,
    join(repoRoot, "sub", "dir"),
    "--project-path must resolve against the repo root, not stay relative",
  );
}

// --- Step 2: exact search actually searches --------------------------------
// A fixture tree, so the result does not depend on what this repo happens to
// contain today.
const tmp = mkdtempSync(join(tmpdir(), "retrieval-bridge-"));
const fixture = join(tmp, "proj");
mkdirSync(join(fixture, "src"), { recursive: true });
mkdirSync(join(fixture, "node_modules", "junk"), { recursive: true });
mkdirSync(join(fixture, ".git"), { recursive: true });
writeFileSync(join(fixture, "src", "alpha.mjs"), "const NEEDLE_TOKEN = 1;\n// second line\n");
writeFileSync(join(fixture, "src", "beta.mjs"), "const other = 2;\nconst NEEDLE_TOKEN_TOO = 3;\n");
writeFileSync(join(fixture, "node_modules", "junk", "evil.mjs"), "const NEEDLE_TOKEN = 'must not appear';\n");
writeFileSync(join(fixture, ".git", "config"), "NEEDLE_TOKEN\n");

try {
  // Case-insensitive, so a query typed in any case still finds the identifier.
  const hits = exactSearch("needle_token", fixture, 10);
  assert.ok(hits.length > 0, "exactSearch must find a literal match in a fixture tree");
  const files = hits.map((h) => h.file);
  assert.ok(
    files.includes("src/alpha.mjs"),
    `exactSearch must find src/alpha.mjs; got ${JSON.stringify(files)}`,
  );
  assert.ok(
    hits.every((h) => h.line >= 1),
    "every hit must carry a line number, or it cannot be cited",
  );
  assert.ok(
    hits.every((h) => h.text.length > 0),
    "every hit must carry the matching text, not just a location",
  );

  // Exclusions matter: a search that returns node_modules and .git hits looks
  // like it works while returning noise instead of source.
  assert.ok(
    !files.some((f) => f.includes("node_modules")),
    "exactSearch must exclude node_modules; a hit there is noise, not a lead",
  );
  assert.ok(
    !files.some((f) => f.includes(".git")),
    "exactSearch must exclude .git",
  );

  // maxResults is a real cap, not decoration.
  const capped = exactSearch("needle_token", fixture, 1);
  assert.strictEqual(capped.length, 1, "maxResults must actually cap the result count");

  // A rare identifier that semantic recall ranks low is the whole reason step 2
  // exists, so a miss is a failure, not an empty result.
  assert.strictEqual(
    exactSearch("ZZZ_no_such_token_ZZZ", fixture, 10).length,
    0,
    "a query with no match must return nothing rather than inventing hits",
  );
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// --- Step 3: direct read actually reads -----------------------------------
{
  const content = directRead("scripts/margin-earnedness-check.mjs", repoRoot, 200);
  assert.ok(content, "directRead must return the file's contents");
  assert.match(content, /margin-earnedness/, "directRead must return the real content, not a placeholder");
  assert.strictEqual(
    directRead("scripts/definitely-not-here.mjs", repoRoot),
    null,
    "directRead must return null for a missing file rather than throwing or inventing content",
  );
  // A search hit is a lead; reading it is the citation. Truncation is fine and
  // expected — reading a whole repo into a prompt is not.
  assert.ok(content.length <= 200, "directRead must honour its limit");
}

// --- The CLI refuses to run without a query -------------------------------
{
  const r = spawnSync("node", [script], { encoding: "utf8" });
  assert.strictEqual(r.status, 1, "the CLI must exit non-zero with no query, not run a search for undefined");
  assert.match(
    `${r.stdout}${r.stderr}`,
    /Usage:/,
    "the CLI must print usage when given no query",
  );
}

// --- A query containing shell metacharacters is data, not code ------------
// The previous implementation interpolated the query into a double-quoted
// shell string, so a query with a quote or a backtick was a shell fragment.
// This asserts the argument reaches the step-1 call intact.
{
  const nasty = 'a"b`c$(echo pwned)d';
  const a = parseArgs([nasty]);
  assert.strictEqual(a.query, nasty, "a query with shell metacharacters must survive parseArgs unchanged");
  const source = readFileSync(script, "utf8");
  assert.doesNotMatch(
    source,
    /execSync\(\s*`codegraph explore/,
    "the bridge must not build a shell command by string interpolation; use execFileSync with an argv array",
  );
  assert.match(
    source,
    /execFileSync\(\s*"codegraph",\s*\[/,
    "the bridge must invoke codegraph with an argv array so a query cannot become a shell fragment",
  );
}

console.log(
  "PASS: retrieval-bridge's three steps are callable behaviour, not prose; exact search " +
    "excludes node_modules/.git, honours maxResults, and a metacharacter query stays data",
);
