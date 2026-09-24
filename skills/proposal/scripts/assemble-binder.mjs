/**
 * assemble-binder.mjs — Assemble a proposal binder only from complete artifacts.
 * Usage: node skills/proposal/scripts/assemble-binder.mjs <student-slug>
 */
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseMachineVerdict } from './verifier-parser.mjs';
import { PROJECT_ROOT, assertSlug, invalidateDownstream, readRunManifest, sha256, structuredDigest } from './project-utils.mjs';

const slug = process.argv[2];
let projectDir;
try {
  assertSlug(slug);
  projectDir = join(PROJECT_ROOT, 'projects', slug);
} catch (error) {
  console.error(`Invalid slug: ${error.message}`);
  process.exit(1);
}
if (!existsSync(projectDir)) {
  console.error(`Project not found: ${projectDir}`);
  process.exit(1);
}

const paths = {
  profile: join(projectDir, 'profile.json'),
  profileRaw: join(projectDir, 'cv-raw.txt'),
  runManifest: join(projectDir, 'run-manifest.json'),
  phaseProvenance: join(projectDir, 'phase-0-provenance.md'),
  voice: join(projectDir, 'voice-sample.txt'),
  gap: join(projectDir, 'gap-analysis', `${slug}.md`),
  gapProvenance: join(projectDir, 'gap-analysis', `${slug}.provenance.md`),
  evidence: join(projectDir, 'evidence-ranking', `${slug}.md`),
  verifier: join(projectDir, 'verifier', `${slug}-verdict.md`),
  draft: join(projectDir, 'proposal-draft.md'),
  final: join(projectDir, 'proposal-final.md'),
  posting: join(projectDir, 'posting.json'),
  postingRaw: join(projectDir, 'posting-raw.txt'),
  professor: join(projectDir, 'professor-research.json'),
  professorSearchPlan: join(projectDir, 'professor-search-plan.txt'),
};

function retireCurrentOutputs() {
  const stamp = `${Date.now()}-${process.pid}`;
  const retired = [];
  for (const path of [join(projectDir, 'binder.md'), join(projectDir, 'binder.provenance.md')]) {
    if (!existsSync(path)) continue;
    let stalePath = `${path}.stale-${stamp}`;
    let suffix = 1;
    while (existsSync(stalePath)) stalePath = `${path}.stale-${stamp}-${suffix++}`;
    renameSync(path, stalePath);
    retired.push({ path, stalePath });
  }
  return retired;
}

function block(message) {
  invalidateDownstream(projectDir);
  retireCurrentOutputs();
  console.error(message);
  process.exit(1);
}

function publishPair(binder, provenance) {
  const binderPath = join(projectDir, 'binder.md');
  const provenancePath = join(projectDir, 'binder.provenance.md');
  const stamp = `${process.pid}-${Date.now()}`;
  const binderTemp = `${binderPath}.tmp-${stamp}`;
  const provenanceTemp = `${provenancePath}.tmp-${stamp}`;
  let retired = [];
  try {
    writeFileSync(provenanceTemp, provenance, 'utf-8');
    writeFileSync(binderTemp, binder, 'utf-8');
    retired = retireCurrentOutputs();
    renameSync(provenanceTemp, provenancePath);
    try {
      renameSync(binderTemp, binderPath);
    } catch (error) {
      rmSync(provenancePath, { force: true });
      for (const item of retired) renameSync(item.stalePath, item.path);
      throw error;
    }
  } finally {
    rmSync(binderTemp, { force: true });
    rmSync(provenanceTemp, { force: true });
  }
}

const required = [
  ['profile.json', paths.profile],
  ['run-manifest.json', paths.runManifest],
  ['phase-0-provenance.md', paths.phaseProvenance],
  ['voice-sample.txt', paths.voice],
  [`gap-analysis/${slug}.md`, paths.gap],
  [`gap-analysis/${slug}.provenance.md`, paths.gapProvenance],
  [`evidence-ranking/${slug}.md`, paths.evidence],
  [`verifier/${slug}-verdict.md`, paths.verifier],
  ['proposal-draft.md', paths.draft],
  ['proposal-final.md', paths.final],
];
const missing = required.filter(([, path]) => !existsSync(path)).map(([name]) => name);
if (missing.length > 0) {
  block(`Missing required artifacts:\n${missing.map((name) => `  - ${name}`).join('\n')}\n\nBinder was not written. Complete every required phase before assembly.`);
}

const blockedAttempts = [
  'profile.json.blocked',
  'posting.json.blocked',
  'professor-research.json.blocked',
  'voice-sample.txt.blocked',
].filter((name) => existsSync(join(projectDir, name)));
if (blockedAttempts.length > 0) {
  block(`Blocked input attempts remain: ${blockedAttempts.join(', ')}\nBinder was not written. Resolve the failed attempt or remove the stale retry sidecar.`);
}

function readText(path, label) {
  let text;
  try {
    text = readFileSync(path, 'utf-8');
  } catch (error) {
    throw new Error(`cannot read ${label}: ${error.message}`);
  }
  if (text.trim() === '') throw new Error(`${label} is empty`);
  return text;
}

function readJson(path, label) {
  try {
    return JSON.parse(readText(path, label));
  } catch (error) {
    throw new Error(`invalid ${label}: ${error.message}`);
  }
}

function validateIntakeArtifact(value, label) {
  if (!['text', 'pdf-parse'].includes(value.method)) throw new Error(`${label} extraction method is not deterministic text/pdf-parse`);
  if (typeof value.raw_text !== 'string' || value.raw_text.trim() === '') throw new Error(`${label} is missing readable source text`);
  if (value.raw_bytes !== Buffer.byteLength(value.raw_text, 'utf-8')) throw new Error(`${label} raw byte count does not match raw_text`);
  if (value.raw_sha256 !== sha256(value.raw_text)) throw new Error(`${label} raw digest does not match raw_text`);
  if (typeof value.resolved_source !== 'string' || value.resolved_source.trim() === '') {
    throw new Error(`${label} is missing a resolved source path`);
  }
  if (!/^[a-f0-9]{64}$/.test(value.source_sha256 || '') || !Number.isInteger(value.source_bytes)) {
    throw new Error(`${label} is missing a source digest and byte count`);
  }
  if (existsSync(value.resolved_source)) {
    const source = readFileSync(value.resolved_source);
    if (source.length !== value.source_bytes || sha256(source) !== value.source_sha256) {
      throw new Error(`${label} source file digest no longer matches the recorded intake`);
    }
  }
  if (value.verification?.status !== 'verified' || value.verification?.provenance !== 'phase-0-provenance.md') {
    throw new Error(`${label} structured fields are not verified against phase-0 provenance`);
  }
  if (value.verification.source_sha256 !== value.source_sha256 || value.verification.raw_sha256 !== value.raw_sha256) {
    throw new Error(`${label} verification digests do not match intake digests`);
  }
  if (value.structured_sha256 !== structuredDigest(value)) {
    throw new Error(`${label} structured digest is missing or stale`);
  }
}

function requireLedgerBinding(phaseProvenance, value, label) {
  const method = value.method.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sameEntry = new RegExp(`status=parsed;\\s*method=${method};[^\\n]*source_bytes=${value.source_bytes};[^\\n]*source_sha256=${value.source_sha256};[^\\n]*raw_bytes=${value.raw_bytes};[^\\n]*raw_sha256=${value.raw_sha256}`);
  if (!sameEntry.test(phaseProvenance)) {
    throw new Error(`${label} parsed deterministic digest tuple is not recorded in phase-0 provenance`);
  }
}

function requireRawSidecar(path, value, label) {
  if (!existsSync(path)) throw new Error(`${label} raw sidecar is missing`);
  const text = readText(path, `${label} raw sidecar`);
  if (text !== value.raw_text || Buffer.byteLength(text, 'utf-8') !== value.raw_bytes || sha256(text) !== value.raw_sha256) {
    throw new Error(`${label} raw sidecar does not match the recorded raw_text digest`);
  }
}

function requireLineage(text, lineageId, label) {
  const markers = [...text.matchAll(/RUN_INPUT_SHA256:\s*([a-f0-9]{64})/gi)].map((match) => match[1].toLowerCase());
  if (markers.length !== 1 || markers[0] !== lineageId.toLowerCase()) {
    throw new Error(`${label} is not bound to exactly one current intake generation`);
  }
}

function readOptionalJson(path, label) {
  if (!existsSync(path)) return null;
  const value = readJson(path, label);
  if (value.status !== 'parsed' || value.structured !== true) {
    throw new Error(`${label} must have status=parsed and structured=true`);
  }
  if (label === 'professor-research.json' && (!Array.isArray(value.sources_consulted) || value.sources_consulted.length === 0 || value.sources_consulted.some((source) => typeof source !== 'string' || source.trim() === ''))) {
    throw new Error(`${label} has no nonempty sources_consulted entries`);
  }
  return value;
}

function sectionBody(text, heading) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === heading || line.trim().startsWith(`${heading} `));
  if (start < 0) return '';
  const level = heading.match(/^#+/)[0].length;
  const next = lines.findIndex((line, index) => {
    if (index <= start) return false;
    const match = line.match(/^(#+)\s+/);
    return match && match[1].length <= level;
  });
  return lines.slice(start + 1, next < 0 ? lines.length : next).join('\n').trim();
}

function validateVerifierArtifact(text, parsedVerdict) {
  for (const heading of ['## Findings', '### Checks that passed', '### Issues found', '## Corrected Conclusion', '## Evidence Trail']) {
    if (!sectionBody(text, heading)) throw new Error(`verifier artifact is missing content under ${heading}`);
  }
  const proseVerdicts = [...text.matchAll(/^## Verdict\s*:\s*(PASS|PARTIAL|BLOCKED)\s*$/gim)].map((match) => match[1].toUpperCase());
  if (proseVerdicts.length !== 1 || proseVerdicts[0] !== parsedVerdict.verdict) {
    throw new Error('verifier must contain one prose verdict consistent with MACHINE_VERDICT');
  }
  const corrected = sectionBody(text, '## Corrected Conclusion');
  if (corrected.length < 20 || /^(?:n\/a|tbd|unknown|placeholder)\.?$/i.test(corrected)) {
    throw new Error('verifier Corrected Conclusion is not substantive');
  }
  const evidence = sectionBody(text, '## Evidence Trail');
  if (!/\|\s*#\s*\|.*\|\s*Source\s*\|\s*Location/i.test(evidence)) {
    throw new Error('verifier Evidence Trail must contain a line-pinned table');
  }
  const evidenceRows = evidence.split(/\r?\n/).filter((line) => /^\s*\|\s*\d+\s*\|/.test(line));
  const malformedRows = evidenceRows.filter((line) => {
    const columns = line.split('|').slice(1, -1).map((column) => column.trim());
    return columns.length < 5 || columns.slice(0, 5).some((column) => !column || /^(?:n\/a|tbd|unknown|placeholder|\.\.\.)$/i.test(column)) || !/(line|page|section|clause|table|figure|calc|source)/i.test(columns[3]);
  });
  if (evidenceRows.length < parsedVerdict.linePinnedDen || malformedRows.length > 0) {
    throw new Error('verifier Evidence Trail must contain complete line-pinned data rows');
  }
  if (parsedVerdict.verdict === 'PASS') {
    const passedBody = sectionBody(text, '### Checks that passed');
    const requiredChecks = [
      'applicability', 'units', 'completeness', 'missing factors', 'calculation',
      'source-to-claim', 'conflict', 'entailment',
    ];
    if (requiredChecks.some((check) => !passedBody.toLowerCase().includes(check))) {
      throw new Error('PASS verifier must name all eight canonical checks');
    }
    const passedChecks = passedBody.split(/\r?\n/).filter((line) => /^\s*(?:[-*]|\d+\.)\s+/.test(line));
    if (passedChecks.length < 8) throw new Error('PASS verifier must record all eight checks as passed');
  }
  if (parsedVerdict.confidence < 0.7) {
    throw new Error(`verifier confidence ${parsedVerdict.confidence} is below the PASS threshold 0.7`);
  }
  if (parsedVerdict.verdict === 'PASS' && !/^(?:[-*]\s*)?(?:none|no issues)\b/i.test(sectionBody(text, '### Issues found'))) {
    throw new Error('PASS verifier must report no issues');
  }
}

let profile;
let posting;
let professor;
let verdict;
let gapText;
let evidenceText;
let draftText;
let proposal;
let phaseProvenance;
let verifierText;
let voiceText;
try {
  phaseProvenance = readText(paths.phaseProvenance, 'phase-0-provenance.md');
  if (!/source=[^;\n]+;\s*status=parsed;\s*method=[^;\n]+;\s*pages=[^;\n]+;\s*source_bytes=\d+;\s*source_sha256=[a-f0-9]{64};\s*raw_bytes=\d+;\s*raw_sha256=[a-f0-9]{64}(?:;|\n)/.test(phaseProvenance)) {
    throw new Error('phase-0-provenance.md has no hashed parsed source entry');
  }

  profile = readJson(paths.profile, 'profile.json');
  if (profile.status !== 'parsed' || profile.structured !== true) {
    throw new Error('profile.json must be a parsed, structured artifact');
  }
  if (typeof profile.name !== 'string' || profile.name.trim() === '') {
    throw new Error('profile.json is missing a verified student name');
  }
  validateIntakeArtifact(profile, 'profile.json');
  requireLedgerBinding(phaseProvenance, profile, 'profile.json');
  requireRawSidecar(paths.profileRaw, profile, 'profile.json');

  posting = readOptionalJson(paths.posting, 'posting.json');
  if (posting) {
    validateIntakeArtifact(posting, 'posting.json');
    requireLedgerBinding(phaseProvenance, posting, 'posting.json');
    requireRawSidecar(paths.postingRaw, posting, 'posting.json');
  }
  const manifest = readRunManifest(projectDir);
  if (manifest.schema !== 'proposal-run.v1' || manifest.status !== 'ready') {
    throw new Error('run manifest is missing, blocked, or not ready');
  }
  if (manifest.profile_sha256 !== profile.raw_sha256 || manifest.profile_structured_sha256 !== profile.structured_sha256) {
    throw new Error('run manifest does not match the current profile intake');
  }
  if ((posting && (manifest.posting_sha256 !== posting.raw_sha256 || manifest.posting_structured_sha256 !== posting.structured_sha256)) || (!posting && (manifest.posting_sha256 !== null || manifest.posting_structured_sha256 !== null))) {
    throw new Error('run manifest does not match the current posting intake');
  }
  const expectedLineage = sha256(`${manifest.profile_sha256}|${manifest.posting_sha256 || 'none'}|${manifest.profile_structured_sha256 || 'none'}|${manifest.posting_structured_sha256 || 'none'}`);
  if (manifest.lineage_id !== expectedLineage) throw new Error('run manifest lineage id does not match its intake hashes');
  const lineageId = manifest.lineage_id;
  if (!/^[a-f0-9]{64}$/.test(lineageId || '')) throw new Error('run manifest has no valid lineage id');
  professor = readOptionalJson(paths.professor, 'professor-research.json');
  if (professor) {
    if (professor.verification?.status !== 'verified' || professor.provenance !== 'phase-0-provenance.md' || professor.input_lineage !== lineageId) {
      throw new Error('professor research is not verified against the current intake generation');
    }
    if (!existsSync(paths.professorSearchPlan) || professor.search_plan_sha256 !== sha256(readFileSync(paths.professorSearchPlan))) {
      throw new Error('professor research is not bound to the current search plan');
    }
  }
  voiceText = readText(paths.voice, 'voice-sample.txt');
  if (!/^Status:\s*(DEFAULT_NEUTRAL|PROVIDED)\s*$/m.test(voiceText)) {
    throw new Error('voice-sample.txt lacks an explicit DEFAULT_NEUTRAL or PROVIDED status');
  }
  gapText = readText(paths.gap, 'gap dossier');
  requireLineage(gapText, lineageId, 'gap dossier');
  const gapProvenance = readText(paths.gapProvenance, 'gap provenance');
  requireLineage(gapProvenance, lineageId, 'gap provenance');
  evidenceText = readText(paths.evidence, 'evidence table');
  requireLineage(evidenceText, lineageId, 'evidence table');
  draftText = readText(paths.draft, 'proposal draft');
  requireLineage(draftText, lineageId, 'proposal draft');
  proposal = readText(paths.final, 'proposal final');
  requireLineage(proposal, lineageId, 'proposal final');
  verifierText = readText(paths.verifier, 'verifier verdict');
  requireLineage(verifierText, lineageId, 'verifier verdict');

  const verdictMarkerCount = (verifierText.match(/machine_verdict:/gi) || []).length;
  const verdictLines = verifierText.split(/\r?\n/).filter((line) => /^\s*#*\s*MACHINE_VERDICT:/i.test(line));
  if (verdictMarkerCount !== 1 || verdictLines.length !== 1) {
    throw new Error(`verifier must contain exactly one MACHINE_VERDICT line (found ${verdictMarkerCount})`);
  }
  verdict = parseMachineVerdict(verdictLines[0]);
  if (!verdict) throw new Error('verifier artifact has no valid MACHINE_VERDICT line');
  validateVerifierArtifact(verifierText, verdict);
  if (verdict.verdict !== 'PASS') throw new Error(`verdict is ${verdict.verdict}; PASS is required before binder assembly`);
} catch (error) {
  block(`Binder BLOCKED: ${error.message}`);
}

const studentName = profile.name;
const targetLab = profile.targetLab || 'Not provided';
const researchTopic = profile.researchInterests?.[0] || 'Engineering research topic not provided';
const date = new Date().toISOString().split('T')[0];
const binder = `# Research Proposal: ${researchTopic}
**Student:** ${studentName}
**Target:** ${targetLab}
**Date:** ${date}
**Slug:** ${slug}

---

## Executive Summary

${proposal}

---

## Appendices

### Appendix A: Gap Analysis
[Detailed gap analysis](./gap-analysis/${slug}.md)

${extractGaps(gapText)}

### Appendix B: Evidence Ranking
[Scored evidence table](./evidence-ranking/${slug}.md)

${evidenceText}

### Appendix C: Verdict
[Verifier verdict](./verifier/${slug}-verdict.md)

**MACHINE_VERDICT:** ${verdict.verdict} | **Flaw:** ${verdict.flaw} | **Checks:** ${verdict.checksPassed}/8

### Appendix D: Researcher Profile
\`\`\`json
${JSON.stringify(profile, null, 2)}
\`\`\`

### Appendix E: Position Posting
${posting ? '[Structured posting data](./posting.json)' : '*Posting data not provided; field-level draft.*'}
${posting ? `\n\`\`\`json\n${JSON.stringify(posting, null, 2)}\n\`\`\`` : ''}

### Appendix F: Professor/Lab Research
${professor ? '[Professor research](./professor-research.json)' : '*Professor research not provided; field-level draft.*'}
${professor ? `\n\`\`\`json\n${JSON.stringify(professor, null, 2)}\n\`\`\`` : ''}

### Appendix G: Provenance
See [phase-0 provenance](./phase-0-provenance.md) and [binder provenance](./binder.provenance.md).
`;

const provenance = `# Provenance: ${slug}

**Generated:** ${new Date().toISOString()}
**Pipeline:** /proposal skill

## Required Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Structured profile | profile.json | ✓ |
| Run manifest/lineage | run-manifest.json | ✓ |
| Phase 0 provenance | phase-0-provenance.md | ✓ |
| Voice sample/baseline | voice-sample.txt | ✓ |
| Gap dossier | gap-analysis/${slug}.md | ✓ |
| Gap provenance | gap-analysis/${slug}.provenance.md | ✓ |
| Evidence table | evidence-ranking/${slug}.md | ✓ |
| Verifier verdict | verifier/${slug}-verdict.md | ✓ PASS |
| Proposal draft | proposal-draft.md | ✓ |
| Proposal final | proposal-final.md | ✓ |

## Optional Artifacts

| Artifact | Status |
|----------|--------|
| Posting | ${posting ? '✓ structured and provided' : 'not provided; field-level draft'} |
| Professor research | ${professor ? '✓ structured and provided' : 'not provided; field-level draft'} |
| Binder | ✓ |

## Review Checklist for Student
- [ ] All facts verified against the original CV
- [ ] Research gaps accurately reflect cited sources
- [ ] Research questions are answerable and specific
- [ ] Target lab/professor references are accurate
- [ ] Writing voice is appropriate for the application
- [ ] All DOIs resolve to correct papers
- [ ] No unsupported numeric claims
`;

try {
  publishPair(binder, provenance);
} catch (error) {
  block(`Binder publication BLOCKED: ${error.message}`);
}
console.log(`Binder created: ${join(projectDir, 'binder.md')}`);
console.log(`Provenance saved: ${join(projectDir, 'binder.provenance.md')}`);

function extractGaps(text) {
  const sections = text.split(/### Gap \d+/).slice(1);
  return sections.length > 0
    ? sections.map((section, index) => {
        const firstLine = section.split('\n').find((line) => line.trim().length > 0);
        return `${index + 1}. ${firstLine?.trim() || 'Gap identified'}`;
      }).join('\n')
    : 'Gap statements are embedded in the dossier.';
}
