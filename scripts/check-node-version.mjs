/**
 * check-node-version.mjs — fail when the running Node is outside the range
 * declared in package.json `engines.node`.
 *
 * Transfer from ref/feynman/scripts/check-node-version.mjs. The Node 24
 * pdf-parse `Buffer` failure showed that an undeclared runtime floor is a real
 * trap here. Dependency-free: supports a leading `>=X[.Y[.Z]]` range, which is
 * all this package declares.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const range = pkg.engines?.node;
if (typeof range !== "string" || range.trim() === "") {
  console.error("FAIL: package.json has no engines.node range");
  process.exit(1);
}

const match = range.match(/^>=\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?$/);
if (!match) {
  console.error(`FAIL: unsupported engines.node range (expected >=X[.Y[.Z]]): ${range}`);
  process.exit(1);
}

const required = [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
const running = process.versions.node.split(".").map(Number);
const within =
  running[0] > required[0] ||
  (running[0] === required[0] &&
    (running[1] > required[1] ||
      (running[1] === required[1] && running[2] >= required[2])));

if (!within) {
  console.error(
    `FAIL: Node ${process.versions.node} is below engines.node ${range}; upgrade Node or lower the declared floor`,
  );
  process.exit(1);
}

console.log(`PASS: Node ${process.versions.node} satisfies engines.node ${range}`);
