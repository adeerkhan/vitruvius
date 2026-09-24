/**
 * Register verified structured intake fields and start a new downstream lineage.
 * Usage: node skills/proposal/scripts/register-structured.mjs <student-slug>
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  assertSlug,
  invalidateDownstream,
  markRunBlocked,
  projectDir,
  readRunManifest,
  sha256,
  structuredDigest,
  updateRunManifest,
  writeJson,
} from './project-utils.mjs';

const slug = process.argv[2];
let project;

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function requireRawSidecar(project, filename, value, label) {
  const path = join(project, filename);
  if (!existsSync(path)) throw new Error(`${label} raw sidecar is missing`);
  const text = readFileSync(path, 'utf-8');
  if (text !== value.raw_text || Buffer.byteLength(text, 'utf-8') !== value.raw_bytes || sha256(text) !== value.raw_sha256) {
    throw new Error(`${label} raw sidecar does not match raw_text`);
  }
}

function requireLedgerBinding(project, value, label) {
  const path = join(project, 'phase-0-provenance.md');
  const text = readFileSync(path, 'utf-8');
  const method = value.method.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`status=parsed;\\s*method=${method};[^\\n]*source_bytes=${value.source_bytes};[^\\n]*source_sha256=${value.source_sha256};[^\\n]*raw_bytes=${value.raw_bytes};[^\\n]*raw_sha256=${value.raw_sha256}`);
  if (!pattern.test(text)) throw new Error(`${label} is not bound to a parsed phase-0 ledger entry`);
}

function validate(value, label) {
  if (value.status !== 'parsed' || value.structured !== true) throw new Error(`${label} is not parsed and structured`);
  if (!['text', 'pdf-parse'].includes(value.method)) throw new Error(`${label} extraction method is not deterministic`);
  if (typeof value.raw_text !== 'string' || value.raw_text.trim() === '') throw new Error(`${label} has no readable text`);
  if (value.raw_bytes !== Buffer.byteLength(value.raw_text, 'utf-8') || value.raw_sha256 !== sha256(value.raw_text)) {
    throw new Error(`${label} raw digest does not match raw_text`);
  }
  if (value.verification?.status !== 'verified' || value.verification.provenance !== 'phase-0-provenance.md') {
    throw new Error(`${label} is not verified against phase-0 provenance`);
  }
  if (value.verification.raw_sha256 !== value.raw_sha256 || value.verification.source_sha256 !== value.source_sha256) {
    throw new Error(`${label} verification digests do not match intake digests`);
  }
  if (typeof value.resolved_source !== 'string' || value.resolved_source.trim() === '') throw new Error(`${label} has no resolved source path`);
  if (!/^[a-f0-9]{64}$/.test(value.source_sha256 || '') || !Number.isInteger(value.source_bytes)) {
    throw new Error(`${label} has no source digest and byte count`);
  }
  if (existsSync(value.resolved_source)) {
    const source = readFileSync(value.resolved_source);
    if (source.length !== value.source_bytes || sha256(source) !== value.source_sha256) throw new Error(`${label} source changed since intake`);
  }
}

try {
  assertSlug(slug);
  project = projectDir(slug);
  if (!existsSync(project)) throw new Error(`project not found: ${project}`);
  const manifest = readRunManifest(project);
  const blockedSidecar = ['profile.json.blocked', 'posting.json.blocked', 'voice-sample.txt.blocked']
    .some((name) => existsSync(join(project, name)));
  if (blockedSidecar) throw new Error('a blocked intake sidecar remains; resolve it before registration');

  const profilePath = join(project, 'profile.json');
  const profile = readJson(profilePath);
  validate(profile, 'profile.json');
  requireRawSidecar(project, 'cv-raw.txt', profile, 'profile.json');
  requireLedgerBinding(project, profile, 'profile.json');
  let posting = null;
  const postingPath = join(project, 'posting.json');
  if (existsSync(postingPath)) {
    posting = readJson(postingPath);
    validate(posting, 'posting.json');
    requireRawSidecar(project, 'posting-raw.txt', posting, 'posting.json');
    requireLedgerBinding(project, posting, 'posting.json');
  }

  const profileDigest = structuredDigest(profile);
  const postingDigest = posting ? structuredDigest(posting) : null;
  if (manifest.profile_structured_sha256 && manifest.profile_structured_sha256 !== profileDigest) {
    throw new Error('profile structured fields changed after registration; start a new intake generation');
  }
  if (manifest.posting_structured_sha256 && manifest.posting_structured_sha256 !== postingDigest) {
    throw new Error('posting structured fields changed after registration; start a new intake generation');
  }
  if (manifest.profile_structured_sha256 === profileDigest && manifest.posting_structured_sha256 === postingDigest) {
    console.log(`Structured intake already registered; lineage=${manifest.lineage_id}`);
    process.exit(0);
  }

  profile.structured_sha256 = profileDigest;
  writeJson(profilePath, profile);
  if (posting) {
    posting.structured_sha256 = postingDigest;
    writeJson(postingPath, posting);
  }

  invalidateDownstream(project);
  const updated = updateRunManifest(project, {
    status: 'ready',
    profile_sha256: profile.raw_sha256,
    posting_sha256: posting?.raw_sha256 ?? null,
    profile_structured_sha256: profileDigest,
    posting_structured_sha256: postingDigest,
  });
  console.log(`Structured intake registered; lineage=${updated.lineage_id}`);
} catch (error) {
  if (project) {
    invalidateDownstream(project);
    markRunBlocked(project, error);
  }
  console.error(`BLOCKED: ${error.message}`);
  process.exitCode = 1;
}
