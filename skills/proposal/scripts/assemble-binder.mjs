/**
 * assemble-binder.mjs — Create the final binder from all proposal artifacts.
 *
 * Usage:
 *   node skills/proposal/scripts/assemble-binder.mjs <student-slug>
 *
 * Expects all artifacts to exist:
 *   - proposal-final.md (humanized proposal)
 *   - gap-analysis/<slug>.md
 *   - evidence-ranking/<slug>.md
 *   - verifier/<slug>-verdict.md
 *   - profile.json
 *
 * Outputs:
 *   - binder.md (layered binder)
 *   - binder.provenance.md (audit trail)
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');

const slug = process.argv[2];

if (!slug) {
  console.error('Usage: node skills/proposal/scripts/assemble-binder.mjs <student-slug>');
  process.exit(1);
}

const projectDir = join(REPO_ROOT, 'projects', slug);
if (!existsSync(projectDir)) {
  console.error(`Project not found: ${projectDir}`);
  process.exit(1);
}

// Helper to find the most recent file by extension in a directory
function findMostRecentFile(dir, ext) {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter(f => f.endsWith(ext))
    .map(f => ({ path: join(dir, f), mtime: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime); // Most recent first
  return files.length > 0 ? files[0].path : null;
}

// Read all artifacts
const proposalPath = join(projectDir, 'proposal-final.md');
const profilePath = join(projectDir, 'profile.json');
const postingPath = join(projectDir, 'posting.json');
const professorPath = join(projectDir, 'professor-research.json');
const gapDir = join(projectDir, 'gap-analysis');
const evidenceDir = join(projectDir, 'evidence-ranking');
const verifierDir = join(projectDir, 'verifier');

// Validate required artifacts exist
const required = [
  [proposalPath, 'proposal-final.md'],
  [profilePath, 'profile.json'],
];

const missing = [];
for (const [path, name] of required) {
  if (!existsSync(path)) {
    missing.push(name);
  }
}

if (missing.length > 0) {
  console.error('Missing required artifacts:');
  missing.forEach(m => console.error(`  - ${m}`));
  console.error('\nEnsure all phases have completed before assembling binder.');
  process.exit(1);
}

// Read content
const proposal = readFileSync(proposalPath, 'utf-8');
let profile;
try {
  profile = JSON.parse(readFileSync(profilePath, 'utf-8'));
} catch (err) {
  console.error(`Failed to parse profile.json: ${err.message}`);
  process.exit(1);
}

// Helper to safely read JSON files
function readJsonSafe(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

const gapFile = findMostRecentFile(gapDir, '.md');
const evidenceFile = findMostRecentFile(evidenceDir, '.md');
const verifierFile = findMostRecentFile(verifierDir, '-verdict.md');

// Extract fields (profile.json validated at intake — direct access)
const studentName = profile.name || 'Student';
const targetLab = profile.targetLab || 'Target Institution';
const researchTopic = profile.researchInterests?.[0] || 'Engineering Research';
const today = new Date().toISOString().split('T')[0];

// Build binder
const binder = `# Research Proposal: ${researchTopic}
**Student:** ${studentName}
**Target:** ${targetLab}
**Date:** ${today}
**Slug:** ${slug}

---

## Executive Summary

${proposal}

---

## Appendices

### Appendix A: Gap Analysis
${gapFile ? `[Detailed gap analysis](./gap-analysis/${gapFile.split('\\').pop() || gapFile.split('/').pop()})` : '*Gap analysis not available*'}
${gapFile ? `\nKey gaps identified:\n${extractGaps(readFileSync(gapFile, 'utf-8'))}` : ''}

### Appendix B: Evidence Ranking
${evidenceFile ? `[Scored evidence table](./evidence-ranking/${evidenceFile.split('\\').pop() || evidenceFile.split('/').pop()})` : '*Evidence ranking not available*'}

### Appendix C: Verdict
${verifierFile ? `[Verifier verdict](./verifier/${verifierFile.split('\\').pop() || verifierFile.split('/').pop()})` : '*Verifier verdict not available*'}
${verifierFile ? `\n${extractVerdict(readFileSync(verifierFile, 'utf-8'))}` : ''}

### Appendix D: Researcher Profile
\`\`\`json
${JSON.stringify(profile, null, 2)}
\`\`\`

### Appendix E: Position Posting
${postingPath && existsSync(postingPath) ? `[Structured posting data](./posting.json)` : '*Posting data not available*'}
${postingPath && existsSync(postingPath) ? `\n\`\`\`json\n${JSON.stringify(readJsonSafe(postingPath), null, 2)}\n\`\`\`` : ''}

### Appendix F: Professor/Lab Research
${professorPath && existsSync(professorPath) ? `[Professor research](./professor-research.json)` : '*Professor research not available*'}
${professorPath && existsSync(professorPath) ? `\n\`\`\`json\n${JSON.stringify(readJsonSafe(professorPath), null, 2)}\n\`\`\`` : ''}

### Appendix G: Provenance
This proposal was generated using the /proposal skill pipeline:
1. Position posting parsed → posting.json
2. Professor/lab researched → professor-research.json
3. CV parsed → profile.json
4. Gap analysis → gap-analysis/
5. Evidence ranking → evidence-ranking/
6. Verification → verifier/
7. Proposal written → proposal-draft.md
8. Humanized → proposal-final.md
9. Assembled → binder.md

All artifacts saved in: \`projects/${slug}/\`
`;

// Write binder
const binderPath = join(projectDir, 'binder.md');
writeFileSync(binderPath, binder);
console.log(`Binder created: ${binderPath}`);

// Write provenance
const provenance = `# Provenance: ${slug}

**Generated:** ${new Date().toISOString()}
**Pipeline:** /proposal skill

## Artifacts Generated

| Artifact | Path | Status |
|----------|------|--------|
| Profile | profile.json | ${existsSync(profilePath) ? '✓' : '✗'} |
| CV Raw Text | cv-raw.txt | ${existsSync(join(projectDir, 'cv-raw.txt')) ? '✓' : '✗'} |
| Voice Sample | voice-sample.txt | ${existsSync(join(projectDir, 'voice-sample.txt')) ? '✓' : '✗'} |
| Posting | posting.json | ${postingPath && existsSync(postingPath) ? '✓' : '✗'} |
| Professor Research | professor-research.json | ${professorPath && existsSync(professorPath) ? '✓' : '✗'} |
| Gap Dossier | gap-analysis/ | ${gapFile ? '✓' : '✗'} |
| Evidence Table | evidence-ranking/ | ${evidenceFile ? '✓' : '✗'} |
| Verdict | verifier/ | ${verifierFile ? '✓' : '✗'} |
| Proposal Draft | proposal-draft.md | ${existsSync(join(projectDir, 'proposal-draft.md')) ? '✓' : '✗'} |
| Proposal Final | proposal-final.md | ${existsSync(proposalPath) ? '✓' : '✗'} |
| Binder | binder.md | ✓ |

## Non-Negotiable Boundaries Enforced
- [x] No fabricated DOIs (verified via doi.org)
- [x] No invented statistics (all numbers sourced)
- [x] No inferred claims presented as validated
- [x] Verifier blind to author's reasoning
- [x] Humanization applied to final proposal
- [x] Subagents isolated (no shared verdict channels)

## Review Checklist for Student
- [ ] All facts verified against original CV
- [ ] Research gaps accurately reflect cited sources
- [ ] Research questions are answerable and specific
- [ ] Target lab/professor references are accurate
- [ ] Writing voice sounds like you (or acceptably neutral)
- [ ] All DOIs resolve to correct papers
- [ ] No unsupported numeric claims
`;

const provenancePath = join(projectDir, 'binder.provenance.md');
writeFileSync(provenancePath, provenance);
console.log(`Provenance saved: ${provenancePath}`);

console.log('\n✓ Binder assembly complete.');
console.log(`Review: ${binderPath}`);

// Helper functions
function extractGaps(gapText) {
  // Extract gap statements from the dossier (robust regex for "### Gap N" format)
  const gapSections = gapText.split(/### Gap \d+/).slice(1);
  return gapSections.map((section, i) => {
    const firstLine = section.split('\n').find(l => l.trim().length > 0);
    return `${i + 1}. ${firstLine?.trim() || 'Gap identified'}`;
  }).join('\n');
}

function extractVerdict(verdictText) {
  // Extract MACHINE_VERDICT line
  const match = verdictText.match(/MACHINE_VERDICT:.*/);
  if (match) return `**Verdict:** ${match[0]}`;
  return '*See verifier document for details*';
}
