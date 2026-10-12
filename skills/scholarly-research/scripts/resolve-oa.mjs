#!/usr/bin/env node
/**
 * resolve-oa.mjs — "is there a licensed free copy of this DOI, and where",
 * answered before anything is downloaded.
 *
 * `skills/scholarly-research/SKILL.md` tells the reader to reach for Unpaywall
 * before downloading, and until now nothing in this repo did it: the layer was
 * documented with no implementation behind it. This module is that
 * implementation, and it talks to exactly one fixed host, so it adds no new
 * trust surface — the address validation and redirect re-checking in
 * `../extract-pdf.mjs` still guard everything the caller downloads.
 *
 * Unpaywall is keyless: one parameter, a contact email, which the API requires
 * and which the API, not this module, judges. It is a contact address and not a
 * credential.
 *
 * The failure policy is the part worth reading. A resolution that could not be
 * made — no contact address, a network failure, a non-200 response, or a 422
 * because the contact address was refused — is an ERROR. Only `is_oa: false` is
 * a paywall finding. Collapsing the two turns "the API was unreachable" into
 * "there is no free copy", which is how an evidence ledger quietly lies.
 */

import { pathToFileURL } from 'node:url';

const HOST = 'api.unpaywall.org';
const DEFAULT_BUDGET_MS = 20_000;

/** A DOI is `10.<registrant>/<suffix>`; anything else is not worth a request. */
const DOI_SHAPE = /^10\.\d{4,9}\/\S+$/;

export function isDoi(value) {
  return typeof value === 'string' && DOI_SHAPE.test(value.trim());
}

/**
 * The request URL. The DOI is percent-encoded because the path segment holds a
 * slash, and the email is encoded because it belongs in a query parameter.
 */
export function buildUnpaywallUrl(doi, email) {
  if (!isDoi(doi)) throw new Error(`not a DOI: ${JSON.stringify(doi)}`);
  if (typeof email !== 'string' || email.trim() === '') {
    throw new Error('a contact email is required; Unpaywall rejects a placeholder');
  }
  return `https://${HOST}/v2/${encodeURIComponent(doi.trim())}?email=${encodeURIComponent(email.trim())}`;
}

/**
 * Pure interpretation of an Unpaywall record, so the decision can be tested
 * without the network. `is_oa: true` does not promise a PDF: a green or hybrid
 * record can carry `url_for_pdf: null`, which is an observed case, not a
 * theoretical one.
 */
export function parseUnpaywall(payload, { doi } = {}) {
  const best = payload && typeof payload.best_oa_location === 'object' ? payload.best_oa_location : null;
  const isOa = Boolean(payload && payload.is_oa);
  const base = {
    doi: doi ?? payload?.doi ?? null,
    is_oa: isOa,
    oa_status: typeof payload?.oa_status === 'string' ? payload.oa_status : null,
    url_for_pdf: best && typeof best.url_for_pdf === 'string' ? best.url_for_pdf : null,
    url_for_landing_page:
      best && typeof best.url_for_landing_page === 'string' ? best.url_for_landing_page : null,
  };

  if (!isOa) {
    return { ...base, paywalled: true, download_url: null, note: null };
  }

  // A direct PDF is preferred; the landing page is the honest fallback, and
  // saying so is what stops a reader assuming a PDF was fetched.
  if (base.url_for_pdf) {
    return { ...base, paywalled: false, download_url: base.url_for_pdf, note: null };
  }
  const landing = base.url_for_landing_page;
  return {
    ...base,
    paywalled: false,
    download_url: landing,
    note: landing
      ? 'open access but no direct PDF URL; the landing page is returned and must be read, not downloaded'
      : 'open access but no location URL was returned; treat the copy as unavailable',
  };
}

/**
 * Resolve one DOI. Never throws: a resolution that cannot be made returns
 * `{ ok: false, error: ... }`, and the caller records it as a failed search
 * rather than as a paywall.
 */
export async function resolveOa(doi, { email, fetchImpl = globalThis.fetch, budgetMs = DEFAULT_BUDGET_MS } = {}) {
  if (typeof email !== 'string' || email.trim() === '') {
    return { ok: false, doi, error: 'no contact address; Unpaywall requires a real one and rejects a placeholder' };
  }

  let url;
  try {
    url = buildUnpaywallUrl(doi, email);
  } catch (error) {
    return { ok: false, doi, error: error.message };
  }

  let response;
  try {
    response = await fetchImpl(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(budgetMs),
    });
  } catch (error) {
    return { ok: false, doi, error: `Unpaywall request failed: ${error.message}` };
  }

  if (!response || response.ok !== true) {
    // 422 here is the API refusing the contact address, which is a request
    // error, not a statement about the work.
    return {
      ok: false,
      doi,
      error: `Unpaywall responded ${response ? response.status : 'without a response'}`,
    };
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    return { ok: false, doi, error: `Unpaywall response was not JSON: ${error.message}` };
  }

  if (!payload || typeof payload !== 'object') {
    return { ok: false, doi, error: 'Unpaywall response was not an object' };
  }

  return { ok: true, ...parseUnpaywall(payload, { doi }) };
}

export function formatResult(decision, asJson = true) {
  return asJson ? JSON.stringify(decision, null, 2) : JSON.stringify(decision);
}

async function runResolveOaCli(argv) {
  const args = argv.filter((a) => !a.startsWith('--'));
  const doi = args[0];
  const emailFlag = argv.findIndex((a) => a === '--email');
  const email = emailFlag === -1 ? process.env.UNPAYWALL_EMAIL : argv[emailFlag + 1];
  const asJson = !argv.includes('--pretty');

  if (!doi) {
    console.error('usage: node resolve-oa.mjs <doi> [--email <address>] [--pretty]');
    process.exitCode = 1;
    return;
  }

  const decision = await resolveOa(doi, { email });
  console.log(formatResult(decision, asJson));
  // A failed resolution and a paywall both exit 1 — the caller must read the
  // `ok` field, not the exit code, to tell them apart.
  process.exitCode = decision.ok ? 0 : 1;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  await runResolveOaCli(process.argv.slice(2));
}
