import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { extractDocument } from './document-extractor.mjs';

export const PROJECT_ROOT = resolve(process.env.VITRUVIUS_PROJECT_ROOT || process.cwd());
const IMAGE_EXTENSIONS = new Set(['.bmp', '.gif', '.jpeg', '.jpg', '.png', '.tif', '.tiff', '.webp']);

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function structuredDigest(value) {
  const copy = { ...value };
  delete copy.structured_sha256;
  delete copy.verification;
  delete copy.input_lineage;
  return sha256(JSON.stringify(copy));
}

export function assertSlug(slug) {
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('slug must be lowercase letters, numbers, and hyphens only');
  }
  return slug;
}

export function projectDir(slug) {
  return join(PROJECT_ROOT, 'projects', assertSlug(slug));
}

export function readRunManifest(project) {
  const path = join(project, 'run-manifest.json');
  if (!existsSync(path)) throw new Error(`run-manifest.json not found: ${path}`);
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch (error) {
    throw new Error(`invalid run-manifest.json: ${error.message}`);
  }
}

export function updateRunManifest(project, patch = {}) {
  let previous = {};
  const manifestPath = join(project, 'run-manifest.json');
  if (existsSync(manifestPath)) {
    try {
      previous = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    } catch {
      previous = {};
    }
  }
  const profileSha = patch.profile_sha256 ?? previous.profile_sha256 ?? null;
  const postingSha = patch.posting_sha256 ?? previous.posting_sha256 ?? null;
  const profileChanged = Object.hasOwn(patch, 'profile_sha256') && patch.profile_sha256 !== previous.profile_sha256;
  const postingChanged = Object.hasOwn(patch, 'posting_sha256') && patch.posting_sha256 !== previous.posting_sha256;
  const profileStructured = Object.hasOwn(patch, 'profile_structured_sha256')
    ? patch.profile_structured_sha256
    : profileChanged ? null : (previous.profile_structured_sha256 ?? null);
  const postingStructured = Object.hasOwn(patch, 'posting_structured_sha256')
    ? patch.posting_structured_sha256
    : postingChanged ? null : (previous.posting_structured_sha256 ?? null);
  const blockedSidecars = ['profile.json.blocked', 'posting.json.blocked', 'voice-sample.txt.blocked']
    .some((name) => existsSync(join(project, name)));
  const requestedStatus = patch.status || previous.status || 'awaiting-intake';
  const status = requestedStatus === 'blocked' || blockedSidecars ? 'blocked' : requestedStatus;
  const manifest = {
    schema: 'proposal-run.v1',
    revision: (previous.revision || 0) + 1,
    status,
    profile_sha256: profileSha,
    posting_sha256: postingSha,
    profile_structured_sha256: profileStructured,
    posting_structured_sha256: postingStructured,
    lineage_id: sha256(`${profileSha || 'none'}|${postingSha || 'none'}|${profileStructured || 'none'}|${postingStructured || 'none'}`),
    updated_at: new Date().toISOString(),
    error: status === 'blocked' ? (patch.error || previous.error || 'blocked intake') : null,
  };
  writeJson(join(project, 'run-manifest.json'), manifest);
  return manifest;
}

export function markRunBlocked(project, error) {
  return updateRunManifest(project, { status: 'blocked', error: error.message || String(error) });
}

export function invalidateDownstream(project) {
  const stamp = `${Date.now()}-${process.pid}`;
  const roots = [
    join(project, 'gap-analysis'),
    join(project, 'evidence-ranking'),
    join(project, 'verifier'),
  ];
  const files = [
    join(project, 'professor-search-plan.txt'),
    join(project, 'professor-research.json'),
    join(project, 'proposal-draft.md'),
    join(project, 'proposal-final.md'),
    join(project, 'binder.md'),
    join(project, 'binder.provenance.md'),
  ];
  const archive = (path) => {
    if (!existsSync(path)) return;
    let target = `${path}.stale-${stamp}`;
    let suffix = 1;
    while (existsSync(target)) target = `${path}.stale-${stamp}-${suffix++}`;
    renameSync(path, target);
  };
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (entry.isFile()) archive(join(root, entry.name));
    }
  }
  files.forEach(archive);
}

export async function runExtractor(filePath) {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new Error('document path is required');
  }
  if (/^https?:\/\//i.test(filePath)) {
    throw new Error('URL extraction is BLOCKED: fetch and read the source explicitly before parsing');
  }
  const resolvedPath = resolve(filePath);
  if (IMAGE_EXTENSIONS.has(extname(resolvedPath).toLowerCase())) {
    throw new Error('image extraction is BLOCKED: use an explicitly read text transcription or PDF');
  }
  if (!existsSync(resolvedPath)) throw new Error(`document not found: ${resolvedPath}`);

  const sourceBytes = readFileSync(resolvedPath);
  const parsed = await extractDocument(resolvedPath, sourceBytes);
  if (parsed.method === 'vision' || parsed.method === 'error') {
    throw new Error(`document extraction BLOCKED: ${(parsed.warnings || []).join('; ')}`);
  }
  if (typeof parsed.text !== 'string' || parsed.text.trim() === '') {
    throw new Error('document extraction produced no readable text');
  }
  return {
    ...parsed,
    source: resolvedPath,
    source_bytes: sourceBytes.length,
    source_sha256: sha256(sourceBytes),
  };
}

export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

export function writeText(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value, 'utf-8');
}

export function writeBlockedArtifact(project, filename, value) {
  const primaryPath = join(project, filename);
  const blockedPath = `${primaryPath}.blocked`;
  // Never destroy a previously valid intake artifact during a failed retry.
  const targetPath = existsSync(primaryPath) ? blockedPath : primaryPath;
  writeJson(targetPath, value);
  return targetPath;
}

export function recordPhaseProvenance(project, source, extraction, status, error = '') {
  const sourceLabel = String(source || '<unspecified>').replace(/\s+/g, ' ').trim();
  const text = typeof extraction?.text === 'string' ? extraction.text : '';
  const rawDigest = text ? sha256(text) : 'unavailable';
  const rawBytes = text ? Buffer.byteLength(text, 'utf-8') : 0;
  const sourceDigest = extraction?.source_sha256 || 'unavailable';
  const sourceBytes = extraction?.source_bytes ?? 'unavailable';
  const warnings = (extraction?.warnings || []).map((warning) => String(warning).replace(/\s+/g, ' ').trim()).join('; ') || 'none';
  const method = extraction?.method || 'none';
  const pages = extraction?.pages ?? 'unavailable';
  const detail = String(error || '').replace(/\s+/g, ' ').trim() || 'none';
  const entry = `- ${new Date().toISOString()} source=${sourceLabel}; status=${status}; method=${method}; pages=${pages}; source_bytes=${sourceBytes}; source_sha256=${sourceDigest}; raw_bytes=${rawBytes}; raw_sha256=${rawDigest}; warnings=${warnings}; error=${detail}`;
  const path = join(project, 'phase-0-provenance.md');
  const previous = existsSync(path) ? readFileSync(path, 'utf-8').replace(/\s+$/, '') : '# Phase 0 Provenance\n\n## Sources';
  writeText(path, `${previous}\n${entry}\n`);
}
