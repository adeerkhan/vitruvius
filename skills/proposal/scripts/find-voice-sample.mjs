/**
 * find-voice-sample.mjs — Copy a student-provided writing sample.
 * If none is supplied, record an explicit neutral baseline.
 */
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertSlug, invalidateDownstream, markRunBlocked, projectDir, recordPhaseProvenance, runExtractor, updateRunManifest, writeBlockedArtifact } from './project-utils.mjs';

const args = process.argv.slice(2);
const slug = args[0];
let project;
let sourcePath = null;
let sourceType = null;

try {
  assertSlug(slug);
  project = projectDir(slug);
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--statement' || args[i] === '--sample') {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`${args[i]} requires a path`);
      const candidateType = args[i].slice(2);
      if (!sourcePath || candidateType === 'sample' || sourceType === candidateType) {
        sourcePath = args[i + 1];
        sourceType = candidateType;
      }
      i++;
    } else if (args[i].startsWith('--')) {
      throw new Error(`unknown option: ${args[i]}`);
    }
  }
  if (!existsSync(project)) throw new Error(`project not found: ${project}`);

  const destination = join(project, 'voice-sample.txt');
  if (!sourcePath) {
    invalidateDownstream(project);
    writeFileSync(destination, '# Voice Sample\n\nStatus: DEFAULT_NEUTRAL\nNo student sample supplied; humanizer must use the neutral baseline.\n', 'utf-8');
    rmSync(`${destination}.blocked`, { force: true });
    recordPhaseProvenance(project, '<voice-sample>', null, 'default-neutral', 'no sample supplied');
    updateRunManifest(project, { status: 'ready' });
    console.log('No voice sample provided. Using default neutral voice.');
  } else {
    const extraction = await runExtractor(sourcePath);
    invalidateDownstream(project);
    writeFileSync(destination, `# Voice Sample\n# Source: ${sourcePath}\n# Resolved: ${extraction.source}\n# Type: ${sourceType}\n# Method: ${extraction.method}\nStatus: PROVIDED\n\n${extraction.text}`, 'utf-8');
    rmSync(`${destination}.blocked`, { force: true });
    recordPhaseProvenance(project, sourcePath, extraction, 'parsed');
    updateRunManifest(project, { status: 'ready' });
    console.log(`Voice sample saved: ${sourcePath} -> ${destination}`);
  }
} catch (error) {
  if (project) {
    invalidateDownstream(project);
    writeBlockedArtifact(project, 'voice-sample.txt', {
      status: 'blocked',
      source: sourcePath || null,
      error: error.message,
    });
    markRunBlocked(project, error);
    recordPhaseProvenance(project, sourcePath || '<voice-sample>', null, 'blocked', error.message);
  }
  console.error(`BLOCKED: ${error.message}`);
  process.exitCode = 1;
}
