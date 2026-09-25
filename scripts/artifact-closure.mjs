#!/usr/bin/env node
/**
 * Recursive final/provenance closure contract.
 *
 * This validator is intentionally opt-in for the mutable local outputs tree.
 * Normal CI uses temporary fixtures through tests/artifacts/. Method-specific
 * working, judge, and manifest-bound artifact families are excluded here and
 * remain owned by their dedicated validators.
 */

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, lstatSync, realpathSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EXCLUDED_PREFIXES = [".plans/", ".drafts/", ".archive/", ".habits/", ".q1-example/", ".ref-audits/", "verifier/", "audit/"];

function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]));
  } catch {
    return false;
  }
}

function isExcludedDirectory(relativePath) {
  const first = relativePath.split("/")[0];
  return EXCLUDED_PREFIXES.some((prefix) => {
    const excluded = prefix.slice(0, -1);
    return process.platform === "win32" ? first.toLowerCase() === excluded.toLowerCase() : first === excluded;
  });
}

function normalize(value) {
  return value.replaceAll("\\", "/");
}

function display(root, path) {
  return normalize(relative(root, path));
}

function readFields(text, label) {
  const values = [];
  for (const line of text.split(/\r?\n/)) {
    let cleaned = line.trim().replace(/^[-*]\s*/, "");
    if (cleaned.startsWith("**")) cleaned = cleaned.slice(2);
    const colon = cleaned.indexOf(":");
    if (colon < 0) continue;
    const key = cleaned.slice(0, colon).replace(/\*\*$/, "").trim();
    if (key.toLowerCase() !== label.toLowerCase()) continue;
    values.push(cleaned.slice(colon + 1).trim().replace(/^\*\*|\*\*$/g, "").trim().replace(/^`|`$/g, "").trim());
  }
  return values;
}

function collect(root, current, files, errors) {
  let entries;
  try {
    entries = readdirSync(current, { withFileTypes: true });
  } catch (error) {
    errors.push(`${display(root, current)} could not be read: ${error.message}`);
    return;
  }
  for (const entry of entries) {
    const path = join(current, entry.name);
    const pathFromRoot = normalize(relative(root, path));
    if (entry.isSymbolicLink()) {
      errors.push(`${pathFromRoot}: symbolic links are not allowed in artifact closure`);
      continue;
    }
    if (entry.isDirectory()) {
      if (isExcludedDirectory(pathFromRoot)) continue;
      collect(root, path, files, errors);
    } else if (entry.isFile()) {
      files.push({ path, relative: pathFromRoot });
    }
  }
}

export function validateArtifactClosure(rootDirectory) {
  const root = resolve(rootDirectory);
  const errors = [];
  const files = [];
  try {
    if (!lstatSync(root).isDirectory()) throw new Error("artifact root is not a directory");
  } catch (error) {
    return { valid: false, errors: [`artifact root could not be read: ${error.message}`], finalCount: 0, sidecarCount: 0 };
  }
  collect(root, root, files, errors);

  const finals = new Map(files.filter((file) => file.relative.endsWith(".md") && !file.relative.endsWith(".provenance.md")).map((file) => [file.relative, file]));
  const sidecars = files.filter((file) => file.relative.endsWith(".provenance.md"));
  const sidecarByFinal = new Map(sidecars.map((file) => [file.relative.replace(/\.provenance\.md$/i, ".md"), file]));

  for (const [finalRelative, final] of finals) {
    const sidecar = sidecarByFinal.get(finalRelative);
    if (!sidecar) {
      errors.push(`${finalRelative}: missing provenance sidecar ${finalRelative.replace(/\.md$/i, ".provenance.md")}`);
      continue;
    }
    const text = readFileSync(sidecar.path, "utf8");
    const declaredNames = readFields(text, "Final artifact");
    const declaredHashes = readFields(text, "Final SHA-256");
    const declaredByteCounts = readFields(text, "Final bytes");
    const declaredName = declaredNames[0];
    const declaredHash = declaredHashes[0];
    const declaredBytes = declaredByteCounts[0];
    if (declaredNames.length !== 1) errors.push(`${sidecar.relative}: expected exactly one Final artifact field`);
    else if (declaredName.includes("/") || declaredName.includes("\\") || declaredName.includes(":") || declaredName === "." || declaredName === "..") errors.push(`${sidecar.relative}: Final artifact must be a basename`);
    else if (declaredName !== finalRelative.split("/").at(-1)) errors.push(`${sidecar.relative}: Final artifact does not match adjacent final ${finalRelative}`);
    if (declaredHashes.length !== 1 || !/^[0-9a-f]{64}$/.test(declaredHash)) errors.push(`${sidecar.relative}: expected exactly one valid Final SHA-256 field`);
    if (declaredByteCounts.length !== 1 || !/^\d+$/.test(declaredBytes) || Number(declaredBytes) < 1) errors.push(`${sidecar.relative}: expected exactly one positive Final bytes field`);
    const bytes = readFileSync(final.path);
    const actualHash = createHash("sha256").update(bytes).digest("hex");
    if (declaredHash === actualHash) {
      // binding is current
    } else {
      errors.push(`${finalRelative}: final hash mismatch declared by ${sidecar.relative}`);
    }
    if (declaredBytes && Number(declaredBytes) === bytes.length) {
      // binding is current
    } else {
      errors.push(`${finalRelative}: final byte count mismatch declared by ${sidecar.relative}`);
    }
  }

  for (const sidecar of sidecars) {
    const finalRelative = sidecar.relative.replace(/\.provenance\.md$/i, ".md");
    if (!finals.has(finalRelative)) errors.push(`orphan provenance sidecar: ${sidecar.relative}`);
  }

  return { valid: errors.length === 0, errors, finalCount: finals.size, sidecarCount: sidecars.length };
}

if (isMainModule()) {
  const directory = process.argv[2];
  if (!directory) {
    console.error("Usage: node scripts/artifact-closure.mjs <artifacts-directory>");
    process.exit(1);
  }
  const result = validateArtifactClosure(directory);
  if (!result.valid) {
    console.error(result.errors.map((error) => `- ${error}`).join("\n"));
    process.exit(1);
  }
  console.log(`PASS: ${result.finalCount} final artifact(s) have current adjacent provenance sidecars`);
}
