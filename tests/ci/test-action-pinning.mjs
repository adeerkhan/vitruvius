import { strict as assert } from "node:assert";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Every GitHub Actions `uses:` must be pinned to a full 40-hex commit SHA,
// not a mutable version tag. A `@v4` reference is a moving target: the tag
// can be repointed (or its target replaced), so a workflow that reads as
// "checkout v4" today is not provably the code that ran yesterday. The
// comment after the SHA keeps the human-readable version; the SHA is what
// executes. Method reference: ref/humanizer's "pin CI actions to reviewed
// versions" lesson; SHAs for the current pins were resolved with
// `git ls-remote` against each action's repository on 2026-10-25.
//
// Teeth are inline: the same predicate is asserted against a pinned and an
// unpinned fixture in this file, so a regression in the predicate itself
// fails here rather than silently passing the real workflows.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const workflowDir = join(repoRoot, ".github", "workflows");

const USES_LINE = /^[ \t]*(?:-\s+)?uses:\s*(\S+)(\s+#.*)?$/;

export function pinningErrors(text, label) {
  const errors = [];
  for (const [index, line] of text.split("\n").entries()) {
    const match = USES_LINE.exec(line);
    if (!match) continue;
    const ref = match[1];
    // A Docker action (docker://...) or a local action (./path) carries no
    // third-party supply-chain risk; only remote action refs must be pinned.
    if (ref.startsWith("docker://") || ref.startsWith("./")) continue;
    const [action, version] = ref.split("@");
    if (!action || !version) {
      errors.push(`${label}:${index + 1} uses "${ref}" has no version part`);
      continue;
    }
    if (!/^[0-9a-f]{40}$/.test(version)) {
      errors.push(`${label}:${index + 1} ${action} is not SHA-pinned (found "${version}")`);
    }
  }
  return errors;
}

const realFiles = readdirSync(workflowDir).filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"));
assert.ok(realFiles.length > 0, "no workflow files found under .github/workflows");
const realErrors = realFiles.flatMap((name) => pinningErrors(readFileSync(join(workflowDir, name), "utf8"), `.github/workflows/${name}`));
assert.deepEqual(realErrors, [], `unpinned action references:\n${realErrors.join("\n")}`);

const pinned = pinningErrors("steps:\n  - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4\n  - uses: docker://alpine:3\n  - uses: ./.github/actions/local\n", "fixture");
assert.deepEqual(pinned, [], `SHA-pinned, docker, and local refs must all pass: ${pinned}`);
const unpinned = pinningErrors("steps:\n  - uses: actions/checkout@v4\n  - uses: actions/setup-node@main\n", "fixture");
assert.equal(unpinned.length, 2, "mutable tag and branch refs must both fail");
assert.match(unpinned[0], /actions\/checkout is not SHA-pinned \(found "v4"\)/);
assert.match(unpinned[1], /actions\/setup-node is not SHA-pinned \(found "main"\)/);
const malformed = pinningErrors("steps:\n  - uses: actions/checkout\n", "fixture");
assert.equal(malformed.length, 1, "a uses line without @ must fail");
assert.match(malformed[0], /has no version part/);

console.log("PASS: every workflow action is SHA-pinned, and the pin predicate fails on tags, branches, and bare action refs");
