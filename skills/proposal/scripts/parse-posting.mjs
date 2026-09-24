/**
 * Parse a local position posting into a raw intake artifact.
 * Structured fields are intentionally left for the isolated research step.
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
  if (!source) throw new Error('posting path or URL is required');
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
    professor: null,
    university: null,
    department: null,
    lab: null,
    position: null,
    research: { areas: [], keywords: [], description: null },
    requirements: { required: [], preferred: [] },
    contact: { email: null, url: null },
    deadline: null,
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
  writeJson(join(project, 'posting.json'), output);
  rmSync(join(project, 'posting.json.blocked'), { force: true });
  writeText(join(project, 'posting-raw.txt'), extraction.text);
  recordPhaseProvenance(project, source, extraction, 'parsed');
  updateRunManifest(project, { status: 'ready', posting_sha256: output.raw_sha256, posting_structured_sha256: null });
  console.log(`Posting raw intake saved: ${join(project, 'posting.json')}`);
} catch (error) {
  if (project) {
    invalidateDownstream(project);
    const blocked = {
      status: 'blocked',
      source: source || null,
      error: error.message,
    };
    writeBlockedArtifact(project, 'posting.json', blocked);
    markRunBlocked(project, error);
    recordPhaseProvenance(project, source, null, 'blocked', error.message);
  }
  console.error(`BLOCKED: ${error.message}`);
  process.exitCode = 1;
}
