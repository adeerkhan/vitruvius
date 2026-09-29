/**
 * Behavioral test for the scholarly-research PDF extractor.
 *
 * The extractor wraps the optional `pdf-parse` dependency. These tests pin the
 * parts that must work with or without that dependency installed: reading-order
 * line reconstruction, page-marker stamping, hashing, and fail-closed errors.
 */

import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { check } from '../_contract/contract.mjs';
import {
  DOWNLOAD_BUDGET_MS,
  downloadToTemp,
  extractPdf,
  isScannedPdf,
  makePagerender,
  sha256Hex,
  textContentToLines,
} from '../../skills/scholarly-research/scripts/extract-pdf.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

console.log('\n[Test] scholarly-research — PDF extraction');

// 1. Reading-order line reconstruction from pdfjs text items.
const content = {
  items: [
    { str: 'Two-column paper', transform: [1, 0, 0, 1, 10, 700], hasEOL: true },
    { str: 'left column line 1', transform: [1, 0, 0, 1, 10, 680] },
    { str: ' continues', transform: [1, 0, 0, 1, 90, 680], hasEOL: true },
    { str: 'left column line 2', transform: [1, 0, 0, 1, 10, 660], hasEOL: true },
  ],
};
check(
  textContentToLines(content) ===
    'Two-column paper\nleft column line 1 continues\nleft column line 2',
  'textContentToLines reconstructs reading-order lines and honors hasEOL',
);

// 2. A Y-position change breaks a line even without hasEOL.
const yContent = {
  items: [
    { str: 'first', transform: [1, 0, 0, 1, 0, 100] },
    { str: 'second', transform: [1, 0, 0, 1, 0, 80] },
  ],
};
check(
  textContentToLines(yContent) === 'first\nsecond',
  'textContentToLines breaks on a Y-position change',
);

// 3. Page markers survive across pages via a closure counter.
const pagerender = makePagerender();
const fakePage = (label) => ({
  getTextContent: async () => ({
    items: [{ str: label, transform: [1, 0, 0, 1, 0, 10], hasEOL: true }],
  }),
});
const pageOne = await pagerender(fakePage('alpha'));
const pageTwo = await pagerender(fakePage('beta'));
check(pageOne.startsWith('[[page 1]]'), 'pagerender stamps page 1');
check(pageTwo.startsWith('[[page 2]]'), 'pagerender increments the page counter');

// 4. Deterministic hash for provenance after the binary is deleted.
check(
  sha256Hex(Buffer.from('abc')) ===
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  'sha256Hex matches the known digest',
);

// 5. Fail-closed errors.
let missing = false;
try {
  await extractPdf(join(tmpdir(), 'vitruvius-does-not-exist.pdf'));
} catch (error) {
  missing = /file not found/.test(error.message);
}
check(missing, 'extractPdf fails closed on a missing file');

const dir = mkdtempSync(join(tmpdir(), 'vitruvius-pdf-test-'));
const textPath = join(dir, 'note.txt');
writeFileSync(textPath, 'hello');
let notPdf = false;
try {
  await extractPdf(textPath);
} catch (error) {
  notPdf = /not a PDF/.test(error.message);
}
check(notPdf, 'extractPdf rejects non-PDF input');

const fakePdf = join(dir, 'fake.pdf');
writeFileSync(fakePdf, Buffer.from('%PDF-1.4\nthis is not really a pdf'));
let actionable = false;
try {
  await extractPdf(fakePdf);
} catch (error) {
  actionable = /pdf-parse is not installed|Invalid PDF|not callable|pdf-parse failed/i.test(
    error.message,
  );
}
check(actionable, 'extractPdf reports an actionable error for an unreadable/fake PDF');

check(isScannedPdf('') === true, 'isScannedPdf treats empty text as scanned');
check(isScannedPdf('Dummy PDF file') === false, 'isScannedPdf accepts a text layer');

// --- download budget (P1, stolen from ref/feynman/src/telemetry/posthog.ts:51)
//
// The defect this guards is a hang, so every case here is offline: a fake fetch
// that never settles is precisely the host that accepted the connection and
// then stopped sending. No test may depend on a real network to prove a timeout.

check(
  Number.isFinite(DOWNLOAD_BUDGET_MS) && DOWNLOAD_BUDGET_MS > 0,
  `DOWNLOAD_BUDGET_MS must be a positive finite budget, got ${DOWNLOAD_BUDGET_MS}`,
);

// A fetch that never settles must reject at the budget instead of hanging.
//
// Three details make this case real rather than decorative, and all three were
// found by watching it fail:
//
// 1. The fake honours `init.signal` the way real `fetch` does. An AbortSignal
//    only fires for a consumer that listens, so a signal-ignoring fake hangs
//    here whether or not downloadToTemp sent one.
// 2. The fake holds no OS handle, so nothing keeps the event loop alive and
//    Node exits with an unsettled top-level await before the unref'd budget
//    timer fires. The real fetch holds a socket; the giveUp timer below stands
//    in for it, and doubles as the bound.
// 3. Because the defect being tested IS a hang, each case races the download
//    against its own giveUp timer. Without that, deleting the budget turns a
//    failing test into a suite that hangs for an hour — which is how this
//    harness was found wedged rather than reporting a failure.
function stallingFetch(onSignal) {
  return (_url, init) =>
    new Promise((_resolve, reject) => {
      onSignal(init.signal);
      init.signal.addEventListener('abort', () => reject(new Error('aborted')));
    });
}

const GAVE_UP = 'the test gave up waiting — the deadline never fired';

async function raceGiveUp(promise, ms = 3000) {
  let timer;
  const giveUp = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(GAVE_UP)), ms);
  });
  try {
    return await Promise.race([promise, giveUp]);
  } finally {
    clearTimeout(timer);
  }
}

// The budget is the deadline: a stalled download rejects promptly.
{
  let sawSignal = null;
  const started = Date.now();
  let rejected = null;
  try {
    await raceGiveUp(
      downloadToTemp('https://example.invalid/paper.pdf', {
        budgetMs: 60,
        fetchImpl: stallingFetch((s) => {
          sawSignal = s;
        }),
      }),
    );
  } catch (error) {
    rejected = error;
  }
  const elapsed = Date.now() - started;
  check(
    rejected !== null && rejected.message !== GAVE_UP,
    `a download that exceeds its budget must reject on the budget, not hang (${rejected?.message ?? "no error"})`,
  );
  check(elapsed < 5000, `the budget fired promptly (took ${elapsed}ms)`);
  check(sawSignal !== null, 'downloadToTemp must pass an AbortSignal to fetch');
  check(
    sawSignal !== null && sawSignal.aborted,
    'the signal handed to fetch must be aborted once the budget expires',
  );
}

// A caller-supplied signal composes: with an enormous budget, the caller's own
// deadline is what stops the download. Without AbortSignal.any the caller's
// signal would be replaced by the budget.
{
  const ac = new AbortController();
  const abortSoon = setTimeout(() => ac.abort(), 40);
  let rejected = null;
  try {
    await raceGiveUp(
      downloadToTemp('https://example.invalid/paper.pdf', {
        budgetMs: 3_600_000,
        signal: ac.signal,
        fetchImpl: stallingFetch(() => {}),
      }),
    );
  } catch (error) {
    rejected = error;
  }
  clearTimeout(abortSoon);
  check(rejected !== null, "a caller's own AbortSignal must still cancel the download");
}

// Dropping the composition (using the budget alone) must break the case above —
// asserted directly, so the behaviour is pinned rather than implied.
{
  const budgetOnly = AbortSignal.timeout(3_600_000);
  const caller = new AbortController();
  const composed = AbortSignal.any([caller.signal, budgetOnly]);
  caller.abort();
  check(
    composed.aborted,
    'AbortSignal.any must abort when the caller signal aborts, even with an unexpired budget',
  );
}

// A caller signal that never fires must not disable the budget. This is the
// case that fails if the composition is `signal ?? budget` instead of
// `AbortSignal.any([signal, budget])`: the caller's live-but-silent signal
// would be used on its own and the short budget would never be consulted.
{
  const silent = new AbortController();
  const started = Date.now();
  let rejected = null;
  try {
    await raceGiveUp(
      downloadToTemp('https://example.invalid/paper.pdf', {
        budgetMs: 60,
        signal: silent.signal,
        fetchImpl: stallingFetch(() => {}),
      }),
    );
  } catch (error) {
    rejected = error;
  }
  const elapsed = Date.now() - started;
  check(
    rejected !== null && rejected.message !== GAVE_UP,
    `a silent caller signal must not suppress the budget (${rejected?.message ?? "no error"})`,
  );
  check(elapsed < 5000, `the budget still fired under a silent caller signal (took ${elapsed}ms)`);
}

// The happy path is unchanged: a small successful response still lands on disk.
{
  const bytes = Buffer.from('%PDF-1.4\nbounded download');
  const okFetch = async () => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    arrayBuffer: async () => bytes,
  });
  const dest = await downloadToTemp('https://example.invalid/paper.pdf', {
    budgetMs: 1000,
    fetchImpl: okFetch,
  });
  check(existsSync(dest), 'a successful bounded download still writes a temp file');
  check(
    readFileSync(dest, 'utf-8') === bytes.toString('utf-8'),
    'the downloaded bytes are written unchanged',
  );
  rmSync(dest, { force: true });
}

// A non-OK response still fails loudly rather than writing an empty PDF.
{
  const notFound = async () => ({ ok: false, status: 404, statusText: 'Not Found' });
  let rejected = null;
  try {
    await downloadToTemp('https://example.invalid/missing.pdf', {
      budgetMs: 1000,
      fetchImpl: notFound,
    });
  } catch (error) {
    rejected = error;
  }
  check(rejected !== null && /404/.test(rejected.message), 'a non-OK response still throws with its status');
}

rmSync(dir, { recursive: true, force: true });

console.log('\nPASS: scholarly-research PDF extraction');
