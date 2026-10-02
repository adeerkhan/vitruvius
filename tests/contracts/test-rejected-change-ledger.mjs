import { strict as assert } from "node:assert";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateLedger } from "../../scripts/rejected-change-ledger.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = join(root, "scripts", "rejected-change-ledger.mjs");
const ledgerPath = join(root, "notes", "rejected-changes.md");
const temp = mkdtempSync(join(tmpdir(), "vitruvius-rejected-"));

const run = (args) => spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8" });
const base = readFileSync(ledgerPath, "utf8");

try {
  // The real ledger is well-formed and the CLI agrees.
  assert.deepEqual(validateLedger(base), []);
  const real = run(["validate"]);
  assert.equal(real.status, 0, real.stderr);
  assert.match(real.stdout, /PASS/);

  // Append adds one row and preserves every prior byte.
  //
  // The date is derived from the ledger's own last row rather than hardcoded.
  // A literal here silently became older than the newest real rejection, and
  // the append-only guard refused it — so the test failed on a date it had
  // written itself, three rejections after anyone looked at it.
  const lastRowDate = [...base.matchAll(/^\|\s*(\d{4}-\d{2}-\d{2})\s*\|/gm)].at(-1)?.[1];
  assert.ok(lastRowDate, "the ledger must contain at least one dated row to append after");
  const appendDate = new Date(`${lastRowDate}T00:00:00Z`);
  appendDate.setUTCDate(appendDate.getUTCDate() + 1);
  const stamp = appendDate.toISOString().slice(0, 10);

  const copy = join(temp, "rejected-changes.md");
  writeFileSync(copy, base);
  const appended = run([
    "append", "--path", copy,
    "--date", stamp,
    "--artifact", "verifier",
    "--change", "raise the false-approval floor",
    "--evidence", "benchmark run 2: 1 false approval, 0 false blocks",
    "--outcome", "rejected - weakens the safety gate for one noisy result",
  ]);
  assert.equal(appended.status, 0, appended.stderr);
  const after = readFileSync(copy, "utf8");
  assert.ok(after.startsWith(base), "append preserves the existing prefix");
  assert.match(after, new RegExp(`\\| ${stamp} \\| verifier \\|`));
  assert.deepEqual(validateLedger(after), []);

  // An out-of-order append is refused and leaves the file untouched.
  const outOfOrder = run([
    "append", "--path", copy,
    "--date", "2000-01-01", "--artifact", "x", "--change", "y", "--evidence", "z", "--outcome", "w",
  ]);
  assert.notEqual(outOfOrder.status, 0);
  assert.match(outOfOrder.stderr, /append-only|earlier than/);
  assert.equal(readFileSync(copy, "utf8"), after);

  // Malformed ledgers fail validation.
  //
  // Fixture dates are relative to the real ledger's newest row, for the same
  // reason as above: a literal 2026-09-26 fixture became an out-of-order row the
  // moment a newer rejection landed, and this line then asserted a VALID ledger
  // was invalid — failing on the fixture rather than on the behaviour.
  const row = `| ${stamp} | verifier | change | evidence | rejected |\n`;
  assert.deepEqual(validateLedger(base + row), []);
  assert.match(validateLedger(base + `| ${stamp} | verifier | change |\n`).join("\n"), /expected 5 columns/);
  assert.match(validateLedger(base + `| ${stamp} | verifier |  | evidence | rejected |\n`).join("\n"), /column `Attempted change` is empty/);
  // Deliberately older than the newest real row, to exercise the ordering rule.
  assert.match(validateLedger(base + `| ${stamp} | x | y | z | w |\n| 2000-01-01 | a | b | c | d |\n`).join("\n"), /append-only/);
  assert.match(validateLedger(base + "| 2026-13-40 | x | y | z | w |\n").join("\n"), /not a real date/);
  assert.match(validateLedger("# no table here\n").join("\n"), /missing header row/);

  console.log("PASS: rejected-change ledger is append-only and refuses malformed or out-of-order rows");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
