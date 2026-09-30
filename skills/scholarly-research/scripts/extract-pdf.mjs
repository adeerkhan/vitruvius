/**
 * extract-pdf.mjs — page-anchored PDF text extraction.
 *
 * Canonical Vitruvius PDF reader. It wraps the optional `pdf-parse`
 * dependency with a custom page renderer that:
 *   - keeps page boundaries as `[[page N]]` markers, so an extracted claim can
 *     be anchored back to a page instead of an undifferentiated text blob;
 *   - reconstructs lines from text items (`hasEOL` plus Y-position changes)
 *     instead of concatenating every item with a space, which is what makes
 *     two-column papers come out in reading order more often than not;
 *   - reports SHA-256 of the source bytes, so provenance survives deleting the
 *     binary.
 *
 * The repository `scripts/extract-pdf.mjs` file is a thin CLI wrapper around
 * this module, mirroring the proposal skill's document-extractor pattern.
 *
 * Limitations, stated rather than hidden:
 *   - pdf-parse is an optional dependency. Without it the extractor fails with
 *     an actionable error; it does not silently invent text.
 *   - A scanned PDF (image-only) has no text layer. This extractor does not
 *     OCR: it returns empty text and a warning, and refuses to delete a source
 *     it could not read.
 *   - Column detection is heuristic. Always cross-check numbers against the
 *     `[[page N]]` source before citing (see the artifact-reading skill).
 */
import { createHash, randomUUID } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Reconstruct reading-order lines from a pdfjs text-content object. */
export function textContentToLines(textContent) {
  const items = textContent && Array.isArray(textContent.items) ? textContent.items : [];
  const lines = [];
  let current = '';
  let lastY = null;

  const flush = () => {
    const line = current.replace(/\s+$/, '');
    if (line !== '') lines.push(line);
    current = '';
  };

  for (const item of items) {
    if (!item || typeof item.str !== 'string') continue;
    const y = Array.isArray(item.transform) ? item.transform[5] : null;
    const yChanged = lastY !== null && y !== null && Math.abs(y - lastY) > 0.5;
    if (yChanged) flush();
    current += item.str;
    if (item.hasEOL === true) {
      flush();
      lastY = null;
      continue;
    }
    if (y !== null) lastY = y;
  }
  flush();
  return lines.join('\n');
}

/**
 * Build a pdf-parse `pagerender` that stamps each page with a `[[page N]]`
 * marker. pdf-parse renders pages sequentially, so a closure counter is a
 * reliable page number.
 */
export function makePagerender() {
  let pageNumber = 0;
  return async function pagerender(pageData) {
    pageNumber += 1;
    const textContent = await pageData.getTextContent({
      normalizeWhitespace: false,
      disableCombineTextItems: true,
    });
    return `[[page ${pageNumber}]]\n${textContentToLines(textContent)}`;
  };
}

function isScannedPdf(text) {
  if (!text || text.trim() === '') return true;
  const sample = text.slice(0, 1000);
  const controlCharacters = (sample.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g) || []).length;
  return controlCharacters / sample.length > 0.3;
}

/**
 * Run `body` with process.stdout captured. `pdf-parse` prints diagnostics of
 * its own straight to stdout; left alone they corrupt the `--json` payload.
 */
async function withCapturedStdout(body) {
  const captured = [];
  const realWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk, ...rest) => {
    captured.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
    const callback = rest.find((argument) => typeof argument === 'function');
    if (callback) callback();
    return true;
  };
  try {
    return { value: await body(), stdout: captured.join('') };
  } finally {
    process.stdout.write = realWrite;
  }
}

async function runPdfParse(buffer) {
  let module;
  try {
    module = await import('pdf-parse');
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      throw new Error(
        'pdf-parse is not installed; install the optional dependency (npm install pdf-parse) or provide a text transcription',
      );
    }
    throw error;
  }
  const pdfParse = module.default ?? module;
  if (typeof pdfParse !== 'function') throw new Error('pdf-parse export is not callable');
  // pdf-parse 1.x bundles an old pdfjs that misreads a Node Buffer as a string
  // and throws "bad XRef entry" on valid PDFs. A Uint8Array is the input it
  // actually expects.
  const data = await pdfParse(new Uint8Array(buffer), { pagerender: makePagerender() });
  return {
    text: typeof data.text === 'string' ? data.text : '',
    pages: data.numpages || 0,
  };
}

export function sha256Hex(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Extract text from a local PDF file.
 *
 * @param {string} filePath
 * @param {{ removeSource?: boolean }} [options] `removeSource` deletes the PDF
 *   after a *usable* extraction, leaving text + SHA-256 as the record. A source
 *   that could not be read (scanned, no text layer) is never deleted.
 */
export async function extractPdf(filePath, { removeSource = false } = {}) {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new Error('PDF path is required');
  }
  if (!existsSync(filePath)) throw new Error(`file not found: ${filePath}`);
  if (extname(filePath).toLowerCase() !== '.pdf') throw new Error(`not a PDF: ${filePath}`);

  const bytes = readFileSync(filePath);
  const sha256 = sha256Hex(bytes);
  const byteLength = bytes.length;
  const warnings = [];

  const { value, stdout } = await withCapturedStdout(() => runPdfParse(bytes));
  if (stdout.trim() !== '') warnings.push(`pdf-parse wrote to stdout: ${stdout.trim()}`);

  const scanned = isScannedPdf(value.text);
  if (scanned) {
    warnings.push('PDF appears to be scanned or has no usable text layer; OCR is not performed');
  }

  let deleted = false;
  if (removeSource) {
    if (scanned) {
      warnings.push('source kept: extraction yielded no text, so deleting it would lose the only copy');
    } else {
      rmSync(filePath);
      deleted = true;
    }
  }

  return {
    source: filePath,
    sha256,
    pages: value.pages,
    text: scanned ? '' : value.text,
    bytes: byteLength,
    warnings,
    deleted,
  };
}

/**
 * Wall-clock budget for one download.
 *
 * Before this existed the fetch had no signal at all, so a host that accepted
 * the connection and then stalled left the extractor waiting indefinitely —
 * the failure mode described for src-05's telemetry at
 * src-05 src/telemetry/posthog.ts:47 (MIT, cd72f97), where a pending send
 * made every command wait for the library's 10s deadline.
 *
 * 60s, not src-05's 1.5s: this downloads whole papers, often several
 * megabytes over a slow link. The shape is what transfers, not the number —
 * a budget that fires on a legitimate 8 MB PDF would be a worse bug than the
 * hang. Override per call for a known-large source.
 */
export const DOWNLOAD_BUDGET_MS = 60_000;

/**
 * Redirect hops followed before giving up. `fetch` defaults to 20, which is far
 * more than a PDF source needs and is attacker-controlled headroom.
 */
export const MAX_REDIRECTS = 5;

/**
 * Is this IP literal one the extractor must never reach?
 *
 * The list is the non-routable set plus the cloud metadata address. The
 * metadata case is the reason this function exists: on a cloud host,
 * 169.254.169.254 hands out instance credentials to anything that asks, so a
 * fetched "paper URL" pointed there is an exfiltration primitive, not a
 * malformed link.
 *
 * Written against a string rather than a parsed address type because Node has
 * no built-in IP classifier and the shapes here are few and fixed.
 *
 * @param {string} address an IPv4 or IPv6 literal
 * @returns {boolean} true when the address must be refused
 */
export function isPrivateAddress(address) {
  const ip = String(address).trim().toLowerCase().replace(/^\[|\]$/g, "");

  // IPv4-mapped and IPv4-compatible IPv6 (::ffff:169.254.169.254). Judged by
  // the IPv4 rules below, or a mapped address is a one-token bypass of every
  // range. The IPv4 half is extracted and classified INLINE rather than by
  // recursing: the first version called isPrivateAddress(mapped[1]) and the
  // pattern re-matched its own output, so every call blew the stack. A
  // classifier that cannot classify a mapped address is not a classifier.
  const mapped = /^(?:::ffff:)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(ip);
  if (mapped) return isPrivateIpv4(mapped[1]);

  if (ip === "::" || ip === "::1") return true;
  // Unique-local (fc00::/7) and link-local (fe80::/10).
  if (/^f[cd][0-9a-f]{2}:/.test(ip) || /^fe[89ab][0-9a-f]:/.test(ip)) return true;

  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return false; // a hostname: see assertPublicUrl
  return isPrivateIpv4(ip);
}

/**
 * The IPv4 half of {@link isPrivateAddress}, as a plain dotted quad.
 *
 * @param {string} ip
 * @returns {boolean}
 */
function isPrivateIpv4(ip) {
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (!v4) return false;
  const a = Number(v4[1]);
  const b = Number(v4[2]);
  if (a === 0) return true;                         // 0.0.0.0/8   this network
  if (a === 10) return true;                        // 10/8        private
  if (a === 127) return true;                       // 127/8       loopback
  if (a === 169 && b === 254) return true;          // 169.254/16  link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12   private
  if (a === 192 && b === 168) return true;          // 192.168/16  private
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64/10   CGNAT
  if (a === 192 && b === 0) return true;            // 192.0/24    IETF protocol assignments
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18/15 benchmarking
  if (a >= 224) return true;                        // multicast + reserved
  return false;
}

/** Hostnames that resolve inside the machine without a public DNS answer. */
const LOCAL_HOSTNAMES = new Set(["localhost", "metadata.google.internal", "instance-data"]);

/**
 * Refuse a URL that is not a public http(s) address.
 *
 * Checks, in order: the scheme, a hostname that is a literal private address,
 * a known-local hostname, and finally every address the hostname resolves to.
 * The DNS step is the one that matters — `evil.test` is a perfectly ordinary
 * name that can hold a 127.0.0.1 A record, and a check that only looked at the
 * string would wave it through.
 *
 * `lookup` is injected so this is provable without a network.
 *
 * @param {string} rawUrl
 * @param {{ lookup?: Function }} [opts]
 * @returns {Promise<URL>}
 * @throws when the target is not publicly routable
 */
export async function assertPublicUrl(rawUrl, { lookup } = {}) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`refusing to fetch a malformed URL: ${rawUrl}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`refusing to fetch ${parsed.protocol}// — only http and https are allowed`);
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (LOCAL_HOSTNAMES.has(host) || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new Error(`refusing to fetch ${host} — a loopback or link-local host is not a paper source`);
  }
  // A literal address needs no DNS step and must still be judged.
  if (isPrivateAddress(host)) {
    throw new Error(`refusing to fetch ${host} — private, loopback, or link-local address`);
  }

  const resolve = lookup ?? dnsLookup;
  let addresses;
  try {
    addresses = await resolve(host);
  } catch (error) {
    throw new Error(`cannot resolve ${host}: ${error.message}`);
  }
  for (const address of addresses) {
    if (isPrivateAddress(address)) {
      throw new Error(
        `refusing to fetch ${host} — it resolves to ${address}, a private, loopback, or link-local address`,
      );
    }
  }
  return parsed;
}

/** `dns.lookup` in the shape this module needs, with every A/AAAA answer. */
async function dnsLookup(hostname) {
  const results = await lookup(hostname, { all: true, verbatim: true });
  return results.map((r) => r.address);
}

/**
 * Download a URL to a temporary `.pdf` path and return that path.
 *
 * The budget is composed with any caller signal via `AbortSignal.any`, so a
 * caller that already has its own deadline keeps it and whichever fires first
 * wins. `fetchImpl` and `lookup` are injectable so both the budget and the
 * address checks are provable without a network.
 *
 * Redirects are followed here rather than by `fetch`. `redirect: 'follow'`
 * handed the destination of every hop to the transport without ever looking at
 * it, so a public URL that answered `302 Location: http://169.254.169.254/…`
 * reached the metadata service while every check above it passed. Following by
 * hand means each hop is re-validated, and a redirect into a private range is
 * refused with the same error as a direct request to one.
 *
 * Known limit: the address is checked, then `fetch` resolves the name again.
 * A host that answers public to the first lookup and private to the second can
 * still win that race. Closing it needs a pinned-IP connection, which `fetch`
 * does not expose. Recorded rather than claimed as fixed.
 */
export async function downloadToTemp(
  url,
  { budgetMs = DOWNLOAD_BUDGET_MS, signal, fetchImpl, lookup, maxRedirects = MAX_REDIRECTS } = {},
) {
  const doFetch = fetchImpl ?? fetch;
  const budget = AbortSignal.timeout(budgetMs);
  const composed = signal ? AbortSignal.any([signal, budget]) : budget;

  let current = String(url);
  for (let hop = 0; hop <= maxRedirects; hop++) {
    await assertPublicUrl(current, { lookup });

    const response = await doFetch(current, {
      redirect: 'manual',
      signal: composed,
      headers: { 'User-Agent': 'vitruvius-research/1.0 (+https://github.com/adeerkhan/vitruvius)' },
    });

    if (REDIRECT_STATUSES.has(response.status)) {
      const location = response.headers?.get?.('location');
      if (!location) {
        throw new Error(`fetch returned ${response.status} with no Location header`);
      }
      if (hop === maxRedirects) {
        throw new Error(`refusing to follow more than ${maxRedirects} redirects from ${url}`);
      }
      current = new URL(location, current).toString();
      continue;
    }

    if (!response.ok) {
      throw new Error(`fetch failed: ${response.status} ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const dest = join(tmpdir(), `vitruvius-${randomUUID()}.pdf`);
    writeFileSync(dest, buffer);
    return dest;
  }
  /* c8 ignore next */
  throw new Error(`too many redirects from ${url}`);
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function formatResult(result, outputJson) {
  if (outputJson) return JSON.stringify(result, null, 2);
  const lines = [
    `Source: ${result.url || result.source}`,
    `Pages: ${result.pages}`,
    `SHA-256: ${result.sha256}`,
    `Deleted: ${result.deleted ? 'yes' : 'no'}`,
  ];
  if (result.warnings.length > 0) lines.push(`Warnings: ${result.warnings.join(', ')}`);
  lines.push('---', result.text);
  return lines.join('\n');
}

export async function runExtractPdfCli(argv) {
  const positional = argv.filter((argument) => !argument.startsWith('--'));
  const source = positional[0];
  const outputJson = argv.includes('--json');
  const removeSource = argv.includes('--delete');

  if (!source) {
    console.error('Usage: node scripts/extract-pdf.mjs <pdf-path-or-url> [--json] [--delete]');
    process.exitCode = 1;
    return;
  }

  const isUrl = /^https?:\/\//i.test(source);
  let pdfPath = source;
  let url = null;
  try {
    if (isUrl) {
      url = source;
      pdfPath = await downloadToTemp(source);
    }
    const result = await extractPdf(pdfPath, { removeSource: removeSource || isUrl });
    if (url) {
      result.url = url;
      result.source = url;
    }
    console.log(formatResult(result, outputJson));
    process.exitCode = result.text.trim() === '' ? 1 : 0;
  } catch (error) {
    const result = {
      source,
      url,
      sha256: null,
      pages: 0,
      text: '',
      warnings: [`extraction error: ${error.message}`],
      deleted: false,
    };
    console.log(formatResult(result, true));
    process.exitCode = 1;
  }
}

export { isScannedPdf };

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  await runExtractPdfCli(process.argv.slice(2));
}
