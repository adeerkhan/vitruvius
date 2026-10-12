/**
 * Behavioral test for the scholarly-research open-access resolver.
 *
 * The point of the module is the line between "there is no free copy" and "this
 * could not be resolved", so nearly every assertion below is about that
 * distinction. Nothing here touches the network: the fetch implementation is
 * injected, because a suite that needs the registry is a suite that fails in CI
 * for a reason unrelated to what it claims to be testing.
 */

import { check } from '../_contract/contract.mjs';
import {
  buildUnpaywallUrl,
  isDoi,
  parseUnpaywall,
  resolveOa,
} from '../../skills/scholarly-research/scripts/resolve-oa.mjs';

console.log('\n[Test] scholarly-research — open-access resolution');

// --- DOI shape ---------------------------------------------------------------
check(isDoi('10.1038/nature14539'), 'accepts a DOI');
check(!isDoi('nature14539'), 'refuses a bare identifier');
check(!isDoi('10.1038'), 'refuses a DOI with no suffix');
check(!isDoi(''), 'refuses an empty string');

// --- URL construction: the DOI is encoded because the path holds a slash -----
check(
  buildUnpaywallUrl('10.1038/nature14539', 'probe@example.com') ===
    'https://api.unpaywall.org/v2/10.1038%2Fnature14539?email=probe%40example.com',
  'encodes the DOI and the contact address',
);
let threw = false;
try {
  buildUnpaywallUrl('10.1038/nature14539', '');
} catch {
  threw = true;
}
check(threw, 'refuses to build a URL with no contact address');

// --- The observed cases ------------------------------------------------------
// A golden-OA record with a direct PDF.
const withPdf = parseUnpaywall({
  doi: '10.1038/nature14539',
  is_oa: true,
  oa_status: 'green',
  best_oa_location: { url_for_pdf: 'https://hal.science/hal-04206682/file/a.pdf', url_for_landing_page: 'https://hal.science/hal-04206682' },
});
check(withPdf.is_oa === true && withPdf.paywalled === false, 'a green OA record is open access');
check(withPdf.download_url === 'https://hal.science/hal-04206682/file/a.pdf', 'the direct PDF is preferred');
check(withPdf.note === null, 'no note is added when a direct PDF exists');

// Observed on a real response: is_oa true, hybrid, url_for_pdf null, landing present.
const noPdf = parseUnpaywall({
  doi: '10.1016/j.physletb.2012.08.020',
  is_oa: true,
  oa_status: 'hybrid',
  best_oa_location: { url_for_pdf: null, url_for_landing_page: 'https://doi.org/10.1016/j.physletb.2012.08.020' },
});
check(noPdf.download_url === 'https://doi.org/10.1016/j.physletb.2012.08.020', 'falls back to the landing page');
check(
  typeof noPdf.note === 'string' && /no direct PDF/i.test(noPdf.note),
  'says the landing page must be read rather than downloaded',
);

// A closed record.
const closed = parseUnpaywall({ is_oa: false, oa_status: 'closed', best_oa_location: null });
check(closed.paywalled === true && closed.download_url === null, 'a closed record is a paywall finding with no URL');

// --- The failure policy, which is the whole point ----------------------------
const json = (body, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => body,
});
const okFetch = (body, ok = true, status = 200) => async () => json(body, ok, status);

// No contact address: an error, and explicitly not a paywall.
const noEmail = await resolveOa('10.1038/nature14539', { email: '' });
check(noEmail.ok === false && noEmail.paywalled !== true, 'a missing contact address is an error, not a paywall');

// Network failure: an error, not a paywall.
const offline = await resolveOa('10.1038/nature14539', {
  email: 'probe@example.com',
  fetchImpl: async () => {
    throw new Error('getaddrinfo ENOTFOUND api.unpaywall.org');
  },
});
check(offline.ok === false && offline.paywalled !== true, 'a network failure is an error, not a paywall');
check(/ENOTFOUND/.test(offline.error), 'the network failure carries its cause');

// 422 — the API refusing a placeholder contact address. Still an error.
const rejected = await resolveOa('10.1038/nature14539', {
  email: 'probe@example.com',
  fetchImpl: okFetch({ is_oa: true }, false, 422),
});
check(rejected.ok === false && /422/.test(rejected.error), 'a 422 is reported as an error');
check(rejected.paywalled !== true, 'a 422 is not recorded as "no free copy"');

// A 5xx from the service, same rule.
const serverError = await resolveOa('10.1038/nature14539', {
  email: 'probe@example.com',
  fetchImpl: okFetch({}, false, 503),
});
check(serverError.ok === false && /503/.test(serverError.error), 'a 503 is reported as an error');

// Malformed JSON: an error, not a crash.
const notJson = {
  ok: true,
  status: 200,
  json: async () => {
    throw new Error('Unexpected token < in JSON at position 0');
  },
};
const badBody = await resolveOa('10.1038/nature14539', { email: 'probe@example.com', fetchImpl: async () => notJson });
check(badBody.ok === false && /not JSON/.test(badBody.error), 'a non-JSON response is an error');

// The happy path end to end, through the injected fetch.
const resolved = await resolveOa('10.1038/nature14539', {
  email: 'probe@example.com',
  fetchImpl: okFetch({
    doi: '10.1038/nature14539',
    is_oa: true,
    oa_status: 'green',
    best_oa_location: { url_for_pdf: 'https://hal.science/hal-04206682/file/a.pdf', url_for_landing_page: 'https://hal.science/hal-04206682' },
  }),
});
check(resolved.ok === true && resolved.is_oa === true, 'a resolved OA record reports open access');
check(resolved.download_url === 'https://hal.science/hal-04206682/file/a.pdf', 'the resolved record carries the PDF URL');

// The request went to the fixed host, with the encoded DOI and the contact.
let seenUrl = null;
await resolveOa('10.1038/nature14539', {
  email: 'probe@example.com',
  fetchImpl: async (url) => {
    seenUrl = url;
    return json({ is_oa: false });
  },
});
check(
  seenUrl === 'https://api.unpaywall.org/v2/10.1038%2Fnature14539?email=probe%40example.com',
  'the request URL carries the encoded DOI and the contact address',
);

// A paywall found through the injected fetch stays a paywall, not an error.
const found = await resolveOa('10.1038/nature14539', {
  email: 'probe@example.com',
  fetchImpl: okFetch({ is_oa: false, oa_status: 'closed' }),
});
check(found.ok === true && found.paywalled === true, 'a closed record resolves successfully as a paywall');

console.log('\nAll open-access resolution checks passed.');
