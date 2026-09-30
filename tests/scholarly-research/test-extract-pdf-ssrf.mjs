import { strict as assert } from "node:assert";
import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import {
  DOWNLOAD_BUDGET_MS,
  MAX_REDIRECTS,
  assertPublicUrl,
  downloadToTemp,
  isPrivateAddress,
} from "../../skills/scholarly-research/scripts/extract-pdf.mjs";

// The defect this closes, in one line:
//
//   const response = await doFetch(url, { redirect: 'follow', ... });
//
// `redirect: 'follow'` handed every hop's destination to the transport without
// looking at it. A public URL answering `302 Location: http://169.254.169.254/`
// reached the cloud metadata service while every check above it passed. On a
// cloud host that endpoint returns instance credentials to anything that asks,
// so a "paper URL" steered by a prompt-injected document was a credential
// exfiltration primitive rather than a malformed link.
//
// The 60s download budget added earlier fixed a HANG, not a TRAVERSAL. Both
// defects lived in the same three lines and only one of them was closed.

// A lookup that answers with a fixed public address, so nothing here touches DNS.
const publicLookup = async () => ["93.184.216.34"];

/** A fetch stand-in returning a scripted sequence of responses. */
function fakeFetch(sequence) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init });
    const next = sequence[Math.min(calls.length - 1, sequence.length - 1)];
    return typeof next === "function" ? next(url, init) : next;
  };
  impl.calls = calls;
  return impl;
}

const okResponse = (body = "%PDF-1.4\n") => ({
  ok: true,
  status: 200,
  statusText: "OK",
  headers: new Map(),
  arrayBuffer: async () => Buffer.from(body).buffer,
});

const redirect = (status, location) => ({
  ok: false,
  status,
  statusText: "Redirect",
  headers: new Map([["location", location]]),
  arrayBuffer: async () => new ArrayBuffer(0),
});

// --- 1. The address classifier, including every CIDR boundary --------------
// Boundaries are pinned rather than sampled: a classifier that is off by one
// on 172.16/12 or 100.64/10 is a classifier with a hole in it.
{
  const BLOCK = [
    "0.0.0.0", "0.1.2.3",
    "10.0.0.0", "10.255.255.255",
    "100.64.0.0", "100.127.255.255", "100.64.1.1",
    "127.0.0.0", "127.0.0.1",
    "169.254.0.1", "169.254.169.254",   // link-local, and the metadata address
    "172.16.0.0", "172.31.255.255", "172.20.10.5",
    "192.0.0.1", "192.0.2.5",
    "192.168.0.0", "192.168.1.1",
    "198.18.0.1", "198.19.255.255",
    "224.0.0.1", "239.255.255.255", "255.255.255.255",
    "::", "::1", "fc00::1", "fd12:3456::1", "fe80::1", "fe80::1%eth0",
    // Mapped forms — a one-token bypass of every IPv4 range if unhandled.
    "::ffff:127.0.0.1", "::ffff:169.254.169.254", "::ffff:10.0.0.1",
    "[::1]", "[::ffff:127.0.0.1]",
  ];
  const ALLOW = [
    "1.1.1.1", "8.8.8.8", "93.184.216.34", "203.0.113.9",
    "172.15.255.255",  // one below 172.16/12
    "172.32.0.0",      // one above it
    "100.63.255.255",  // one below 100.64/10
    "100.128.0.0",     // one above it
    "198.20.0.0",      // one above 198.18/15
    "2606:4700::1111", // public IPv6
    "papers.example.com", // a hostname: not an address, so not this function's call
  ];
  for (const ip of BLOCK) {
    assert.equal(isPrivateAddress(ip), true, `must block ${ip}`);
  }
  for (const ip of ALLOW) {
    assert.equal(isPrivateAddress(ip), false, `must NOT block ${ip}`);
  }
}

// --- 2. Scheme, hostname, and DNS -----------------------------------------
{
  await assert.rejects(() => assertPublicUrl("file:///etc/passwd", { lookup: publicLookup }), /only http and https/);
  await assert.rejects(() => assertPublicUrl("ftp://example.com/x.pdf", { lookup: publicLookup }), /only http and https/);
  await assert.rejects(() => assertPublicUrl("not a url", { lookup: publicLookup }), /malformed URL/);

  for (const host of ["http://localhost/x", "http://app.localhost/x", "http://printer.local/x", "http://metadata.google.internal/"]) {
    await assert.rejects(() => assertPublicUrl(host, { lookup: publicLookup }), /loopback or link-local/);
  }

  // A literal private address needs no DNS and must still be refused.
  await assert.rejects(
    () => assertPublicUrl("http://169.254.169.254/latest/meta-data/", { lookup: publicLookup }),
    /private, loopback, or link-local/,
  );

  // The DNS step is the one that matters: an ordinary-looking name holding a
  // loopback A record is exactly the bypass a string check would wave through.
  await assert.rejects(
    () => assertPublicUrl("https://totally-normal.test/paper.pdf", { lookup: async () => ["127.0.0.1"] }),
    /resolves to 127\.0\.0\.1/,
  );
  await assert.rejects(
    () => assertPublicUrl("https://mixed.test/paper.pdf", { lookup: async () => ["93.184.216.34", "10.1.2.3"] }),
    /resolves to 10\.1\.2\.3/,
    "one private answer among several must still block",
  );
  await assert.rejects(
    () => assertPublicUrl("https://unresolvable.invalid/x", { lookup: async () => { throw new Error("ENOTFOUND"); } }),
    /cannot resolve/,
  );

  // The happy path still works, or the fix is a denial of service.
  const ok = await assertPublicUrl("https://arxiv.org/pdf/2301.00001.pdf", { lookup: publicLookup });
  assert.equal(ok.hostname, "arxiv.org", "a public URL must pass and return the parsed URL");
}

// --- 3. THE BUG: a redirect into a private range is refused ---------------
{
  const fetchImpl = fakeFetch([redirect(302, "http://169.254.169.254/latest/meta-data/iam/")]);
  await assert.rejects(
    () => downloadToTemp("https://papers.example.test/a.pdf", { fetchImpl, lookup: publicLookup }),
    /private, loopback, or link-local/,
    "a public URL redirecting to the metadata service must be refused",
  );
  // The redirect target was never fetched, which is the point.
  assert.equal(fetchImpl.calls.length, 1, "the traversal must be refused BEFORE the second request");
}

{
  // A chain that stays public for two hops and only turns private on the third.
  // Every response must be a redirect, or the walk stops early and the test
  // would pass for the wrong reason — the first version of this case used an
  // okResponse() on hop 1, which has no Location, so the traversal it claimed
  // to prove was never actually attempted.
  const fetchImpl = fakeFetch([
    redirect(301, "https://hop2.example.test/b.pdf"),
    redirect(302, "https://cdn.example.test/c.pdf"),
    redirect(302, "http://127.0.0.1:8080/admin"),
  ]);
  // hop1 and hop2 resolve publicly; hop3 does not.
  let n = 0;
  const lookup = async () => (++n <= 2 ? ["93.184.216.34"] : ["127.0.0.1"]);
  await assert.rejects(
    () => downloadToTemp("https://hop1.example.test/a.pdf", { fetchImpl, lookup }),
    /private, loopback, or link-local/,
    "a traversal three hops in must be caught, not only the first hop",
  );
  // Two requests were made (hop1, hop2). The third URL is refused during
  // validation, BEFORE any request carries it — so the count is one lower
  // than the number of hops, which is the whole point of validating first.
  assert.equal(fetchImpl.calls.length, 2, "the private hop must never be requested");
  assert.ok(
    !fetchImpl.calls.some((c) => c.url.includes("127.0.0.1")),
    "no request may ever carry the private address",
  );
}

// --- 4. A legitimate redirect still works ---------------------------------
{
  const fetchImpl = fakeFetch([redirect(302, "https://arxiv.org/pdf/real.pdf"), okResponse("%PDF-1.4 real\n")]);
  const dest = await downloadToTemp("https://arxiv.org/abs/2301.00001", { fetchImpl, lookup: publicLookup });
  try {
    assert.ok(existsSync(dest), "a public redirect must still download");
    assert.equal(fetchImpl.calls.length, 2, "exactly one hop followed");
    assert.equal(fetchImpl.calls[1].url, "https://arxiv.org/pdf/real.pdf", "relative Location resolved against the current URL");
  } finally {
    rmSync(dest, { force: true });
  }
}

// --- 5. The hop cap -------------------------------------------------------
{
  // Every response redirects, so only the cap can stop it.
  const fetchImpl = fakeFetch([redirect(302, "https://loop.example.test/next.pdf")]);
  await assert.rejects(
    () => downloadToTemp("https://start.example.test/a.pdf", { fetchImpl, lookup: publicLookup, maxRedirects: 3 }),
    /more than 3 redirects/,
  );
  assert.equal(fetchImpl.calls.length, 4, "must stop immediately after the cap, not keep going");
  assert.ok(MAX_REDIRECTS <= 10, "the default cap must be well under fetch's own 20");
}

{
  const fetchImpl = fakeFetch([{ ok: false, status: 302, statusText: "Redirect", headers: new Map(), arrayBuffer: async () => new ArrayBuffer(0) }]);
  await assert.rejects(
    () => downloadToTemp("https://a.example.test/x.pdf", { fetchImpl, lookup: publicLookup }),
    /no Location header/,
    "a redirect with no destination is an error, not a silent success",
  );
}

// --- 6. fetch is asked NOT to follow, so nothing bypasses the checks -------
{
  const fetchImpl = fakeFetch([okResponse()]);
  const dest = await downloadToTemp("https://a.example.test/x.pdf", { fetchImpl, lookup: publicLookup });
  try {
    assert.equal(fetchImpl.calls[0].init.redirect, "manual", "redirect must be manual — 'follow' is the bug");
    assert.ok(fetchImpl.calls[0].init.signal, "the budget signal must still be attached");
  } finally {
    rmSync(dest, { force: true });
  }
}

// --- 7. The budget still works, and composes with a caller signal ---------
// Bounded in BOTH directions, which is the lesson the download-budget work
// recorded the hard way: a test of a hang must fail fast when the hang is
// reintroduced, or it wedges the suite instead of reporting. The give-up
// timer below is what turns "the budget is missing" into a named failure.
{
  const giveUpMs = 8_000;
  const stall = (_url, init) =>
    new Promise((_, reject) => {
      // A fake that ignores init.signal is the other half of that lesson: it
      // proves nothing and hangs. This one listens, like real fetch.
      init.signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    });
  const withGiveUp = async (opts) => {
    const result = downloadToTemp("https://a.example.test/x.pdf", {
      fetchImpl: stall,
      lookup: publicLookup,
      ...opts,
    });
    // NOT unref'd, and that is the point. A fake fetch holds no socket, so
    // nothing else keeps the event loop alive; an unref'd guard timer is
    // discarded and Node exits on the unsettled await instead of reporting.
    // The guard must be a real pending timer to be able to fire.
    return Promise.race([
      result,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("GIVE-UP: the download budget did not fire")), giveUpMs),
      ),
    ]);
  };

  const started = Date.now();
  await assert.rejects(() => withGiveUp({ budgetMs: 300 }), /aborted/);
  assert.ok(Date.now() - started < giveUpMs, "the budget must actually fire, not merely be passed");

  // A caller's own deadline must survive composition with the budget.
  await assert.rejects(() => withGiveUp({ signal: AbortSignal.timeout(300) }), /aborted/);

  // And the give-up path is itself reachable, so it is not dead code: a budget
  // that does not fire must produce this failure, which is what makes the case
  // above meaningful rather than decorative.
  await assert.rejects(
    () =>
      Promise.race([
        downloadToTemp("https://a.example.test/x.pdf", { fetchImpl: stall, lookup: publicLookup, budgetMs: 60_000 }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("GIVE-UP: the download budget did not fire")), 200)),
      ]),
    /GIVE-UP/,
    "without a short budget the give-up timer must be what reports, proving it works",
  );
}

// --- 8. The real boundary: the CLI refuses a traversal, not just the API ---
// The CLI reports a failed extraction as a result object with a warning and a
// non-zero exit, so "it printed something" is not the test. What matters is
// that it says REFUSING, that it exits non-zero, and that it extracted nothing
// — a refusal that still reported a page count would be a fetch that happened.
{
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const r = spawnSync(
    process.execPath,
    [join(repoRoot, "skills", "scholarly-research", "scripts", "extract-pdf.mjs"), "http://169.254.169.254/latest/meta-data/", "--json"],
    { encoding: "utf8" },
  );
  const output = `${r.stdout}${r.stderr}`;
  assert.notEqual(r.status, 0, "the CLI must exit non-zero on a metadata URL");
  assert.match(output, /refusing to fetch/, "and must say why, in the operator's terms");

  // The refusal must be an extraction FAILURE, not a successful read of an
  // empty document. sha256 null, zero pages and empty text together are what
  // distinguish "blocked before any request" from "reached it and found
  // nothing" — the latter would mean the traversal still worked.
  const jsonStart = output.indexOf("{");
  assert.ok(jsonStart >= 0, `expected a JSON result, got:\n${output}`);
  const result = JSON.parse(output.slice(jsonStart));
  assert.equal(result.sha256, null, "nothing may be hashed — no bytes were fetched");
  assert.equal(result.pages, 0, "zero pages, so the metadata service was never read");
  assert.equal(result.text, "", "no text was extracted");
  assert.match(
    result.warnings.join(" "),
    /refusing to fetch 169\.254\.169\.254/,
    "the refusal must be carried in the result, so an operator reading only the JSON sees it",
  );
}

// --- 9. The documented limitation is recorded, not claimed as fixed -------
{
  const src = readFileSync(
    new URL("../../skills/scholarly-research/scripts/extract-pdf.mjs", import.meta.url),
    "utf8",
  );
  assert.match(
    src,
    /re-resolve|Known limit|resolves the name again/i,
    "the DNS-rebinding limit must stay written down; a fix that hides its own residual risk is worse than no fix",
  );
  assert.equal(DOWNLOAD_BUDGET_MS, 60_000, "the budget is unchanged by this fix — hang and traversal are different defects");
}

console.log(
  "PASS: private, loopback, link-local and cloud-metadata addresses are refused before any " +
    "request, every CIDR boundary is exact, IPv4-mapped IPv6 cannot bypass it, redirects are " +
    "followed by hand and re-validated at each hop, a legitimate redirect still works, and the " +
    "DNS-rebinding limit is recorded rather than claimed as fixed",
);
