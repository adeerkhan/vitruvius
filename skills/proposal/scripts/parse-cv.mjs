/**
 * Parse a local CV into a raw intake artifact.
 * Field extraction and validation remain an isolated step; no identity fields
 * are guessed from the document.
 */
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  assertSlug,
  projectDir,
  invalidateDownstream,
  markRunBlocked,
  recordPhaseProvenance,
  runExtractor,
  sha256,
  updateRunManifest,
  writeBlockedArtifact,
  writeJson,
  writeText,
} from './project-utils.mjs';

const slug = process.argv[2];
const source = process.argv[3];
let project;

try {
  assertSlug(slug);
  project = projectDir(slug);
  if (!source) throw new Error('CV path is required');
  if (!existsSync(project)) throw new Error(`project not found: ${project}`);

  const extraction = await runExtractor(source);
  invalidateDownstream(project);
  const output = {
    status: 'parsed',
    structured: false,
    source,
    resolved_source: extraction.source,
    method: extraction.method,
    pages: extraction.pages,
    name: null,
    targetLab: null,
    researchInterests: [],
    raw_text: extraction.text,
    raw_bytes: Buffer.byteLength(extraction.text, 'utf-8'),
    raw_sha256: sha256(extraction.text),
    source_bytes: extraction.source_bytes,
    source_sha256: extraction.source_sha256,
    structured_sha256: null,
    verification: {
      status: 'unverified',
      provenance: 'phase-0-provenance.md',
    },
    warnings: extraction.warnings || [],
  };
  writeJson(join(project, 'profile.json'), output);
  rmSync(join(project, 'profile.json.blocked'), { force: true });
  writeText(join(project, 'cv-raw.txt'), extraction.text);
  recordPhaseProvenance(project, source, extraction, 'parsed');
  updateRunManifest(project, { status: 'ready', profile_sha256: output.raw_sha256, profile_structured_sha256: null });
  console.log(`CV raw intake saved: ${join(project, 'profile.json')}`);
} catch (error) {
  if (project) {
    invalidateDownstream(project);
    const blocked = {
      status: 'blocked',
      source: source || null,
      error: error.message,
    };
    writeBlockedArtifact(project, 'profile.json', blocked);
    markRunBlocked(project, error);
    recordPhaseProvenance(project, source, null, 'blocked', error.message);
  }
  console.error(`BLOCKED: ${error.message}`);
  process.exitCode = 1;
}
