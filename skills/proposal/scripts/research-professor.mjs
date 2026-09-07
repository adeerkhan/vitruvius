/**
 * research-professor.mjs — Generate web research plan for professor/lab.
 *
 * Usage:
 *   node skills/proposal/scripts/research-professor.mjs <slug>
 *
 * Input: projects/<slug>/posting.json (professor name, university, lab)
 * Output: projects/<slug>/professor-search-plan.txt
 *
 * Note: This script generates search queries and URLs.
 * The actual web fetching is done by the LLM in Phase 0c.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');

const slug = process.argv[2];

if (!slug) {
  console.error('Usage: node skills/proposal/scripts/research-professor.mjs <slug>');
  process.exit(1);
}

const projectDir = join(REPO_ROOT, 'projects', slug);
const postingPath = join(projectDir, 'posting.json');

if (!existsSync(postingPath)) {
  console.error(`posting.json not found: ${postingPath}`);
  console.error('Run parse-posting.mjs first.');
  process.exit(1);
}

// Read posting data
let posting;
try {
  posting = JSON.parse(readFileSync(postingPath, 'utf-8'));
} catch (err) {
  console.error('Failed to parse posting.json:', err.message);
  process.exit(1);
}

const professorName = posting.professor?.name || 'Unknown';
const university = posting.university || '';
const labName = posting.lab?.name || '';
const researchAreas = posting.research?.areas || [];

// Generate search queries
const queries = [
  `"${professorName}" ${university} lab research`,
  `"${professorName}" recent papers 2024 2025 2026`,
  `"${professorName}" ${university} publications`,
];

if (labName) {
  queries.push(`"${labName}" lab ${university}`);
  queries.push(`"${labName}" research projects`);
}

if (researchAreas.length > 0) {
  const areaQuery = researchAreas.slice(0, 3).join(' OR ');
  queries.push(`"${professorName}" ${areaQuery}`);
}

// Generate URLs to check
const urls = [];
if (posting.lab?.url) {
  urls.push(posting.lab.url);
}
urls.push(`https://scholar.google.com/scholar?q=${encodeURIComponent(professorName + ' ' + university)}`);
urls.push(`https://www.semanticscholar.org/search?q=${encodeURIComponent(professorName)}&sort=relevance`);

// Build search plan
const searchPlan = `# Professor/Lab Research Plan
# Generated: ${new Date().toISOString()}
# Professor: ${professorName}
# University: ${university}
# Lab: ${labName || 'Not specified'}

## Search Queries (execute with web_search)
${queries.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## URLs to Check (execute with web_fetch)
${urls.map((u, i) => `${i + 1}. ${u}`).join('\n')}

## Target Output Structure
Save structured research to: projects/${slug}/professor-research.json

\`\`\`json
{
  "professor": {
    "name": "${professorName}",
    "title": "...",
    "department": "...",
    "email": "...",
    "profile_url": "..."
  },
  "university": "${university}",
  "lab": {
    "name": "${labName || 'Unknown'}",
    "url": "...",
    "description": "...",
    "members": ["..."],
    "funding": ["..."]
  },
  "recent_papers": [
    {
      "title": "...",
      "authors": "...",
      "year": 2024,
      "venue": "...",
      "doi": "...",
      "url": "...",
      "key_contribution": "..."
    }
  ],
  "research_focus": ["..."],
  "ongoing_projects": ["..."],
  "recent_news": ["..."],
  "sources_consulted": ["..."]
}
\`\`\`

## Instructions for /proposal Skill
1. Execute each search query with web_search
2. For promising results, use web_fetch to get full content
3. Extract: recent papers, lab website, research focus, ongoing projects
4. Save structured data to professor-research.json
5. Log all sources consulted in the sources_consulted array

## Non-Negotiable Boundaries
- NEVER fabricate professor details. If not found, mark as "not found".
- NEVER claim to have read a paper the agent hasn't fetched. Mark as blocked if paywalled.
- NEVER invent lab projects. Only state what's found on the lab website or in papers.
- ALWAYS distinguish between what the posting says vs. what web research found.
`;

const planPath = join(projectDir, 'professor-search-plan.txt');
writeFileSync(planPath, searchPlan);
console.log(`Research plan saved to: ${planPath}`);
console.log(`\nNext: /proposal skill executes these searches and writes professor-research.json`);
