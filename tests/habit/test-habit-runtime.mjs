import { strict as assert } from "node:assert";
import {
  activateLedger,
  approveCandidates,
  loadHabits,
  redactSecrets,
  rejectCandidates,
  revokeHabit,
  validateLedger,
} from "../../scripts/habit-ledger.mjs";

const T0 = "2026-09-24T10:00:00.000Z";
const T1 = "2026-09-24T11:00:00.000Z";

function ledger(overrides = {}) {
  return {
    schema: "habit.v1",
    version: 1,
    run: "fixture-run",
    scope: "research",
    createdAt: T0,
    window: [
      { id: "u1", role: "user", text: "Always cite the section number.", createdAt: T0 },
      { id: "a1", role: "assistant", text: "I will do that.", createdAt: T0 },
    ],
    c: [
      {
        id: "h1",
        t: "Cite section numbers.",
        d: "Use the section identifier in every citation.",
        e: ["u1"],
        scope: "research",
        status: "proposed",
        createdAt: T0,
      },
    ],
    ...overrides,
  };
}

function validReport(value) {
  return validateLedger(value, { now: T1 });
}

{
  const report = validReport(ledger());
  assert.equal(report.valid, true, report.errors.join("; "));
}

{
  const overBound = ledger();
  overBound.window[0].text = "x".repeat(2001);
  assert.match(validReport(overBound).errors.join("\\n"), /window text too long/i);
}

{
  const tooManyCandidates = ledger({
    c: Array.from({ length: 21 }, (_, index) => ({
      ...ledger().c[0],
      id: `h${index + 1}`,
    })),
  });
  assert.match(validReport(tooManyCandidates).errors.join("\\n"), /at most 20/i);
}

{
  const assistantEvidence = ledger();
  assistantEvidence.c[0].e = ["a1"];
  assert.match(validReport(assistantEvidence).errors.join("\n"), /user/i);
}

{
  const outsideWindow = ledger();
  outsideWindow.c[0].e = ["u404"];
  assert.match(validReport(outsideWindow).errors.join("\n"), /outside.*window|unknown.*u404/i);
}

{
  const secret = ledger();
  secret.window[0].text = "Use api_key=sk_live_1234567890 for the source.";
  assert.match(validReport(secret).errors.join("\n"), /secret/i);
  assert.match(redactSecrets(secret.window[0].text), /REDACTED/);
  assert.doesNotMatch(redactSecrets(secret.window[0].text), /sk_live_/);
}

{
  const duplicate = ledger();
  duplicate.c.push({ ...duplicate.c[0] });
  assert.match(validReport(duplicate).errors.join("\n"), /duplicate.*candidate|candidate.*duplicate/i);
}

{
  assert.throws(
    () => approveCandidates(ledger(), ["h1"], { approvedBy: "assistant", approvedAt: T1 }),
    /user|approval/i,
  );
}

{
  const approved = approveCandidates(ledger(), ["h1"], {
    approvedBy: "user",
    approvedAt: T1,
  });
  assert.equal(approved.c[0].status, "approved");
  assert.deepEqual(approved.approval.candidateIds, ["h1"]);

  const store = activateLedger(approved, { schema: "habit-store.v1", rules: [], events: [] }, { now: T1 });
  assert.equal(store.rules.length, 1);
  assert.equal(store.rules[0].status, "active");
  assert.equal(store.rules[0].e[0], "u1");
  assert.equal("window" in store.rules[0], false, "activation must not copy transcript text");

  const context = loadHabits(store, { scope: "research", now: T1 });
  assert.equal(context.length, 1);
  assert.equal(context[0].t, "Cite section numbers.");
  assert.equal(loadHabits(store, { scope: "civil", now: T1 }).length, 0);
}

{
  const rejected = rejectCandidates(ledger(), ["h1"], { actor: "user", at: T1 });
  assert.equal(rejected.c[0].status, "rejected");
  assert.throws(() => activateLedger(rejected, { schema: "habit-store.v1", rules: [], events: [] }, { now: T1 }), /approved/i);
}

{
  const first = approveCandidates(ledger(), ["h1"], { approvedBy: "user", approvedAt: T1 });
  const store = activateLedger(first, { schema: "habit-store.v1", rules: [], events: [] }, { now: T1 });
  const replacement = approveCandidates(
    ledger({
      c: [{
        id: "h2",
        t: "Cite section numbers and edition.",
        d: "Include the edition when the source has one.",
        e: ["u1"],
        scope: "research",
        status: "proposed",
        createdAt: T1,
        supersedes: ["h1"],
      }],
    }),
    ["h2"],
    { approvedBy: "user", approvedAt: T1 },
  );
  const next = activateLedger(replacement, store, { now: T1 });
  assert.equal(next.rules.find((rule) => rule.id === "h1").status, "superseded");
  assert.equal(next.rules.find((rule) => rule.id === "h2").status, "active");
  assert.equal(loadHabits(next, { scope: "research", now: T1 }).length, 1);
}

{
  const approved = approveCandidates(ledger(), ["h1"], { approvedBy: "user", approvedAt: T1 });
  const store = activateLedger(approved, { schema: "habit-store.v1", rules: [], events: [] }, { now: T1 });
  const revoked = revokeHabit(store, "h1", { now: T1 });
  assert.equal(revoked.rules[0].status, "revoked");
  assert.equal(loadHabits(revoked, { scope: "research", now: T1 }).length, 0);
}

{
  const expiring = ledger({ expiresAt: "2026-09-25T00:00:00.000Z" });
  const approved = approveCandidates(expiring, ["h1"], { approvedBy: "user", approvedAt: T1 });
  const store = activateLedger(approved, { schema: "habit-store.v1", rules: [], events: [] }, { now: T1 });
  assert.equal(loadHabits(store, { scope: "research", now: "2026-09-26T00:00:00.000Z" }).length, 0);
}

{
  const first = approveCandidates(ledger(), ["h1"], { approvedBy: "user", approvedAt: T1 });
  const store = activateLedger(first, { schema: "habit-store.v1", rules: [], events: [] }, { now: T1 });
  const conflict = approveCandidates(
    ledger({
      c: [{ ...ledger().c[0], id: "h2" }],
    }),
    ["h2"],
    { approvedBy: "user", approvedAt: T1 },
  );
  assert.throws(() => activateLedger(conflict, store, { now: T1 }), /conflict|duplicate/i);
}

{
  const orphanApproved = ledger();
  orphanApproved.c[0].status = "approved";
  assert.match(validReport(orphanApproved).errors.join("\\n"), /approval/i);
}

{
  const invalidVersion = ledger({ version: 999 });
  assert.match(validReport(invalidVersion).errors.join("\\n"), /version/i);
}

{
  const inconsistent = ledger({
    approval: {
      status: "approved",
      approvedBy: "user",
      approvedAt: T1,
      candidateIds: ["h1"],
    },
  });
  assert.match(validReport(inconsistent).errors.join("\\n"), /approval.*approved|approved.*status/i);
}

{
  const duplicateBatch = ledger({
    c: [
      { ...ledger().c[0], id: "h1" },
      { ...ledger().c[0], id: "h2" },
    ],
  });
  const approved = approveCandidates(duplicateBatch, ["h1", "h2"], {
    approvedBy: "user",
    approvedAt: T1,
  });
  assert.throws(
    () => activateLedger(approved, { schema: "habit-store.v1", rules: [], events: [] }, { now: T1 }),
    /conflict|duplicate/i,
  );
}

{
  const forged = ledger({
    approval: {
      status: "approved",
      approvedBy: "assistant",
      approvedAt: T1,
      candidateIds: ["h1"],
    },
  });
  forged.c[0].status = "approved";
  assert.match(validReport(forged).errors.join("\\n"), /approvedBy.*user|approval.*user/i);
}

{
  const noEventStore = {
    schema: "habit-store.v1",
    rules: [{
      id: "h1",
      t: "Cite sections.",
      d: "",
      e: ["u1"],
      scope: "research",
      sourceRun: "fixture-run",
      status: "active",
      activatedAt: T1,
      expiresAt: null,
    }],
    events: [],
  };
  assert.throws(() => loadHabits(noEventStore, { now: T1 }), /activation event|store/i);
}

{
  const duplicateEvidenceStore = {
    schema: "habit-store.v1",
    rules: [{
      id: "h1",
      t: "Cite sections.",
      d: "",
      e: ["u1", "u1"],
      scope: "research",
      sourceRun: "fixture-run",
      status: "active",
      activatedAt: T1,
      expiresAt: null,
    }],
    events: [{ action: "activated", id: "h1", by: "user", at: T1 }],
  };
  assert.throws(() => loadHabits(duplicateEvidenceStore, { now: T1 }), /evidence|store/i);
}

{
  const unsafeStore = {
    schema: "habit-store.v1",
    rules: [{
      id: "unsafe",
      t: "Use api_key=sk_live_1234567890.",
      d: "",
      e: ["u1"],
      scope: "research",
      sourceRun: "fixture-run",
      status: "active",
      activatedAt: T1,
      expiresAt: null,
    }],
    events: [],
  };
  assert.throws(() => loadHabits(unsafeStore, { scope: "research", now: T1 }), /store|secret/i);
}

{
  const unsafeEvents = {
    schema: "habit-store.v1",
    rules: [],
    events: [{ action: "revoked", id: "missing", at: T1 }],
  };
  assert.throws(() => loadHabits(unsafeEvents, { now: T1 }), /event|store/i);
}

{
  const first = approveCandidates(ledger(), ["h1"], { approvedBy: "user", approvedAt: T1 });
  const store = activateLedger(first, { schema: "habit-store.v1", rules: [], events: [] }, { now: T1 });
  const competing = approveCandidates(
    ledger({
      c: [
        { ...ledger().c[0], id: "h2", t: "Cite sections and edition.", supersedes: ["h1"] },
        { ...ledger().c[0], id: "h3", t: "Cite sections with date.", supersedes: ["h1"] },
      ],
    }),
    ["h2", "h3"],
    { approvedBy: "user", approvedAt: T1 },
  );
  assert.throws(() => activateLedger(competing, store, { now: T1 }), /supersed|conflict/i);
}

console.log("PASS: Habit validation, activation, later-run loading, and revocation");
