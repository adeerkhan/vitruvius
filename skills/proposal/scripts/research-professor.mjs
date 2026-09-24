/**
 * research-professor.mjs — Generate a web-research plan for a verified posting.
 * Actual fetching and structured professor/lab extraction remain agent steps.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertSlug, invalidateDownstream, markRunBlocked, projectDir, readRunManifest, recordPhaseProvenance, structuredDigest, updateRunManifest } from './project-utils.mjs';

let project;
try {
  assertSlug(process.argv[2]);
  project = projectDir(process.argv[2]);
  const postingPath = join(project, 'posting.json');
  if (!existsSync(postingPath)) throw new Error(`posting.json not found: ${postingPath}`);

  let posting;
  try {
    posting = JSON.parse(readFileSync(postingPath, 'utf-8'));
  } catch (error) {
    throw new Error(`failed to parse posting.json: ${error.message}`);
  }
  if (posting.status !== 'parsed' || posting.structured !== true || posting.verification?.status !== 'verified') {
    throw new Error('posting.json is raw or unverified; complete and verify structured posting fields before research');
  }
  const manifest = readRunManifest(project);
  const blockedSidecar = ['profile.json.blocked', 'posting.json.blocked', 'voice-sample.txt.blocked']
    .some((name) => existsSync(join(project, name)));
  if (manifest.status !== 'ready' || manifest.posting_sha256 !== posting.raw_sha256 || manifest.posting_structured_sha256 !== posting.structured_sha256 || posting.structured_sha256 !== structuredDigest(posting) || blockedSidecar) {
    throw new Error('run manifest is blocked or does not match the verified current posting intake');
  }

  const professorName = posting.professor?.name || 'Unknown';
  const university = posting.university || '';
  const labName = posting.lab?.name || '';
  const researchAreas = Array.isArray(posting.research?.areas) ? posting.research.areas : [];
  const queries = [
    `"${professorName}" ${university} lab research`,
    `"${professorName}" recent papers 2024 2025 2026`,
    `"${professorName}" ${university} publications`,
  ];
  if (labName) queries.push(`"${labName}" lab ${university}`, `"${labName}" research projects`);
  if (researchAreas.length > 0) queries.push(`"${professorName}" ${researchAreas.slice(0, 3).join(' OR ')}`);

  const urls = [];
  if (posting.lab?.url) urls.push(posting.lab.url);
  urls.push(`https://scholar.google.com/scholar?q=${encodeURIComponent(`${professorName} ${university}`)}`);
  urls.push(`https://www.semanticscholar.org/search?q=${encodeURIComponent(professorName)}&sort=relevance`);

  const searchPlan = `# Professor/Lab Research Plan
# Generated: ${new Date().toISOString()}
# Professor: ${professorName}
# University: ${university}
# Lab: ${labName || 'Not specified'}
RUN_INPUT_SHA256: ${manifest.lineage_id}

## Search Queries (execute with web_search)
${queries.map((query, index) => `${index + 1}. ${query}`).join('\n')}

## URLs to Check (execute with web_fetch)
${urls.map((url, index) => `${index + 1}. ${url}`).join('\n')}

## Target Output Structure
Save structured, source-linked research to projects/${process.argv[2]}/professor-research.json.
Set status=parsed, structured=true, input_lineage=${manifest.lineage_id}, search_plan_sha256=<sha256 of professor-search-plan.txt>, provenance=phase-0-provenance.md, and verification.status=verified only after recording the fetched sources.
Do not infer fields that were not found; use null or "not found".

## Boundaries
- Do not claim to have read an unfetched paper.
- Mark paywalled or inaccessible sources blocked.
- Record every source in sources_consulted.
`;
  const planPath = join(project, 'professor-search-plan.txt');
  invalidateDownstream(project);
  writeFileSync(planPath, searchPlan, 'utf-8');
  recordPhaseProvenance(project, 'professor-search-plan.txt', {
    method: 'search-plan',
    pages: 0,
    warnings: [],
    text: queries.join('\n'),
  }, 'planned', 'queries and URLs recorded in professor-search-plan.txt');
  updateRunManifest(project, { status: 'ready' });
  console.log(`Research plan saved to: ${planPath}`);
  console.log('Next: fetch the listed sources and write professor-research.json with provenance.');
} catch (error) {
  if (project) {
    invalidateDownstream(project);
    markRunBlocked(project, error);
    recordPhaseProvenance(project, 'professor-research', null, 'blocked', error.message);
  }
  console.error(`BLOCKED: ${error.message}`);
  process.exitCode = 1;
}
